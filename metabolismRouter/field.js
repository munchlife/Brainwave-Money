'use strict';

// signal.js (routes)

// Dependency packages
var debug   = require('debug')('munch:routes:Field');
var verbose = require('debug')('munch:verbose:routes:Field');
var express = require('express');

// Local js modules
var Middlewares = require('./middlewares');
var metabolism  = require('../../metabolismLifeModels/database');
var Immunities  = require('../../metabolismConfiguration/immunities');
var Blockages   = require('../../metabolismConfiguration/blockages');

var validate = metabolism.Sequelize.Validator;

var router = module.exports = express.Router();

// -----------------------------------------------------------------------------
// TOKEN AUTHENTICATION MIDDLEWARE
// -----------------------------------------------------------------------------
router.use(Middlewares.tokenAuth);

// -----------------------------------------------------------------------------
// GET CELL FIELDS
// -----------------------------------------------------------------------------
// /fields
// --- retrieve array of all active cell fields (UUIDs)
router.get('/fields', function(req, res) {
    debug('[GET] /fields');
    // No immunity level necessary for this route; all are allowed access
    // after token has been verified.

    // TODO: implement use of 'active' column
    metabolism.CellField
        .findAll()
        .then(function(fields) {
            verbose('    fields = ' + fields);
            debug('(200)');
            res.status(200).send(Blockages.respMsg(res, true, fields));
        })
        .catch(function(error) {
            verbose('    error = ' + error);
            debug('(500)');
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// GET CHECKINS
// -----------------------------------------------------------------------------
// /checkin/:field/major/:major
// --- retrieve the current list of life for the instance with identification (:field, :major)
router.get('/checkin/:field/major/:major', function(req, res) {
    debug('[GET] /checkin/:field/major/:major');
    var field = req.params.field;
    var major = req.params.major;

    // TODO: Use Immunities.verifyNoRejectionFromCell() function to verify access

    metabolism.CellCheckin
        .findAll({
            where: {
                field: field,
                major: major
            }
        })
        .then(function(checkins) {
            res.status(200).send(Blockages.respMsg(res, true, checkins));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// /checkin/:field/major/:major/minor/:minor
// --- retrieve the current list of life for the device at instance with identification (:field, :major, :minor)
router.get('/checkin/:field/major/:major/minor/:minor', function(req, res) {
    debug('[GET] /checkin/:field/major/:major/minor/:minor');
    var field = req.params.field;
    var major = req.params.major;
    var minor = req.params.minor;

    // TODO: Use Immunities.verifyNoRejectionFromCell() function to verify access

    metabolism.CellCheckin
        .findAll({
            where: {
                field: field,
                major: major,
                minor: minor
            }
        })
        .then(function(checkins) {
            res.status(200).send(Blockages.respMsg(res, true, checkins));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// CHECKIN OVER DISTANCE
// -----------------------------------------------------------------------------
// /distance/:id/checkin/:field/major/:major/minor/:minor/proximity/:proximity
// --- add life to checkin list for instance associated to inputs (:field, :major, :minor)
router.put('/distance/:id/checkin/:field/major/:major/minor/:minor/proximity/:proximity', function(req, res) {
    debug('[PUT] /distance/:id/checkin/:field/major/:major/minor/:minor/proximity/:proximity');
    var deviceType = 'Distance'; // Extremely Low-Frequency (Distance)
    var lifeId     = req.params.id;
    var field      = validate.trim(validate.toString(req.params.field));
    var major      = validate.toInt(req.params.major);
    var minor      = validate.toInt(req.params.minor);
    var proximity  = validate.toInt(req.params.proximity);

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellCheckin
        // .findOrCreate({
        .findOrInitialize({
            where: {
                field:  field,
                major:  major,
                minor:  minor,
                lifeId: res.locals.lifePacket.life.lifeId
            },
            defaults: {
                proximity:  proximity,
                deviceType: deviceType
            }
        }).bind({})
        .spread(function(checkin, created) {
            this.created = created;

            if (!created) {
                checkin.deviceType = deviceType;
                checkin.proximity  = proximity;
            }

            return checkin.save();
        })
        .then(function(checkin) {
            res.status((this.created) ? 201 : 200).send(Blockages.respMsg(res, true, checkin.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// CHECKIN OVER CONTACT
// -----------------------------------------------------------------------------
// /contact/:id/checkin/:field/major/:major/minor/:minor/proximity/:proximity
// --- add life to checkin list for instance associated to inputs (:field, :major, :minor)
router.put('/contact/:id/checkin/:field/major/:major/minor/:minor/proximity/:proximity', function(req, res) {
    debug('[PUT] /contact/:id/checkin/:field/major/:major/minor/:minor/proximity/:proximity');
    var deviceType = 'Contact'; // Near Field Communication (Contact)
    var contactId  = req.params.id;
    var field      = req.params.field;
    var major      = req.params.major;
    var minor      = req.params.minor;
    var proximity  = req.params.proximity;

    // TODO: Use Immunities.verifyNoRejectionFromLife() function to verify access; 
    //       not sent from life app, comes from cell device/app

    metabolism.LifeDevice
        .find({
            where: {
                type:         deviceType,
                serialNumber: contactId
            }
            // attributes: default
        })
        .then(function(device) {
            if (!device)
                throw new Blockages.NotFoundError('Life device not found');

            return metabolism.CellCheckin
                // .findOrCreate({
                .findOrInitialize({
                    where: {
                        field:  field,
                        major:  major,
                        minor:  minor,
                        lifeId: device.lifeId
                    },
                    defaults: {
                        proximity:  proximity,
                        deviceType: deviceType
                    }
                });
        })
        .spread(function(checkin, created) {
            this.created = created;

            if (!created) {
                checkin.deviceType = deviceType;
                checkin.proximity  = proximity;
            }

            return checkin.save();
        })
        .then(function(checkin) {
            res.status((this.created) ? 201 : 200).send(Blockages.respMsg(res, true, checkin.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});
