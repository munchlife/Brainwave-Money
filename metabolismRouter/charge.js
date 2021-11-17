'use strict';

// charge.js (routes)

// TODO: Consider recording the life that makes any changes to charge tables;
//       since there are no immunities, this will help track abuse

// Dependency packages
var debug   = require('debug')('munch:routes:Charge');
var verbose = require('debug')('munch:verbose:routes:Charge');
var express = require('express');

// Local js modules
var Middlewares  = require('./middlewares');
var metabolism   = require('../../models/database');
var Immunities   = require('../../config/immunities');
var Blockages    = require('../../config/blockages');
var CountryCodes = require('../../data/countryCodes');

var validate = metabolism.Sequelize.Validator;

var router = module.exports = express.Router();

// -----------------------------------------------------------------------------
// TOKEN AUTHENTICATION MIDDLEWARE
// -----------------------------------------------------------------------------
router.use(Middlewares.tokenAuth);

// -----------------------------------------------------------------------------
// ATTRIBUTE/INCLUDE SETUP
// -----------------------------------------------------------------------------
var attributesAddress  = [ 'addressId',        'name', 'address1', 'address2', 'address3', 'address4', 'locality', 'region', 'postalCode' ];
var attributesCharge   = [ 'chargeId',         'value', 'chargeCellId' ];
var attributesInstance = [ 'chargeInstanceId', 'constructiveInterference', 'destructiveInterference', 'name', 'website', 'cellType', 'countryCode' ];
var attributesPhone    = [ 'phoneId',          'name', 'number', 'extension' ];
var attributesGene     = [ 'geneId',           'name' ]

var includeChargeInstance = { model: metabolism.ChargeInstance, as: 'Instances', attributes: attributesInstance };
var includeCharge         = { model: metabolism.Charge,         as: 'Bounties',  attributes: attributesCharge };
var includeAddress        = { model: metabolism.Address,        as: 'Addresses', attributes: attributesAddress };
var includePhone          = { model: metabolism.Phone,          as: 'Phones',    attributes: attributesPhone };
var includeGene           = { model: metabolism.Gene,           as: 'Genes',     attributes: attributesGene };

var chargeIncludesCell = [ includeChargeInstance, includeCharge, includeAddress, includePhone ];

// Remove fields from metabolism.Charge: createdAt, deletedAt
var chargeAttributes = [ 'chargeId', 'value', 'lifeId', 'chargeCellId', 'updatedAt' ];

// Remove fields from metabolism.ChargeCell: createdAt, deletedAt
var chargeCellAttributes = [ 'chargeCellId', 'name', 'cellType', 'website', 'countryCode', 'updatedAt' ];

// Remove fields from metabolism.ChargeInstance: createdAt, deletedAt
var chargeInstanceAttributes = [ 'chargeInstanceId', 'constructiveInterference', 'destructiveInterference', 'name', 'website', 'cellType', 'countryCode', 'updatedAt', 'chargeCellId' ];

