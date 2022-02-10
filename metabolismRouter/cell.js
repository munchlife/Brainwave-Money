'use strict';

// cell.js (routes)

// Node.js native packages
var fs = require('fs');

// Dependency packages
var debug   = require('debug')('munch:routes:Cell');
var verbose = require('debug')('munch:verbose:routes:Cell');
var express = require('express');
var mv      = require('mv');

// Local js modules
var Middlewares  = require('./middlewares');
var metabolism   = require('../../models/database');
var CellGraph    = require('../../config/cellGraph');
var Immunities   = require('../../config/immunities');
var Genes        = require('../../config/genes');
var Blockages    = require('../../config/blockages');
var CountryCodes = require('../../data/countryCodes');
var GeneType     = require('../../data/geneTypes');

var validate = metabolism.Sequelize.Validator;

var router = module.exports = express.Router();

// -----------------------------------------------------------------------------
// NON-TOKEN AUTH ROUTES
// -----------------------------------------------------------------------------
// Cell OAuth2 Authorization Callback
// TODO: place proper restrictions to auth callback to verify sender
var authCallback = function(req, res, cellId, geneId) {
    metabolism.sequelize.Promise.all([
        metabolism.GeneSignalPathway
            .find({ where: {cellId: cellId, geneId: geneId} /* attributes: default */ }),
        metabolism.Gene
            .find({ where: {geneId: geneId}                 /* attributes: default */ }),
        metabolism.Cell
            .find({ where: {cellId: cellId}                 /* attributes: default */ })
    ]).bind({})
    .spread(function(signalPathway, gene, cell) {
        if (signalPathway)
            throw new Blockages.ConflictError('Gene signalPathway already exists');
        else if (!gene)
            throw new Blockages.NotFoundError('Gene not found');
        else if (!cell)
            throw new Blockages.NotFoundError('Cell not found');

        this.cell = cell;
        this.gene = gene;

        var geneAPI = new Genes[gene.geneName.toString()]();
        return geneAPI.authenticateCallback(req.query.code, req.headers.host + '/v1', null, cell.cellId);
    })
    .then(function(newSignalPathway) {
      /*newSignalPathway.signalPathwayId: 0,*/
      /*newSignalPathway.signalPheromone:                        set by geneAPI*/
      /*newSignalPathway.signalPheromoneExpiration:              set by geneAPI*/
      /*newSignalPathway.reinforcementSignalPheromone:           set by geneAPI*/
      /*newSignalPathway.reinforcementSignalPheromoneExpiration: set by geneAPI*/
      /*newSignalPathway.optional:                               set by geneAPI*/
      /*newSignalPathway.lifeId                                  null,*/
        newSignalPathway.cellId                                  = this.cell.cellId;
        newSignalPathway.geneId                                  = this.gene.geneId;

        return metabolism.GeneSignalPathway.create(newSignalPathway);
    })
    .then(function(signalPathway) {
        res.status(201).send(Blockages.respMsg(res, true, signalPathway.get()));
    })
    .catch(metabolism.Sequelize.ValidationError, function(error) {
        res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
    })
    .catch(function(error) {
        res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
    });
};

// /cell/gene/:geneId/auth/callback
// --- OAuth2 authorization callback handler (correctly uses state query field)
router.get('/gene/:geneId/auth/callback', function(req, res) {
    debug('[GET] /cell/gene/:geneId/auth/callback');
    var cellId = req.query.state;
    var geneId  = req.params.geneId;

    authCallback(req, res, cellId, geneId);
});

// /cell/:id/gene/:geneId/auth/callback
// --- OAuth2 authorization callback handler (for genes that don't support the state field)
router.get('/:id/gene/:geneId/auth/callback', function(req, res) {
    debug('[GET] /cell/:id/gene/:geneId/auth/callback');
    var cellId = req.params.id;
    var geneId  = req.params.geneId;

    authCallback(req, res, cellId, geneId);
});

// -----------------------------------------------------------------------------
// TOKEN AUTHENTICATION MIDDLEWARE
// -----------------------------------------------------------------------------
router.use(Middlewares.tokenAuth);

// -----------------------------------------------------------------------------
// ATTRIBUTE/INCLUDE SETUP
// -----------------------------------------------------------------------------
// Removed from all attribute lists: createdAt, updatedAt, deletedAt
var attributesAddress           = [ 'addressId',       'name', 'address1', 'address2', 'address3', 'address4', 'locality', 'region', 'postalCode' ]; // Removed: lifeId, cellId, instanceId, geneId, chargeCellId, chargeInstanceId
var attributesCellDevice        = [ 'deviceId',        'map', 'type', 'serialNumber', 'description', 'acceptsCash', 'acceptsCredit', 'instanceId' ];
var attributesCellInstance      = [ 'instanceId',      'atlas', 'constructiveInterference', 'destructiveInterference', 'name', 'website', 'cellType', 'countryCode', 'fieldId' ]; // Removed: cellId
var attributesCellStakeholder   = [ 'stakeholderId',   'immunities', 'cellId', 'instanceId', 'lifeId' ]; // Removed: N/A
var attributesPhone             = [ 'phoneId',         'name', 'number', 'extension' ];    // Removed: chargeInstanceId, chargeCellId, cellId, instanceId, lifeId, geneId
var attributesGeneSignalPathway = [ 'signalPathwayId', 'signalPheromone', 'geneId' ]; // Removed: signalPheromone, signalPheromoneExpiration, reinforcementWavePheromone, reinforcementWavePheromoneExpiration, optional, cellId, lifeId

// Remove fields from metabolism.Cell: deletedAt
var cellAttributes = [ 'cellId', 'verified', 'name', 'type', 'website', 'countryCode', 'createdAt', 'updatedAt' ];

// Remove fields from metabolism.CellInstance: deletedAt
var instanceAttributes = [ 'instanceId', 'atlas', 'constructiveInterference', 'destructiveInterference', 'name', 'website', 'cellType', 'countryCode', 'createdAt', 'updatedAt', 'cellId', 'fieldId' ];

// Remove fields from metabolism.Life: phoneVerified, emailVerified, receiptEmail, receiptEmailVerified, referralCode, eegHash, eegExpiration, genomeHash, createdAt, updatedAt, deletedAt
var lifeAttributes = [ 'lifeId', 'phone', 'email', 'givenName', 'middleName', 'familyName', 'countryCode' ];

// Remove fields from metabolism.Gene: supportEmail, supportEmailVerified, supportWebsite, supportVersion, signupUrl, authUrl, deauthUrl
var includeGene = { model: metabolism.Gene, attributes: [ 'geneId', 'geneType', 'geneName', 'companyName', 'website', 'countryCode' ] };

var includeAddress           = { model: metabolism.Address,           as: 'Address',            attributes: attributesAddress };
var includeCellDevice        = { model: metabolism.CellDevice,        as: 'Devices',            attributes: attributesCellDevice };
var includeCellInstance      = { model: metabolism.CellInstance,      as: 'Instances',          attributes: attributesCellInstance};
var includeCellStakeholder   = { model: metabolism.CellStakeholder,   as: 'StakeholderMembers', attributes: attributesCellStakeholder };
var includePhone             = { model: metabolism.Phone,             as: 'Phones',             attributes: attributesPhone };
var includeGeneSignalPathway = { model: metabolism.GeneSignalPathway, as: 'SignalPathways',     attributes: attributesGeneSignalPathway };

