'use strict';

// brainwave.js (routes)

// Node.js native packages
var fs = require('fs');

// Dependency packages
var debug   = require('debug')('munch:routes:Brainwave');
var verbose = require('debug')('munch:verbose:routes:Brainwave');
var express = require('express');
var mv      = require('mv');

// Local js modules
var Middlewares  = require('./middlewares');
var metabolism   = require('../../models/database');
var BrainwaveGraph    = require('../../config/brainwaveGraph');
var Immunities   = require('../../config/immunities');
var Services        = require('../../config/services');
var Blockages    = require('../../config/blockages');
var CountryCodes = require('../../data/countryCodes');
var ServiceType     = require('../../data/serviceTypes');

var validate = metabolism.Sequelize.Validator;

var router = module.exports = express.Router();

// -----------------------------------------------------------------------------
// NON-TOKEN AUTH ROUTES
// -----------------------------------------------------------------------------
// Brainwave OAuth2 Authorization Callback
// TODO: place proper restrictions to auth callback to verify sender
var authCallback = function(req, res, brainwaveId, serviceId) {
    metabolism.sequelize.Promise.all([
        metabolism.ServiceSignalPathway
            .find({ where: {brainwaveId: brainwaveId, serviceId: serviceId} /* attributes: default */ }),
        metabolism.Service
            .find({ where: {serviceId: serviceId}                 /* attributes: default */ }),
        metabolism.Brainwave
            .find({ where: {brainwaveId: brainwaveId}                 /* attributes: default */ })
    ]).bind({})
    .spread(function(signalPathway, service, brainwave) {
        if (signalPathway)
            throw new Blockages.ConflictError('Service signalPathway already exists');
        else if (!service)
            throw new Blockages.NotFoundError('Service not found');
        else if (!brainwave)
            throw new Blockages.NotFoundError('Brainwave not found');

        this.brainwave = brainwave;
        this.service = service;

        var serviceAPI = new Services[service.serviceName.toString()]();
        return serviceAPI.authenticateCallback(req.query.code, req.headers.host + '/v1', null, brainwave.brainwaveId);
    })
    .then(function(newSignalPathway) {
      /*newSignalPathway.signalPathwayId: 0,*/
      /*newSignalPathway.signalPheromone:                        set by serviceAPI*/
      /*newSignalPathway.signalPheromoneExpiration:              set by serviceAPI*/
      /*newSignalPathway.reinforcementSignalPheromone:           set by serviceAPI*/
      /*newSignalPathway.reinforcementSignalPheromoneExpiration: set by serviceAPI*/
      /*newSignalPathway.optional:                               set by serviceAPI*/
      /*newSignalPathway.lifeId                                  null,*/
        newSignalPathway.brainwaveId                                  = this.brainwave.brainwaveId;
        newSignalPathway.serviceId                                  = this.service.serviceId;

        return metabolism.ServiceSignalPathway.create(newSignalPathway);
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

// /brainwave/service/:serviceId/auth/callback
// --- OAuth2 authorization callback handler (correctly uses state query field)
router.get('/service/:serviceId/auth/callback', function(req, res) {
    debug('[GET] /brainwave/service/:serviceId/auth/callback');
    var brainwaveId = req.query.state;
    var serviceId  = req.params.serviceId;

    authCallback(req, res, brainwaveId, serviceId);
});

// /brainwave/:id/service/:serviceId/auth/callback
// --- OAuth2 authorization callback handler (for services that don't support the state field)
router.get('/:id/service/:serviceId/auth/callback', function(req, res) {
    debug('[GET] /brainwave/:id/service/:serviceId/auth/callback');
    var brainwaveId = req.params.id;
    var serviceId  = req.params.serviceId;

    authCallback(req, res, brainwaveId, serviceId);
});

// -----------------------------------------------------------------------------
// TOKEN AUTHENTICATION MIDDLEWARE
// -----------------------------------------------------------------------------
router.use(Middlewares.tokenAuth);

// -----------------------------------------------------------------------------
// ATTRIBUTE/INCLUDE SETUP
// -----------------------------------------------------------------------------
// Removed from all attribute lists: createdAt, updatedAt, deletedAt
var attributesAddress           = [ 'addressId',       'name', 'address1', 'address2', 'address3', 'address4', 'locality', 'region', 'postalCode' ]; // Removed: lifeId, brainwaveId, instanceId, serviceId, chargeBrainwaveId, chargeInstanceId
var attributesBrainwaveDevice        = [ 'deviceId',        'minor', 'type', 'serialNumber', 'description', 'acceptsCash', 'acceptsCredit', 'instanceId' ];
var attributesBrainwaveInstance      = [ 'instanceId',      'major', 'constructiveInterference', 'destructiveInterference', 'name', 'website', 'brainwaveType', 'countryCode', 'fieldId' ]; // Removed: brainwaveId
var attributesBrainwaveStakeholder   = [ 'stakeholderId',   'immunities', 'brainwaveId', 'instanceId', 'lifeId' ]; // Removed: N/A
var attributesPhone             = [ 'phoneId',         'name', 'number', 'extension' ];    // Removed: chargeInstanceId, chargeBrainwaveId, brainwaveId, instanceId, lifeId, serviceId
var attributesServiceSignalPathway = [ 'signalPathwayId', 'signalPheromone', 'serviceId' ]; // Removed: signalPheromone, signalPheromoneExpiration, reinforcementWavePheromone, reinforcementWavePheromoneExpiration, optional, brainwaveId, lifeId

// Remove fields from metabolism.Brainwave: deletedAt
var brainwaveAttributes = [ 'brainwaveId', 'verified', 'name', 'type', 'website', 'countryCode', 'createdAt', 'updatedAt' ];

// Remove fields from metabolism.BrainwaveInstance: deletedAt
var instanceAttributes = [ 'instanceId', 'major', 'constructiveInterference', 'destructiveInterference', 'name', 'website', 'brainwaveType', 'countryCode', 'createdAt', 'updatedAt', 'brainwaveId', 'fieldId' ];

// Remove fields from metabolism.Life: phoneVerified, emailVerified, receiptEmail, receiptEmailVerified, referralCode, eegHash, eegExpiration, genomeHash, createdAt, updatedAt, deletedAt
var lifeAttributes = [ 'lifeId', 'phone', 'email', 'givenName', 'middleName', 'familyName', 'countryCode' ];

// Remove fields from metabolism.Service: supportEmail, supportEmailVerified, supportWebsite, supportVersion, signupUrl, authUrl, deauthUrl
var includeService = { model: metabolism.Service, attributes: [ 'serviceId', 'serviceType', 'serviceName', 'companyName', 'website', 'countryCode' ] };

var includeAddress           = { model: metabolism.Address,           as: 'Address',            attributes: attributesAddress };
var includeBrainwaveDevice        = { model: metabolism.BrainwaveDevice,        as: 'Devices',            attributes: attributesBrainwaveDevice };
var includeBrainwaveInstance      = { model: metabolism.BrainwaveInstance,      as: 'Instances',          attributes: attributesBrainwaveInstance};
var includeBrainwaveStakeholder   = { model: metabolism.BrainwaveStakeholder,   as: 'StakeholderMembers', attributes: attributesBrainwaveStakeholder };
var includePhone             = { model: metabolism.Phone,             as: 'Phones',             attributes: attributesPhone };
var includeServiceSignalPathway = { model: metabolism.ServiceSignalPathway, as: 'SignalPathways',     attributes: attributesServiceSignalPathway };

//  brainwaveIncludesAll      = [ includeAddress, includeBrainwaveInstance, includeBrainwaveStakeholder, includePhone, includeServiceSignalPathway ];
var brainwaveIncludesBrainwave     = [ includeAddress, includeBrainwaveInstance, includeBrainwaveStakeholder, includePhone, includeServiceSignalPathway ];
var brainwaveIncludesInstance = [ includeAddress, includeBrainwaveDevice,   includeBrainwaveStakeholder, includePhone ];

// -----------------------------------------------------------------------------
// USE MERCHANT-ORDER ROUTES
// -----------------------------------------------------------------------------
// All routes related to a brainwave's cycles are located in the brainwave-cycle.js file
router.use(require('./brainwaveCycle'));

// -----------------------------------------------------------------------------
// GET ROUTES
// -----------------------------------------------------------------------------
// /brainwave/:id
// --- retrieve info for brainwave (:id)
router.get('/:id', function(req, res) {
    debug('[GET] /brainwave/:id');
    var brainwaveId = req.params.id;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Brainwave
        .find({
            where: {brainwaveId: brainwaveId},
            include: brainwaveIncludesBrainwave,
            attributes: brainwaveAttributes
        })
        .then(function(brainwave) {
            if (!brainwave)
                throw new Blockages.NotFoundError('Brainwave not found');

            res.status(200).send(Blockages.respMsg(res, true, brainwave.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// TODO: determine different media types and types to expand uses
var sendBrainwaveMedia = function(res, brainwaveId, type) {
    var mediaTypes = [ '.png', '.wav', '.mov', '.fasta' ];

    if (!validate.isIn(type, mediaTypes))
        return res.status(400).send(Blockages.respMsg(res, false, 'Media type not recognized'));

    var mediaFile = 'media-name' + type;
    var mediaPath = res.app.locals.rootDir + '/medias/brainwave/' + brainwaveId + '/';
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

// /brainwave/:id/media (default type)
// --- retrieve brainwave media (logo) for brainwave (:id)
router.get('/:id/media', function(req, res) {
    debug('[GET] /brainwave/:id/media');
    var brainwaveId = req.params.id;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    sendBrainwaveMedia(res, brainwaveId);
});

// /brainwave/:id/media/:type (all supported types)
// --- retrieve brainwave media (logo) for brainwave (:id)
router.get('/:id/media/:type', function(req, res) {
    debug('[GET] /brainwave/:id/media/:type');
    var brainwaveId = req.params.id;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    sendBrainwaveMedia(res, brainwaveId, req.params.type);
});

// /brainwave/:id/address
// --- retrieve the address of the brainwave (:id)
router.get('/:id/address', function(req, res) {
    debug('[GET] /brainwave/:id/address');
    var brainwaveId = req.params.id;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .find({
            where: {brainwaveId: brainwaveId},
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

// /brainwave/:id/phones
// --- retrieve array of phone numbers for brainwave (:id)
router.get('/:id/phones', function(req, res) {
    debug('[GET] /brainwave/:id/phones');
    var brainwaveId = req.params.id;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .findAll({
            where: {brainwaveId: brainwaveId},
            attributes: attributesPhone
        })
        .then(function(phones) {
            res.status(200).send(Blockages.respMsg(res, true, phones));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /brainwave/:id/signalPathways/:type
// --- retrieve array of connected services of (:type) for brainwave (:id)
// TODO: service types: dictionary, genomics, communications
router.get('/:id/signalPathways/:type', function(req, res) {
    debug('[GET] /brainwave/:id/signalPathways/:type');
    var brainwaveId         = req.params.id;
    var serviceTypeString = validate.toString(req.params.type).toLowerCase();

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.ServiceSignalPathway
        .findAll({
            where: {brainwaveId: brainwaveId},
            include: includeService,
            attributes: attributesServiceSignalPathway
        })
        .then(function(signalPathways) {
            var filteredSignalPathways = [];

            if (validate.equals(serviceTypeString, ServiceType.ENUM.ALL.text))
                filteredSignalPathways = signalPathways;
            else {
                var serviceSelector;
                if (validate.equals(serviceTypeString, ServiceType.ENUM.DICTIONARY.text))
                    serviceSelector = ServiceType.ENUM.DICTIONARY.value;
                else if (validate.equals(serviceTypeString, ServiceType.ENUM.GENOMICS.text))
                    serviceSelector = ServiceType.ENUM.GENOMICS.value;
                else if (validate.equals(serviceTypeString, ServiceType.ENUM.COMMUNICATIONS.text))
                    serviceSelector = ServiceType.ENUM.COMMUNICATIONS.value;
                else
                    throw new Blockages.BadRequestError('Service type not recognized');

                for (var i = 0; i < signalPathways.length; i++) {
                    if (signalPathways[i].Service.serviceType & serviceSelector)
                        filteredSignalPathways.push(signalPathways[i]);
                }
            }

            res.status(200).send(Blockages.respMsg(res, true, filteredSignalPathways));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /brainwave/:id/signalPathway/:signalPathwayId
// --- retrieve info on signalPathway (:signalPathwayId) for brainwave (:id)
router.get('/:id/signalPathway/:signalPathwayId', function(req, res) {
    debug('[GET] /brainwave/:id/signalPathway/:signalPathwayId');
    var brainwaveId          = req.params.id;
    var signalPathwayId = req.params.signalPathwayId;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.ServiceSignalPathway
        .find({
            where: {
                signalPathwayId: signalPathwayId,
                brainwaveId: brainwaveId
            },
            include: includeService,
            attributes: attributesServiceSignalPathway
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

// /brainwave/:id/signalPathwayForService/:serviceId
// --- retrieve info on signalPathway to service (:serviceId) for brainwave (:id)
router.get('/:id/signalPathwayForService/:serviceId', function(req, res) {
    debug('[GET] /brainwave/:id/signalPathwayForService/:serviceId');
    var brainwaveId = req.params.id;
    var serviceId = req.params.serviceId;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.ServiceSignalPathway
        .find({
            where: {
                serviceId: serviceId,
                brainwaveId: brainwaveId
            },
            attributes: attributesServiceSignalPathway
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

// /brainwave/:id/stakeholder
// --- retrieve array of top level brainwave stakeholder (all members) for brainwave (:id)
router.get('/:id/stakeholder', function(req, res) {
    debug('[GET] /brainwave/:id/stakeholder');
    var brainwaveId = req.params.id;

    // TODO: restrict this route to only admins; returns a list of brainwave admins (access to all instances)
    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveStakeholder
        .findAll({
            where: {
                brainwaveId: brainwaveId,
                instanceId: null
            },
            attributes: attributesBrainwaveStakeholder
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

// /brainwave/:id/stakeholderMember/:lifeId
// --- retrieve immunity info on top level brainwave stakeholder member (:lifeId) for brainwave (:id)
router.get('/:id/stakeholderMember/:lifeId', function(req, res) {
    debug('[GET] /brainwave/:id/stakeholderMember/:lifeId');
    var brainwaveId = req.params.id;
    var lifeId = req.params.lifeId;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveStakeholder
        .find({
            where: {
                lifeId: lifeId,
                brainwaveId: brainwaveId,
                instanceId: null
            },
            attributes: attributesBrainwaveStakeholder
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

// /brainwave/:id/instances
// --- retrieve array of instances for brainwave (:id)
router.get('/:id/instances', function(req, res) {
    debug('[GET] /brainwave/:id/instances');
    var brainwaveId = req.params.id;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveInstance
        .findAll({
            where: {brainwaveId: brainwaveId},
            attributes: attributesBrainwaveInstance
        })
        .then(function(instances) {
            res.status(200).send(Blockages.respMsg(res, true, instances));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /brainwave/:id/instance/:instanceId
// --- retrieve info on instance (:instanceId) for brainwave (:id)
router.get('/:id/instance/:instanceId', function(req, res) {
    debug('[GET] /brainwave/:id/instance/:instanceId');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveInstance
        .find({
            where: {
                brainwaveId: brainwaveId,
                instanceId: instanceId
            },
            include: brainwaveIncludesInstance,
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

// /brainwave/:id/instance/:instanceId/address
// --- retrieve the address of instance (:instanceId) for brainwave (:id)
router.get('/:id/instance/:instanceId/address', function(req, res) {
    debug('[GET] /brainwave/:id/instance/:instanceId/address');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
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

// /brainwave/:id/instance/:instanceId/phones
// --- retrieve phone numbers of instance (:instanceId) for brainwave (:id)
router.get('/:id/instance/:instanceId/phones', function(req, res) {
    debug('[GET] /brainwave/:id/instance/:instanceId/phones');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
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

// /brainwave/:id/instance/:instanceId/stakeholder
// --- retrieve array of brainwave stakeholder (all members) of instance (:instanceId) for brainwave (:id)
router.get('/:id/instance/:instanceId/stakeholder', function(req, res) {
    debug('[GET] /brainwave/:id/instance/:instanceId/stakeholder');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelManager, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveStakeholder
        .findAll({
            where: {
                brainwaveId: brainwaveId,
                instanceId: instanceId
            },
            attributes: attributesBrainwaveStakeholder
        })
        .then(function(stakeholderMembers) {
            res.status(200).send(Blockages.respMsg(res, true, stakeholderMembers));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /brainwave/:id/instance/:instanceId/stakeholderMember/:lifeId
// --- retrieve immunity info on brainwave stakeholder member (:lifeId) of instance (:instanceId) for brainwave (:id)
router.get('/:id/instance/:instanceId/stakeholderMember/:lifeId', function(req, res) {
    debug('[GET] /brainwave/:id/instance/:instanceId/stakeholderMember/:lifeId');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;
    var lifeId     = req.params.lifeId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelManager, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveStakeholder
        .find({
            where: {
                lifeId: lifeId,
                brainwaveId: brainwaveId,
                instanceId: instanceId
            },
            attributes: attributesBrainwaveStakeholder
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

// /brainwave/:id/instance/:instanceId/devices
// --- retrieve array of devices at instance (:instanceId) for brainwave (:id)
router.get('/:id/instance/:instanceId/devices', function(req, res) {
    debug('[GET] /brainwave/:id/instance/:instanceId/devices');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelManager, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveDevice
        .findAll({
            where: {instanceId: instanceId},
            attributes: attributesBrainwaveDevice
        })
        .then(function(devices) {
            res.status(200).send(Blockages.respMsg(res, true, devices));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /brainwave/:id/instance/:instanceId/device/:deviceId
// --- retrieve info on device (:deviceId) of instance (:instanceId) for brainwave (:id)
router.get('/:id/instance/:instanceId/device/:deviceId', function(req, res) {
    debug('[GET] /brainwave/:id/instance/:instanceId/device/:deviceId');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;
    var deviceId   = req.params.deviceId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelManager, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveDevice
        .find({
            where: {
                deviceId: deviceId,
                instanceId: instanceId
            },
            attributes: attributesBrainwaveDevice
        })
        .then(function(device) {
            if (!device)
                throw new Blockages.NotFoundError('Brainwave device not found');

            res.status(200).send(Blockages.respMsg(res, true, device.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /brainwave/:id/loadDeviceType/:type/serialNumber/:serialNumber
// --- retrieve the brainwave (:id) information based on the device type (:type)
//     and serial number (:serialNumber) of the asking device
router.get('/:id/loadDeviceType/:type/serialNumber/:serialNumber', function(req, res) {
    debug('[GET] /brainwave/:id/loadDeviceType/:type/serialNumber/:serialNumber');
    var brainwaveId       = req.params.id;
    var type         = validate.trim(validate.toString(req.params.type)).toUpperCase();
    var serialNumber = validate.trim(validate.toString(req.params.serialNumber));

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveDevice
        .find({
            where: {
                type: type,
                serialNumber: serialNumber
            },
            include: metabolism.BrainwaveInstance,
            attributes: attributesBrainwaveDevice
        }).bind({})
        .then(function(device) {
            if (!device || device.BrainwaveInstance.brainwaveId !== validate.toInt(brainwaveId))
                throw new Blockages.NotFoundError('Brainwave device not found');

            this.device = device;

            return metabolism.Brainwave.find({ where: {brainwaveId: brainwaveId} });
        })
        .then(function(brainwave) {
            if (!brainwave)
                throw new Blockages.NotFoundError('Brainwave not found');

            res.status(200).send(Blockages.respMsg(res, true, {brainwave: brainwave.get(), device: this.device.get()}));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /brainwave/:id/sequencer
// --- retrieve sequencer information (JSON data? use service?)
router.get('/:id/sequencer', function(req, res) {
    debug('[GET] /brainwave/:id/sequencer');
    var brainwaveId  = req.params.id;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    var regFilePath = res.app.locals.rootDir + '/sequencer/' + brainwaveId + '/sequencer.json';
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

// /brainwave/instance/interferometer?constructiveInterference=[constructiveInterference]&destructiveInterference=[destructiveInterference]&constructiveInterferenceD=[constructiveInterference region delta]&destructiveInterferenceD=[destructiveInterference region delta]
// --- retrieve array of instances in a given area covered by the interferometer (constructiveInterference, destructiveInterference, constructiveInterferenceDelta, destructiveInterferenceDelta)
router.get('/instance/interferometer', function(req, res) {
    debug('[GET] /brainwave/instance/interferometer?');
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

    metabolism.BrainwaveInstance
        .findAll({
            where: {
                constructiveInterference: { between: [constructiveInterferenceMin, constructiveInterferenceMax] },
                destructiveInterference: { between: [destructiveInterferenceMin, destructiveInterferenceMax] }
            },
            include: [includeAddress, includePhone, {model: metabolism.Brainwave, attributes: brainwaveAttributes}],
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
// /brainwave/:id
// --- update info for brainwave (:id)
router.put('/:id', function(req, res) {
    debug('[PUT] /brainwave/:id');
    var brainwaveId = req.params.id;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Brainwave
        .find({
            where: {brainwaveId: brainwaveId},
            attributes: brainwaveAttributes
        })
        .then(function(brainwave) {
            if (!brainwave)
                throw new Blockages.NotFoundError('Brainwave not found');

          /*brainwave.brainwaveId:      not accessible for change */
          /*brainwave.verified:    not accessible for change */
            brainwave.name         = validate.trim(validate.toString(req.body.name));
            brainwave.type         = validate.trim(validate.toString(req.body.type));
            brainwave.website      = metabolism.Brainwave.extractWebsite(metabolism, req.body.website);
          /*brainwave.countryCode: not accessible for change */

            return brainwave.save();
        })
        .then(function(brainwave) {
            res.status(200).send(Blockages.respMsg(res, true, brainwave.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /brainwave/:id/address/:addressId
// --- update main address (:addressId) for brainwave (:id)
router.put('/:id/address/:addressId', function(req, res) {
    debug('[PUT] /brainwave/:id/address/:addressId');
    var brainwaveId     = req.params.id;
    var addressId  = req.params.addressId;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .find({
            where: {
                addressId: addressId,
                brainwaveId: brainwaveId
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
          /*address.brainwaveId:           not accessible for change */
          /*address.instanceId:       not accessible for change */
          /*address.serviceId:           not accessible for change */
          /*address.chargeBrainwaveId:     not accessible for change */
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

// /brainwave/:id/phone/:phoneId
// --- update phone number (:phoneId) for brainwave (:id)
router.put('/:id/phone/:phoneId', function(req, res) {
    debug('[PUT] /brainwave/:id/phone/phoneId');
    var brainwaveId     = req.params.id;
    var phoneId    = req.params.phoneId;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .find({
            where: {
                phoneId: phoneId,
                brainwaveId: brainwaveId
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
          /*phone.brainwaveId:           not accessible for change */
          /*phone.instanceId:       not accessible for change */
          /*phone.serviceId:           not accessible for change */
          /*phone.chargeBrainwaveId:     not accessible for change */
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

// A route to update a service signalPathway for a brainwave does not exist;
// the signalPathway should just be deleted and reregistered for updating

// /brainwave/:id/stakeholderMember/:lifeId
// --- update stakeholder member (:lifeId) at brainwave level for brainwave (:id)
// TODO: Expand functionality to ensure there is always at least one admin account for the brainwave
router.put('/:id/stakeholderMember/:lifeId', function(req, res) {
    debug('[PUT] /brainwave/:id/stakeholderMember/:lifeId');
    var brainwaveId = req.params.id;
    var lifeId = req.params.lifeId;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveStakeholder
        .find({
            where: {
                lifeId: lifeId,
                brainwaveId: brainwaveId,
                instanceId: null
            },
            attributes: attributesBrainwaveStakeholder
        })
        .then(function(stakeholderMember) {
            if (!stakeholderMember)
                throw new Blockages.NotFoundError('Stakeholder member not found');

          /*stakeholderMember.stakeholderId: not accessible for change */
            stakeholderMember.immunities =   validate.toInt(req.body.immunities);
          /*stakeholderMember.lifeId:        not accessible for change */
          /*stakeholderMember.brainwaveId:        not accessible for change */
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

// /brainwave/:id/instance/:instanceId
// --- update info of instance (:instanceid) for brainwave (:id)
router.put('/:id/instance/:instanceId', function(req, res) {
    debug('[PUT] /brainwave/:id/instance/:instanceId');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveInstance
        .find({
            where: {
                instanceId: instanceId,
                brainwaveId: brainwaveId
            },
            attributes: attributesBrainwaveInstance
        })
        .then(function(instance) {
            if (!instance)
                throw new Blockages.NotFoundError('Instance not found');

            // Extract 'constructiveInterference' from the body
            var constructiveInterference = null;
            if (req.body.hasOwnProperty('constructiveInterference'))
                constructiveInterference = metabolism.BrainwaveInstance.extractConstructiveInterferenceitude(metabolism, req.body.constructiveInterference);

            // Extract 'destructiveInterference' from the body
            var destructiveInterference = null;
            if (req.body.hasOwnProperty('destructiveInterference'))
                destructiveInterference = metabolism.BrainwaveInstance.extractDestructiveInterferencegitude(metabolism, req.body.destructiveInterference);

          /*instance.instanceId: 	      not accessible for change */
            instance.constructiveInterference = constructiveInterference;
            instance.destructiveInterference  = destructiveInterference;
            instance.name                     = metabolism.BrainwaveInstance.extractName(metabolism, req.body.name);
            instance.website                  = metabolism.BrainwaveInstance.extractWebsite(metabolism, req.body.website);
          /*instance.brainwaveType: 		      not accessible for change */
          /*instance.countryCode: 	      not accessible for change */
          /*instance.chargeBrainwaveId: 	      not accessible for change */

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

// /brainwave/:id/instance/:instanceId/address/:addressId
// --- update main address (:addressId) for instance (:instanceId) of brainwave (:id)
router.put('/:id/instance/:instanceId/address/:addressId', function(req, res) {
    debug('[PUT] /brainwave/:id/instance/:instanceId/address/:addressId');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;
    var addressId  = req.params.addressId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
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
          /*address.brainwaveId:           not accessible for change */
          /*address.instanceId:       not accessible for change */
          /*address.serviceId: 	      not accessible for change */
          /*address.chargeBrainwaveId:     not accessible for change */
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

// /brainwave/:id/instance/:instanceId/phone/:phoneId
// --- update phone number (:phoneId) for instance (:instanceId) of brainwave (:id)
router.put('/:id/instance/:instanceId/phone/:phoneId', function(req, res) {
    debug('[PUT] /brainwave/:id/instance/:instanceId/phone/:phoneId');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;
    var phoneId    = req.params.phoneId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
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
          /*phone.brainwaveId: 	    not accessible for change */
          /*phone.instanceId: 	    not accessible for change */
          /*phone.serviceId: 	    not accessible for change */
          /*phone.chargeBrainwaveId:     not accessible for change */
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

// /brainwave/:id/instance/:instanceId/stakeholderMember/:lifeId
// --- update stakeholder member (:lifeId) at instance level for instance (:instanceId) of brainwave (:id)
router.put('/:id/instance/:instanceId/stakeholderMember/:lifeId', function(req, res) {
    debug('[PUT] /brainwave/:id/instance/:instanceId/stakeholderMember/:lifeId');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;
    var lifeId     = req.params.lifeId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveStakeholder
        .find({
            where: {
                lifeId: lifeId,
                brainwaveId: brainwaveId,
                instanceId: instanceId
            },
            attributes: attributesBrainwaveStakeholder
        })
        .then(function(stakeholderMember) {
            if (!stakeholderMember)
                throw new Blockages.NotFoundError('Stakeholder member not found');

          /*stakeholderMember.stakeholderId: not accessible for change */
            stakeholderMember.immunities     = validate.toInt(req.body.immunities);
          /*stakeholderMember.lifeId:        not accessible for change */
          /*stakeholderMember.brainwaveId:        not accessible for change */
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

// /brainwave/:id/instance/:instanceId/device/:deviceId
// --- update info of device (:deviceId) for instance (:instanceid) of brainwave (:id)
router.put('/:id/instance/:instanceId/device/:deviceId', function(req, res) {
    debug('[PUT] /brainwave/:id/instance/:instanceId/device/:deviceId');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;
    var deviceId   = req.params.deviceId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveDevice
        .find({
            where: {
                deviceId: deviceId,
                instanceId: instanceId
            },
            attributes: attributesBrainwaveDevice
        })
        .then(function(device) {
            if (!device)
                throw new Blockages.NotFoundError('Brainwave device not found');

            var acceptsCash = false;
            if (req.body.hasOwnProperty('acceptsCash'))
                acceptsCash = metabolism.BrainwaveDevice.extractAcceptsCash(metabolism, req.body.acceptsCash);

            var acceptsCredit = false;
            if (req.body.hasOwnProperty('acceptsCredit'))
                acceptsCredit = metabolism.BrainwaveDevice.extractAcceptsCredit(metabolism, req.body.acceptsCredit);

          /*device.deviceId: 	 not accessible for change */
          /*device.minor: 	 not accessible for change */
            device.type          = validate.trim(validate.toString(req.body.type)).toUpperCase();
            device.serialNumber  = validate.trim(validate.toString(req.body.serialNumber));
            device.description   = metabolism.BrainwaveDevice.extractDescription(metabolism, req.body.textDescription);
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
// /brainwave/signup
// --- create a new brainwave
router.post('/signup', function(req, res) {
    debug('[POST] /brainwave/signup');
    // No immunity level necessary for this route; all are allowed access after token has been verified.

    // Create the brainwave record
    var newBrainwave = {
      /*brainwaveId:  0,*/
      /*verified:    false,*/
        name:        validate.trim(validate.toString(req.body.name)),
        type:        validate.trim(validate.toString(req.body.type)),
        website:     metabolism.Brainwave.extractWebsite(metabolism, req.body.website),
        countryCode: CountryCodes.ENUM.USA.abbr
    };

    metabolism.Brainwave.create(newBrainwave).bind({})
        .then(function(brainwave) {
            this.brainwave = brainwave;

            // Create brainwave stakeholder record to make the life an admin
            var newStakeholder = {
              /*stakeholderId: 0,*/
                immunities:    Immunities.AuthLevelAdminStakeholder,
                lifeId:        res.locals.lifePacket.life.lifeId,
                brainwaveId:        brainwave.brainwaveId
              /*instanceId:    null*/
            };

            return metabolism.BrainwaveStakeholder.create(newStakeholder);
        })
        .then(function(stakeholderMember) {
            return BrainwaveGraph.create(this.brainwave.brainwaveId);
        })
        .then(function() {
            res.status(201).send(Blockages.respMsg(res, true, this.brainwave.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /brainwave/instance/signup
// --- create a new brainwave adestructiveInterferenceg with one instance with an optional address and phone number
router.post('/instance/signup', function(req, res) {
    debug('[POST] /brainwave/instance/signup');
    // No immunity level necessary for this route; all are allowed access after token has been verified.

    // Create the brainwave record
    var newBrainwave = {
      /*brainwaveId:      0,*/
      /*verified:    false,*/
        name:        validate.trim(validate.toString(req.body.name)),
        type:        validate.trim(validate.toString(req.body.type)),
        website:     metabolism.Brainwave.extractWebsite(metabolism, req.body.website),
        countryCode: CountryCodes.ENUM.USA.abbr
    };

    metabolism.Brainwave.create(newBrainwave).bind({})
        .then(function(brainwave) {
            this.brainwave = brainwave;

            // Create brainwave stakeholder record to make the life an admin
            var newStakeholder = {
              /*stakeholderId: 0,*/
                immunities:    Immunities.AuthLevelAdminStakeholder,
                lifeId:        res.locals.lifePacket.life.lifeId,
                brainwaveId:        brainwave.brainwaveId
              /*instanceId:    null*/
            };

            return metabolism.BrainwaveStakeholder.create(newStakeholder);
        })
        .then(function(stakeholderMember) {
            return BrainwaveGraph.create(this.brainwave.brainwaveId);
        })
        .then(function(instance) {
            // Extract 'constructiveInterference' from the body
            var constructiveInterference = instance.calculateConstructiveInterference();
            if (req.body.hasOwnProperty('constructiveInterference'))
                constructiveInterference = metabolism.BrainwaveInstance.extractConstructiveInterference(metabolism, req.body.constructiveInterference);

            // Extract 'destructiveInterference' from the body
            var destructiveInterference = instance.calculateDestructiveInterference();
            if (req.body.hasOwnProperty('destructiveInterference'))
                destructiveInterference = metabolism.BrainwaveInstance.extractDestructiveInterference(metabolism, req.body.destructiveInterference);

            // Create the instance record
            var newInstance = {
              /*instanceId:   		  0,*/
                major:       		  0,
                constructiveInterference: constructiveInterference,
                destructiveInterference:  destructiveInterference,
              /*name:        		  null,*/
              /*website:      		  null,*/
              /*brainwaveType:     		  null,*/
              /*countryCode:  	          null,*/
                brainwaveId:       	          this.brainwave.brainwaveId
              /*fieldId:      		  null*/
            };

            return metabolism.BrainwaveInstance.create(newInstance);
        })
        .then(function(instance) {
            this.instance = instance;

            var id = instance.calculateFieldId();
            return metabolism.BrainwaveField.find({ where: {fieldId: id} });
        })
        .then(function(field) {
            if (!field)
                throw new Blockages.NotFoundError('Field to associate with brainwave instance not found');

            return field.addInstance(this.instance);
        })
        .then(function() {
            this.instance.calculateAndSetMajor();

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
                  /*brainwaveId:           null,*/
                    instanceId:       this.instance.instanceId
                  /*serviceId:           null,*/
                  /*chargeBrainwaveId:     null,*/
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
                  /*brainwaveId:           null,*/
                    instanceId:       this.instance.instanceId
                  /*serviceId:           null,*/
                  /*chargeBrainwaveId:     null,*/
                  /*chargeInstanceId: null*/
                };

                executeArray.push(metabolism.Phone.create(newPhone));
            }

         // signalPathwayId, signalPheromone, signalPheromoneExpiration, reinforcementSignalPheromone, reinforcementSignalPheromoneExpiration, optional, lifeId fields are defaults
            executeArray.push(metabolism.ServiceSignalPathway.create({ brainwaveId: this.brainwave.brainwaveId, serviceId: 1008 }));

            return metabolism.sequelize.Promise.all(executeArray);
        })
        .then(function(results) {
            res.status(201).send(Blockages.respMsg(res, true, this.brainwave.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /brainwave/:id/media
// --- add an media to an existing brainwave (:id)
router.post('/:id/media', function(req, res) {
    debug('[POST] /brainwave/:id/media');
    var brainwaveId = req.params.id;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Brainwave
        .find({
            where: {brainwaveId: brainwaveId},
            attributes: brainwaveAttributes
        })
        .then(function(brainwave) {
            if (!brainwave)
                throw new Blockages.NotFoundError('Brainwave not found');

            // Validate 'media' format
            // TODO: restrict media format to PNG
            // TODO: restrict media type to  200x200 (??)
            var mediaPath = req.files.media.path;
            if (validate.equals(req.files.media.name, ''))
                throw new Blockages.BadRequestError('Media is required');

            // Move the media into the directory associated with the brainwave
            var mediaDir = 'medias/brainwave/' + brainwave.brainwaveId + '/';
            mv(mediaPath, mediaDir + 'brainwave-media.extension', {mkdirp: true}, function(error) {
                if (error)
                    throw error;
                else
                    res.status(201).send(Blockages.respMsg(res, true, brainwave.get()));
            });
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /brainwave/:id/address
// --- add an address to an existing brainwave (:id)
router.post('/:id/address', function(req, res) {
    debug('[POST] /brainwave/:id/address');
    var brainwaveId = req.params.id;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Brainwave
        .find({
            where: {brainwaveId: brainwaveId},
            include: includeAddress,
            attributes: brainwaveAttributes
        })
        .then(function(brainwave) {
            if (!brainwave)
                throw new Blockages.NotFoundError('Brainwave not found');
            else if (brainwave.Address !== null)
                throw new Blockages.ConflictError('Brainwave already has an address');

            var newAddress = {
              /*addressId:        0,*/
                name:             '$$_brainwave',
                address1:         validate.trim(validate.toString(req.body.address1)),
                address2:         metabolism.Address.extractAddress(metabolism, req.body.address2),
                address3:         metabolism.Address.extractAddress(metabolism, req.body.address3),
                address4:         metabolism.Address.extractAddress(metabolism, req.body.address4),
                locality:         validate.trim(validate.toString(req.body.locality)),
                region:           validate.trim(validate.toString(req.body.region)),
                postalCode:       validate.trim(validate.toString(req.body.postalCode)),
              /*lifeId:           null,*/
                brainwaveId:           brainwave.brainwaveId
              /*instanceId:       null,*/
              /*serviceId:           null,*/
              /*chargeBrainwaveId:     null,*/
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

// /brainwave/:id/phone
// --- add a phone number to an existing brainwave (:id)
router.post('/:id/phone', function(req, res) {
    debug('[POST] /brainwave/:id/phone');
    var brainwaveId = req.params.id;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Brainwave
        .find({
            where: {brainwaveId: brainwaveId},
            attributes: brainwaveAttributes
        })
        .then(function(brainwave) {
            if (!brainwave)
                throw new Blockages.NotFoundError('Brainwave not found');

            var newPhone = {
              /*phoneId:          0,*/
                name:             metabolism.Phone.extractName(metabolism, req.body.name),
                number:           validate.trim(validate.toString(req.body.number)),
                extension:        metabolism.Phone.extractExtension(metabolism, req.body.extension),
              /*lifeId:           null,*/
                brainwaveId:           brainwave.brainwaveId
              /*instanceId:       null,*/
              /*serviceId:           null,*/
              /*chargeBrainwaveId:     null,*/
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

// /brainwave/:id/signalPathwayForService/:serviceId
// --- add a signalPathway for a brainwave (:id) of an existing service (:serviceId)
router.post('/:id/signalPathwayForService/:serviceId', function(req, res) {
    debug('[POST] /brainwave/:id/signalPathwayForService/:serviceId');
    var brainwaveId = req.params.id;
    var serviceId = req.params.serviceId;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelManager, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.sequelize.Promise.all([
        metabolism.ServiceSignalPathway
            .find({ where: {brainwaveId: brainwaveId, serviceId: serviceId} /* attributes: default */ }),
        metabolism.Service
            .find({ where: {serviceId: serviceId}                 /* attributes: default */ }),
        metabolism.Brainwave
            .find({ where: {brainwaveId: brainwaveId}                 /* attributes: default */ })
    ])
    .spread(function(signalPathway, service, brainwave) {
        if (signalPathway)
            throw new Blockages.ConflictError('Service signalPathway already exists');
        else if (!service)
            throw new Blockages.NotFoundError('Service not found');
        else if (!brainwave)
            throw new Blockages.NotFoundError('Brainwave not found');

        var serviceAPI = new Services[service.serviceId.toString()]();

        res.redirect(serviceAPI.authenticate(req.headers.host + '/v1', null, brainwave.brainwaveId));
    })
    .catch(function(error) {
        res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
    });
});

// /brainwave/:id/allowPaymentService/:serviceId
// --- add a signalPathway for a brainwave (:id) of an existing dictionary service (:serviceId)
router.post('/:id/serviceExpressionConstraints/:serviceId', function(req, res) {
    debug('[POST] /brainwave/:id/serviceExpressionConstraints/:serviceId');
    var brainwaveId  = req.params.id;
    var serviceId  = req.params.serviceId;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelManager, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.sequelize.Promise.all([
        metabolism.ServiceSignalPathway
            .find({ where: {brainwaveId: brainwaveId, serviceId: serviceId} /* attributes: default */ }),
        metabolism.Service
            .find({ where: {serviceId: serviceId}                 /* attributes: default */ }),
        metabolism.Brainwave
            .find({ where: {brainwaveId: brainwaveId}                 /* attributes: default */ })
    ])
    .spread(function(signalPathway, service, brainwave) {
        if (signalPathway)
            throw new Blockages.ConflictError('Service signalPathway already exists');
        else if (!service)
            throw new Blockages.NotFoundError('Service not found');
        else if (service.serviceType & ServiceType.ENUM.DICTIONARY.value === 0)
            throw new Blockages.BadRequestError('Service is not a dictionary service');
        else if (!brainwave)
            throw new Blockages.NotFoundError('Brainwave not found');

        var newSignalPathway = {
          /*signalPathwayId: 			    0,*/
          /*signalPheromone:         	            null,*/
          /*signalPheromoneExpiration:    	    null,*/
          /*reinforcementSignalPheromone:           null,*/
          /*reinforcementSignalPheromoneExpiration: null,*/
          /*optional:       			    null,*/
          /*lifeId:         		            null,*/
            brainwaveId:     	 		    brainwave.brainwaveId,
            serviceId:      			    service.serviceId
        }; 

        return metabolism.ServiceSignalPathway.create(newSignalPathway);
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

// /brainwave/:id/stakeholderMember
// --- add a stakeholder member to an existing brainwave (:id)
router.post('/:id/stakeholderMember', function(req, res) {
    debug('[POST] /brainwave/:id/stakeholderMember');
    var brainwaveId = req.params.id;
    var lifeId = req.body.lifeId;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.sequelize.Promise.all([
        metabolism.Brainwave
            .find({
                where: {brainwaveId: brainwaveId},
                attributes: brainwaveAttributes
            }),
        metabolism.Life
            .find({
                where: {lifeId: lifeId},
                attributes: lifeAttributes
            })
    ])
    .spread(function(brainwave, life) {
        if (!brainwave)
            throw new Blockages.NotFoundError('Brainwave not found');
        else if (!life)
            throw new Blockages.NotFoundError('Life not found');

        var newStakeholderMember = {
          /*stakeholderId: 0,*/
            immunities:    validate.toInt(req.body.immunities),
            lifeId:        life.lifeId,
            brainwaveId:        brainwave.brainwaveId
          /*instanceId:    null*/
        };

        return metabolism.BrainwaveStakeholder.create(newStakeholderMember);
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

// /brainwave/:id/instance
// --- add a instance to an existing brainwave (:id)
router.post('/:id/instance', function(req, res) {
    debug('[POST] /brainwave/:id/instance');
    var brainwaveId = req.params.id;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Brainwave
        .find({
            where: {brainwaveId: brainwaveId},
            attributes: brainwaveAttributes
        }).bind({})
        .then(function(brainwave) {
            if (!brainwave)
                throw new Blockages.NotFoundError('Brainwave not found');

            // Extract 'constructiveInterference' from the body
            var constructiveInterference = null;
            if (req.body.hasOwnProperty('constructiveInterference'))
                constructiveInterference = metabolism.BrainwaveInstance.extractConstructiveInterferenceitude(metabolism, req.body.constructiveInterference);

            // Extract 'destructiveInterference' from the body
            var destructiveInterference = null;
            if (req.body.hasOwnProperty('destructiveInterference'))
                destructiveInterference = metabolism.BrainwaveInstance.extractDestructiveInterferencegitude(metabolism, req.body.destructiveInterference);

            var newInstance = {
              /*instanceId:   		   0,*/
                major:        		   0,
                constructiveInterference:  constructiveInterference,
                destructiveInterference:   destructiveInterference,
              /*name:         	           null,*/
              /*website:     		   null,*/
              /*brainwaveType:     		   null,*/
              /*countryCode:  		   null,*/
                brainwaveId:       		   brainwave.brainwaveId
              /*fieldId: 		   null*/
            };

            return metabolism.BrainwaveInstance.create(newInstance);
        })
        .then(function(instance) {
            this.instance = instance;

            var id = instance.calculateFieldId();
            return metabolism.BrainwaveField.find({ where: {fieldId: id} });
        })
        .then(function(field) {
            if (!field)
                throw new Blockages.NotFoundError('Field to associate with instance not found');

            return field.addInstance(this.instance);
        })
        .then(function() {
            this.instance.calculateAndSetMajor();

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

// /brainwave/:id/instance/:instanceId/address
// --- add an address to an existing instance (:instanceId) of brainwave (:id)
router.post('/:id/instance/:instanceId/address', function(req, res) {
    debug('[POST] /brainwave/:id/instance/:instanceId/address');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveInstance
        .find({
            where: {
                instanceId: instanceId,
                brainwaveId: brainwaveId
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
              /*brainwaveId:           null,*/
                instanceId:       instance.instanceId
              /*serviceId:           null,*/
              /*chargeBrainwaveId:     null,*/
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

// /brainwave/:id/instance/:instanceId/phone
// --- add a phone number to an existing instance (:instanceId) of brainwave (:id)
router.post('/:id/instance/:instanceId/phone', function(req, res) {
    debug('[POST] /brainwave/:id/instance/:instanceId/phone');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveInstance
        .find({
            where: {
                instanceId: instanceId,
                brainwaveId: brainwaveId
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
              /*brainwaveId:           null,*/
                instanceId:       instance.instanceId
              /*serviceId:           null,*/
              /*chargeBrainwaveId:     null,*/
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

// /brainwave/:id/instance/:instanceId/stakeholderMember
// --- add a stakeholder member to an existing instance (:instanceId) of brainwave (:id)
router.post('/:id/instance/:instanceId/stakeholderMember', function(req, res) {
    debug('[POST] /brainwave/:id/instance/:instanceId/stakeholderMember');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;
    var lifeId     = req.body.lifeId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.sequelize.Promise.all([
        metabolism.Brainwave
            .find({
                where: {brainwaveId: brainwaveId},
                attributes: brainwaveAttributes
            }),
        metabolism.BrainwaveInstance
            .find({
                where: {instanceId: instanceId, brainwaveId: brainwaveId},
                attributes: instanceAttributes
            }),
        metabolism.Life
            .find({
                where: {lifeId: lifeId},
                attributes: lifeAttributes
            })
    ])
    .spread(function(brainwave, instance, life) {
        if (!brainwave)
            throw new Blockages.NotFoundError('Brainwave not found');
        else if (!instance)
            throw new Blockages.NotFoundError('Instance not found');
        else if (!life)
            throw new Blockages.NotFoundError('Life not found');

        var newStakeholderMember = {
          /*stakeholderId: 0,*/
            immunities:    validate.toInt(req.body.immunities),
            lifeId:        life.lifeId,
            brainwaveId:        brainwave.brainwaveId,
            instanceId:    instance.instanceId
        };

        return metabolism.BrainwaveStakeholder.create(newStakeholderMember);
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

// /brainwave/:id/instance/:instanceId/device
// --- add a device to an existing brainwave instance (:instanceId) of brainwave (:id)
router.post('/:id/instance/:instanceId/device', function(req, res) {
    debug('[POST] /brainwave/:id/instance/:instanceId/device');
    var brainwaveId     = req.params.id;
    var instanceId = req.params.instanceId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelManager, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.BrainwaveInstance
        .find({
            where: {
                instanceId: instanceId,
                brainwaveId: brainwaveId
            },
            attributes: instanceAttributes
        }).bind({})
        .then(function(instance) {
            if (!instance)
                throw new Blockages.NotFoundError('Instance not found');

            // Extract 'acceptsCash' from the body
            var acceptsCash = false;
            if (req.body.hasOwnProperty('acceptsCash'))
                acceptsCash = metabolism.BrainwaveDevice.extractAcceptsCash(metabolism, req.body.acceptsCash);

            // Extract 'acceptsCredit' from the body
            var acceptsCredit = false;
            if (req.body.hasOwnProperty('acceptsCredit'))
                acceptsCredit = metabolism.BrainwaveDevice.extractAcceptsCredit(metabolism, req.body.acceptsCredit);

            var newDevice = {
              /*deviceId:      0,*/
                minor:         0,
                type:          validate.trim(validate.toString(req.body.type)).toUpperCase(),
                serialNumber:  validate.trim(validate.toString(req.body.serialNumber)),
                description:   metabolism.BrainwaveDevice.extractDescription(metabolism, req.body.textDescription),
                acceptsCash:   acceptsCash,
                acceptsCredit: acceptsCredit,
                instanceId:    instance.instanceId
            };

            return metabolism.BrainwaveDevice.create(newDevice);
        })
        .then(function(device) {
            this.device = device;

            return metabolism.BrainwaveDevice.max('minor', { where: {instanceId: device.instanceId} });
        })
        .then(function(minorMax) {
            var minor = 0;
            for (var i = 0; i < devices.length; i++)
                if (minor < devices[i].minor)
                    minor = devices[i].minor;

            this.device.minor = minorMax + 1;
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
// /brainwave/:id
// --- delete an existing brainwave (:id)
router.delete('/:id', function(req, res) {
    debug('[DELETE] /brainwave/:id');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /brainwave/:id/media/:type
// --- delete an media of an existing brainwave (:id)
router.delete('/:id/media/:type', function(req, res) {
    debug('[DELETE] /brainwave/:id/media/:type');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /brainwave/:id/address/:addressId
// --- delete an address (:addressId) of an existing brainwave (:id)
router.delete('/:id/address/:addressId', function(req, res) {
    debug('[DELETE] /brainwave/:id/address/:addressId');
    var brainwaveId = req.params.id;
    var addressId  = req.params.addressId;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .find({
            where: {
                addressId: addressId,
                brainwaveId: brainwaveId
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

// /brainwave/:id/phone/:phoneId
// --- delete a phone number (:phoneId) of an existing brainwave (:id)
router.delete('/:id/phone/:phoneId', function(req, res) {
    debug('[DELETE] /brainwave/:id/phone/:phoneId');
    var brainwaveId = req.params.id;
    var phoneId    = req.params.phoneId;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelAdminStakeholder, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .find({
            where: {
                phoneId: phoneId,
                brainwaveId: brainwaveId
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

// /brainwave/:id/signalPathway/:signalPathwayId
// --- delete a signalPathway (:signalPathwayId) for a brainwave (:id) of an existing service
router.delete('/:id/signalPathway/:signalPathwayId', function(req, res) {
    debug('[DELETE] /brainwave/:id/signalPathway/:signalPathwayId');
    var brainwaveId     = req.params.id;
    var signalPathwayId = req.params.signalPathwayId;

    if (!Immunities.verifyNoRejectionFromBrainwave(brainwaveId, Immunities.AuthLevelManager, false, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.ServiceSignalPathway
        .find({
            where: {signalPathwayId: signalPathwayId,
                    brainwaveId: brainwaveId}
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

// /brainwave/:id/stakeholderMember/:lifeId
// --- delete stakeholder member (:lifeId) of an existing brainwave (:id)
router.delete('/:id/stakeholderMember/:lifeId', function(req, res) {
    debug('[DELETE] /brainwave/:id/stakeholderMember/:lifeId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /brainwave/:id/instance/:instanceId
// --- delete an existing instance (:instanceId) of brainwave (:id)
router.delete('/:id/instance/:instanceId', function(req, res) {
    debug('[DELETE] /brainwave/:id/instance/:instanceId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /brainwave/:id/instance/:instanceId/address/:addressId
// --- delete an address (:addressId) of an existing instance (:instanceId) of brainwave (:id)
router.delete('/:id/instance/:instanceId/address/:addressId', function(req, res) {
    debug('[DELETE] /brainwave/:id/instance/:instanceId/address/:addressId');
    var brainwaveId = req.params.id;
    var instanceId = req.params.instanceId;
    var addressId  = req.params.addressId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelManager, false, false, res.locals.lifePacket))
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

// /brainwave/:id/instance/:instanceId/phone/:phoneId
// --- delete a phone number (:phoneId) of an existing instance (:instanceId) of brainwave (:id)
router.delete('/:id/instance/:instanceId/phone/:phoneId', function(req, res) {
    debug('[DELETE] /brainwave/:id/instance/:instanceId/phone/:phoneId');
    var brainwaveId = req.params.id;
    var instanceId = req.params.instanceId;
    var phoneId    = req.params.phoneId;

    if (!Immunities.verifyNoRejectionFromBrainwaveInstance(brainwaveId, instanceId, Immunities.AuthLevelManager, false, false, res.locals.lifePacket))
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

// /brainwave/:id/instance/:instanceId/stakeholderMember/:lifeId
// --- delete stakeholder member (:lifeId) at instance level of an existing instance (:instanceId) of brainwave (:id)
router.put('/:id/instance/:instanceId/stakeholderMember/:lifeId', function(req, res) {
    debug('[DELETE] /brainwave/:id/instance/:instanceId/stakeholderMember/:lifeId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /brainwave/:id/instance/:instanceId/device/:deviceId
// --- delete a device (:deviceId) of an existing instance (:instanceId) of brainwave (:id)
router.delete('/:id/instance/:instanceId/device/:deviceId', function(req, res) {
    debug('[DELETE] /brainwave/:id/instance/:instanceId/device/:deviceId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// -----------------------------------------------------------------------------
// CATCH-ALL ROUTES (error)
// -----------------------------------------------------------------------------
// /brainwave/*
// --- Any get route request not handled is caught with this route
router.get('/*', function(req, res) {
    debug('[GET] /brainwave/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /brainwave/*
// --- Any put route request not handled is caught with this route
router.put('/*', function(req, res) {
    debug('[PUT] /brainwave/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /brainwave/*
// --- Any post route request not handled is caught with this route
router.post('/*', function(req, res) {
    debug('[POST] /brainwave/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /brainwave/*
// --- Any delete route request not handled is caught with this route
router.delete('/*', function(req, res) {
    debug('[DELETE] /brainwave/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});
