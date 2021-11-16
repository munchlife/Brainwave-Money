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
// GET CELL SIGNALS
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
// GET MAPS
// -----------------------------------------------------------------------------
// /signal/:field/atlas/:atlas
// --- retrieve the current list of life for the instance with identification (:field, :atlas)
router.get('/signal/:field/atlas/:atlas', function(req, res) {
    debug('[GET] /signal/:field/atlas/:atlas');
    var field = req.params.field;
    var atlas = req.params.atlas;

    // TODO: Use Immunities.verifyNoRejectionFromCell() function to verify access

    metabolism.CellSignal
        .findAll({
            where: {
                field: field,
                atlas: atlas
            }
        })
        .then(function(signals) {
            res.status(200).send(Blockages.respMsg(res, true, signals));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// /signal/:field/atlas/:atlas/map/:map
// --- retrieve the current list of life for the device at instance with identification (:field, :atlas, :map)
router.get('/signal/:field/atlas/:atlas/map/:map', function(req, res) {
    debug('[GET] /signal/:field/atlas/:atlas/map/:map');
    var field = req.params.field;
    var atlas = req.params.atlas;
    var map   = req.params.map;

    // TODO: Use Immunities.verifyNoRejectionFromCell() function to verify access

    metabolism.CellSignal
        .findAll({
            where: {
                field: field,
                atlas: atlas,
                map:   map
            }
        })
        .then(function(signals) {
            res.status(200).send(Blockages.respMsg(res, true, signals));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// MAP OVER DISTANCE
// -----------------------------------------------------------------------------
// /distance/:id/signalForCellSignal/:field/atlas/:atlas/map/:map/proximity/:proximity
// --- add life to signal list for instance associated to inputs (:field, :atlas, :map)
router.put('/distance/:id/signal/:field/atlas/:atlas/map/:map/proximity/:proximity', function(req, res) {
    debug('[PUT] /distance/:id/signal/:field/atlas/:atlas/map/:map/proximity/:proximity');
    var deviceType = 'Distance'; // Bluetooth Low Energy (Distance)/iBeacon
    var lifeId     = req.params.id;
    var field      = validate.trim(validate.toString(req.params.field));
    var atlas      = validate.toInt(req.params.atlas);
    var map        = validate.toInt(req.params.map);
    var proximity  = validate.toInt(req.params.proximity);

    if (!Immunities.verifyNoRejectionFromLife(lifeId, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellSignal
        // .findOrCreate({
        .findOrInitialize({
            where: {
                field:  field,
                atlas:  atlas,
                map:    map,
                lifeId: res.locals.lifePacket.life.lifeId
            },
            defaults: {
                proximity:  proximity,
                deviceType: deviceType
            }
        }).bind({})
        .spread(function(signal, created) {
            this.created = created;

            if (!created) {
                signal.deviceType = deviceType;
                signal.proximity  = proximity;
            }

            return signal.save();
        })
        .then(function(signal) {
            res.status((this.created) ? 201 : 200).send(Blockages.respMsg(res, true, signal.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// MAP OVER CONTACT
// -----------------------------------------------------------------------------
// /contact/:id/signalForCellSignal/:field/atlas/:atlas/map/:map/proximity/:proximity
// --- add life to signal list for instance associated to inputs (:field, :atlas, :map)
router.put('/contact/:id/signal/:field/atlas/:atlas/map/:map/proximity/:proximity', function(req, res) {
    debug('[PUT] /contact/:id/signal/:field/atlas/:atlas/map/:map/proximity/:proximity');
    var deviceType = 'Contact'; // Near Field Communication (Contact)
    var contactId  = req.params.id;
    var field      = req.params.field;
    var atlas      = req.params.atlas;
    var map        = req.params.map;
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

            return metabolism.CellSignal
                // .findOrCreate({
                .findOrInitialize({
                    where: {
                        field:  field,
                        atlas:  atlas,
                        map:    map,
                        lifeId: device.lifeId
                    },
                    defaults: {
                        proximity:  proximity,
                        deviceType: deviceType
                    }
                });
        })
        .spread(function(signal, created) {
            this.created = created;

            if (!created) {
                signal.deviceType = deviceType;
                signal.proximity  = proximity;
            }

            return signal.save();
        })
        .then(function(signal) {
            res.status((this.created) ? 201 : 200).send(Blockages.respMsg(res, true, signal.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});
