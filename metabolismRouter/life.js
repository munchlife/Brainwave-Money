'use strict';

// life.js (routes)

// Dependency packages
var debug     = require('debug')('munch:routes:Life');
var verbose   = require('debug')('munch:verbose:routes:Life');
var express   = require('express');
var mv        = require('mv');
var Random    = require('random-js')(); // uses the nativeMath engine
var bciEEG    = require('bci');

// Local js modules
var Middlewares             = require('./middlewares');
var metabolism              = require('../../models/database');
// var Transporter          = require('../../config/transporter');
var Immunities              = require('../../config/immunities');
var Genes                   = require('../../config/genes');
var Blockages               = require('../../config/blockages');
var CountryCodes            = require('../../data/countryCodes');
var GeneType                = require('../../data/geneTypes');
// var TextMessage          = require('../../config/textMessage');
var genomeEegReceipt        = require('../../config/eegFrequencyPing');

var validate = metabolism.Sequelize.Validator;

var router = module.exports = express.Router();

// -----------------------------------------------------------------------------
// NON-TOKEN AUTH ROUTES
// -----------------------------------------------------------------------------
// Life OAuth2 Authorization Callback
// TODO: place proper restrictions to auth callback to verify sender
var authCallback = function(req, res, lifeId, geneId) {
    metabolism.sequelize.Promise.all([
        metabolism.GeneSignalPathway
            .find({ where: {lifeId: lifeId, geneId: geneId} /* attributes: default */ }),
        metabolism.Gene
            .find({ where: {geneId: geneId}                 /* attributes: default */ }),
        metabolism.Life
            .find({ where: {lifeId: lifeId}                       /* attributes: default */ })
    ]).bind({})
    .spread(function(signalPathway, gene, life) {
        if (signalPathway)
            throw new Blockages.ConflictError('Gene signalPathway already exists');
        else if (!gene)
            throw new Blockages.NotFoundError('Gene not found');
        else if (!life)
            throw new Blockages.NotFoundError('Life not found');

        this.life = life;
        this.gene = gene;

        var geneAPI = new Genes[gene.geneName.toString()]();
        return geneAPI.authenticateCallback(req.query.code, req.headers.host + '/v1', life.lifeId, null);
    })
    .then(function(newSignalPathway) {
      /*newSignalPathway.signalPathwayId:                      0,*/
      /*newSignalPathway.signalPheromone:                      set by geneAPI*/
      /*newSignalPathway.signalPheromoneExpiration:            set by geneAPI*/
      /*newSignalPathway.reinforcementWavePheromone:           set by geneAPI*/
      /*newSignalPathway.reinforcementWavePheromoneExpiration: set by geneAPI*/
      /*newSignalPathway.optional:                             set by geneAPI*/
        newSignalPathway.lifeId                                = this.life.lifeId;
      /*newSignalPathway.cellId:                               null,*/
        newSignalPathway.geneId                                = this.gene.geneId;

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

// /life/gene/:geneId/auth/callback
// --- OAuth2 authorization callback handler (correctly uses state query field)
router.get('/gene/:geneId/auth/callback', function(req, res) {
    debug('[GET] /life/gene/:geneId/auth/callback');
    var lifeId = req.query.state;
    var geneId = req.params.geneId;

    authCallback(req, res, lifeId, geneId);
});

// /life/:id/gene/:geneId/auth/callback
// --- OAuth2 authorization callback handler (for genes that don't support the state field)
router.get('/:id/gene/:geneId/auth/callback', function(req, res) {
    debug('[GET] /life/:id/gene/:geneId/auth/callback');
    var lifeId = req.params.id;
    var geneId = req.params.geneId;

    authCallback(req, res, lifeId, geneId);
});

// -----------------------------------------------------------------------------
// TOKEN AUTHENTICATION MIDDLEWARE
// -----------------------------------------------------------------------------
router.use(Middlewares.tokenAuth);

// -----------------------------------------------------------------------------
// IMMUNITY REJECTION MIDDLEWARE
// -----------------------------------------------------------------------------
// router.use(Middlewares.lifeImmunity);

// -----------------------------------------------------------------------------
// ATTRIBUTE/INCLUDE SETUP
// -----------------------------------------------------------------------------
var attributesAddress           = [ 'addressId',       'name', 'address1', 'address2', 'address3', 'address4', 'locality', 'region', 'postalCode' ];
//  attributesCharge            = [ 'chargeId',        'value', 'chargeCellId' ];
//  attributesCellSignal        = [ 'signalId',        'field', 'atlas', 'map', 'proximity', 'deviceType' ];
var attributesCellStakeholder   = [ 'stakeholderId',   'immunities', 'cellId', 'instanceId' ];
var attributesPhone             = [ 'phoneId',         'name', 'number', 'extension' ];
var attributesGeneStakeholder   = [ 'stakeholderId',   'immunities', 'geneId' ];
var attributesGeneSignalPathway = [ 'signalPathwayId', 'geneId' ];
var attributesLifeDevice        = [ 'deviceId',        'type', 'serialNumber', 'description' ];
//  attributesLifeVerification  = [ 'verificationId',  'verificationType', 'code' ];
var attributesLifePreference    = [ /*'lifeId',*/      'signalingSignalPathwayId' ];
//  'loyaltySignalPathwayId', 'checkinSignalPathwayId'
// Remove fields from metabolism.Life: eegHash, eegExpiration, deletedAt
var lifeAttributes = [ 'lifeId', 'phone', 'phoneVerified', 'email', 'emailVerified', 'receiptEmail', 'receiptEmailVerified', 'referralCode', 'givenName', 'middleName', 'familyName', 'genomeHash', 'countryCode', 'createdAt', 'updatedAt' ];

// Remove fields from metabolism.Cell: verified, createdAt, updatedAt, deletedAt
var includeCell = { model: metabolism.Cell, attributes: [ 'cellId', 'name', 'type', 'website', 'countryCode' ] };

// Remove fields from metabolism.CellInstance: createdAt, updatedAt, deletedAt, cellId
var includeInstance = { model: metabolism.CellInstance, attributes: [ 'instanceId', 'atlas', 'constructiveInterference', 'destructiveInterference', 'name', 'website', 'cellType', 'countryCode', 'fieldId' ] };

// Remove fields from metabolism.Gene: supportEmail, supportEmailVerified, supportWebsite, supportVersion
var includeGene = { model: metabolism.Gene, attributes: [ 'geneId', 'geneType', 'geneName', 'companyName', 'website', 'countryCode' ] };

var includeAddress           = { model: metabolism.Address,           as: 'Addresses',       attributes: attributesAddress };
//  includeCharge            = { model: metabolism.Charge,            as: 'Charges',         attributes: attributesCharge };
//  includeCellSignal        = { model: metabolism.CellSignal,        as: 'Signals',         attributes: attributesCellSignal };
var includeCellStakeholder   = { model: metabolism.CellStakeholder,   as: 'CellStakeholder', attributes: attributesCellStakeholder };
var includePhone             = { model: metabolism.Phone,             as: 'Phones',          attributes: attributesPhone };
var includeGeneStakeholder   = { model: metabolism.GeneStakeholder,   as: 'GeneStakeholder', attributes: attributesGeneStakeholder };
var includeGeneSignalPathway = { model: metabolism.GeneSignalPathway, as: 'SignalPathways',  attributes: attributesGeneSignalPathway };
var includeLifeDevice        = { model: metabolism.LifeDevice,        as: 'Devices',         attributes: attributesLifeDevice };
//  includeLifeVerification  = { model: metabolism.LifeVerification,  as: 'Verifications',   attributes: attributesLifeVerification };
var includeLifePreference    = { model: metabolism.LifePreference,    as: 'Preferences',     attributes: attributesLifePreference };

//  lifeIncludesAll  = [ includeAddress, includeCharge, includeCellSignal, includeCellStakeholder, includePhone, includeGeneStakeholder, includeGeneSignalPathway, includeLifeDevice, includeLifeVerification, includeLifePreference ];
var lifeIncludesLife = [ includeAddress, includeCellStakeholder, includePhone, includeGeneStakeholder, includeGeneSignalPathway, includeLifeDevice,                          includeLifePreference ];

// -----------------------------------------------------------------------------
// GET ROUTES
// -----------------------------------------------------------------------------
// /life/:id
// --- retrieve info for life (:id)
router.get('/:id', function(req, res) {
    debug('[' + req.method + '] /life/:id  ' + req.originalUrl);
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Life
        .find({
            where: {lifeId: lifeId},
            include: lifeIncludesLife,
            attributes: lifeAttributes
        })
        .then(function(life) {
            if (!life)
                throw new Blockages.NotFoundError('Life not found');

            res.status(200).send(Blockages.respMsg(res, true, life.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

var sendLifeGenome  = function(res, lifeId) {

    var genomeFile = 'genome-' + '.txt';
    var genomePath = res.app.locals.rootDir + '/genomes/life/' + lifeId + '/';
    var genomeInfo = { root: genomePath };

    res.sendFile(genomeFile, genomeInfo, function (error) {
        if (error) {
            if (res.statusCode !== 304 || error.code !== 'ECONNABORT') {
    			res.status(error.status).send(Blockages.respMsg(res, false, 'No genome found'));
            }
    		else { /* 304 cache hit, no data sent but still success */ }
        }
        else { /* Successfully sent, nothing to do here */ }
    });
};

// TODO: determine different media types and sizes to expand uses
var sendLifeMedia  = function(res, lifeId, type) {
    var mediaTypes = [ '.png', '.wav', '.mov', '.fasta' ]; // include others as needed

    if (!validate.isIn(type, mediaTypes))
        return res.status(400).send(Blockages.respMsg(res, false, 'Media size not recognized'));

    var mediaFile = 'media-name' + type;
    var mediaPath = res.app.locals.rootDir + '/medias/life/' + lifeId + '/';
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

// /life/:id/genome (default size)
// --- retrieve life genome (DNA verification) for life (:id)
router.get('/:id/genome', function(req, res) {
    debug('[GET] /life/:id/genome');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    sendLifeGenome(res, lifeId);
});

// /life/:id/media (default size)
// --- retrieve life media (file storage) for life (:id)
router.get('/:id/media', function(req, res) {
    debug('[GET] /life/:id/media');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    sendLifeMedia(res, lifeId);
});

// /cell/:id/media/:type (all supported types)
// --- retrieve cell media (logo) for cell (:id)
router.get('/:id/media/:type', function(req, res) {
    debug('[GET] /cell/:id/media/:type');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    sendLifeMedia(res, lifeId, req.params.type);
});


// /life/:id/addresses
// --- retrieve array of addresses for life (:id)
router.get('/:id/addresses', function(req, res) {
    debug('[GET] /life/:id/addresses');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .findAll({
            where: {lifeId: lifeId},
            attributes: attributesAddress
        })
        .then(function(addresses) {
            res.status(200).send(Blockages.respMsg(res, true, addresses));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// /life/:id/phones
// --- retrieve array of phone numbers for life (:id)
router.get('/:id/phones', function(req, res) {
    debug('[GET] /life/:id/phones');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .findAll({
            where: {lifeId: lifeId},
            attributes: attributesPhone
        })
        .then(function(phones) {
            res.status(200).send(Blockages.respMsg(res, true, phones));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// /life/:id/devices
// --- retrieve array of devices for life (:id)
router.get('/:id/devices', function(req, res) {
    debug('[GET] /life/:id/devices');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.LifeDevice
        .findAll({
            where: {lifeId: lifeId},
            attributes: attributesLifeDevice
        })
        .then(function(devices) {
            res.status(200).send(Blockages.respMsg(res, true, devices));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// /life/:id/preferences
// --- retrieve set of preferences for life (:id)
router.get('/:id/preferences', function(req, res) {
    debug('[GET] /life/:id/preferences');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.LifePreference
        .find({
            where: {lifeId: lifeId},
            attributes: attributesLifePreference
        })
        .then(function(preference) {
            if (!preference)
                throw new Blockages.NotFoundError('Life preferences not found');

            res.status(200).send(Blockages.respMsg(res, true, preference.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /life/:id/signalPathways/:type
// --- retrieve array of connected genes of (:type) for life (:id)
router.get('/:id/signalPathways/:type', function(req, res) {
    debug('[GET] /life/:id/signalPathway/:type');
    var lifeId         = req.params.id;
    var geneTypeString = validate.toString(req.params.type).toLowerCase();

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.GeneSignalPathway
        .findAll({
            where: {lifeId: lifeId},
            include: includeGene,
            attributes: attributesGeneSignalPathway
        })
        .then(function(signalPathways) {
            var filteredSignalPathways = [];

            if (validate.equals(geneTypeString, GeneType.ENUM.ALL.text))
                filteredSignalPathways = signalPathways;
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

// /life/:id/signalPathway/:signalPathwayId
// --- retrieve info on signalPathway (:signalPathwayId) for life (:id)
router.get('/:id/signalPathway/:signalPathwayId', function(req, res) {
    debug('[GET] /life/:id/signalPathway/:signalPathwayId');
    var lifeId          = req.params.id;
    var signalPathwayId = req.params.signalPathwayId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.GeneSignalPathway
        .find({
            where: {
                signalPathwayId: signalPathwayId,
                lifeId: lifeId
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

// /life/:id/signalPathwayForGene/:geneId
// --- retrieve info on signalPathway to gene (:geneId) for life (:id)
router.get('/:id/signalPathwayForGene/:geneId', function(req, res) {
    debug('[GET] /life/:id/signalPathwayForGene/:geneId');
    var lifeId = req.params.id;
    var geneId = req.params.geneId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.GeneSignalPathway
        .find({
            where: {
                geneId: geneId,
                lifeId: lifeId
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

// /life/:id/cell/stakeholder
// --- retrieve array of cell stakeholdering for life (:id)
router.get('/:id/cell/stakeholder', function(req, res) {
    debug('[GET] /life/:id/cell/stakeholder');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellStakeholder
        .findAll({
            where: {lifeId: lifeId},
            include: [ includeCell, includeInstance ],
            attributes: attributesCellStakeholder
        })
        .then(function(stakeholderMembers) {
            res.status(200).send(Blockages.respMsg(res, true, stakeholderMembers));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// /life/:id/cell/stakeholderMember/:stakeholderId
// --- retrieve immunity info on cell stakeholder member (:stakeholderId) for life (:id)
router.get('/:id/cell/stakeholderMember/:stakeholderId', function(req, res) {
    debug('[GET] /life/:id/cell/stakeholderMember/:stakeholderId');
    var lifeId        = req.params.id;
    var stakeholderId = req.params.stakeholderId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellStakeholder
        .find({
            where: {
                stakeholderId: stakeholderId,
                lifeId: lifeId
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

// /life/:id/gene/stakeholder
// --- retrieve array of gene stakeholdering for life (:id)
router.get('/:id/gene/stakeholder', function(req, res) {
    debug('[GET] /life/:id/gene/stakeholder');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.GeneStakeholder
        .findAll({
            where: {lifeId: lifeId},
            include: includeGene,
            attributes: attributesGeneStakeholder
        })
        .then(function(stakeholderMembers) {
            res.status(200).send(Blockages.respMsg(res, true, stakeholderMembers));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// /life/:id/gene/stakeholderMember/:stakeholderId
// --- retrieve immunity info on gene stakeholder member (:stakeholderId) for life (:id)
router.get('/:id/gene/stakeholderMember/:stakeholderId', function(req, res) {
    debug('[GET] /life/:id/gene/stakeholderMember/:stakeholderId');
    var lifeId        = req.params.id;
    var stakeholderId = req.params.stakeholderId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.GeneStakeholder
        .find({
            where: {
                stakeholderId: stakeholderId,
                lifeId: lifeId
            },
            attributes: attributesGeneStakeholder
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

// /life/:id/signals
// --- retrieve array of signals for life (:id)
router.get('/:id/signals', function(req, res) {
    debug('[GET] /life/:id/signals');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.LifeSignal
        .findAll({
            where:
                metabolism.Sequelize.or(
                    { lifeSenderId: lifeId },
                    { lifeReceiverId: lifeId }
                ),
            // attributes: default
        })
        .then(function(signals) {
            res.status(200).send(Blockages.respMsg(res, true, signals));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

var cellSignal = function(signal) {
    return metabolism.sequelize.Promise.all([
        metabolism.Cell
            .find({ where: {cellId: signal.cellId}, /* attributes: defaults */ }),
        metabolism.CellGraph[signal.cellId.toString()].CycleLife
            .find({ where: {cycleLifeId: signal.cycleLifeId}, /* attributes: defaults */ })
        ])
        .spread(function(cell, cycleLife) {
            signal.Cell      = cell;
            signal.CycleLife = cycleLife;

            return metabolism.sequelize.Promise.all([
                metabolism.Gene
                    .find({ where: {geneId: cycleLife.signalingGeneId}, /* attributes: defaults */ }),
                metabolism.CellGraph[signal.cellId.toString()].Cycle
                    .find({ where: {cycleId: cycleLife.cycleId}, /* attributes: defaults */ })
                ]);
        })
        .spread(function(gene, cycle) {
            signal.Gene = gene;
            signal.Cycle = cycle;

            return metabolism.CellInstance
                .find({ where: {instanceId: cycle.instanceId}, /* attributes: defaults */ });
        })
        .then(function(instance) {
            signal.Instance = instance;

            return metabolism.sequelize.Promise.resolve();
        });
};

// TODO: complete P2P signal retrieval when chat is added
var lifeSignal = function(signal) {
    signal.LifeSender;
    signal.LifeReceiver;
    return metabolism.sequelize.Promise.resolve();
};

// /life/:id/signal/:signalId
// --- retrieve info on signal (:signalId) for life (:id)
router.get('/:id/signal/:signalId', function(req, res) {
    debug('[GET] /life/:id/signal/:signalId');
    var lifeId   = req.params.id;
    var signalId = req.params.signalId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.LifeSignal
        .find({
            where:
                metabolism.Sequelize.and(
                    {signalId: signalId},
                    metabolism.Sequelize.or(
                        { lifeSenderId: lifeId },
                        { lifeReceiverId: lifeId }
                    )
                ),
            // attributes: default
        }).bind({})
        .then(function(signal) {
            if (!signal)
                throw new Blockages.NotFoundError('Signal not found');

            this.signal = signal;

            if (signal.cellId != null)
                return cellSignal(this.signal);
            else
                return lifeSignal(this.signal);
        })
        .then(function() {
            var signalJSON = this.signal.get();

            if (this.signal.cellId != null) {
                signalJSON.Cycle     = this.signal.Cycle.get();
                signalJSON.CycleLife = this.signal.CycleLife.get();
                signalJSON.Cell      = this.signal.Cell.get();
                signalJSON.Instance  = this.signal.Instance.get();
            }
            else {
                signalJSON.LifeSender
                signalJSON.LifeReceiver
            }

            signalJSON.Gene = this.signal.Gene.get();

            res.status(200).send(Blockages.respMsg(res, true, signalJSON));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// Associate a life and cell/instance together in active access token
var associateWithCell = function(res, tokenId, lifeId, cellId, instanceId) {

    metabolism.sequelize.Promise.all([
        metabolism.CellStakeholder
            .find({
                where: {
                    lifeId: lifeId,
                    cellId: cellId,
                    instanceId: instanceId
                },
                attributes: attributesCellStakeholder
            }),
        metabolism.Token
            .find({
                where: {tokenId: tokenId}
                // attributes: default
            })
    ])
    .spread(function(stakeholderMember, token) {
        // If stakeholder record does not exist, pass back error
        if (!stakeholderMember)
            throw new Blockages.NotFoundError('Cell stakeholder member not found');
        // If token is already associated with a gene, pass back error
        else if (token.geneStakeholderId !== null)
            throw new Blockages.ConflictError('Token occupied by gene stakeholder member');
        // If stakeholderMember is for a specific instance, retrieve instance information
        else if (stakeholderMember.instanceId !== null) {
            return metabolism.sequelize.Promise.all([
                token.setCellStakeholder(stakeholderMember),
                metabolism.CellInstance.find({ where: {cellId: stakeholderMember.cellId, instanceId: instanceId}, include: metabolism.Cell}),
                metabolism.sequelize.Promise.resolve(function() {return 'Instance'; })
                ]);
        }
        // Otherwise, retrieve signaling cell information
        else {
            return metabolism.sequelize.Promise.all([
                token.setCellStakeholder(stakeholderMember),
                metabolism.Cell.find({ where: {cellId: stakeholderMember.cellId} }),
                metabolism.sequelize.Promise.resolve(function() {return 'Cell'; })
                ]);
        }
    })
    .then(function(results) {
        var data = results[1];

        if (!data)
            throw new Blockages.NotFoundError(results[2] + ' not found');

        res.status(200).send(Blockages.respMsg(res, true, data.get()));
    })
    .catch(function(error) {
        res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
    });
};

// /life/:id/token/associate/cell/:cellId
// --- Associate the cell (:cellId) with the life (:id) in current token
router.get('/:id/token/associate/cell/:cellId', function(req, res) {
    debug('[GET] /life/:id/token/associate/cell/:cellId');
    var lifeId  = req.params.id;
    var cellId  = req.params.cellId;
    var tokenId = res.locals.lifePacket.tokenId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    associateWithCell(res, tokenId, lifeId, cellId, null);
});

// /life/:id/token/associate/cell/:cellId/instance/:instanceId
// --- Associate the instance (:instanceId) of cell (:cellId) with the life (:id) in current token
router.get('/:id/token/associate/cell/:cellId/instance/:instanceId', function(req, res) {
    debug('[GET] /life/:id/token/associate/cell/:cellId/instance/:instanceId');
    var lifeId     = req.params.id;
    var cellId = req.params.cellId;
    var instanceId = req.params.instanceId;
    var tokenId    = res.locals.lifePacket.tokenId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    associateWithCell(res, tokenId, lifeId, cellId, instanceId);
});

// /life/:id/token/associate/gene/:geneId
// --- Associate the gene (:geneId) with the life (:id) in current token
router.get('/:id/token/associate/gene/:geneId', function(req, res) {
    debug('[GET] /life/:id/token/associate/gene/:geneId');
    var lifeId  = req.params.id;
    var geneId  = req.params.geneId;
    var tokenId = res.locals.lifePacket.tokenId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.sequelize.Promise.all([
        metabolism.GeneStakeholder
            .find({
                where: {
                    lifeId: lifeId,
                    geneId: geneId
                },
                attributes: attributesGeneStakeholder
            }),
        metabolism.Token
            .find({
                where: {tokenId: tokenId}
                // attributes: default
            })
    ])
    .spread(function(stakeholderMember, token) {
        // If stakeholder record does not exist, pass back error
        if (!stakeholderMember)
            throw new Blockages.NotFoundError('Gene stakeholder member not found');
        // If token is already associated with a cell, pass back error
        else if (token.cellStakeholderId !== null)
            throw new Blockages.ConflictError('Token occupied by cell stakeholder member');

        // Otherwise, retrieve signaling gene information
        return metabolism.sequelize.Promise.all([
            token.setGeneStakeholder(stakeholderMember),
            metabolism.Gene.find({ where: {geneId: stakeholderMember.geneId} })
        ]);
    })
    .spread(function(stakeholderMember, gene) {
        if (!gene)
            throw new Blockages.NotFoundError('Gene not found');

        res.status(200).send(Blockages.respMsg(res, true, gene.get()));
    })
    .catch(function(error) {
        res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
    });
});

// /life/:id/token/dissociate
// --- Dissociate the current cell or gene from the life (:id) in current token
router.get('/:id/token/dissociate', function(req, res) {
    debug('[GET] /life/:id/token/dissociate');
    var lifeId  = req.params.id;
    var tokenId = res.locals.lifePacket.tokenId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Token
        .find({
            where: {tokenId: tokenId}
            // attributes: default
        })
        .then(function(token) {
            // Check for any invalid states of the token
            if (token.cellStakeholderId === token.geneStakeholderId) {
                if (token.cellStakeholderId === null)
                    throw new Blockages.NotFoundError('Stakeholder member association not found');
                else
                    throw new Blockages.BadRequestError('Bad token, multiple stakeholder member assocations');
            }
            // If cell associated, remove association
            else if (token.cellStakeholderId !== null) {
                return metabolism.sequelize.Promise.all([
                    token.setCellStakeholder(null),
                    metabolism.CellStakeholder.findAll({ where: {lifeId: lifeId} /*attributes: default*/ })
                ]);
            }
            // If gene associated, remove association
            else {
                return metabolism.sequelize.Promise.all([
                    token.setGeneStakeholder(null),
                    metabolism.GeneStakeholder.findAll({ where: {lifeId: lifeId} /*attributes: default*/ })
                ]);
            }
        })
        .spread(function (token, stakeholderMembers) {
            res.status(200).send(Blockages.respMsg(res, true, stakeholderMembers));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// PUT ROUTES
// -----------------------------------------------------------------------------
// /life/:id
// --- update info for life (:id)
router.put('/:id', function(req, res) {
    debug('[PUT] /life/:id');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    var email = metabolism.Life.extractEmail(metabolism, req.body.email);
    var phone = metabolism.Life.extractPhone(metabolism, req.body.phone, CountryCodes.ENUM.USA.abbr);

    metabolism.sequelize.Promise.all([
        metabolism.Life.find({ where: {lifeId: lifeId}, attributes: lifeAttributes }),
        metabolism.Life.find({ where: {email: email},   attributes: [ 'lifeId', 'email' ]}),
        metabolism.Life.find({ where: {phone: phone},   attributes: [ 'lifeId', 'phone' ]})
    ]).bind({})
    .spread(function(life, emailLife, phoneLife) {
        if (!life)
            throw new Blockages.NotFoundError('Life not found');
        else if (emailLife && emailLife.lifeId !== life.lifeId)
            throw new Blockages.ConflictError('Email address already in use');
        else if (phoneLife && phoneLife.lifeId !== life.lifeId)
            throw new Blockages.ConflictError('Phone number already in use');

        // If the email has changed, set emailVerified to false
        if (!validate.equals(email, life.email)) {
            life.emailVerified = false;
            this.sendEmailVerification = true;
        }

        // If the phone has changed, set phoneVerified to false
        if (!validate.equals(phone, life.phone)) {
            life.phoneVerified = false;
            this.sendPhoneVerification = true;
        }

        // If the receiptEmail has changed, set receiptEmailVerified to false
        var receiptEmail = metabolism.Life.extractReceiptEmail(metabolism, req.body.receiptEmail);
        if (!validate.equals(receiptEmail, life.receiptEmail)) {
            life.receiptEmailVerified = false;
            this.sendReceiptEmailVerification = true;
        }

      /*life.lifeId:               not accessible for change */
        life.phone                 = phone;
      /*life.phoneVerified:        set above */
        life.email                 = email;
      /*life.emailVerified:        set above */
        life.receiptEmail          = receiptEmail;
      /*life.receiptEmailVerified: set above */
      /*life.eeg:                  not accessible for change */
      /*life.eegExpiration:        not accessible for change */
      /*life.genome:               not accessible for change */
      /*life.referralCode:         not accessible for change */
        life.givenName             = validate.trim(validate.toString(req.body.givenName));
        life.middleName            = metabolism.Life.extractMiddleName(metabolism, req.body.middleName);
        life.familyName            = validate.trim(validate.toString(req.body.familyName));
      /*life.countryCode:          not accessible for change */

        return life.save();
    })
    .then(function(life) {
        // var sendMail = metabolism.sequelize.Promise.promisify(Transporter.sendMail, Transporter);
        // var mailOptions;
        // var newVerification = { lifeId: life.lifeId };
        var executeArray = [];

        this.life = life;

        // // If a primary email was changed, send verification email
        // if (this.sendEmailVerification) {
        //     newVerification = {
        //       /*verificationId:   0,*/
        //         verificationType: 'EML',
        //         code:             metabolism.LifeVerification.generateCode(),
        //         lifeId:           life.lifeId
        //     };

        //     mailOptions = {
        //         from: 'Munch <donotreply@munchmode.com>',
        //         to: life.givenName + ' ' + life.familyName + ' <' + life.email + '>',
        //         subject: 'Verify Email Address',
        //         text: 'Email Verification\n'+
        //               'Please verify this email address with Munch by following the link below and signing into your new account.'+
        //               'https://munch-meanjoe45.c9.io/verify/email/' + newVerification.code,
        //         html: '<h2>Email Verification</h2><br/>' +
        //               '<p>Please verify this email address with Munch by following the link below and signing into your new account.</p>' +
        //               '<p><a href="https://munch-meanjoe45.c9.io/verify/email/' + newVerification.code + '">Verify Email</a></p>' +
        //               '<p>You can also copy this address into your browser:<br/>https://munch-meanjoe45.c9.io/verify/email/' + newVerification.code + '</p>'
        //     };

        //     executeArray.push(metabolism.LifeVerification.create(newVerification));
        //     executeArray.push(sendMail(mailOptions));
        // }

        // // If a primary phone was changed, send verification text message
        // if (this.sendPhoneVerification) {
        //     newVerification = {
        //       /*verificationId:   0,*/
        //         verificationType: 'PHN',
        //         code:             metabolism.LifeVerification.generateCode(),
        //         lifeId:           life.lifeId
        //     };

        //     executeArray.push(metabolism.LifeVerification.create(newVerification));
        // }

        // // If a receipt email was changed, send verification email
        // if (this.sendReceiptEmailVerification) {
        //     newVerification = {
        //       /*verificationId:   0,*/
        //         verificationType: 'REM',
        //         code:             metabolism.LifeVerification.generateCode(),
        //         lifeId:           life.lifeId
        //     };

        //     mailOptions = {
        //         from: 'Munch <donotreply@munchmode.com>',
        //         to: life.givenName + ' ' + life.familyName + ' <' + life.receiptEmail + '>',
        //         subject: 'Verify Receipt Email Address',
        //         text: 'Receipt Email Verification\n'+
        //               'Please verify this email address with Munch by following the link below and signing into your new account.'+
        //               'http://www.munch.com/verify/' + newVerification.code,
        //         html: '<h2>Receipt Email Verification</h2><br/>' +
        //               '<p>Please verify this email address with Munch by following the link below and signing into your new account.</p>' +
        //               '<p><a href="http://www.munch.com/verify/' + newVerification.code + '">www.munch.com/verify/' + newVerification.code + '</a></p>'
        //     };

        //     executeArray.push(metabolism.LifeVerification.create(newVerification));
        //     executeArray.push(sendMail(mailOptions));
        // }

        if (executeArray.length > 0)
            return metabolism.sequelize.Promise.all(executeArray);
        else
            return metabolism.sequelize.Promise.resolve();
    })
    .then(function(results) {
        res.status(200).send(Blockages.respMsg(res, true, this.life.get()));
    })
    .catch(metabolism.Sequelize.ValidationError, function(error) {
        res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
    })
    .catch(function(error) {
        res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
    });
});

// /life/:id/address/:addressId
// --- update address (:addressId) for life (:id)
router.put('/:id/address/:addressId', function(req, res) {
    debug('[PUT] /life/:id/address/:addressId');
    var lifeId    = req.params.id;
    var addressId = req.params.addressId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .find({
            where: {
                addressId: addressId,
                lifeId: lifeId
            },
            attributes: attributesAddress
        })
        .then(function(address) {
            if (!address)
                throw new Blockages.NotFoundError('Address not found');

          /*address.addressId: not accessible for change */
            address.name              = metabolism.Address.extractName(metabolism, req.body.name);
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

// /life/:id/phone/:phoneId
// --- update phone number (:phoneId) for life (:id)
router.put('/:id/phone/:phoneId', function(req, res) {
    debug('[PUT] /life/:id/phone/:phoneId');
    var lifeId  = req.params.id;
    var phoneId = req.params.phoneId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .find({
            where: {
                phoneId: phoneId,
                lifeId: lifeId
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

// /life/:id/device/:deviceId
// --- update info of device (:deviceId) for life (:id)
router.put('/:id/device/:deviceId', function(req, res) {
    debug('[PUT] /life/:id/device/:deviceId');
    var lifeId   = req.params.id;
    var deviceId = req.params.deviceId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.LifeDevice
        .find({
            where: {
                deviceId: deviceId,
                lifeId: lifeId
            },
            attributes: attributesLifeDevice
        })
        .then(function(device) {
            if (!device)
                throw new Blockages.NotFoundError('Life device not found');

          /*device.deviceId:    not accessible for change */
            device.type         = validate.trim(validate.toString(req.body.type)).toUpperCase();
            device.serialNumber = validate.trim(validate.toString(req.body.serialNumber));
            device.description  = metabolism.LifeDevice.extractDescription(metabolism, req.body.textDescription);
          /*device.lifeId:      not accessible for change */

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

// A route to update a gene signalPathway for a life does not exist; the
// signalPathway should just be deleted and reregistered for updating

// -----------------------------------------------------------------------------
// POST ROUTES
// -----------------------------------------------------------------------------
// /life/register --> located in proofOfLife.js to avoid token auth middleware

// /life/:id/genome
// --- add an genome to an existing life (:id)
// TODO: extend to allow different genome sizes OR resize given genome to multiple sizes
router.post('/:id/genome', function(req, res) {
    debug('[POST] /life/:id/genome');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Life
        .find({
            where: {lifeId: lifeId},
            attributes: lifeAttributes
        })
        .then(function(life) {
            if (!life)
                throw new Blockages.NotFoundError('Life not found');

            // Validate 'genome' format
            // TODO: restrict genome format to txt
            var genomePath = req.files.genome.path;
            if (validate.equals(req.files.genome.name, ''))
                throw new Blockages.BadRequestError('Genome is required');

            // Move the genome into the directory associated with the life
            var genomeDir = 'genomes/life/' + life.lifeId + '/';
            mv(genomePath, genomeDir + 'genome.txt', {mkdirp: true}, function(error) {
                if (error)
                    throw error;
                else
                    res.status(201).send(Blockages.respMsg(res, true, life));
            });
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /life/:id/media
// --- add an media to an existing life (:id)
// TODO: extend to allow different media sizes OR resize given media to multiple sizes
router.post('/:id/media', function(req, res) {
    debug('[POST] /life/:id/media');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Life
        .find({
            where: {lifeId: lifeId},
            attributes: lifeAttributes
        })
        .then(function(life) {
            if (!life)
                throw new Blockages.NotFoundError('Life not found');

            // Validate 'media' format
            var mediaPath = req.files.media.path;
            if (validate.equals(req.files.media.name, ''))
                throw new Blockages.BadRequestError('Media is required');

            // Move the media into the directory associated with the life
            var mediaDir = 'media/life/' + life.lifeId + '/';
            mv(mediaPath, mediaDir + 'life-media.extension', {mkdirp: true}, function(error) {
                if (error)
                    throw error;
                else
                    res.status(201).send(Blockages.respMsg(res, true, life));
            });
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /life/:id/address
// --- add an address to an existing life (:id)
router.post('/:id/address', function(req, res) {
    debug('[POST] /life/:id/address');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Life
        .find({
            where: {lifeId: lifeId},
            attributes: lifeAttributes
        })
        .then(function(life) {
            if (!life)
                throw new Blockages.NotFoundError('Life not found');

            var newAddress = {
              /*addressId:        0,*/
                name:             metabolism.Address.extractName(metabolism, req.body.name),
                address1:         validate.trim(validate.toString(req.body.address1)),
                address2:         metabolism.Address.extractAddress(metabolism, req.body.address2),
                address3:         metabolism.Address.extractAddress(metabolism, req.body.address3),
                address4:         metabolism.Address.extractAddress(metabolism, req.body.address4),
                locality:         validate.trim(validate.toString(req.body.locality)),
                region:           validate.trim(validate.toString(req.body.region)),
                postalCode:       validate.trim(validate.toString(req.body.postalCode)),
                lifeId:           life.lifeId
              /*cellId:           null,*/
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

// /life/:id/phone
// --- add a phone number to an existing life (:id)
router.post('/:id/phone', function(req, res) {
    debug('[POST] /life/:id/phone');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Life
        .find({
            where: {lifeId: lifeId},
            attributes: lifeAttributes
        })
        .then(function(life) {
            if (!life)
                throw new Blockages.NotFoundError('Life not found');

            var newPhone = {
              /*phoneId:          0,*/
                name:             metabolism.Phone.extractName(metabolism, req.body.name),
                number:           validate.trim(validate.toString(req.body.number)),
                extension:        metabolism.Phone.extractExtension(metabolism, req.body.extension),
                lifeId:           life.lifeId
              /*cellId:           null,*/
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

// /life/:id/device
// --- add a device to an existing life (:id)
router.post('/:id/device', function(req, res) {
    debug('[POST] /life/:id/device');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Life
        .find({
            where: {lifeId: lifeId},
            attributes: lifeAttributes
        })
        .then(function(life) {
            if (!life)
                throw new Blockages.NotFoundError('Life not found');

            var newDevice = {
              /*deviceId:     0,*/
                type:         validate.trim(validate.toString(req.body.type)).toUpperCase(),
                serialNumber: validate.trim(validate.toString(req.body.serialNumber)),
                description:  metabolism.LifeDevice.extractDescription(metabolism, req.body.textDescription),
                lifeId:       life.lifeId
            };

            return metabolism.LifeDevice.create(newDevice);
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

// /life/:id/password
// --- update the password for life (:id)
// router.post('/:id/password', function(req, res) {
//     debug('[POST] /life/:id/password');
//     var lifeId      = req.params.id;
//     var oldPassword = req.body.oldPassword;
//     var newPassword = req.body.newPassword;

//     if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
//         return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

//     metabolism.Life
//         .find({
//             where: {lifeId: lifeId},
//             attributes: [ 'lifeId', 'eegHash' ]
//         })
//         .then(function(life) {
//             if (!life)
//                 throw new Blockages.NotFoundError('Life not found');
//             // Verify old password
//             else if (!life.validPassword(oldPassword))
//                 throw new Blockages.BadRequestError('Original password is invalid');

//             life.password = newPassword;

//             return life.save();
//         })
//         .then(function(life) {
//             res.status(200).send(Blockages.respMsg(res, true, { 'lifeId': life.lifeId }));
//         })
//         .catch(metabolism.Sequelize.ValidationError, function(error) {
//             res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
//         })
//         .catch(function(error) {
//             res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
//         });
// });

// /life/:id/verify/genome
// --- produce a verification code to allow the genome to be updated for life (:id)
router.post('/:id/verify/genome', function(req, res) {
    debug('[' + req.method + '] /life/:id/verify/genome');
    var lifeId = req.params.id;
    var genome    = req.body.genome;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Life
        .find({
            where: {lifeId: lifeId},
            attributes: [ 'lifeId', 'phone', 'eegHash', 'eegExpiration', 'genomeHash' ]
        })
        .bind({})
        .then(function(life) {
            if (!life)
                throw new Blockages.NotFoundError('Life not found');
            // Verify genome
            else if (!life.validGenome(genome))
                throw new Blockages.BadRequestError('Original genome is invalid');
                
            this.life = life;
            this.eeg = bciEEG.bandpower.toString();

            if (life.phone === '+12125551234') {
                this.eeg = 'ATTCGAAT 0010100111000010';
            }

            life.eeg = this.eeg;
            life.eegExpiration = new Date(new Date().getTime() + (5*60*60*1000)); // 5 minute expiration

            return life.save();
        })
        .then(function() {
            if (this.life.phone !== '+12125551234') {

            return genomeEegReceipt.send({
                to: this.life.genome,
                body: 'Verification code for changing your genome: ' + this.eeg
            });

            } else {
                return metabolism.sequelize.Promise.resolve();
            }
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true, { 'lifeId': this.life.lifeId }));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /life/:id/genome
// --- update the genome for life (:id)
router.post('/:id/genome', function(req, res) {
    debug('[' + req.method + '] /life/:id/genome');
    var lifeId    = req.params.id;
    var eeg       = req.body.eeg;
    var oldGenome = req.body.oldGenome;
    var newGenome = req.body.newGenome;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Life
        .find({
            where: {lifeId: lifeId},
            attributes: [ 'lifeId', 'eegHash', 'eegExpiration', 'genomeHash' ]
        })
        .then(function(life) {
            if (!life)
                throw new Blockages.NotFoundError('Life not found');
            // Verify eeg
            else if (!life.validEeg(eeg))
                throw new Blockages.UnauthorizedError('EEG is invalid');
            // Verify old genome
            else if (!life.validGenome(oldGenome))
                throw new Blockages.BadRequestError('Original genome is invalid');

            life.genome = newGenome;
            life.eegExpiration = new Date();

            return life.save();
        })
        .then(function(life) {
            res.status(200).send(Blockages.respMsg(res, true, { 'lifeId': life.lifeId }));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

var setPreference = function(res, lifeId, signalPathwayId, geneTypeValue, preferenceField) {
    metabolism.sequelize.Promise.all([
        metabolism.LifePreference
            .find({
                where: {lifeId: lifeId},
                // attributes: default
            }),
        metabolism.GeneSignalPathway
            .find({
                where: {signalPathwayId: signalPathwayId},
                include: includeGene
                // attributes: default
            })
    ])
    .spread(function(preference, signalPathway) {
        if (!preference)
            throw new Blockages.NotFoundError('Life preferences not found');
        else if (!signalPathway)
            throw new Blockages.NotFoundError('Gene signalPathway not found');
        else if (signalPathway.Gene.geneType & geneTypeValue === 0)
            throw new Blockages.BadRequestError('Gene signalPathway is incorrect gene type');

        preference.setDataValue(preferenceField, signalPathway.signalPathwayId);

        return preference.save();
    })
    .then(function(preference) {
        res.status(200).send(Blockages.respMsg(res, true, preference));
    })
    .catch(function(error) {
        res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
    });
};

// /life/:id/preference/signaling
// --- set the signaling gene signalPathway (:signalPathwayId) preference for a life (:id)
router.post('/:id/preference/signaling', function(req, res) {
    debug('[POST] /life/:id/preference/signaling');
    var lifeId          = req.params.id;
    var signalPathwayId = req.body.signalPathwayId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    setPreference(res, lifeId, signalPathwayId, GeneType.ENUM.SIGNALING.value, 'signalingSignalPathwayId');
});

// // /life/:id/preference/loyalty
// // --- set the loyalty gene signalPathway (:signalPathwayId) preference for a life (:id)
// router.post('/:id/preference/loyalty', function(req, res) {
//     debug('[POST] /life/:id/preference/loyalty');
//     var lifeId          = req.params.id;
//     var signalPathwayId = req.body.signalPathwayId;

//     if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
//         return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

//     setPreference(res, lifeId, signalPathwayId, GeneType.ENUM.LOYALTY.value, 'loyaltySignalPathwayId');
// });

// // /life/:id/preference/signal
// // --- set the signal gene signalPathway (:signalPathwayId) preference for a life (:id)
// router.post('/:id/preference/signal', function(req, res) {
//     debug('[POST] /life/:id/preference/signal');
//     var lifeId          = req.params.id;
//     var signalPathwayId = req.body.signalPathwayId;

//     if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
//         return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

//     setPreference(res, lifeId, signalPathwayId, GeneType.ENUM.CHECKIN.value, 'signalSignalPathwayId');
// });

// /life/:id/signalPathwayForGene/:geneId
// --- add a signalPathway for a life (:id) of an existing gene (:geneId)
router.post('/:id/signalPathwayForGene/:geneId', function(req, res) {
    debug('[POST] /life/:id/signalPathwayForGene/:geneId');
    var lifeId = req.params.id;
    var geneId = req.params.geneId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.sequelize.Promise.all([
        metabolism.GeneSignalPathway
            .find({ where: {lifeId: lifeId, geneId: geneId} /* attributes: default */ }),
        metabolism.Gene
            .find({ where: {geneId: geneId}                 /* attributes: default */ }),
        metabolism.Life
            .find({ where: {lifeId: lifeId}                       /* attributes: default */ })
    ])
    .spread(function(signalPathway, gene, life) {
        if (signalPathway)
            throw new Blockages.ConflictError('Gene signalPathway already exists');
        else if (!gene)
            throw new Blockages.NotFoundError('Gene not found');
        else if (!life)
            throw new Blockages.NotFoundError('Life not found');

        var geneAPI = new Genes[gene.geneId.toString()]();

        res.redirect(geneAPI.authenticate(req.headers.host + '/v1', life.lifeId, null));
    })
    .catch(function(error) {
        res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
    });
});

// -----------------------------------------------------------------------------
// DELETE ROUTES
// -----------------------------------------------------------------------------
// /life/:id
// --- delete an existing life (:id)
router.delete('/:id', function(req, res) {
    debug('[DELETE] /life/:id');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Life
        .find({
            where: {lifeId: lifeId}
            // attributes: default
        })
        .then(function(life) {
            if (!life)
                throw new Blockages.NotFoundError('Life not found');

            return life.destroy();
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true, 'LIFE (' + lifeId + ') DELETED'));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /life/:id/genome/:size
// --- delete an genome of an existing life (:id)
router.delete('/:id/genome/:size', function(req, res) {
    debug('[DELETE] /life/:id/genome/:size');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /life/:id/address/:addressId
// --- delete an address (:addressId) of an existing life (:id)
router.delete('/:id/address/:addressId', function(req, res) {
    debug('[DELETE] /life/:id/address/:addressId');
    var lifeId    = req.params.id;
    var addressId = req.params.addressId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .find({
            where: {
                addressId: addressId,
                lifeId: lifeId
            }
            // attributes: default
        })
        .then(function(address) {
            if (!address)
                throw new Blockages.NotFoundError('Address not found');

            return address.destroy();
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true, 'ADDRESS (' + addressId + ') DELETED'));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /life/:id/phone/:phoneId
// --- delete a phone number (:phoneId) of an existing life (:id)
router.delete('/:id/phone/:phoneId', function(req, res) {
    debug('[DELETE] /life/:id/phone/:phoneId');
    var lifeId  = req.params.id;
    var phoneId = req.params.phoneId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .find({
            where: {
                phoneId: phoneId,
                lifeId: lifeId
            }
            // attributes: default
        })
        .then(function(phone) {
            if (!phone)
                throw new Blockages.NotFoundError('Phone not found');

            return phone.destroy();
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true, 'PHONE NUMBER (' + phoneId + ') DELETED'));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /life/:id/device/:deviceId
// --- delete a device (:deviceId) of an existing life (:id)
router.delete('/:id/device/:deviceId', function(req, res) {
    debug('[DELETE] /life/:id/device/:deviceId');
    var lifeId   = req.params.id;
    var deviceId = req.params.deviceId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.LifeDevice
        .find({
            where: {
                deviceId: deviceId,
                lifeId: lifeId
            }
            // attributes: default
        })
        .then(function(device) {
            if (!device)
                throw new Blockages.NotFoundError('Life device not found');

            return device.destroy();
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true, 'DEVICE (' + deviceId + ') DELETED'));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

var removePreference = function(res, lifeId, preferenceField) {
    metabolism.LifePreference
        .find({
            where: {lifeId: lifeId},
            // attributes: default
        })
        .then(function(preferences) {
            if (!preferences)
                throw new Blockages.NotFoundError('Life preferences not found');

            preferences[ preferenceField ] = null;
            return preferences.save();
        })
        .then(function(preferences) {
            res.status(200).send(Blockages.respMsg(res, true, preferences.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
};

// /life/:id/preference/signaling
router.delete('/:id/preference/signaling', function(req, res) {
    debug('[DELETE] /life/:id/preference/signaling');
    var lifeId = req.params.id;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    removePreference(res, lifeId, 'signalingSignalPathwayId');
});

// // /life/:id/preference/loyalty
// router.delete('/:id/preference/loyalty', function(req, res) {
//     debug('[DELETE] /life/:id/preference/loyalty');
//     var lifeId = req.params.id;

//     if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
//         return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

//     removePreference(res, lifeId, 'loyaltySignalPathwayId');
// });

// // /life/:id/preference/signal
// router.delete('/:id/preference/signal', function(req, res) {
//     debug('[DELETE] /life/:id/preference/signal');
//     var lifeId = req.params.id;

//     if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
//         return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

//     removePreference(res, lifeId, 'signalSignalPathwayId');
// });

// /life/:id/preference/:signalPathwayId
router.delete('/:id/preference/:signalPathwayId', function(req, res) {
    debug('[DELETE] /life/:id/preference/:signalPathwayId');
    var lifeId         = req.params.id;
    var signalPathwayId = req.params.signalPathwayId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.LifePreference
        .find({
            where: {lifeId: lifeId}
            // attributes: default
        })
        .then(function(preferences) {
            if (!preferences)
                throw new Blockages.NotFoundError('Life preferences not found');

            if (preferences.signalingSignalPathwayId === signalPathwayId)
                preferences.signalingSignalPathwayId = null;

            // if (preferences.loyaltySignalPathwayId === signalPathwayId)
            //     preferences.loyaltySignalPathwayId = null;

            // if (preferences.signalSignalPathwayId === signalPathwayId)
            //     preferences.signalSignalPathwayId = null;

            return preferences.save();
        })
        .then(function(preferences) {
            res.status(200).send(Blockages.respMsg(res, true, preferences.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /life/:id/signalPathway/:signalPathwayId
// --- delete a signalPathway (:signalPathwayId) for a life (:id) of an existing gene
router.delete('/:id/signalPathway/:signalPathwayId', function(req, res) {
    debug('[DELETE] /life/:id/signalPathway/:signalPathwayId');
    var lifeId         = req.params.id;
    var signalPathwayId = req.params.signalPathwayId;

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.GeneSignalPathway
        .find({
            where: {
                signalPathwayId: signalPathwayId,
                lifeId: lifeId
            }
            // attributes: default
        })
        .then(function(signalPathway) {
            if (!signalPathway)
                throw new Blockages.NotFoundError('SignalPathway not found');

            return signalPathway.destroy();
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true, 'SIGNAL_PATHWAY (' + signalPathwayId + ') DELETED'));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// CATCH-ALL ROUTES (error)
// -----------------------------------------------------------------------------
// /life/*
// --- Any get route request not handled is caught with this route
router.get('/*', function(req, res) {
    debug('[GET] /life/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /life/*
// --- Any put route request not handled is caught with this route
router.put('/*', function(req, res) {
    debug('[PUT] /life/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /life/*
// --- Any post route request not handled is caught with this route
router.post('/*', function(req, res) {
    debug('[POST] /life/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /life/*
// --- Any delete route request not handled is caught with this route
router.delete('/*', function(req, res) {
    debug('[DELETE] /life/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});
