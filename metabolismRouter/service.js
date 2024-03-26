'use strict';

// service.js (routes)

// Dependency packages
var debug   = require('debug')('munch:routes:Service');
var verbose = require('debug')('munch:verbose:routes:Service');
var express = require('express');
var mv      = require('mv');

// Local js modules
var Middlewares  = require('./middlewares');
var metabolism   = require('../../models/database');
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
// Service OAuth2 Authorization Callback
// TODO: place proper restrictions to auth callback to verify sender
// /service/:id/auth/callback
// --- OAuth2 authorization callback handler (correctly uses state query field)
router.get('/:id/auth/callback', function(req, res) {
    debug('[GET] /service/:serviceId/auth/callback');
    var serviceId     = req.params.id;
    var lifeId     = null;
    var brainwaveId     = null;
    var stateType  = req.query.state.substring(0, 1);
    var stateId    = parseInt(req.query.state.substring(1), 10);
    if (stateType === 'l') {
        lifeId = stateId;
    }
    else if (stateType === 'c') {
        brainwaveId = stateId;
    }

    var executions = [];
    executions.push(metabolism.Service.find({ where: {serviceId: serviceId} /* attributes: default */ }) );

    // If lifeId and brainwaveId are both defined or undefined/null, throw error.
    if (!!lifeId === !!brainwaveId) {
        throw new Blockages.BadRequestError('Invalid authorization callback request');
    }
    // Otherwise, execute queries for the ID that is not undefined/null.
    else {
        if (!!lifeId) {
            executions.push(metabolism.ServiceSignalPathway
                .find({ where: {lifeId: lifeId, serviceId: serviceId} /* attributes: default */ }));
            executions.push(metabolism.Life
                .find({ where: {lifeId: lifeId}                 /* attributes: default */ }));
            executions.push(metabolism.sequelize.Promise.resolve(null));
        }
        else if (!!brainwaveId) {
            executions.push(metabolism.ServiceSignalPathway
                .find({ where: {brainwaveId: brainwaveId, serviceId: serviceId} /* attributes: default */ }));
            executions.push(metabolism.sequelize.Promise.resolve(null));
            executions.push(metabolism.Brainwave
                .find({ where: {brainwaveId: brainwaveId}                 /* attributes: default */ }));
        }
    }

    metabolism.sequelize.Promise.all(executions)
    .bind({})
    .spread(function(service, signalPathway, life, brainwave) {
        if (signalPathway)
            throw new Blockages.ConflictError('Service signalPathway already exists');
        else if (!service)
            throw new Blockages.NotFoundError('Service not found');
        else if (!!lifeId && !life)
            throw new Blockages.NotFoundError('Life not found');
        else if (!!brainwaveId && !brainwave)
            throw new Blockages.NotFoundError('Brainwave not found');

        this.service = service;

        var serviceAPI = new Services[service.serviceName.toString()]();
        return serviceAPI.authenticateCallback(req.query.code, req.headers.host + '/v1', lifeId, brainwaveId);
    })
    .then(function(newSignalPathway) {
      /*newSignalPathway.signalPathwayId: 0,*/
      /*newSignalPathway.signalPheromone:                        set by serviceAPI*/
      /*newSignalPathway.signalPheromoneExpiration:              set by serviceAPI*/
      /*newSignalPathway.reinforcementSignalPheromone:           set by serviceAPI*/
      /*newSignalPathway.reinforcementSignalPheromoneExpiration: set by serviceAPI*/
      /*newSignalPathway.optional:                               set by serviceAPI*/
        newSignalPathway.lifeId                                  = lifeId;
        newSignalPathway.brainwaveId                                  = brainwaveId;
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
var attributesServiceSetting       = [ /*'serviceId',*/      'host', 'apiHost', 'sanmetabolismoxHost', 'scope', 'signupPath', 'authenticatePath', 'refreshPath', 'balancePath', 'sendPath', 'requestPath', 'deauthenticatePath' ];
var attributesServiceStakeholder   = [ 'stakeholderId',   'immunities', 'serviceId', 'lifeId' ];
var attributesServiceSignalPathway = [ 'signalPathwayId', 'lifeId', 'brainwaveId' ];

// Remove fields from metabolism.Service: deletedAt
var serviceAttributes = [ 'serviceId', 'verified', 'serviceType', 'serviceName', 'companyName', 'website', 'countryCode', 'supportEmail', 'supportEmailVerified', 'supportWebsite', 'supportVersion', 'createdAt', 'updatedAt' ];

// Remove fields from metabolism.Life: phoneVerified, emailVerified, receiptEmail, receiptEmailVerified, referralCode, voiceprintHash, voiceprintExpiration, gutIdHash, createdAt, updatedAt, deletedAt
var lifeAttributes = [ 'lifeId', 'phone', 'email', 'givenName', 'middleName', 'familyName', 'countryCode' ];

var includeAddress           = { model: metabolism.Address,           as: 'Address',            attributes: attributesAddress };
var includePhone             = { model: metabolism.Phone,             as: 'Phones',             attributes: attributesPhone };
var includeServiceSetting       = { model: metabolism.ServiceSetting,       as: 'Settings',           attributes: attributesServiceSetting };
var includeServiceStakeholder   = { model: metabolism.ServiceStakeholder,   as: 'StakeholderMembers', attributes: attributesServiceStakeholder };
var includeServiceSignalPathway = { model: metabolism.ServiceSignalPathway, as: 'SignalPathways',     attributes: attributesServiceSignalPathway };

//  serviceIncludesAll  = [ includeAddress, includePhone, includeServiceSetting, includeServiceStakeholder, includeServiceSignalPathway ];
var serviceIncludesService = [ includeAddress, includePhone, includeServiceSetting, includeServiceStakeholder, includeServiceSignalPathway ];

// -----------------------------------------------------------------------------
// GET ROUTES
// -----------------------------------------------------------------------------
// /service/:id
// --- retrieve info for service (:id)
router.get('/:id', function(req, res) {
    debug('[GET] /service/:id');
    var serviceId = req.params.id;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelStakeholder, true, true, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Service
        .find({
            where: {serviceId: serviceId},
            include: serviceIncludesService,
            attributes: serviceAttributes
        })
        .then(function(service) {
            if (!service)
                throw new Blockages.NotFoundError('Service not found');

            res.status(200).send(Blockages.respMsg(res, true, service.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// TODO: determine different media types and types to expand uses
var sendServiceMedia = function(res, serviceId, type) {
    var mediaTypes = [ '.png', '.wav', '.mov', '.fasta' ];

    if (!validate.isIn(type, mediaTypes))
        return res.status(400).send(Blockages.respMsg(res, false, 'Media type not recognized'));

    var mediaFile = 'media-name' + type;
    var mediaPath = res.app.locals.rootDir + '/medias/service/' + serviceId + '/';
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

// /service/:id/media (default type)
// --- retrieve service media (logo) for service (:id)
router.get('/:id/media', function(req, res) {
    debug('[GET] /service/:id/media');
    var serviceId = req.params.id;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelStakeholder, true, true, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    sendServiceMedia(res, serviceId);
});

// /service/:id/media/:type (all supported types)
// --- retrieve service media (logo) for service (:id)
router.get('/:id/media/:type', function(req, res) {
    debug('[GET] /service/:id/media/:type');
    var serviceId = req.params.id;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    sendServiceMedia(res, serviceId, req.params.type);
});

// /service/:id/address
// --- retrieve the address for service (:id)
router.get('/:id/address', function(req, res) {
    debug('[GET] /service/:id/address');
    var serviceId = req.params.id;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .find({
            where: {serviceId: serviceId},
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

// /service/:id/phones
// --- retrieve array of phone numbers for service (:id)
router.get('/:id/phones', function(req, res) {
    debug('[GET] /service/:id/phones');
    var serviceId = req.params.id;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .findAll({
            where: {serviceId: serviceId},
            attributes: attributesPhone
        })
        .then(function(phones) {
            res.status(200).send(Blockages.respMsg(res, true, phones));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// /service/:id/signalPathways
// --- retrieve array of signalPathways for service (:id)
router.get('/:id/signalPathways', function(req, res) {
    debug('[GET] /service/:id/signalPathways');
    var serviceId = req.params.id;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.ServiceSignalPathway
        .findAll({
            where: {serviceId: serviceId},
            attributes: attributesServiceSignalPathway
        })
        .then(function(signalPathways) {
            res.status(200).send(Blockages.respMsg(res, true, signalPathways));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// /service/:id/signalPathway/:signalPathwayId
// --- retrieve info on signalPathway (:signalPathwayId) for service (:id)
router.get('/:id/signalPathway/:signalPathwayId', function(req, res) {
    debug('[GET] /service/:id/signalPathway/:signalPathwayId');
    var serviceId          = req.params.id;
    var signalPathwayId = req.params.signalPathwayId;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.ServiceSignalPathway
        .find({
            where: {
                signalPathwayId: signalPathwayId,
                serviceId: serviceId
            },
            attributes: attributesServiceSignalPathway
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

// /service/:id/stakeholder
// --- retrieve array of stakeholder (all members) for service (:id)
router.get('/:id/stakeholder', function(req, res) {
    debug('[GET] /service/:id/stakeholder');
    var serviceId = req.params.id;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.ServiceStakeholder
        .findAll({
            where: {serviceId: serviceId},
            attributes: attributesServiceStakeholder
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

// /service/:id/stakeholderMember/:lifeId
// --- retrieve immunity info on stakeholder member (:lifeId) for service (:id)
router.get('/:id/stakeholderMember/:lifeId', function(req, res) {
    debug('[GET] /service/:id/stakeholderMember/:lifeId');
    var serviceId = req.params.id;
    var lifeId = req.params.lifeId;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.ServiceStakeholder
        .find({
            where: {
                lifeId: lifeId,
                serviceId: serviceId
            },
            attributes: attributesServiceStakeholder
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

// /service/:id/cycles
// --- retrieve array of cycles for service (:id)
router.get('/:id/cycles', function(req, res) {
    debug('[GET] /service/:id/cycles');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /service/:id/cycle/:cycleId
// --- retrieve info on cycle (:cycleId) for service (:id)
router.get('/:id/cycle/:cycleId', function(req, res) {
    debug('[GET] /service/:id/cycle/:cycleId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /service/type/search?s=[searchString]&t=[serviceType]
// --- retrieve array of services with given search criteria
router.get('/type/search', function(req, res) {
    debug('[GET] /service/type/search?');
    var searchString      = req.query.s;
    var serviceTypeString = validate.toString(req.query.t).toLowerCase();

    // No immunity level necessary for this route; all are allowed access
    // after token has been verified.

    metabolism.Service
        .findAll({
            where:
                metabolism.Sequelize.and(
                    {serviceId: {$gte: 1000}},
                    metabolism.Sequelize.or(
                        { serviceName: {like: '%' + searchString + '%'} },
                        { companyName: {like: '%' + searchString + '%'} }
                    )
                ),
            attributes: serviceAttributes
        })
        .then(function(services) {
            var filteredServices = [];

            if (validate.equals(serviceTypeString, ServiceType.ENUM.ALL.text))
                filteredServices = services;
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

                for (var i = 0; i < services.length; i++) {
                    if (services[i].serviceType & serviceSelector)
                        filteredServices.push(services[i]);
                }
            }

            res.status(200).send(Blockages.respMsg(res, true, filteredServices));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// PUT ROUTES
// -----------------------------------------------------------------------------
// /service/:id
// --- update info for service (:id)
router.put('/:id', function(req, res) {
    debug('[PUT] /service/:id');
    var serviceId = req.params.id;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Service
        .find({
            where: {serviceId: serviceId},
            attributes: serviceAttributes
        })
        .then(function(service) {
            if (!service)
                throw new Blockages.NotFoundError('Service not found');

            // If the supportEmail has changed, set supportEmailVerified to false
            var supportEmail = metabolism.Service.extractSupportEmail(req.body.supportEmail);
            if (!validate.equals(supportEmail, service.supportEmail))
                service.suportEmailVerified = false;

          /*service.serviceId: not accessible for change */
            service.serviceType              = validate.toInt(req.body.serviceType);
            service.serviceName              = validate.trim(validate.toString(req.body.serviceName));
            service.companyName           = metabolism.Service.extractCompanyName(metabolism, req.body.companyName);
            service.website               = metabolism.Service.extractWebsite(metabolism, req.body.website);
          /*service.countryCode:          not accessible for change */
            service.supportEmail          = supportEmail;
          /*service.supportEmailVerified: set above */
            service.supportWebsite        = metabolism.Service.extractSupportWebsite(req.body.supportWebsite);
            service.supportVersion        = metabolism.Service.extractSupportVersion(req.body.supportVersion);

            return service.save();
        })
        .then(function(service) {
            res.status(200).send(Blockages.respMsg(res, true, service.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /service/:id/address/:addressId
// --- update main address (:addressId) for service (:id)
router.put('/:id/address/:addressId', function(req, res) {
    debug('[PUT] /service/:id/address/:addressId');
    var serviceId    = req.params.id;
    var addressId = req.params.addressId;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Address
        .find({
            where: {
                addressId: addressId,
                serviceId: serviceId
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

// /service/:id/phone/:phoneId
// --- update phone number (:phoneId) for service (:id)
router.put('/:id/phone/:phoneId', function(req, res) {
    debug('[PUT] /service/:id/phone/:phoneId');
    var serviceId  = req.params.id;
    var phoneId = req.params.phoneId;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Phone
        .find({
            where: {
                phoneId: phoneId,
                serviceId: serviceId
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

// /service/:id/stakeholderMember/:lifeId
// --- update stakeholder member (:lifeId) for service (:id)
// TODO: Expand functionality to ensure there is always at least one admin account for the service
router.put('/:id/stakeholderMember/:lifeId', function(req, res) {
    debug('[PUT] /service/:id/stakeholderMember/:lifeId');
    var serviceId = req.params.id;
    var lifeId = req.params.lifeId;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.ServiceStakeholder
        .find({
            where: {
                lifeId: lifeId,
                serviceId: serviceId
            },
            attributes: attributesServiceStakeholder
        })
        .then(function(stakeholderMember) {
            if (!stakeholderMember)
                throw new Blockages.NotFoundError('Stakeholder member not found');

          /*stakeholderMember.stakeholderId: not accessible for change */
            stakeholderMember.immunities     = validate.toInt(req.body.immunities);
          /*stakeholderMember.lifeId:        not accessible for change */
          /*stakeholderMember.serviceId:        not accessible for change */

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
// /service/signup
// --- create a new service
router.post('/signup', function(req, res) {
    debug('[POST] /service/signup');
    // Create the service record
    var newService = {
      /*serviceId:               0,*/
        serviceType:             validate.toInt(req.body.serviceType),
        serviceName:             validate.trim(validate.toString(req.body.serviceName)),
        companyName:          metabolism.Service.extractCompanyName(metabolism, req.body.companyName),
        website:              metabolism.Service.extractWebsite(metabolism, req.body.website),
        countryCode:          CountryCodes.ENUM.USA.abbr,
        supportEmail:         metabolism.Service.extractSupportEmail(req.body.supportEmail),
      /*supportEmailVerified: false,*/
        supportWebsite:       metabolism.Service.extractSupportWebsite(req.body.supportWebsite),
        supportVersion:       metabolism.Service.extractSupportVersion(req.body.supportVersion)
    };

    metabolism.Service.create(newService).bind({})
        .then(function(service) {
            this.service = service;
            var newSettings = { serviceId: service.serviceId };

            // Create service stakeholder record to make the life an admin
            var newStakeholder = {
              /*stakeholderId: 0,*/
                immunities:    Immunities.AuthLevelAdminStakeholder,
                lifeId:        res.locals.lifePacket.life.lifeId,
                serviceId:        service.serviceId
            };

            return metabolism.sequelize.Promise.all([
                metabolism.ServiceStakeholder.create(newStakeholder),
                metabolism.ServiceSettings.create(newSettings)
            ]);
        })
        .spread(function(stakeholderMember, settings) {
            res.status(201).send(Blockages.respMsg(res, true, this.service.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /service/:id/media
// --- add an media to an existing service (:id)
router.post('/:id/media', function(req, res) {
    debug('[POST] /service/:id/media');
    var serviceId = req.params.id;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Service
        .find({
            where: {serviceId: serviceId},
            attributes: serviceAttributes
        })
        .then(function(service) {
            if (!service)
                throw new Blockages.NotFoundError('Service not found');

            // Validate 'media' format
            // TODO: restrict media format to PNG
            // TODO: restrict media type to  200x200 (??)
            var mediaPath = req.files.media.path;
            if (validate.equals(req.files.media.name, ''))
                throw new Blockages.BadRequestError('Media is required');

            // Move the media into the directory associated with the service
            var mediaDir = 'medias/service/' + service.serviceId + '/';
            mv(mediaPath, mediaDir + 'life-media.extension', {mkdirp: true}, function(error) {
                if (error)
                    throw error;
                else
                    res.status(201).send(Blockages.respMsg(res, true, service));
            });
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /service/:id/address
// --- add an address to an existing service (:id)
router.post('/:id/address', function(req, res) {
    debug('[POST] /service/:id/address');
    var serviceId = req.params.id;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Service
        .find({
            where: {serviceId: serviceId},
            include: includeAddress,
            attributes: serviceAttributes
        })
        .then(function(service) {
            if (!service)
                throw new Blockages.NotFoundError('Service not found');
            else if (service.Address !== null)
                throw new Blockages.ConflictError('Service already has an address');

            var newAddress = {
              /*addressId:        0,*/
                name:             '$$_service',
                address1:         validate.trim(validate.toString(req.body.address1)),
                address2:         metabolism.Address.extractAddress(metabolism, req.body.address2),
                address3:         metabolism.Address.extractAddress(metabolism, req.body.address3),
                address4:         metabolism.Address.extractAddress(metabolism, req.body.address4),
                locality:         validate.trim(validate.toString(req.body.locality)),
                region:           validate.trim(validate.toString(req.body.region)),
                postalCode:       validate.trim(validate.toString(req.body.postalCode)),
              /*lifeId:           null,*/
              /*brainwaveId:           null,*/
              /*instanceId:       null,*/
                serviceId:           service.serviceId,
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

// /service/:id/phone
// --- add a phone number to an existing service (:id)
router.post('/:id/phone', function(req, res) {
    debug('[POST] /service/:id/phone');
    var serviceId = req.params.id;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Service
        .find({
            where: {serviceId: serviceId},
            attributes: serviceAttributes
        })
        .then(function(service) {
            if (!service)
                throw new Blockages.NotFoundError('Service not found');

            var newPhone = {
              /*phoneId:          0,*/
                name:             metabolism.Phone.extractName(metabolism, req.body.name),
                number:           validate.trim(validate.toString(req.body.number)),
                extension:        metabolism.Phone.extractExtension(metabolism, req.body.extension),
              /*lifeId:           null,*/
              /*brainwaveId:           null,*/
              /*instanceId:       null,*/
                serviceId:           service.serviceId
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

// /service/:id/stakeholderMember
// --- add a stakeholder member to an existing service (:id)
router.post('/:id/stakeholderMember', function(req, res) {
    debug('[POST] /service/:id/stakeholderMember');
    var serviceId = req.params.id;
    var lifeId = req.body.lifeId;

    if (!Immunities.verifyNoRejectionFromService(serviceId, Immunities.AuthLevelAdminStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.sequelize.Promise.all([
        metabolism.Service
            .find({
                where: {serviceId: serviceId},
                attributes: serviceAttributes
            }),
        metabolism.Life
            .find({
                where: {lifeId: lifeId},
                attributes: lifeAttributes
            })
    ])
    .spread(function(service, life) {
        if (!service)
            throw new Blockages.NotFoundError('Service not found');
        else if (!life)
            throw new Blockages.NotFoundError('Life not found');

        var newStakeholderMember = {
          /*stakeholderId: 0,*/
            immunities:    validate.toInt(req.body.immunities),
            lifeId:        life.lifeId,
            serviceId:        service.serviceId
        };

        return metabolism.ServiceStakeholder.create(newStakeholderMember);
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
// /service/:id
// --- delete an existing service (:id)
router.delete('/:id', function(req, res) {
    debug('[DELETE] /service/:id');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /service/:id/media/:type
// --- delete an media of an existing service (:id)
router.delete('/:id/media/:type', function(req, res) {
    debug('[DELETE] /service/:id/media/:type');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /service/:id/address/:addressId
// --- delete an address (:addressId) of an existing service (:id)
router.delete('/:id/address/:addressId', function(req, res) {
    debug('[DELETE] /service/:id/address/:addressId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /service/:id/phone/:phoneId
// --- delete a phone number (:phoneId) of an existing service (:id)
router.delete('/:id/phone/:phoneId', function(req, res) {
    debug('[DELETE] /service/:id/phone/:phoneId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /service/:id/stakeholderMember/:lifeId
// --- delete stakeholder member (:lifeId) of an existing service (:id)
router.delete('/:id/stakeholderMember/:lifeId', function(req, res) {
    debug('[DELETE] /service/:id/stakeholderMember/:lifeId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// -----------------------------------------------------------------------------
// CATCH-ALL ROUTES (error)
// -----------------------------------------------------------------------------
// /service/*
// --- Any get route request not handled is caught with this route
router.get('/*', function(req, res) {
    debug('[GET] /service/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /service/*
// --- Any put route request not handled is caught with this route
router.put('/*', function(req, res) {
    debug('[PUT] /service/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /service/*
// --- Any post route request not handled is caught with this route
router.post('/*', function(req, res) {
    debug('[POST] /service/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});

// /service/*
// --- Any delete route request not handled is caught with this route
router.delete('/*', function(req, res) {
    debug('[DELETE] /service/*');
    res.status(501).send(Blockages.respMsg(res, false, 'The requested route does not exist'));
});