//  cellIncludesAll      = [ includeAddress, includeCellInstance, includeCellStakeholder, includePhone, includeGeneSignalPathway ];
var cellIncludesCell     = [ includeAddress, includeCellInstance, includeCellStakeholder, includePhone, includeGeneSignalPathway ];
var cellIncludesInstance = [ includeAddress, includeCellDevice,   includeCellStakeholder, includePhone ];

// -----------------------------------------------------------------------------
// USE MERCHANT-ORDER ROUTES
// -----------------------------------------------------------------------------
// All routes related to a cell's cycles are located in the cell-cycle.js file
router.use(require('./cellCycle'));

// -----------------------------------------------------------------------------
// GET ROUTES
// -----------------------------------------------------------------------------
// /cell/:id
// --- retrieve info for cell (:id)
router.get('/:id', function(req, res) {
    debug('[GET] /cell/:id');
    var cellId = req.params.id;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Cell
        .find({
            where: {cellId: cellId},
            include: cellIncludesCell,
            attributes: cellAttributes
        })
        .then(function(cell) {
            if (!cell)
                throw new Blockages.NotFoundError('Cell not found');

            res.status(200).send(Blockages.respMsg(res, true, cell.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// TODO: determine different media types and types to expand uses
var sendCellMedia = function(res, cellId, type) {
    var mediaTypes = [ '.png', '.wav', '.mov', '.fasta' ];

    if (!validate.isIn(type, mediaTypes))
        return res.status(400).send(Blockages.respMsg(res, false, 'Media type not recognized'));

    var mediaFile = 'media-name' + type;
    var mediaPath = res.app.locals.rootDir + '/medias/cell/' + cellId + '/';
    var mediaInfo = { root: mediaPath };

    res.sendFile(mediaFile, mediaInfo, function (error) {
        if (error) {
            if (res.statusCode !== 304 || error.code !== 'ECONNABORT') {
    			res.status(error.status).send(Blockages.respMsg(res, false, 'No media found'));
            }
    		else { /* 304 cache hit, no data sent but still success */ }
        }
        else { /* Successfully sent, nothing to do here */ }
    });
};

// /cell/:id/media (default type)
// --- retrieve cell media (logo) for cell (:id)
router.get('/:id/media', function(req, res) {
    debug('[GET] /cell/:id/media');
    var cellId = req.params.id;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    sendCellMedia(res, cellId);
});

// /cell/:id/media/:type (all supported types)
// --- retrieve cell media (logo) for cell (:id)
router.get('/:id/media/:type', function(req, res) {
    debug('[GET] /cell/:id/media/:type');
    var cellId = req.params.id;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    sendCellMedia(res, cellId, req.params.type);
});

// /cell/:id/address
// --- retrieve the address of the cell (:id)
router.get('/:id/address', function(req, res) {
    debug('[GET] /cell/:id/address');
    var cellId = req.params.id;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .find({
            where: {cellId: cellId},
            attributes: attributesAddress
        })
        .then(function(address) {
            if (!address)
                throw new Blockages.NotFoundError('Address not found');

            res.status(200).send(Blockages.respMsg(res, true, address.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/phones
// --- retrieve array of phone numbers for cell (:id)
router.get('/:id/phones', function(req, res) {
    debug('[GET] /cell/:id/phones');
    var cellId = req.params.id;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .findAll({
            where: {cellId: cellId},
            attributes: attributesPhone
        })
        .then(function(phones) {
            res.status(200).send(Blockages.respMsg(res, true, phones));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/signalPathways/:type
// --- retrieve array of connected genes of (:type) for cell (:id)
// TODO: gene types: dictionary, genomics, communications
router.get('/:id/signalPathways/:type', function(req, res) {
    debug('[GET] /cell/:id/signalPathways/:type');
    var cellId         = req.params.id;
    var geneTypeString = validate.toString(req.params.type).toLowerCase();

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.GeneSignalPathway
        .findAll({
            where: {cellId: cellId},
            include: includeGene,
            attributes: attributesGeneSignalPathway
        })
        .then(function(signalPathways) {
            var filteredSignalPathways = [];

            if (validate.equals(geneTypeString, GeneType.ENUM.ALL.text))
                filteredSignalPathways = signalPathways;
            else {
                var geneSelector;
                if (validate.equals(geneTypeString, GeneType.ENUM.DICTIONARY.text))
                    geneSelector = GeneType.ENUM.DICTIONARY.value;
                else if (validate.equals(geneTypeString, GeneType.ENUM.GENOMICS.text))
                    geneSelector = GeneType.ENUM.GENOMICS.value;
                else if (validate.equals(geneTypeString, GeneType.ENUM.COMMUNICATIONS.text))
                    geneSelector = GeneType.ENUM.COMMUNICATIONS.value;
                else
                    throw new Blockages.BadRequestError('Gene type not recognized');

                for (var i = 0; i < signalPathways.length; i++) {
                    if (signalPathways[i].Gene.geneType & geneSelector)
                        filteredSignalPathways.push(signalPathways[i]);
                }
            }

            res.status(200).send(Blockages.respMsg(res, true, filteredSignalPathways));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/signalPathway/:signalPathwayId
// --- retrieve info on signalPathway (:signalPathwayId) for cell (:id)
router.get('/:id/signalPathway/:signalPathwayId', function(req, res) {
    debug('[GET] /cell/:id/signalPathway/:signalPathwayId');
    var cellId          = req.params.id;
    var signalPathwayId = req.params.signalPathwayId;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.GeneSignalPathway
        .find({
            where: {
                signalPathwayId: signalPathwayId,
                cellId: cellId
            },
            include: includeGene,
            attributes: attributesGeneSignalPathway
        })
        .then(function(signalPathway) {
            if (!signalPathway)
                throw new Blockages.NotFoundError('SignalPathway not found');

            res.status(200).send(Blockages.respMsg(res, true, signalPathway.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/signalPathwayForGene/:geneId
// --- retrieve info on signalPathway to gene (:geneId) for cell (:id)
router.get('/:id/signalPathwayForGene/:geneId', function(req, res) {
    debug('[GET] /cell/:id/signalPathwayForGene/:geneId');
    var cellId = req.params.id;
    var geneId = req.params.geneId;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.GeneSignalPathway
        .find({
            where: {
                geneId: geneId,
                cellId: cellId
            },
            attributes: attributesGeneSignalPathway
        })
        .then(function(signalPathway) {
            if (!signalPathway)
                throw new Blockages.NotFoundError('SignalPathway not found');

            res.status(200).send(Blockages.respMsg(res, true, signalPathway.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/stakeholder
// --- retrieve array of top level cell stakeholder (all members) for cell (:id)
router.get('/:id/stakeholder', function(req, res) {
    debug('[GET] /cell/:id/stakeholder');
    var cellId = req.params.id;

    // TODO: restrict this route to only admins; returns a list of cell admins (access to all instances)
    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellStakeholder
        .findAll({
            where: {
                cellId: cellId,
                instanceId: null
            },
            attributes: attributesCellStakeholder
        })
        .then(function(stakeholderMembers) {
            if (stakeholderMembers.length === 0)
                throw new Blockages.NotFoundError('Stakeholder member list is empty');

            res.status(200).send(Blockages.respMsg(res, true, stakeholderMembers));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/stakeholderMember/:lifeId
// --- retrieve immunity info on top level cell stakeholder member (:lifeId) for cell (:id)
router.get('/:id/stakeholderMember/:lifeId', function(req, res) {
    debug('[GET] /cell/:id/stakeholderMember/:lifeId');
    var cellId = req.params.id;
    var lifeId = req.params.lifeId;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellStakeholder
        .find({
            where: {
                lifeId: lifeId,
                cellId: cellId,
                instanceId: null
            },
            attributes: attributesCellStakeholder
        })
        .then(function(stakeholderMember) {
            if (!stakeholderMember)
                throw new Blockages.NotFoundError('Stakeholder member not found');

            res.status(200).send(Blockages.respMsg(res, true, stakeholderMember.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/instances
// --- retrieve array of instances for cell (:id)
router.get('/:id/instances', function(req, res) {
    debug('[GET] /cell/:id/instances');
    var cellId = req.params.id;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellInstance
        .findAll({
            where: {cellId: cellId},
            attributes: attributesCellInstance
        })
        .then(function(instances) {
            res.status(200).send(Blockages.respMsg(res, true, instances));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/instance/:instanceId
// --- retrieve info on instance (:instanceId) for cell (:id)
router.get('/:id/instance/:instanceId', function(req, res) {
    debug('[GET] /cell/:id/instance/:instanceId');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellInstance
        .find({
            where: {
                cellId: cellId,
                instanceId: instanceId
            },
            include: cellIncludesInstance,
            attributes: instanceAttributes
        })
        .then(function(instance) {
            if (!instance)
                throw new Blockages.NotFoundError('Instance not found');

            res.status(200).send(Blockages.respMsg(res, true, instance.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/instance/:instanceId/address
// --- retrieve the address of instance (:instanceId) for cell (:id)
router.get('/:id/instance/:instanceId/address', function(req, res) {
    debug('[GET] /cell/:id/instance/:instanceId/address');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .find({
            where: {instanceId: instanceId},
            attributes: attributesAddress
        })
        .then(function(address) {
            if (!address)
                throw new Blockages.NotFoundError('Address not found');

            res.status(200).send(Blockages.respMsg(res, true, address.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/instance/:instanceId/phones
// --- retrieve phone numbers of instance (:instanceId) for cell (:id)
router.get('/:id/instance/:instanceId/phones', function(req, res) {
    debug('[GET] /cell/:id/instance/:instanceId/phones');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .findAll({
            where: {instanceId: instanceId},
            attributes: attributesPhone
        })
        .then(function(phones) {
            res.status(200).send(Blockages.respMsg(res, true, phones));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/instance/:instanceId/stakeholder
// --- retrieve array of cell stakeholder (all members) of instance (:instanceId) for cell (:id)
router.get('/:id/instance/:instanceId/stakeholder', function(req, res) {
    debug('[GET] /cell/:id/instance/:instanceId/stakeholder');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelManager, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellStakeholder
        .findAll({
            where: {
                cellId: cellId,
                instanceId: instanceId
            },
            attributes: attributesCellStakeholder
        })
        .then(function(stakeholderMembers) {
            res.status(200).send(Blockages.respMsg(res, true, stakeholderMembers));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/instance/:instanceId/stakeholderMember/:lifeId
// --- retrieve immunity info on cell stakeholder member (:lifeId) of instance (:instanceId) for cell (:id)
router.get('/:id/instance/:instanceId/stakeholderMember/:lifeId', function(req, res) {
    debug('[GET] /cell/:id/instance/:instanceId/stakeholderMember/:lifeId');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;
    var lifeId     = req.params.lifeId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelManager, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellStakeholder
        .find({
            where: {
                lifeId: lifeId,
                cellId: cellId,
                instanceId: instanceId
            },
            attributes: attributesCellStakeholder
        })
        .then(function(stakeholderMember) {
            if (!stakeholderMember)
                throw new Blockages.NotFoundError('Stakeholder member not found');

            res.status(200).send(Blockages.respMsg(res, true, stakeholderMember.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/instance/:instanceId/devices
// --- retrieve array of devices at instance (:instanceId) for cell (:id)
router.get('/:id/instance/:instanceId/devices', function(req, res) {
    debug('[GET] /cell/:id/instance/:instanceId/devices');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelManager, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellDevice
        .findAll({
            where: {instanceId: instanceId},
            attributes: attributesCellDevice
        })
        .then(function(devices) {
            res.status(200).send(Blockages.respMsg(res, true, devices));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/instance/:instanceId/device/:deviceId
// --- retrieve info on device (:deviceId) of instance (:instanceId) for cell (:id)
router.get('/:id/instance/:instanceId/device/:deviceId', function(req, res) {
    debug('[GET] /cell/:id/instance/:instanceId/device/:deviceId');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;
    var deviceId   = req.params.deviceId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelManager, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellDevice
        .find({
            where: {
                deviceId: deviceId,
                instanceId: instanceId
            },
            attributes: attributesCellDevice
        })
        .then(function(device) {
            if (!device)
                throw new Blockages.NotFoundError('Cell device not found');

            res.status(200).send(Blockages.respMsg(res, true, device.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/loadDeviceType/:type/serialNumber/:serialNumber
// --- retrieve the cell (:id) information based on the device type (:type)
//     and serial number (:serialNumber) of the asking device
router.get('/:id/loadDeviceType/:type/serialNumber/:serialNumber', function(req, res) {
    debug('[GET] /cell/:id/loadDeviceType/:type/serialNumber/:serialNumber');
    var cellId       = req.params.id;
    var type         = validate.trim(validate.toString(req.params.type)).toUpperCase();
    var serialNumber = validate.trim(validate.toString(req.params.serialNumber));

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellDevice
        .find({
            where: {
                type: type,
                serialNumber: serialNumber
            },
            include: metabolism.CellInstance,
            attributes: attributesCellDevice
        }).bind({})
        .then(function(device) {
            if (!device || device.CellInstance.cellId !== validate.toInt(cellId))
                throw new Blockages.NotFoundError('Cell device not found');

            this.device = device;

            return metabolism.Cell.find({ where: {cellId: cellId} });
        })
        .then(function(cell) {
            if (!cell)
                throw new Blockages.NotFoundError('Cell not found');

            res.status(200).send(Blockages.respMsg(res, true, {cell: cell.get(), device: this.device.get()}));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/sequencer
// --- retrieve sequencer information (JSON data? use gene?)
router.get('/:id/sequencer', function(req, res) {
    debug('[GET] /cell/:id/sequencer');
    var cellId  = req.params.id;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    var regFilePath = res.app.locals.rootDir + '/sequencer/' + cellId + '/sequencer.json';
    verbose('    regFilePath = ' + regFilePath);
    fs.readFile(regFilePath, {encoding: 'utf8', flag: 'r'}, function (error, data) {
        if (error) {
            verbose('    error = ' + error);
            debug('(' + (error.status || 500) + ')');
			res.status(404).send(Blockages.respMsg(res, false, 'No sequencer data found'));
        }
        else {
            var jsonConversion = JSON.parse(data);
            verbose('    JSON.parse(data) = ' + jsonConversion);
            debug('(200)');
            res.status(200).send(Blockages.respMsg(res, true, jsonConversion));
        }
    });
});

// /cell/instance/interferometer?constructiveInterference=[constructiveInterference]&destructiveInterference=[destructiveInterference]&constructiveInterferenceD=[constructiveInterference region delta]&destructiveInterferenceD=[destructiveInterference region delta]
// --- retrieve array of instances in a given area covered by the interferometer (constructiveInterference, destructiveInterference, constructiveInterferenceDelta, destructiveInterferenceDelta)
router.get('/instance/interferometer', function(req, res) {
    debug('[GET] /cell/instance/interferometer?');
    var constructiveInterference      = validate.toFloat(req.query.constructiveInterference);
    var destructiveInterference       = validate.toFloat(req.query.destructiveInterference);
    var constructiveInterferenceDelta = validate.toFloat(req.query.constructiveInterferenceD);
    var destructiveInterferenceDelta  = validate.toFloat(req.query.destructiveInterferenceD);

    // No immunity level necessary for this route; all are allowed access after token has been verified.
    
    verbose('ConstructiveInterference: ' + constructiveInterference + ' DestructiveInterference: ' + destructiveInterference + ' ConstructiveInterferenceDelta: ' + constructiveInterferenceDelta + ' DestructiveInterferenceDelta: ' + destructiveInterferenceDelta);
    var constructiveInterferenceMin = Math.max(constructiveInterference   - (constructiveInterferenceDelta/2), -90);
    var constructiveInterferenceMax = Math.min(constructiveInterference   + (constructiveInterferenceDelta/2),  90);
    var destructiveInterferenceMin  = Math.max(destructiveInterference    - (destructiveInterferenceDelta/2), -180);
    var destructiveInterferenceMax  = Math.min(destructiveInterference    + (destructiveInterferenceDelta/2),  180);
    verbose('ConstructiveInterferenceMin: ' + constructiveInterferenceMin + 'ConstructiveInterferenceMax: ' + constructiveInterferenceMax + ' DestructiveInterferenceMin: ' + destructiveInterferenceMin + ' DestructiveInterferenceMax: ' + destructiveInterferenceMax);

    metabolism.CellInstance
        .findAll({
            where: {
                constructiveInterference: { between: [constructiveInterferenceMin, constructiveInterferenceMax] },
                destructiveInterference: { between: [destructiveInterferenceMin, destructiveInterferenceMax] }
            },
            include: [includeAddress, includePhone, {model: metabolism.Cell, attributes: cellAttributes}],
            attributes: instanceAttributes
        })
        .then(function(instances) {
            res.status(200).send(Blockages.respMsg(res, true, instances));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// PUT ROUTES
// -----------------------------------------------------------------------------
// /cell/:id
// --- update info for cell (:id)
router.put('/:id', function(req, res) {
    debug('[PUT] /cell/:id');
    var cellId = req.params.id;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Cell
        .find({
            where: {cellId: cellId},
            attributes: cellAttributes
        })
        .then(function(cell) {
            if (!cell)
                throw new Blockages.NotFoundError('Cell not found');

          /*cell.cellId:      not accessible for change */
          /*cell.verified:    not accessible for change */
            cell.name         = validate.trim(validate.toString(req.body.name));
            cell.type         = validate.trim(validate.toString(req.body.type));
            cell.website      = metabolism.Cell.extractWebsite(metabolism, req.body.website);
          /*cell.countryCode: not accessible for change */

            return cell.save();
        })
        .then(function(cell) {
            res.status(200).send(Blockages.respMsg(res, true, cell.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/address/:addressId
// --- update main address (:addressId) for cell (:id)
router.put('/:id/address/:addressId', function(req, res) {
    debug('[PUT] /cell/:id/address/:addressId');
    var cellId     = req.params.id;
    var addressId  = req.params.addressId;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .find({
            where: {
                addressId: addressId,
                cellId: cellId
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

// /cell/:id/phone/:phoneId
// --- update phone number (:phoneId) for cell (:id)
router.put('/:id/phone/:phoneId', function(req, res) {
    debug('[PUT] /cell/:id/phone/phoneId');
    var cellId     = req.params.id;
    var phoneId    = req.params.phoneId;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .find({
            where: {
                phoneId: phoneId,
                cellId: cellId
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

// A route to update a gene signalPathway for a cell does not exist;
// the signalPathway should just be deleted and reregistered for updating

// /cell/:id/stakeholderMember/:lifeId
// --- update stakeholder member (:lifeId) at cell level for cell (:id)
// TODO: Expand functionality to ensure there is always at least one admin account for the cell
router.put('/:id/stakeholderMember/:lifeId', function(req, res) {
    debug('[PUT] /cell/:id/stakeholderMember/:lifeId');
    var cellId = req.params.id;
    var lifeId = req.params.lifeId;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellStakeholder
        .find({
            where: {
                lifeId: lifeId,
                cellId: cellId,
                instanceId: null
            },
            attributes: attributesCellStakeholder
        })
        .then(function(stakeholderMember) {
            if (!stakeholderMember)
                throw new Blockages.NotFoundError('Stakeholder member not found');

          /*stakeholderMember.stakeholderId: not accessible for change */
            stakeholderMember.immunities =   validate.toInt(req.body.immunities);
          /*stakeholderMember.lifeId:        not accessible for change */
          /*stakeholderMember.cellId:        not accessible for change */
          /*stakeholderMember.instanceId:    not accessible for change */

            return stakeholderMember.save();
        })
        .then(function(stakeholderMember) {
            res.status(200).send(Blockages.respMsg(res, true, stakeholderMember.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/instance/:instanceId
// --- update info of instance (:instanceid) for cell (:id)
router.put('/:id/instance/:instanceId', function(req, res) {
    debug('[PUT] /cell/:id/instance/:instanceId');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellInstance
        .find({
            where: {
                instanceId: instanceId,
                cellId: cellId
            },
            attributes: attributesCellInstance
        })
        .then(function(instance) {
            if (!instance)
                throw new Blockages.NotFoundError('Instance not found');

            // Extract 'constructiveInterference' from the body
            var constructiveInterference = null;
            if (req.body.hasOwnProperty('constructiveInterference'))
                constructiveInterference = metabolism.CellInstance.extractConstructiveInterferenceitude(metabolism, req.body.constructiveInterference);

            // Extract 'destructiveInterference' from the body
            var destructiveInterference = null;
            if (req.body.hasOwnProperty('destructiveInterference'))
                destructiveInterference = metabolism.CellInstance.extractDestructiveInterferencegitude(metabolism, req.body.destructiveInterference);

          /*instance.instanceId: 	      not accessible for change */
            instance.constructiveInterference = constructiveInterference;
            instance.destructiveInterference  = destructiveInterference;
            instance.name                     = metabolism.CellInstance.extractName(metabolism, req.body.name);
            instance.website                  = metabolism.CellInstance.extractWebsite(metabolism, req.body.website);
          /*instance.cellType: 		      not accessible for change */
          /*instance.countryCode: 	      not accessible for change */
          /*instance.chargeCellId: 	      not accessible for change */

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

// /cell/:id/instance/:instanceId/address/:addressId
// --- update main address (:addressId) for instance (:instanceId) of cell (:id)
router.put('/:id/instance/:instanceId/address/:addressId', function(req, res) {
    debug('[PUT] /cell/:id/instance/:instanceId/address/:addressId');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;
    var addressId  = req.params.addressId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .find({
            where: {
                addressId: addressId,
                instanceId: instanceId
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
          /*address.geneId: 	      not accessible for change */
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

// /cell/:id/instance/:instanceId/phone/:phoneId
// --- update phone number (:phoneId) for instance (:instanceId) of cell (:id)
router.put('/:id/instance/:instanceId/phone/:phoneId', function(req, res) {
    debug('[PUT] /cell/:id/instance/:instanceId/phone/:phoneId');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;
    var phoneId    = req.params.phoneId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .find({
            where: {
                phoneId: phoneId,
                instanceId: instanceId
            },
            attributes: attributesPhone
        })
        .then(function(phone) {
            if (!phone)
                throw new Blockages.NotFoundError('Phone not found');

          /*phone.phoneId: 	    not accessible for change */
            phone.name      	    = metabolism.Phone.extractName(metabolism, req.body.name);
            phone.number    	    = validate.trim(validate.toString(req.body.number));
            phone.extension 	    = metabolism.Phone.extractExtension(metabolism, req.body.extension);
          /*phone.lifeId: 	    not accessible for change */
          /*phone.cellId: 	    not accessible for change */
          /*phone.instanceId: 	    not accessible for change */
          /*phone.geneId: 	    not accessible for change */
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

// /cell/:id/instance/:instanceId/stakeholderMember/:lifeId
// --- update stakeholder member (:lifeId) at instance level for instance (:instanceId) of cell (:id)
router.put('/:id/instance/:instanceId/stakeholderMember/:lifeId', function(req, res) {
    debug('[PUT] /cell/:id/instance/:instanceId/stakeholderMember/:lifeId');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;
    var lifeId     = req.params.lifeId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellStakeholder
        .find({
            where: {
                lifeId: lifeId,
                cellId: cellId,
                instanceId: instanceId
            },
            attributes: attributesCellStakeholder
        })
        .then(function(stakeholderMember) {
            if (!stakeholderMember)
                throw new Blockages.NotFoundError('Stakeholder member not found');

          /*stakeholderMember.stakeholderId: not accessible for change */
            stakeholderMember.immunities     = validate.toInt(req.body.immunities);
          /*stakeholderMember.lifeId:        not accessible for change */
          /*stakeholderMember.cellId:        not accessible for change */
          /*stakeholderMember.instanceId:    not accessible for change */

            return stakeholderMember.save();
        })
        .then(function(stakeholderMember) {
            res.status(200).send(Blockages.respMsg(res, true, stakeholderMember.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/instance/:instanceId/device/:deviceId
// --- update info of device (:deviceId) for instance (:instanceid) of cell (:id)
router.put('/:id/instance/:instanceId/device/:deviceId', function(req, res) {
    debug('[PUT] /cell/:id/instance/:instanceId/device/:deviceId');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;
    var deviceId   = req.params.deviceId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellDevice
        .find({
            where: {
                deviceId: deviceId,
                instanceId: instanceId
            },
            attributes: attributesCellDevice
        })
        .then(function(device) {
            if (!device)
                throw new Blockages.NotFoundError('Cell device not found');

            var acceptsCash = false;
            if (req.body.hasOwnProperty('acceptsCash'))
                acceptsCash = metabolism.CellDevice.extractAcceptsCash(metabolism, req.body.acceptsCash);

            var acceptsCredit = false;
            if (req.body.hasOwnProperty('acceptsCredit'))
                acceptsCredit = metabolism.CellDevice.extractAcceptsCredit(metabolism, req.body.acceptsCredit);

          /*device.deviceId: 	 not accessible for change */
          /*device.map: 	 not accessible for change */
            device.type          = validate.trim(validate.toString(req.body.type)).toUpperCase();
            device.serialNumber  = validate.trim(validate.toString(req.body.serialNumber));
            device.description   = metabolism.CellDevice.extractDescription(metabolism, req.body.textDescription);
            device.acceptsCash   = acceptsCash;
            device.acceptsCredit = acceptsCredit;
          /*device.instanceId:   not accessible for change */

            return device.save();
        })
        .then(function(device) {
            res.status(200).send(Blockages.respMsg(res, true, device.get()));
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
// /cell/signup
// --- create a new cell
router.post('/signup', function(req, res) {
    debug('[POST] /cell/signup');
    // No immunity level necessary for this route; all are allowed access after token has been verified.

    // Create the cell record
    var newCell = {
      /*cellId:  0,*/
      /*verified:    false,*/
        name:        validate.trim(validate.toString(req.body.name)),
        type:        validate.trim(validate.toString(req.body.type)),
        website:     metabolism.Cell.extractWebsite(metabolism, req.body.website),
        countryCode: CountryCodes.ENUM.USA.abbr
    };

    metabolism.Cell.create(newCell).bind({})
        .then(function(cell) {
            this.cell = cell;

            // Create cell stakeholder record to make the life an admin
            var newStakeholder = {
              /*stakeholderId: 0,*/
                immunities:    Immunities.AuthLevelAdminStakeholder,
                lifeId:        res.locals.lifePacket.life.lifeId,
                cellId:        cell.cellId
              /*instanceId:    null*/
            };

            return metabolism.CellStakeholder.create(newStakeholder);
        })
        .then(function(stakeholderMember) {
            return CellGraph.create(this.cell.cellId);
        })
        .then(function() {
            res.status(201).send(Blockages.respMsg(res, true, this.cell.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/instance/signup
// --- create a new cell adestructiveInterferenceg with one instance with an optional address and phone number
router.post('/instance/signup', function(req, res) {
    debug('[POST] /cell/instance/signup');
    // No immunity level necessary for this route; all are allowed access after token has been verified.

    // Create the cell record
    var newCell = {
      /*cellId:      0,*/
      /*verified:    false,*/
        name:        validate.trim(validate.toString(req.body.name)),
        type:        validate.trim(validate.toString(req.body.type)),
        website:     metabolism.Cell.extractWebsite(metabolism, req.body.website),
        countryCode: CountryCodes.ENUM.USA.abbr
    };

    metabolism.Cell.create(newCell).bind({})
        .then(function(cell) {
            this.cell = cell;

            // Create cell stakeholder record to make the life an admin
            var newStakeholder = {
              /*stakeholderId: 0,*/
                immunities:    Immunities.AuthLevelAdminStakeholder,
                lifeId:        res.locals.lifePacket.life.lifeId,
                cellId:        cell.cellId
              /*instanceId:    null*/
            };

            return metabolism.CellStakeholder.create(newStakeholder);
        })
        .then(function(stakeholderMember) {
            return CellGraph.create(this.cell.cellId);
        })
        .then(function(instance) {
            // Extract 'constructiveInterference' from the body
            var constructiveInterference = instance.calculateConstructiveInterference();
            if (req.body.hasOwnProperty('constructiveInterference'))
                constructiveInterference = metabolism.CellInstance.extractConstructiveInterference(metabolism, req.body.constructiveInterference);

            // Extract 'destructiveInterference' from the body
            var destructiveInterference = instance.calculateDestructiveInterference();
            if (req.body.hasOwnProperty('destructiveInterference'))
                destructiveInterference = metabolism.CellInstance.extractDestructiveInterference(metabolism, req.body.destructiveInterference);

            // Create the instance record
            var newInstance = {
              /*instanceId:   		  0,*/
                atlas:       		  0,
                constructiveInterference: constructiveInterference,
                destructiveInterference:  destructiveInterference,
              /*name:        		  null,*/
              /*website:      		  null,*/
              /*cellType:     		  null,*/
              /*countryCode:  	          null,*/
                cellId:       	          this.cell.cellId
              /*fieldId:      		  null*/
            };

            return metabolism.CellInstance.create(newInstance);
        })
        .then(function(instance) {
            this.instance = instance;

            var id = instance.calculateFieldId();
            return metabolism.CellField.find({ where: {fieldId: id} });
        })
        .then(function(field) {
            if (!field)
                throw new Blockages.NotFoundError('Field to associate with cell instance not found');

            return field.addInstance(this.instance);
        })
        .then(function() {
            this.instance.calculateAndSetAtlas();

            return this.instance.save();
        })
        .then(function() {
            var executeArray = [];

            // If the required address fields are present, create a new instance address
            if (req.body.hasOwnProperty('address1') && req.body.hasOwnProperty('locality') &&
                req.body.hasOwnProperty('region')   && req.body.hasOwnProperty('postalCode')) {
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
                    instanceId:       this.instance.instanceId
                  /*geneId:           null,*/
                  /*chargeCellId:     null,*/
                  /*chargeInstanceId: null*/
                };

                executeArray.push(metabolism.Address.create(newAddress));
            }

            // If the required phone fields are present, create a new instance phone number
            if (req.body.hasOwnProperty('number')) {
                var newPhone = {
                  /*phoneId:          0,*/
                  /*name:             null,*/
                    number:           validate.trim(validate.toString(req.body.number)),
                  /*extension:        null,*/
                  /*lifeId:           null,*/
                  /*cellId:           null,*/
                    instanceId:       this.instance.instanceId
                  /*geneId:           null,*/
                  /*chargeCellId:     null,*/
                  /*chargeInstanceId: null*/
                };

                executeArray.push(metabolism.Phone.create(newPhone));
            }

         // signalPathwayId, signalPheromone, signalPheromoneExpiration, reinforcementSignalPheromone, reinforcementSignalPheromoneExpiration, optional, lifeId fields are defaults
            executeArray.push(metabolism.GeneSignalPathway.create({ cellId: this.cell.cellId, geneId: 1008 }));

            return metabolism.sequelize.Promise.all(executeArray);
        })
        .then(function(results) {
            res.status(201).send(Blockages.respMsg(res, true, this.cell.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/media
// --- add an media to an existing cell (:id)
router.post('/:id/media', function(req, res) {
    debug('[POST] /cell/:id/media');
    var cellId = req.params.id;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Cell
        .find({
            where: {cellId: cellId},
            attributes: cellAttributes
        })
        .then(function(cell) {
            if (!cell)
                throw new Blockages.NotFoundError('Cell not found');

            // Validate 'media' format
            // TODO: restrict media format to PNG
            // TODO: restrict media type to  200x200 (??)
            var mediaPath = req.files.media.path;
            if (validate.equals(req.files.media.name, ''))
                throw new Blockages.BadRequestError('Media is required');

            // Move the media into the directory associated with the cell
            var mediaDir = 'medias/cell/' + cell.cellId + '/';
            mv(mediaPath, mediaDir + 'cell-media.extension', {mkdirp: true}, function(error) {
                if (error)
                    throw error;
                else
                    res.status(201).send(Blockages.respMsg(res, true, cell.get()));
            });
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/address
// --- add an address to an existing cell (:id)
router.post('/:id/address', function(req, res) {
    debug('[POST] /cell/:id/address');
    var cellId = req.params.id;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Cell
        .find({
            where: {cellId: cellId},
            include: includeAddress,
            attributes: cellAttributes
        })
        .then(function(cell) {
            if (!cell)
                throw new Blockages.NotFoundError('Cell not found');
            else if (cell.Address !== null)
                throw new Blockages.ConflictError('Cell already has an address');

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
                cellId:           cell.cellId
              /*instanceId:       null,*/
              /*geneId:           null,*/
              /*chargeCellId:     null,*/
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

// /cell/:id/phone
// --- add a phone number to an existing cell (:id)
router.post('/:id/phone', function(req, res) {
    debug('[POST] /cell/:id/phone');
    var cellId = req.params.id;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Cell
        .find({
            where: {cellId: cellId},
            attributes: cellAttributes
        })
        .then(function(cell) {
            if (!cell)
                throw new Blockages.NotFoundError('Cell not found');

            var newPhone = {
              /*phoneId:          0,*/
                name:             metabolism.Phone.extractName(metabolism, req.body.name),
                number:           validate.trim(validate.toString(req.body.number)),
                extension:        metabolism.Phone.extractExtension(metabolism, req.body.extension),
              /*lifeId:           null,*/
                cellId:           cell.cellId
              /*instanceId:       null,*/
              /*geneId:           null,*/
              /*chargeCellId:     null,*/
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

// /cell/:id/signalPathwayForGene/:geneId
// --- add a signalPathway for a cell (:id) of an existing gene (:geneId)
router.post('/:id/signalPathwayForGene/:geneId', function(req, res) {
    debug('[POST] /cell/:id/signalPathwayForGene/:geneId');
    var cellId = req.params.id;
    var geneId = req.params.geneId;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelManager, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.sequelize.Promise.all([
        metabolism.GeneSignalPathway
            .find({ where: {cellId: cellId, geneId: geneId} /* attributes: default */ }),
        metabolism.Gene
            .find({ where: {geneId: geneId}                 /* attributes: default */ }),
        metabolism.Cell
            .find({ where: {cellId: cellId}                 /* attributes: default */ })
    ])
    .spread(function(signalPathway, gene, cell) {
        if (signalPathway)
            throw new Blockages.ConflictError('Gene signalPathway already exists');
        else if (!gene)
            throw new Blockages.NotFoundError('Gene not found');
        else if (!cell)
            throw new Blockages.NotFoundError('Cell not found');

        var geneAPI = new Genes[gene.geneId.toString()]();

        res.redirect(geneAPI.authenticate(req.headers.host + '/v1', null, cell.cellId));
    })
    .catch(function(error) {
        res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
    });
});

// /cell/:id/allowPaymentGene/:geneId
// --- add a signalPathway for a cell (:id) of an existing dictionary gene (:geneId)
router.post('/:id/geneExpressionConstraints/:geneId', function(req, res) {
    debug('[POST] /cell/:id/geneExpressionConstraints/:geneId');
    var cellId  = req.params.id;
    var geneId  = req.params.geneId;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelManager, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.sequelize.Promise.all([
        metabolism.GeneSignalPathway
            .find({ where: {cellId: cellId, geneId: geneId} /* attributes: default */ }),
        metabolism.Gene
            .find({ where: {geneId: geneId}                 /* attributes: default */ }),
        metabolism.Cell
            .find({ where: {cellId: cellId}                 /* attributes: default */ })
    ])
    .spread(function(signalPathway, gene, cell) {
        if (signalPathway)
            throw new Blockages.ConflictError('Gene signalPathway already exists');
        else if (!gene)
            throw new Blockages.NotFoundError('Gene not found');
        else if (gene.geneType & GeneType.ENUM.DICTIONARY.value === 0)
            throw new Blockages.BadRequestError('Gene is not a dictionary gene');
        else if (!cell)
            throw new Blockages.NotFoundError('Cell not found');

        var newSignalPathway = {
          /*signalPathwayId: 			   0,*/
          /*signalPheromone:         	           null,*/
          /*signalPheromoneExpiration:    	   null,*/
          /*reinforcementSignalPheromone:          null,*/
          /*reinforcementSignalheromoneExpiration: null,*/
          /*optional:       			   null,*/
          /*lifeId:         		           null,*/
            cellId:     	 		   cell.cellId,
            geneId:      			   gene.geneId
        };

        return metabolism.GeneSignalPathway.create(newSignalPathway);
    })
    .then(function(signalPathway) {
        res.status(201).send(Blockages.respMsg(res, true, signalPathway.get()));
    })
    .catch(metabolism.Sequelize.ValidationError, function(error) {
        res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
    })
    .catch(function(error) {
        res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
    });
});

// /cell/:id/stakeholderMember
// --- add a stakeholder member to an existing cell (:id)
router.post('/:id/stakeholderMember', function(req, res) {
    debug('[POST] /cell/:id/stakeholderMember');
    var cellId = req.params.id;
    var lifeId = req.body.lifeId;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.sequelize.Promise.all([
        metabolism.Cell
            .find({
                where: {cellId: cellId},
                attributes: cellAttributes
            }),
        metabolism.Life
            .find({
                where: {lifeId: lifeId},
                attributes: lifeAttributes
            })
    ])
    .spread(function(cell, life) {
        if (!cell)
            throw new Blockages.NotFoundError('Cell not found');
        else if (!life)
            throw new Blockages.NotFoundError('Life not found');

        var newStakeholderMember = {
          /*stakeholderId: 0,*/
            immunities:    validate.toInt(req.body.immunities),
            lifeId:        life.lifeId,
            cellId:        cell.cellId
          /*instanceId:    null*/
        };

        return metabolism.CellStakeholder.create(newStakeholderMember);
    })
    .then(function(stakeholderMember) {
        res.status(201).send(Blockages.respMsg(res, true, stakeholderMember.get()));
    })
    .catch(metabolism.Sequelize.ValidationError, function(error) {
        res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
    })
    .catch(function(error) {
        res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
    });
});

// /cell/:id/instance
// --- add a instance to an existing cell (:id)
router.post('/:id/instance', function(req, res) {
    debug('[POST] /cell/:id/instance');
    var cellId = req.params.id;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Cell
        .find({
            where: {cellId: cellId},
            attributes: cellAttributes
        }).bind({})
        .then(function(cell) {
            if (!cell)
                throw new Blockages.NotFoundError('Cell not found');

            // Extract 'constructiveInterference' from the body
            var constructiveInterference = null;
            if (req.body.hasOwnProperty('constructiveInterference'))
                constructiveInterference = metabolism.CellInstance.extractConstructiveInterferenceitude(metabolism, req.body.constructiveInterference);

            // Extract 'destructiveInterference' from the body
            var destructiveInterference = null;
            if (req.body.hasOwnProperty('destructiveInterference'))
                destructiveInterference = metabolism.CellInstance.extractDestructiveInterferencegitude(metabolism, req.body.destructiveInterference);

            var newInstance = {
              /*instanceId:   		   0,*/
                atlas:        		   0,
                constructiveInterference:  constructiveInterference,
                destructiveInterference:   destructiveInterference,
              /*name:         	           null,*/
              /*website:     		   null,*/
              /*cellType:     		   null,*/
              /*countryCode:  		   null,*/
                cellId:       		   cell.cellId
              /*fieldId: 		   null*/
            };

            return metabolism.CellInstance.create(newInstance);
        })
        .then(function(instance) {
            this.instance = instance;

            var id = instance.calculateFieldId();
            return metabolism.CellField.find({ where: {fieldId: id} });
        })
        .then(function(field) {
            if (!field)
                throw new Blockages.NotFoundError('Field to associate with instance not found');

            return field.addInstance(this.instance);
        })
        .then(function() {
            this.instance.calculateAndSetAtlas();

            return this.instance.save();
        })
        .then(function() {
            res.status(201).send(Blockages.respMsg(res, true, this.instance.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/instance/:instanceId/address
// --- add an address to an existing instance (:instanceId) of cell (:id)
router.post('/:id/instance/:instanceId/address', function(req, res) {
    debug('[POST] /cell/:id/instance/:instanceId/address');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellInstance
        .find({
            where: {
                instanceId: instanceId,
                cellId: cellId
            },
            include: includeAddress,
            attributes: instanceAttributes
        })
        .then(function(instance) {
            if (!instance)
                throw new Blockages.NotFoundError('Instance not found');
            else if (instance.Address !== null)
                throw new Blockages.ConflictError('Instance already has an address');

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
                instanceId:       instance.instanceId
              /*geneId:           null,*/
              /*chargeCellId:     null,*/
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

// /cell/:id/instance/:instanceId/phone
// --- add a phone number to an existing instance (:instanceId) of cell (:id)
router.post('/:id/instance/:instanceId/phone', function(req, res) {
    debug('[POST] /cell/:id/instance/:instanceId/phone');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellInstance
        .find({
            where: {
                instanceId: instanceId,
                cellId: cellId
            },
            attributes: instanceAttributes
        })
        .then(function(instance) {
            if (!instance)
                throw new Blockages.NotFoundError('Instance not found');

            var newPhone = {
              /*phoneId:          0,*/
                name:             metabolism.Phone.extractName(metabolism, req.body.name),
                number:           validate.trim(validate.toString(req.body.number)),
                extension:        metabolism.Phone.extractExtension(metabolism, req.body.extension),
              /*lifeId:           null,*/
              /*cellId:           null,*/
                instanceId:       instance.instanceId
              /*geneId:           null,*/
              /*chargeCellId:     null,*/
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

// /cell/:id/instance/:instanceId/stakeholderMember
// --- add a stakeholder member to an existing instance (:instanceId) of cell (:id)
router.post('/:id/instance/:instanceId/stakeholderMember', function(req, res) {
    debug('[POST] /cell/:id/instance/:instanceId/stakeholderMember');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;
    var lifeId     = req.body.lifeId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.sequelize.Promise.all([
        metabolism.Cell
            .find({
                where: {cellId: cellId},
                attributes: cellAttributes
            }),
        metabolism.CellInstance
            .find({
                where: {instanceId: instanceId, cellId: cellId},
                attributes: instanceAttributes
            }),
        metabolism.Life
            .find({
                where: {lifeId: lifeId},
                attributes: lifeAttributes
            })
    ])
    .spread(function(cell, instance, life) {
        if (!cell)
            throw new Blockages.NotFoundError('Cell not found');
        else if (!instance)
            throw new Blockages.NotFoundError('Instance not found');
        else if (!life)
            throw new Blockages.NotFoundError('Life not found');

        var newStakeholderMember = {
          /*stakeholderId: 0,*/
            immunities:    validate.toInt(req.body.immunities),
            lifeId:        life.lifeId,
            cellId:        cell.cellId,
            instanceId:    instance.instanceId
        };

        return metabolism.CellStakeholder.create(newStakeholderMember);
    })
    .then(function(stakeholderMember) {
        res.status(201).send(Blockages.respMsg(res, true, stakeholderMember.get()));
    })
    .catch(metabolism.Sequelize.ValidationError, function(error) {
        res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
    })
    .catch(function(error) {
        res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
    });
});

// /cell/:id/instance/:instanceId/device
// --- add a device to an existing cell instance (:instanceId) of cell (:id)
router.post('/:id/instance/:instanceId/device', function(req, res) {
    debug('[POST] /cell/:id/instance/:instanceId/device');
    var cellId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelManager, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellInstance
        .find({
            where: {
                instanceId: instanceId,
                cellId: cellId
            },
            attributes: instanceAttributes
        }).bind({})
        .then(function(instance) {
            if (!instance)
                throw new Blockages.NotFoundError('Instance not found');

            // Extract 'acceptsCash' from the body
            var acceptsCash = false;
            if (req.body.hasOwnProperty('acceptsCash'))
                acceptsCash = metabolism.CellDevice.extractAcceptsCash(metabolism, req.body.acceptsCash);

            // Extract 'acceptsCredit' from the body
            var acceptsCredit = false;
            if (req.body.hasOwnProperty('acceptsCredit'))
                acceptsCredit = metabolism.CellDevice.extractAcceptsCredit(metabolism, req.body.acceptsCredit);

            var newDevice = {
              /*deviceId:      0,*/
                map:           0,
                type:          validate.trim(validate.toString(req.body.type)).toUpperCase(),
                serialNumber:  validate.trim(validate.toString(req.body.serialNumber)),
                description:   metabolism.CellDevice.extractDescription(metabolism, req.body.textDescription),
                acceptsCash:   acceptsCash,
                acceptsCredit: acceptsCredit,
                instanceId:    instance.instanceId
            };

            return metabolism.CellDevice.create(newDevice);
        })
        .then(function(device) {
            this.device = device;

            return metabolism.CellDevice.max('map', { where: {instanceId: device.instanceId} });
        })
        .then(function(mapMax) {
            var map = 0;
            for (var i = 0; i < devices.length; i++)
                if (map < devices[i].map)
                    map = devices[i].map;

            this.device.map = mapMax + 1;
            return this.device.save();
        })
        .then(function(device) {
            res.status(201).send(Blockages.respMsg(res, true, device.get()));
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
// /cell/:id
// --- delete an existing cell (:id)
router.delete('/:id', function(req, res) {
    debug('[DELETE] /cell/:id');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /cell/:id/media/:type
// --- delete an media of an existing cell (:id)
router.delete('/:id/media/:type', function(req, res) {
    debug('[DELETE] /cell/:id/media/:type');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /cell/:id/address/:addressId
// --- delete an address (:addressId) of an existing cell (:id)
router.delete('/:id/address/:addressId', function(req, res) {
    debug('[DELETE] /cell/:id/address/:addressId');
    var cellId = req.params.id;
    var addressId  = req.params.addressId;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .find({
            where: {
                addressId: addressId,
                cellId: cellId
            }
            // attributes: default
        })
        .then(function(address) {
            if (!address)
                throw new Blockages.NotFoundError('Address not found');

            return address.destroy();
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/phone/:phoneId
// --- delete a phone number (:phoneId) of an existing cell (:id)
router.delete('/:id/phone/:phoneId', function(req, res) {
    debug('[DELETE] /cell/:id/phone/:phoneId');
    var cellId = req.params.id;
    var phoneId    = req.params.phoneId;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .find({
            where: {
                phoneId: phoneId,
                cellId: cellId
            }
            // attributes: default
        })
        .then(function(phone) {
            if (!phone)
                throw new Blockages.NotFoundError('Phone not found');

            return phone.destroy();
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/signalPathway/:signalPathwayId
// --- delete a signalPathway (:signalPathwayId) for a cell (:id) of an existing gene
router.delete('/:id/signalPathway/:signalPathwayId', function(req, res) {
    debug('[DELETE] /cell/:id/signalPathway/:signalPathwayId');
    var cellId     = req.params.id;
    var signalPathwayId = req.params.signalPathwayId;

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelManager, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.GeneSignalPathway
        .find({
            where: {signalPathwayId: signalPathwayId,
                    cellId: cellId}
            // attributes: default
        })
        .then(function(signalPathway) {
            if (!signalPathway)
                throw new Blockages.NotFoundError('SignalPathway not found');

            return signalPathway.destroy();
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true)); // No data to send
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/stakeholderMember/:lifeId
// --- delete stakeholder member (:lifeId) of an existing cell (:id)
router.delete('/:id/stakeholderMember/:lifeId', function(req, res) {
    debug('[DELETE] /cell/:id/stakeholderMember/:lifeId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /cell/:id/instance/:instanceId
// --- delete an existing instance (:instanceId) of cell (:id)
router.delete('/:id/instance/:instanceId', function(req, res) {
    debug('[DELETE] /cell/:id/instance/:instanceId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /cell/:id/instance/:instanceId/address/:addressId
// --- delete an address (:addressId) of an existing instance (:instanceId) of cell (:id)
router.delete('/:id/instance/:instanceId/address/:addressId', function(req, res) {
    debug('[DELETE] /cell/:id/instance/:instanceId/address/:addressId');
    var cellId = req.params.id;
    var instanceId = req.params.instanceId;
    var addressId  = req.params.addressId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelManager, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .find({
            where: {
                addressId: addressId,
                instanceId: instanceId
            }
            // attributes: default
        })
        .then(function(address) {
            if (!address)
                throw new Blockages.NotFoundError('Address not found');

            return address.destroy();
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/instance/:instanceId/phone/:phoneId
// --- delete a phone number (:phoneId) of an existing instance (:instanceId) of cell (:id)
router.delete('/:id/instance/:instanceId/phone/:phoneId', function(req, res) {
    debug('[DELETE] /cell/:id/instance/:instanceId/phone/:phoneId');
    var cellId = req.params.id;
    var instanceId = req.params.instanceId;
    var phoneId    = req.params.phoneId;

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelManager, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .find({
            where: {
                phoneId: phoneId,
                instanceId: instanceId
            }
            // attributes: default
        })
        .then(function(phone) {
            if (!phone)
                throw new Blockages.NotFoundError('Phone not found');

            return phone.destroy();
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/instance/:instanceId/stakeholderMember/:lifeId
// --- delete stakeholder member (:lifeId) at instance level of an existing instance (:instanceId) of cell (:id)
router.put('/:id/instance/:instanceId/stakeholderMember/:lifeId', function(req, res) {
    debug('[DELETE] /cell/:id/instance/:instanceId/stakeholderMember/:lifeId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /cell/:id/instance/:instanceId/device/:deviceId
// --- delete a device (:deviceId) of an existing instance (:instanceId) of cell (:id)
router.delete('/:id/instance/:instanceId/device/:deviceId', function(req, res) {
    debug('[DELETE] /cell/:id/instance/:instanceId/device/:deviceId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// -----------------------------------------------------------------------------
// CATCH-ALL ROUTES (error)
// -----------------------------------------------------------------------------
// /cell/*
// --- Any get route request not handled is caught with this route
router.get('/*', function(req, res) {
    debug('[GET] /cell/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /cell/*
// --- Any put route request not handled is caught with this route
router.put('/*', function(req, res) {
    debug('[PUT] /cell/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /cell/*
// --- Any post route request not handled is caught with this route
router.post('/*', function(req, res) {
    debug('[POST] /cell/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /cell/*
// --- Any delete route request not handled is caught with this route
router.delete('/*', function(req, res) {
    debug('[DELETE] /cell/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});