// -----------------------------------------------------------------------------
// GET ROUTES
// -----------------------------------------------------------------------------
// /charge/life/:id/charges
// --- retrieve all outstanding charges for life (:id)
router.get('/life/:id/charges', function(req, res) {
    debug('[GET] /charge/:id/charges');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Charge
        .findAll({
            where: {lifeId: lifeId},
            attributes: chargeAttributes
        })
        .then(function(charges) {
            res.status(200).send(Blockages.respMsg(res, true, charges));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/life/:id/charge/:chargeId
// --- retrieve the charge (:chargeId) for life (:id)
router.get('/life/:id/charge/:chargeId', function(req, res) {
    debug('[GET] /charge/life/:id/charge/:chargeId');
    var lifeId   = req.params.id;
    var chargeId = req.params.chargeId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Charge
        .find({
            where: {
                chargeId: chargeId,
                lifeId: lifeId
            },
            attributes: chargeAttributes
        })
        .then(function(charge) {
            if (!charge)
                throw new Blockages.NotFoundError('Charge not found');

            res.status(200).send(Blockages.respMsg(res, true, charge.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/life/:id/cell/:cellId
// --- retrieve the charge for a charge cell (:cellId) for life (:id)
router.get('/life/:id/charge/:chargeId', function(req, res) {
    debug('[GET] /charge/life/:id/cell/:cellId');
    var lifeId       = req.params.id;
    var chargeCellId = req.params.cellId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Charge
        .find({
            where: {
                lifeId: lifeId,
                chargeCellId: chargeCellId
            },
            attributes: chargeAttributes
        })
        .then(function(charge) {
            if (!charge)
                throw new Blockages.NotFoundError('Charge not found');

            res.status(200).send(Blockages.respMsg(res, true, charge.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id
// --- retrieve info for charge cell (:id)
router.get('/cell/:id', function(req, res) {
    debug('[GET] /charge/cell/:id/');
    var chargeCellId = req.params.id;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.ChargeCell
        .find({ where: {chargeCellId: chargeCellId},
                include: chargeIncludesCell })
        .then(function(chargeCell) {
            if (!chargeCell)
                throw new Blockages.NotFoundError('Charge cell not found');

            res.status(200).send(Blockages.respMsg(res, true, chargeCell.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/chargeTotal
// --- retrieve total number of charges and their value for charge cell (:id)
router.get('/cell/:id/chargeTotal', function(req, res) {
    debug('[GET] /charge/cell/:id/chargeTotal');
    var chargeCellId = req.params.id;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.Charge
        .findAll({ where: {chargeCellId: chargeCellId} })
        .then(function(charges) {
            var chargeTotal = 0;
            for (var i = 0; i < charges.length; i++)
                chargeTotal += charges[i].value;

            res.status(200).send(Blockages.respMsg(res, true, { charges: charges.length, value: chargeTotal }));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/charges (admin only)
// --- retrieve all charges for charge cell (:id)
router.get('/cell/:id/charges', function(req, res) {
    debug('[GET] /charge/cell/:id/charges');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /charge/cell/:id/image
// --- retrieve cell image (logo) for charge cell (:id)
router.get('/cell/:id/image', function(req, res) {
    debug('[GET] /charge/cell/:id/image');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /charge/cell/:id/address
// --- retrieve the address of the charge cell (:id)
router.get('/cell/:id/address', function(req, res) {
    debug('[GET] /charge/cell/:id/address');
    var chargeCellId = req.params.id;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.Address
        .find({
            where: {chargeCellId: chargeCellId},
            attributes: attributesAddress
        })
        .then(function(address) {
            res.status(200).send(Blockages.respMsg(res, true, address.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/phones
// --- retrieve array of phone numbers for charge cell (:id)
router.get('/cell/:id/phones', function(req, res) {
    debug('[GET] /charge/cell/:id/phones');
    var chargeCellId = req.params.id;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.Phone
        .findAll({
            where: {chargeCellId: chargeCellId},
            attributes: attributesPhone
        })
        .then(function(phones) {
            res.status(200).send(Blockages.respMsg(res, true, phones));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/instances
// --- retrieve array of charge instances for charge cell (:id)
router.get('/cell/:id/instances', function(req, res) {
    debug('[GET] /charge/cell/:id/instances');
    var chargeCellId = req.params.id;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.ChargeInstance
        .findAll({
            where: {chargeCellId: chargeCellId},
            attributes: chargeInstanceAttributes
        })
        .then(function(instances) {
            res.status(200).send(Blockages.respMsg(res, true, instances));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/instance/:instanceId
// --- retrieve info on charge instance (:instanceId) for charge cell (:id)
router.get('/cell/:id/instance/:instanceId', function(req, res) {
    debug('[GET] /charge/cell/:id/instance/:instanceId');
    var chargeCellId     = req.params.id;
    var chargeInstanceId = req.params.instanceId;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.ChargeInstance
        .find({
            where: {
                instanceId: chargeInstanceId,
                cellId: chargeCellId
            },
            attributes: chargeInstanceAttributes
        })
        .then(function(instance) {
            if (!instance)
                throw new Blockages.NotFoundError('Charge instance not found');

            res.status(200).send(Blockages.respMsg(res, true, instance.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/instance/:instanceId/address
// --- retrieve the address of charge instance (:instanceId) for charge cell (:id)
router.get('/cell/:id/instance/:instanceId/address', function(req, res) {
    debug('[GET] /charge/cell/:id/instance/:instanceId/address');
    //  chargeCellId = req.params.id;
    var chargeInstanceId = req.params.instanceId;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.Address
        .find({
            where: {chargeInstanceId: chargeInstanceId},
            attributes: attributesAddress
        })
        .then(function(address) {
            res.status(200).send(Blockages.respMsg(res, true, address.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/instance/:instanceId/phones
// --- retrieve phone numbers of charge instance (:instanceId) for charge cell (:id)
router.get('/cell/:id/instance/:instanceId/phones', function(req, res) {
    debug('[GET] /charge/cell/:id/instance/:instanceId/phones');
    //  chargeCellId = req.params.id;
    var chargeInstanceId = req.params.instanceId;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.Phone
        .findAll({
            where: {chargeInstanceId: chargeInstanceId},
            attributes: attributesPhone
        })
        .then(function(phones) {
            res.status(200).send(Blockages.respMsg(res, true, phones));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/instance/interferenceDegree?constructive=[constructive]&destructive=[destructive]&constructiveDelta=[constructive region delta]&destructiveDelta=[destructive region delta]
// --- retrieve array of instance charge interference(s) in given mapped area of field (constructive, destructive, constructiveDelta, destructiveDelta) // retrieve charge alignments or misalignments for cell charge at a point in time during a cell cycle
router.get('/cell/instance/interferometer?', function(req, res) {
    debug('[GET] /charge/cell/instance/interferometer?'); 
    var constructiveInterference      = validate.toFloat(req.query.constructiveInterference);
    var destructiveInterference       = validate.toFloat(req.query.destructiveInterference);
    var deltaConstructiveInterference = validate.toFloat(req.query.deltaConstructiveInterference);
    var deltaDestructiveInterference  = validate.toFloat(req.query.deltaDestructiveInterference);
    
    // No immunity level necessary for this route; all are allowed access after signature has been verified.

verbose('constructiveInterference: ' + constructiveInterference + ' destructiveInterference: ' + destructiveInterference + 'deltaConstructiveInterference: ' + deltaConstructiveInterference + 'deltaDestructiveInterference: ' + deltaDestructiveInterference);
    var minimumConstructiveInterference = Math.max(constructiveInterference - (deltaConstructiveInterference/2),   0);
    var maximumConstructiveInterference = Math.min(constructiveInterference + (deltaConstructiveInterference/2),  90);
    var maximumDestructiveInterference  = Math.min(destructiveInterference  + (deltaDestructiveInterference/2),    0);
    var minimumDestructiveInterference  = Math.max(destructiveInterference  - (deltaDestructiveInterference/2),  -90);
    verbose('minimumConstructiveInterference: ' + minimumConstructiveInterference + 'maximumConstructiveInterference: ' + maximumConstructiveInterference + 'minimumDestructiveInterference: ' + minimumDestructiveInterference + 'maximumDestructiveInterference: ' + maximumDestructiveInterference);

    metabolism.InstanceCharge
        .findAll({
            where: {
                 constructive: { between: [minimumConstructiveInterference, maximumConstructiveInterference] },
                 destructive: { between: [minimumDestructiveInterference, maximumDestructiveInterference] },
            },
            include: {model: metabolism.chargeCell, attributes: chargeCellAttributes},
            attributes: chargeInstanceAttributes
        })
        .then(function(instances) {
            res.status(200).send(Blockages.response(res, true, instances));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.response(res, false, error));
        });
});

// /charge/cell/:id/life/:id/chargeContributionMargin
// --- retrieve contribution margin for life's charge interferenceDegree (:id)
router.get('/life/:id/charge/:chargeId/contributionMargin', function(req, res) {
    debug('[GET] /life/:id/charge/:chargeId/contributionMargin'); // /life/:id/chargeCurrent/:chargeCurrentId/chargeContributionMargin
    var chargeId = req.params.id;
    var interferenceTotal = req.params.id;

    // No immunity level necessary for this route; all are allowed access after signature has been verified.

    metabolism.Charge
        .findAll({ where: {chargeId: chargeId} })
        .then(function(charges) {
            var contributionMargin = chargeId / interferenceTotal;

            res.status(200).send(Blockages.response(res, true, { charges: charges.length, contributionMargin: contributionMargin }));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.response(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// PUT ROUTES
// -----------------------------------------------------------------------------
// /charge/life/:id/charge/:chargeId
// --- update value of charge (:chargeId) for life (:id)
router.put('/life/:id/charge/:chargeId', function(req, res) {
    debug('[PUT] /charge/life/:id/charge/:chargeId');
    var lifeId   = req.params.id;
    var chargeId = req.params.chargeId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Charge
        .find({
            where: {
                chargeId: chargeId,
                lifeId: lifeId
            },
            attributes: chargeAttributes
        })
        .then(function(charge) {
            if (!charge)
                throw new Blockages.NotFoundError('Charge not found');

          /*charge.chargeId:     not accessible for change */
            charge.value =       validate.toInt(req.body.value);
          /*charge.lifeId:       not accessible for change */
          /*charge.chargeCellId: not accessible for change */

            return charge.save();
        })
        .then(function(charge) {
            res.status(200).send(Blockages.respMsg(res, true, charge.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id
// --- update info for charge cell (:id)
router.put('/cell/:id', function(req, res) {
    debug('[PUT] /charge/cell/:id');
    var cellId = req.params.id;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.ChargeCell
        .find({
            where: {chargeCellId: cellId},
            attributes: chargeCellAttributes
        })
        .then(function(chargeCell) {
            if (!chargeCell)
                throw new Blockages.NotFoundError('Charge cell not found');

          /*chargeCell.chargeCellId: not accessible for change */
            chargeCell.name          = validate.trim(validate.toString(req.body.name));
            chargeCell.type          = metabolism.ChargeCell.extractWebsite(metabolism, req.body.type);
            chargeCell.website       = metabolism.ChargeCell.extractWebsite(metabolism, req.body.website);
          /*chargeCell.countryCode:  not accessible for change */

            return chargeCell.save();
        })
        .then(function(chargeCell) {
            res.status(200).send(Blockages.respMsg(res, true, chargeCell.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/address/:addressId
// --- update main address (:addressId) for charge cell (:id)
router.put('/cell/:id/address/:addressId', function(req, res) {
    debug('[PUT] /charge/cell/:id/address/:addressId');
    var chargeCellId = req.params.id;
    var addressId    = req.params.addressId;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.Address
       .find({
            where: {
                addressId: addressId,
                chargeCellId: chargeCellId
            },
            attributes: attributesAddress
        })
        .then(function(address) {
            if (!address)
                throw new Blockages.NotFoundError('Address not found');

          /*address.addressId:        not accessible for change */
          /*address.name:             not accessible for change */
            address.address1          = validate.trim(validate.toString(req.body.address1));
            address.address2          = metabolism.Address.extractAddress(metabolism, req.body.address2);
            address.address3          = metabolism.Address.extractAddress(metabolism, req.body.address3);
            address.address4          = metabolism.Address.extractAddress(metabolism, req.body.address4);
            address.locality          = validate.trim(validate.toString(req.body.locality));
            address.region            = validate.trim(validate.toString(req.body.region));
            address.postalCode        = validate.trim(validate.toString(req.body.postalCode));
          /*address.lifeId:           not accessible for change */
          /*address.cellId:           not accessible for change */
          /*address.instanceId:       not accessible for change */
          /*address.geneId:           not accessible for change */
          /*address.chargeCellId:     not accessible for change */
          /*address.chargeInstanceId: not accessible for change */

            return address.save();
        })
        .then(function(address) {
            res.status(200).send(Blockages.respMsg(res, true, address.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/phone/:phoneId
// --- update phone number (:phoneId) for charge cell (:id)
router.put('/cell/:id/phone/:phoneId', function(req, res) {
    debug('[PUT] /charge/cell/:id/phone/:phoneId');
    var chargeCellId = req.params.id;
    var phoneId      = req.params.phoneId;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.Phone
        .find({
            where: {
                phoneId: phoneId,
                chargeCellId: chargeCellId
            },
            attributes: attributesPhone
        })
        .then(function(phone) {
            if (!phone)
                throw new Blockages.NotFoundError('Phone not found');

          /*phone.phoneId:          not accessible for change */
            phone.name              = metabolism.Phone.extractName(metabolism, req.body.name);
            phone.number            = validate.trim(validate.toString(req.body.number));
            phone.extension         = metabolism.Phone.extractExtension(metabolism, req.body.extension);
          /*phone.lifeId:           not accessible for change */
          /*phone.cellId:           not accessible for change */
          /*phone.instanceId:       not accessible for change */
          /*phone.geneId:           not accessible for change */
          /*phone.chargeCellId:     not accessible for change */
          /*phone.chargeInstanceId: not accessible for change */

            return phone.save();
        })
        .then(function(phone) {
            res.status(200).send(Blockages.respMsg(res, true, phone.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/instance/:instanceId
// --- update info of charge instance (:instanceid) for charge cell (:id)
router.put('/cell/:id/instance/:instanceId', function(req, res) {
    debug('[PUT] /charge/cell/:id/instance/:instanceId');
    var chargeCellId     = req.params.id;
    var chargeInstanceId = req.params.instanceId;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.ChargeInstance
        .find({
            where: {
                chargeInstanceId: chargeInstanceId,
                chargeCellId: chargeCellId
            },
            attributes: chargeInstanceAttributes
        })
        .then(function(instance) {
            if (!instance)
                throw new Blockages.NotFoundError('Charge instance not found');

            // 'major' field is not part of a charge instance
            // 'uuidId' field is not part of a charge instance

            // Extract 'constructiveInterference' from the body
            var constructiveInterference = null;
            if (req.body.hasOwnProperty('constructiveInterference'))
                constructiveInterference = metabolism.ChargeInstance.extractConstructiveInterference(metabolism, req.body.constructiveInterference);

            // Extract 'destructiveInterference' from the body
            var destructiveInterference = null;
            if (req.body.hasOwnProperty('destructiveInterference'))
                destructiveInterference = metabolism.ChargeInstance.extractDestructiveInterference(metabolism, req.body.destructiveInterference);

          /*instance.instanceId: not accessible for change */
            instance.constructiveInterference = constructiveInterference;
            instance.destructiveInterference  = destructiveInterference;
            instance.name                     = metabolism.ChargeInstance.extractName(metabolism, req.body.name);
            instance.website                  = metabolism.ChargeInstance.extractWebsite(metabolism, req.body.website);
          /*instance.cellType:                not accessible for change */
          /*instance.countryCode:             not accessible for change */
          /*instance.chargeCellId:            not accessible for change */

            return instance.save();
        })
        .then(function(instance) {
            res.status(200).send(Blockages.respMsg(res, true, instance.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/instance/:instanceId/address/:addressId
// --- update main address (:addressId) for charge instance (:instanceId) of charge cell (:id)
router.put('/cell/:id/instance/:instanceId/address/:addressId', function(req, res) {
    debug('[PUT] /charge/cell/:id/instance/:instanceId/address/:addressId');
   //  chargeCellId = req.params.id;
    var chargeInstanceId = req.params.instanceId;
    var addressId        = req.params.addressId;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.Address
       .find({
            where: {
                addressId: addressId,
                chargeInstanceId: chargeInstanceId
            },
            attributes: attributesAddress
        })
        .then(function(address) {
            if (!address)
                throw new Blockages.NotFoundError('Address not found');

          /*address.addressId:        not accessible for change */
          /*address.name:             not accessible for change */
            address.address1          = validate.trim(validate.toString(req.body.address1));
            address.address2          = metabolism.Address.extractAddress(metabolism, req.body.address2);
            address.address3          = metabolism.Address.extractAddress(metabolism, req.body.address3);
            address.address4          = metabolism.Address.extractAddress(metabolism, req.body.address4);
            address.locality          = validate.trim(validate.toString(req.body.locality));
            address.region            = validate.trim(validate.toString(req.body.region));
            address.postalCode        = validate.trim(validate.toString(req.body.postalCode));
          /*address.lifeId:           not accessible for change */
          /*address.cellId:           not accessible for change */
          /*address.instanceId:       not accessible for change */
          /*address.geneId:           not accessible for change */
          /*address.chargeCellId:     not accessible for change */
          /*address.chargeInstanceId: not accessible for change */

            return address.save();
        })
        .then(function(address) {
            res.status(200).send(Blockages.respMsg(res, true, address.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/instance/:instanceId/phone/:phoneId
// --- update phone number (:phoneId) for charge instance (:instanceId) of charge cell (:id)
router.put('/cell/:id/instance/:instanceId/phone/:phoneId', function(req, res) {
    debug('[PUT] /charge/cell/:id/instance/:instanceId/phone/:phoneId');
    //  chargeCellId = req.params.id;
    var chargeInstanceId = req.params.instanceId;
    var phoneId          = req.params.phoneId;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.Phone
        .find({
            where: {
                phoneId: phoneId,
                chargeInstanceId: chargeInstanceId
            },
            attributes: attributesPhone
        })
        .then(function(phone) {
            if (!phone)
                throw new Blockages.NotFoundError('Phone not found');

          /*phone.phoneId:          not accessible for change */
            phone.name              = metabolism.Phone.extractName(metabolism, req.body.name);
            phone.number            = validate.trim(validate.toString(req.body.number));
            phone.extension         = metabolism.Phone.extractExtension(metabolism, req.body.extension);
          /*phone.lifeId:           not accessible for change */
          /*phone.cellId:           not accessible for change */
          /*phone.instanceId:       not accessible for change */
          /*phone.geneId:           not accessible for change */
          /*phone.chargeCellId:     not accessible for change */
          /*phone.chargeInstanceId: not accessible for change */

            return phone.save();
        })
        .then(function(phone) {
            res.status(200).send(Blockages.respMsg(res, true, phone.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// POST ROUTES
// -----------------------------------------------------------------------------
// /charge/cell/register
// --- create a new charge cell
router.post('/cell/register', function(req, res) {
    debug('[POST] /charge/cell/register');
    
    // No immunity level necessary for this route; all are allowed access after token has been verified.

    // Create the cell record
    var newChargeCell = {
      /*chargeCellId: 0,*/
        name:             validate.trim(validate.toString(req.body.name)),
        type:             metabolism.ChargeCell.extractWebsite(metabolism, req.body.type),
        website:          metabolism.ChargeCell.extractWebsite(metabolism, req.body.website),
        countryCode:      CountryCodes.ENUM.USA.abbr
    };

    metabolism.ChargeCell.create(newChargeCell)
        .then(function(chargeCell) {
            res.status(201).send(Blockages.respMsg(res, true, chargeCell.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/charge
// --- create a new charge
router.post('/cell/:id/charge', function(req, res) {
    debug('[POST] /charge/cell/:id/charge');
    var chargeCellId = req.params.id;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.Charge
        .find({
            where: {
                chargeCellId: chargeCellId,
                lifeId: res.locals.lifePacket.life.lifeId
            },
            attributes: chargeAttributes
        })
        .then(function(charge) {
            if (charge)
                throw new Blockages.ConflictError('Charge already exists for this cell');

            var newCharge = {
              /*chargeId:         0,*/
                value:        validate.toInt(req.body.value),
                lifeId:       res.locals.lifePacket.life.lifeId,
                chargeCellId: chargeCellId
            };

            return metabolism.Charge.create(newCharge);
        })
        .then(function(charge) {
            res.status(200).send(Blockages.respMsg(res, true, charge.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/image
// --- add an image to an existing charge cell (:id)
router.post('/cell/:id/image', function(req, res) {
    debug('[POST] /charge/cell/:id/image');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /charge/cell/:id/address
// --- add an address to an existing charge cell (:id)
router.post('/cell/:id/address', function(req, res) {
    debug('[POST] /charge/cell/:id/address');
    var chargeCellId = req.params.id;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.ChargeCell
        .find({
            where: {chargeCellId: chargeCellId},
            include: includeAddress,
            attributes: chargeCellAttributes
        })
        .then(function(chargeCell) {
            if (!chargeCell)
                throw new Blockages.NotFoundError('Charge cell not found');
            else if (chargeCell.Address !== null)
                throw new Blockages.ConflictError('Charge cell already has an address');

            var newAddress = {
              /*addressId:        0,*/
                name:             '$$_cell',
                address1:         validate.trim(validate.toString(req.body.address1)),
                address2:         metabolism.Address.extractAddress(metabolism, req.body.address2),
                address3:         metabolism.Address.extractAddress(metabolism, req.body.address3),
                address4:         metabolism.Address.extractAddress(metabolism, req.body.address4),
                locality:         validate.trim(validate.toString(req.body.locality)),
                region:           validate.trim(validate.toString(req.body.region)),
                postalCode:       validate.trim(validate.toString(req.body.postalCode)),
              /*lifeId:           null,*/
              /*cellId:           null,*/
              /*instanceId:       null,*/
              /*geneId:           null,*/
                chargeCellId:     chargeCell.chargeCellId
              /*chargeInstanceId: null*/
            };

            return metabolism.Address.create(newAddress);
        })
        .then(function(address) {
            res.status(201).send(Blockages.respMsg(res, true, address.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/phone
// --- add a phone number to an existing charge cell (:id)
router.post('/cell/:id/phone', function(req, res) {
    debug('[POST] /charge/cell/:id/phone');
    var chargeCellId = req.params.id;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.ChargeCell
        .find({
            where: {chargeCellId: chargeCellId},
            attributes: chargeCellAttributes
        })
        .then(function(chargeCell) {
            if (!chargeCell)
                throw new Blockages.NotFoundError('Charge cell not found');

            var newPhone = {
              /*phoneId:          0,*/
                name:             metabolism.Phone.extractName(metabolism, req.body.name),
                number:           validate.trim(validate.toString(req.body.number)),
                extension:        metabolism.Phone.extractExtension(metabolism, req.body.extension),
              /*lifeId:           null,*/
              /*cellId:           null,*/
              /*instanceId:       null,*/
              /*geneId:           null,*/
                chargeCellId:     chargeCell.chargeCellId
              /*chargeInstanceId: null*/
            };

            return metabolism.Phone.create(newPhone);
        })
        .then(function(phone) {
            res.status(201).send(Blockages.respMsg(res, true, phone.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/instance
// --- add a instance to an existing charge cell (:id)
router.post('/cell/:id/instance', function(req, res) {
    debug('[POST] /charge/cell/:id/instance');
    var chargeCellId = req.params.id;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.ChargeCell
        .find({
            where: {chargeCellId: chargeCellId},
            attributes: chargeCellAttributes
        })
        .then(function(chargeCell) {
            if (!chargeCell)
                throw new Blockages.NotFoundError('Charge cell not found');

            // Extract 'constructiveInterference' from the body
            var constructiveInterference = null;
            if (req.body.hasOwnProperty('constructiveInterference'))
                constructiveInterference = metabolism.ChargeInstance.extractConstructiveInterference(metabolism, req.body.constructiveInterference);

            // Extract 'destructiveInterference' from the body
            var destructiveInterference = null;
            if (req.body.hasOwnProperty('destructiveInterference'))
                destructiveInterference = metabolism.ChargeInstance.extractDestructiveInterference(metabolism, req.body.destructiveInterference);

            var newChargeInstance = {
              /*instanceId:       0,*/
                constructiveInterference: constructiveInterference,
                destructiveInterference:  destructiveInterference,
                name:                     metabolism.ChargeInstance.extractName(metabolism, req.body.name),
                website:                  metabolism.ChargeInstance.extractWebsite(metabolism, req.body.website),
                cellType:                 metabolism.ChargeInstance.extractType(metabolism, req.body.type),
              /*countryCode:              null,*/
                chargeCellId:             chargeCell.chargeCellId
            };

            return metabolism.ChargeInstance.create(newChargeInstance);
        })
        .then(function(chargeInstance) {
            res.status(201).send(Blockages.respMsg(res, true, chargeInstance.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/instance/:instanceId/address
// --- add an address to an existing charge instance (:instanceId) of charge cell (:id)
router.post('/cell/:id/instance/:instanceId/address', function(req, res) {
    debug('[POST] /charge/cell/:id/instance/:instanceId/address');
    var chargeCellId = req.params.id;
    var chargeInstanceId = req.params.instanceId;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.ChargeInstance
        .find({
            where: {
                chargeInstanceId: chargeInstanceId,
                chargeCellId: chargeCellId
            },
            include: includeAddress,
            attributes: chargeCellAttributes
        })
        .then(function(chargeInstance) {
            if (!chargeInstance)
                throw new Blockages.NotFoundError('Charge instance not found');
            else if (chargeInstance.Address !== null)
                throw new Blockages.ConflictError('Charge instance already has an address');

            var newAddress = {
              /*addressId:        0,*/
                name:             '$$_locale',
                address1:         validate.trim(validate.toString(req.body.address1)),
                address2:         metabolism.Address.extractAddress(metabolism, req.body.address2),
                address3:         metabolism.Address.extractAddress(metabolism, req.body.address3),
                address4:         metabolism.Address.extractAddress(metabolism, req.body.address4),
                locality:         validate.trim(validate.toString(req.body.locality)),
                region:           validate.trim(validate.toString(req.body.region)),
                postalCode:       validate.trim(validate.toString(req.body.postalCode)),
              /*lifeId:           null,*/
              /*cellId:           null,*/
              /*instanceId:       null,*/
              /*geneId:           null,*/
              /*chargeCellId:     null,*/
                chargeInstanceId: chargeInstance.chargeInstanceId
            };

            return metabolism.Address.create(newAddress);
        })
        .then(function(address) {
            res.status(201).send(Blockages.respMsg(res, true, address.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /charge/cell/:id/instance/:instanceId/phone
// --- add a phone number to an existing charge instance (:instanceId) of charge cell (:id)
router.post('/cell/:id/instance/:instanceId/phone', function(req, res) {
    debug('[POST] /charge/cell/:id/instance/:instanceId/phone');
    var chargeCellId = req.params.id;
    var chargeInstanceId = req.params.instanceId;

    // No immunity level necessary for this route; all are allowed access after token has been verified.

    metabolism.ChargeInstance
        .find({
            where: {
                chargeInstanceId: chargeInstanceId,
                chargeCellId: chargeCellId
            },
            attributes: chargeInstanceAttributes
        })
        .then(function(chargeInstance) {
            if (!chargeInstance)
                throw new Blockages.NotFoundError('Charge instance not found');

            var newPhone = {
              /*phoneId:          0,*/
                name:             metabolism.Phone.extractName(metabolism, req.body.name),
                number:           validate.trim(validate.toString(req.body.number)),
                extension:        metabolism.Phone.extractExtension(metabolism, req.body.extension),
              /*lifeId:           null,*/
              /*cellId:           null,*/
              /*instanceId:       null,*/
              /*geneId:           null,*/
              /*chargeCellId:     null,*/
                chargeInstanceId: chargeInstance.chargeInstanceId
            };

            return metabolism.Phone.create(newPhone);
        })
        .then(function(phone) {
            res.status(201).send(Blockages.respMsg(res, true, phone.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// DELETE ROUTES
// -----------------------------------------------------------------------------
// /charge/:id
// ---
router.delete('/:id', function(req, res) {
    debug('[DELETE] /charge/:id');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /charge/cell/:id
// ---
router.delete('/cell/:id', function(req, res) {
    debug('[DELETE] /charge/cell/:id');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /charge/cell/:id/image/:size
// ---
router.delete('/cell/:id/image/:size', function(req, res) {
    debug('[DELETE] /charge/cell/:id/image/:size');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /charge/cell/:id/address/:addressId
// ---
router.delete('/cell/:id/address/:addressId', function(req, res) {
    debug('[DELETE] /charge/cell/:id/address/:addressId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /charge/cell/:id/phone/:phoneId
// ---
router.delete('/cell/:id/phone/:phoneId', function(req, res) {
    debug('[DELETE] /charge/cell/:id/phone/:phoneId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /charge/cell/:id/instance/:instanceId
// ---
router.delete('/cell/:id/instance/:locaitonId', function(req, res) {
    debug('[DELETE] /charge/cell/:id/instance/:instanceId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /charge/cell/:id/instance/:instanceId/address/:addressId
// ---
router.delete('/cell/:id/instance/:instanceId/address/:addressId', function(req, res) {
    debug('[DELETE] /charge/cell/:id/instance/:instanceId/address/:addressId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /charge/cell/:id/instance/:instanceId/phone/:phoneId
// ---
router.delete('/cell/:id/instance/:instanceId/phone/:phoneId', function(req, res) {
    debug('[DELETE] /charge/cell/:id/instance/:instanceId/phone/:phoneId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// -----------------------------------------------------------------------------
// CATCH-ALL ROUTES (error)
// -----------------------------------------------------------------------------
// /charge/*
// --- Any get route request not handled is caught with this route
router.get('/*', function(req, res) {
    debug('[GET] /charge/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /charge/*
// --- Any put route request not handled is caught with this route
router.put('/*', function(req, res) {
    debug('[PUT] /charge/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /charge/*
// --- Any post route request not handled is caught with this route
router.post('/*', function(req, res) {
    debug('[POST] /charge/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /charge/*
// --- Any delete route request not handled is caught with this route
router.delete('/*', function(req, res) {
    debug('[DELETE] /charge/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});
