'use strict';

// gene.js (routes)

// Dependency packages
var debug   = require('debug')('munch:routes:Gene');
var verbose = require('debug')('munch:verbose:routes:Gene');
var express = require('express');
var mv      = require('mv');

// Local js modules
var Middlewares  = require('./middlewares');
var metabolism   = require('../../models/database');
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
// Gene OAuth2 Authorization Callback
// TODO: place proper restrictions to auth callback to verify sender
// /gene/:id/auth/callback
// --- OAuth2 authorization callback handler (correctly uses state query field)
router.get('/:id/auth/callback', function(req, res) {
    debug('[GET] /gene/:geneId/auth/callback');
    var geneId     = req.params.id;
    var lifeId     = null;
    var cellId     = null;
    var stateType  = req.query.state.substring(0, 1);
    var stateId    = parseInt(req.query.state.substring(1), 10);
    if (stateType === 'l') {
        lifeId = stateId;
    }
    else if (stateType === 'c') {
        cellId = stateId;
    }

    var executions = [];
    executions.push(metabolism.Gene.find({ where: {geneId: geneId} /* attributes: default */ }) );

    // If lifeId and cellId are both defined or undefined/null, throw error.
    if (!!lifeId === !!cellId) {
        throw new Blockages.BadRequestError('Invalid authorization callback request');
    }
    // Otherwise, execute queries for the ID that is not undefined/null.
    else {
        if (!!lifeId) {
            executions.push(metabolism.GeneSignalPathway
                .find({ where: {lifeId: lifeId, geneId: geneId} /* attributes: default */ }));
            executions.push(metabolism.Life
                .find({ where: {lifeId: lifeId}                 /* attributes: default */ }));
            executions.push(metabolism.sequelize.Promise.resolve(null));
        }
        else if (!!cellId) {
            executions.push(metabolism.GeneSignalPathway
                .find({ where: {cellId: cellId, geneId: geneId} /* attributes: default */ }));
            executions.push(metabolism.sequelize.Promise.resolve(null));
            executions.push(metabolism.Cell
                .find({ where: {cellId: cellId}                 /* attributes: default */ }));
        }
    }

    metabolism.sequelize.Promise.all(executions)
    .bind({})
    .spread(function(gene, signalPathway, life, cell) {
        if (signalPathway)
            throw new Blockages.ConflictError('Gene signalPathway already exists');
        else if (!gene)
            throw new Blockages.NotFoundError('Gene not found');
        else if (!!lifeId && !life)
            throw new Blockages.NotFoundError('Life not found');
        else if (!!cellId && !cell)
            throw new Blockages.NotFoundError('Cell not found');

        this.gene = gene;

        var geneAPI = new Genes[gene.geneName.toString()]();
        return geneAPI.authenticateCallback(req.query.code, req.headers.host + '/v1', lifeId, cellId);
    })
    .then(function(newSignalPathway) {
      /*newSignalPathway.signalPathwayId: 0,*/
      /*newSignalPathway.signalPheromone:                        set by geneAPI*/
      /*newSignalPathway.signalPheromoneExpiration:              set by geneAPI*/
      /*newSignalPathway.reinforcementSignalPheromone:           set by geneAPI*/
      /*newSignalPathway.reinforcementSignalPheromoneExpiration: set by geneAPI*/
      /*newSignalPathway.optional:                               set by geneAPI*/
        newSignalPathway.lifeId                                  = lifeId;
        newSignalPathway.cellId                                  = cellId;
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
});

// -----------------------------------------------------------------------------
// TOKEN AUTHENTICATION MIDDLEWARE
// -----------------------------------------------------------------------------
router.use(Middlewares.tokenAuth);

// -----------------------------------------------------------------------------
// ATTRIBUTE/INCLUDE SETUP
// -----------------------------------------------------------------------------
var attributesAddress           = [ 'addressId',       'address1', 'address2', 'address3', 'address4', 'locality', 'region', 'postalCode' ];
var attributesPhone             = [ 'phoneId',         'name', 'number', 'extension' ];
var attributesGeneSetting       = [ /*'geneId',*/      'host', 'apiHost', 'sanmetabolismoxHost', 'scope', 'signupPath', 'authenticatePath', 'refreshPath', 'balancePath', 'sendPath', 'requestPath', 'deauthenticatePath' ];
var attributesGeneStakeholder   = [ 'stakeholderId',   'immunities', 'geneId', 'lifeId' ];
var attributesGeneSignalPathway = [ 'signalPathwayId', 'lifeId', 'cellId' ];

// Remove fields from metabolism.Gene: deletedAt
var geneAttributes = [ 'geneId', 'verified', 'geneType', 'geneName', 'companyName', 'website', 'countryCode', 'supportEmail', 'supportEmailVerified', 'supportWebsite', 'supportVersion', 'createdAt', 'updatedAt' ];

// Remove fields from metabolism.Life: phoneVerified, emailVerified, receiptEmail, receiptEmailVerified, referralCode, voiceprintHash, voiceprintExpiration, gutIdHash, createdAt, updatedAt, deletedAt
var lifeAttributes = [ 'lifeId', 'phone', 'email', 'givenName', 'middleName', 'familyName', 'countryCode' ];

var includeAddress           = { model: metabolism.Address,           as: 'Address',            attributes: attributesAddress };
var includePhone             = { model: metabolism.Phone,             as: 'Phones',             attributes: attributesPhone };
var includeGeneSetting       = { model: metabolism.GeneSetting,       as: 'Settings',           attributes: attributesGeneSetting };
var includeGeneStakeholder   = { model: metabolism.GeneStakeholder,   as: 'StakeholderMembers', attributes: attributesGeneStakeholder };
var includeGeneSignalPathway = { model: metabolism.GeneSignalPathway, as: 'SignalPathways',     attributes: attributesGeneSignalPathway };

//  geneIncludesAll  = [ includeAddress, includePhone, includeGeneSetting, includeGeneStakeholder, includeGeneSignalPathway ];
var geneIncludesGene = [ includeAddress, includePhone, includeGeneSetting, includeGeneStakeholder, includeGeneSignalPathway ];

// -----------------------------------------------------------------------------
// GET ROUTES
// -----------------------------------------------------------------------------
// /gene/:id
// --- retrieve info for gene (:id)
router.get('/:id', function(req, res) {
    debug('[GET] /gene/:id');
    var geneId = req.params.id;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelStakeholder, true, true, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Gene
        .find({
            where: {geneId: geneId},
            include: geneIncludesGene,
            attributes: geneAttributes
        })
        .then(function(gene) {
            if (!gene)
                throw new Blockages.NotFoundError('Gene not found');

            res.status(200).send(Blockages.respMsg(res, true, gene.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// TODO: determine different media types and types to expand uses
var sendGeneMedia = function(res, geneId, type) {
    var mediaTypes = [ '.png', '.wav', '.mov', '.fasta' ];

    if (!validate.isIn(type, mediaTypes))
        return res.status(400).send(Blockages.respMsg(res, false, 'Media type not recognized'));

    var mediaFile = 'media-name' + type;
    var mediaPath = res.app.locals.rootDir + '/medias/gene/' + geneId + '/';
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

// /gene/:id/media (default type)
// --- retrieve gene media (logo) for gene (:id)
router.get('/:id/media', function(req, res) {
    debug('[GET] /gene/:id/media');
    var geneId = req.params.id;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelStakeholder, true, true, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    sendGeneMedia(res, geneId);
});

// /gene/:id/media/:type (all supported types)
// --- retrieve gene media (logo) for gene (:id)
router.get('/:id/media/:type', function(req, res) {
    debug('[GET] /gene/:id/media/:type');
    var geneId = req.params.id;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    sendGeneMedia(res, geneId, req.params.type);
});

// /gene/:id/address
// --- retrieve the address for gene (:id)
router.get('/:id/address', function(req, res) {
    debug('[GET] /gene/:id/address');
    var geneId = req.params.id;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .find({
            where: {geneId: geneId},
            attributes: attributesAddress
        })
        .then(function(address) {
            if (!address)
                throw new Blockages.NotFoundError('Address not found');

            res.status(200).send(Blockages.respMsg(res, true, address.get()));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// /gene/:id/phones
// --- retrieve array of phone numbers for gene (:id)
router.get('/:id/phones', function(req, res) {
    debug('[GET] /gene/:id/phones');
    var geneId = req.params.id;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .findAll({
            where: {geneId: geneId},
            attributes: attributesPhone
        })
        .then(function(phones) {
            res.status(200).send(Blockages.respMsg(res, true, phones));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// /gene/:id/signalPathways
// --- retrieve array of signalPathways for gene (:id)
router.get('/:id/signalPathways', function(req, res) {
    debug('[GET] /gene/:id/signalPathways');
    var geneId = req.params.id;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.GeneSignalPathway
        .findAll({
            where: {geneId: geneId},
            attributes: attributesGeneSignalPathway
        })
        .then(function(signalPathways) {
            res.status(200).send(Blockages.respMsg(res, true, signalPathways));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// /gene/:id/signalPathway/:signalPathwayId
// --- retrieve info on signalPathway (:signalPathwayId) for gene (:id)
router.get('/:id/signalPathway/:signalPathwayId', function(req, res) {
    debug('[GET] /gene/:id/signalPathway/:signalPathwayId');
    var geneId          = req.params.id;
    var signalPathwayId = req.params.signalPathwayId;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.GeneSignalPathway
        .find({
            where: {
                signalPathwayId: signalPathwayId,
                geneId: geneId
            },
            attributes: attributesGeneSignalPathway
        })
        .then(function(signalPathway) {
            if (!signalPathway)
                throw new Blockages.NotFoundError('SignalPathway not found');
            else
                res.status(200).send(Blockages.respMsg(res, true, signalPathway));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /gene/:id/stakeholder
// --- retrieve array of stakeholder (all members) for gene (:id)
router.get('/:id/stakeholder', function(req, res) {
    debug('[GET] /gene/:id/stakeholder');
    var geneId = req.params.id;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.GeneStakeholder
        .findAll({
            where: {geneId: geneId},
            attributes: attributesGeneStakeholder
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

// /gene/:id/stakeholderMember/:lifeId
// --- retrieve immunity info on stakeholder member (:lifeId) for gene (:id)
router.get('/:id/stakeholderMember/:lifeId', function(req, res) {
    debug('[GET] /gene/:id/stakeholderMember/:lifeId');
    var geneId = req.params.id;
    var lifeId = req.params.lifeId;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.GeneStakeholder
        .find({
            where: {
                lifeId: lifeId,
                geneId: geneId
            },
            attributes: attributesGeneStakeholder
        })
        .then(function(stakeholderMember) {
            if (!stakeholderMember)
                throw new Blockages.NotFoundError('Stakeholder member not found');

            res.status(200).send(Blockages.respMsg(res, true, stakeholderMember));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /gene/:id/cycles
// --- retrieve array of cycles for gene (:id)
router.get('/:id/cycles', function(req, res) {
    debug('[GET] /gene/:id/cycles');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /gene/:id/cycle/:cycleId
// --- retrieve info on cycle (:cycleId) for gene (:id)
router.get('/:id/cycle/:cycleId', function(req, res) {
    debug('[GET] /gene/:id/cycle/:cycleId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /gene/type/search?s=[searchString]&t=[geneType]
// --- retrieve array of genes with given search criteria
router.get('/type/search', function(req, res) {
    debug('[GET] /gene/type/search?');
    var searchString      = req.query.s;
    var geneTypeString = validate.toString(req.query.t).toLowerCase();

    // No immunity level necessary for this route; all are allowed access
    // after token has been verified.

    metabolism.Gene
        .findAll({
            where:
                metabolism.Sequelize.and(
                    {geneId: {$gte: 1000}},
                    metabolism.Sequelize.or(
                        { geneName: {like: '%' + searchString + '%'} },
                        { companyName: {like: '%' + searchString + '%'} }
                    )
                ),
            attributes: geneAttributes
        })
        .then(function(genes) {
            var filteredGenes = [];

            if (validate.equals(geneTypeString, GeneType.ENUM.ALL.text))
                filteredGenes = genes;
            else {
                var geneSelector;
                if (validate.equals(geneTypeString, GeneType.ENUM.SIGNALING.text))
                    geneSelector = GeneType.ENUM.SIGNALING.value;
                // else if (validate.equals(geneTypeString, GeneType.ENUM.LOYALTY.text))
                //     geneSelector = GeneType.ENUM.LOYALTY.value;
                // else if (validate.equals(geneTypeString, GeneType.ENUM.CHECKIN.text))
                //     geneSelector = GeneType.ENUM.CHECKIN.value;
                else
                    throw new Blockages.BadRequestError('Gene type not recognized');

                for (var i = 0; i < genes.length; i++) {
                    if (genes[i].geneType & geneSelector)
                        filteredGenes.push(genes[i]);
                }
            }

            res.status(200).send(Blockages.respMsg(res, true, filteredGenes));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// PUT ROUTES
// -----------------------------------------------------------------------------
// /gene/:id
// --- update info for gene (:id)
router.put('/:id', function(req, res) {
    debug('[PUT] /gene/:id');
    var geneId = req.params.id;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Gene
        .find({
            where: {geneId: geneId},
            attributes: geneAttributes
        })
        .then(function(gene) {
            if (!gene)
                throw new Blockages.NotFoundError('Gene not found');

            // If the supportEmail has changed, set supportEmailVerified to false
            var supportEmail = metabolism.Gene.extractSupportEmail(req.body.supportEmail);
            if (!validate.equals(supportEmail, gene.supportEmail))
                gene.suportEmailVerified = false;

          /*gene.geneId: not accessible for change */
            gene.geneType              = validate.toInt(req.body.geneType);
            gene.geneName              = validate.trim(validate.toString(req.body.geneName));
            gene.companyName           = metabolism.Gene.extractCompanyName(metabolism, req.body.companyName);
            gene.website               = metabolism.Gene.extractWebsite(metabolism, req.body.website);
          /*gene.countryCode:          not accessible for change */
            gene.supportEmail          = supportEmail;
          /*gene.supportEmailVerified: set above */
            gene.supportWebsite        = metabolism.Gene.extractSupportWebsite(req.body.supportWebsite);
            gene.supportVersion        = metabolism.Gene.extractSupportVersion(req.body.supportVersion);

            return gene.save();
        })
        .then(function(gene) {
            res.status(200).send(Blockages.respMsg(res, true, gene.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /gene/:id/address/:addressId
// --- update main address (:addressId) for gene (:id)
router.put('/:id/address/:addressId', function(req, res) {
    debug('[PUT] /gene/:id/address/:addressId');
    var geneId    = req.params.id;
    var addressId = req.params.addressId;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .find({
            where: {
                addressId: addressId,
                geneId: geneId
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
          /*address.bountyCellId:     not accessible for change */
          /*address.bountyInstanceId: not accessible for change */

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

// /gene/:id/phone/:phoneId
// --- update phone number (:phoneId) for gene (:id)
router.put('/:id/phone/:phoneId', function(req, res) {
    debug('[PUT] /gene/:id/phone/:phoneId');
    var geneId  = req.params.id;
    var phoneId = req.params.phoneId;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .find({
            where: {
                phoneId: phoneId,
                geneId: geneId
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
          /*phone.bountyCellId:     not accessible for change */
          /*phone.bountyInstanceId: not accessible for change */

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

// /gene/:id/stakeholderMember/:lifeId
// --- update stakeholder member (:lifeId) for gene (:id)
// TODO: Expand functionality to ensure there is always at least one admin account for the gene
router.put('/:id/stakeholderMember/:lifeId', function(req, res) {
    debug('[PUT] /gene/:id/stakeholderMember/:lifeId');
    var geneId = req.params.id;
    var lifeId = req.params.lifeId;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.GeneStakeholder
        .find({
            where: {
                lifeId: lifeId,
                geneId: geneId
            },
            attributes: attributesGeneStakeholder
        })
        .then(function(stakeholderMember) {
            if (!stakeholderMember)
                throw new Blockages.NotFoundError('Stakeholder member not found');

          /*stakeholderMember.stakeholderId: not accessible for change */
            stakeholderMember.immunities     = validate.toInt(req.body.immunities);
          /*stakeholderMember.lifeId:        not accessible for change */
          /*stakeholderMember.geneId:        not accessible for change */

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

// -----------------------------------------------------------------------------
// POST ROUTES
// -----------------------------------------------------------------------------
// /gene/signup
// --- create a new gene
router.post('/signup', function(req, res) {
    debug('[POST] /gene/signup');
    // Create the gene record
    var newGene = {
      /*geneId:               0,*/
        geneType:             validate.toInt(req.body.geneType),
        geneName:             validate.trim(validate.toString(req.body.geneName)),
        companyName:          metabolism.Gene.extractCompanyName(metabolism, req.body.companyName),
        website:              metabolism.Gene.extractWebsite(metabolism, req.body.website),
        countryCode:          CountryCodes.ENUM.USA.abbr,
        supportEmail:         metabolism.Gene.extractSupportEmail(req.body.supportEmail),
      /*supportEmailVerified: false,*/
        supportWebsite:       metabolism.Gene.extractSupportWebsite(req.body.supportWebsite),
        supportVersion:       metabolism.Gene.extractSupportVersion(req.body.supportVersion)
    };

    metabolism.Gene.create(newGene).bind({})
        .then(function(gene) {
            this.gene = gene;
            var newSettings = { geneId: gene.geneId };

            // Create gene stakeholder record to make the life an admin
            var newStakeholder = {
              /*stakeholderId: 0,*/
                immunities:    Immunities.AuthLevelAdminStakeholder,
                lifeId:        res.locals.lifePacket.life.lifeId,
                geneId:        gene.geneId
            };

            return metabolism.sequelize.Promise.all([
                metabolism.GeneStakeholder.create(newStakeholder),
                metabolism.GeneSettings.create(newSettings)
            ]);
        })
        .spread(function(stakeholderMember, settings) {
            res.status(201).send(Blockages.respMsg(res, true, this.gene.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /gene/:id/media
// --- add an media to an existing gene (:id)
router.post('/:id/media', function(req, res) {
    debug('[POST] /gene/:id/media');
    var geneId = req.params.id;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Gene
        .find({
            where: {geneId: geneId},
            attributes: geneAttributes
        })
        .then(function(gene) {
            if (!gene)
                throw new Blockages.NotFoundError('Gene not found');

            // Validate 'media' format
            // TODO: restrict media format to PNG
            // TODO: restrict media type to  200x200 (??)
            var mediaPath = req.files.media.path;
            if (validate.equals(req.files.media.name, ''))
                throw new Blockages.BadRequestError('Media is required');

            // Move the media into the directory associated with the gene
            var mediaDir = 'medias/gene/' + gene.geneId + '/';
            mv(mediaPath, mediaDir + 'life-media.extension', {mkdirp: true}, function(error) {
                if (error)
                    throw error;
                else
                    res.status(201).send(Blockages.respMsg(res, true, gene));
            });
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /gene/:id/address
// --- add an address to an existing gene (:id)
router.post('/:id/address', function(req, res) {
    debug('[POST] /gene/:id/address');
    var geneId = req.params.id;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Gene
        .find({
            where: {geneId: geneId},
            include: includeAddress,
            attributes: geneAttributes
        })
        .then(function(gene) {
            if (!gene)
                throw new Blockages.NotFoundError('Gene not found');
            else if (gene.Address !== null)
                throw new Blockages.ConflictError('Gene already has an address');

            var newAddress = {
              /*addressId:        0,*/
                name:             '$$_gene',
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
                geneId:           gene.geneId,
              /*bountyCellId:     null,*/
              /*bountyInstanceId: null*/
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

// /gene/:id/phone
// --- add a phone number to an existing gene (:id)
router.post('/:id/phone', function(req, res) {
    debug('[POST] /gene/:id/phone');
    var geneId = req.params.id;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Gene
        .find({
            where: {geneId: geneId},
            attributes: geneAttributes
        })
        .then(function(gene) {
            if (!gene)
                throw new Blockages.NotFoundError('Gene not found');

            var newPhone = {
              /*phoneId:          0,*/
                name:             metabolism.Phone.extractName(metabolism, req.body.name),
                number:           validate.trim(validate.toString(req.body.number)),
                extension:        metabolism.Phone.extractExtension(metabolism, req.body.extension),
              /*lifeId:           null,*/
              /*cellId:           null,*/
              /*instanceId:       null,*/
                geneId:           gene.geneId
              /*bountyCellId:     null,*/
              /*bountyInstanceId: null*/
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

// /gene/:id/stakeholderMember
// --- add a stakeholder member to an existing gene (:id)
router.post('/:id/stakeholderMember', function(req, res) {
    debug('[POST] /gene/:id/stakeholderMember');
    var geneId = req.params.id;
    var lifeId = req.body.lifeId;

    if (!Immunities.verifyNoRejectionFromGene(geneId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.sequelize.Promise.all([
        metabolism.Gene
            .find({
                where: {geneId: geneId},
                attributes: geneAttributes
            }),
        metabolism.Life
            .find({
                where: {lifeId: lifeId},
                attributes: lifeAttributes
            })
    ])
    .spread(function(gene, life) {
        if (!gene)
            throw new Blockages.NotFoundError('Gene not found');
        else if (!life)
            throw new Blockages.NotFoundError('Life not found');

        var newStakeholderMember = {
          /*stakeholderId: 0,*/
            immunities:    validate.toInt(req.body.immunities),
            lifeId:        life.lifeId,
            geneId:        gene.geneId
        };

        return metabolism.GeneStakeholder.create(newStakeholderMember);
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

// -----------------------------------------------------------------------------
// DELETE ROUTES
// -----------------------------------------------------------------------------
// /gene/:id
// --- delete an existing gene (:id)
router.delete('/:id', function(req, res) {
    debug('[DELETE] /gene/:id');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /gene/:id/media/:type
// --- delete an media of an existing gene (:id)
router.delete('/:id/media/:type', function(req, res) {
    debug('[DELETE] /gene/:id/media/:type');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /gene/:id/address/:addressId
// --- delete an address (:addressId) of an existing gene (:id)
router.delete('/:id/address/:addressId', function(req, res) {
    debug('[DELETE] /gene/:id/address/:addressId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /gene/:id/phone/:phoneId
// --- delete a phone number (:phoneId) of an existing gene (:id)
router.delete('/:id/phone/:phoneId', function(req, res) {
    debug('[DELETE] /gene/:id/phone/:phoneId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /gene/:id/stakeholderMember/:lifeId
// --- delete stakeholder member (:lifeId) of an existing gene (:id)
router.delete('/:id/stakeholderMember/:lifeId', function(req, res) {
    debug('[DELETE] /gene/:id/stakeholderMember/:lifeId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// -----------------------------------------------------------------------------
// CATCH-ALL ROUTES (error)
// -----------------------------------------------------------------------------
// /gene/*
// --- Any get route request not handled is caught with this route
router.get('/*', function(req, res) {
    debug('[GET] /gene/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /gene/*
// --- Any put route request not handled is caught with this route
router.put('/*', function(req, res) {
    debug('[PUT] /gene/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /gene/*
// --- Any post route request not handled is caught with this route
router.post('/*', function(req, res) {
    debug('[POST] /gene/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /gene/*
// --- Any delete route request not handled is caught with this route
router.delete('/*', function(req, res) {
    debug('[DELETE] /gene/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});
