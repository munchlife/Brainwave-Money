'use strict';

// cell-cycle.js (routes)

// Dependency packages
var debug   = require('debug')('munch:routes:Cell:Cycle');
var verbose = require('debug')('munch:verbose:routes:Cell:Cycle');
var express = require('express');

// Local js modules
var metabolism     = require('../../models/database');
var Cycles         = require('../../config/cycle');
var CycleOutsiders = require('../../config/cycleOutsider');
var CycleLives     = require('../../config/cycleLife');
var Immunities     = require('../../config/immunities');
var Genes          = require('../../config/genes');
var Blockages      = require('../../config/blockages');
var CycleType      = require('../../data/cycleTypes');

var validate = metabolism.Sequelize.Validator;

// TODO: incorporate products into cycle sequences throughout for sequence description
var router = module.exports = express.Router();

// -----------------------------------------------------------------------------
// ATTRIBUTE/INCLUDE SETUP
// -----------------------------------------------------------------------------
//  attributesCycleAudit     = [ 'cycleAuditId',    'cycleId', 'messageNumber', 'message', 'createdAt' ];
var attributesCycleSequence  = [ 'cycleSequenceId', 'cycleId', 'productId', 'cycleLifeId', 'position', 'status', 'charge', 'quantity' ];
var attributesCycleLife      = [ 'cycleLifeId',     'cycleId', 'lifeId', 'outsiderId', 'status', 'signalMethod', 'dictionaryGeneId', 'signalingReferenceNumber', 'genomicsGeneId', 'genomicsReferenceNumber', 'communicationsGeneId', 'communicationsReferenceNumber' ];
var attributesOutsider       = [ 'outsiderId',      'givenName', 'familyName', 'phone', 'extension', 'address1', 'address2', 'address3', 'address4', 'locality', 'region', 'postalCode' ];

// Remove fields from metabolism.CellGraph[].Cycle: deletedAt
var cycleAttributes = [ 'cycleId', 'cellType', 'instanceId', 'deviceId', 'stakeholderCreatorId', 'stakeholderDelivererId', 'originGeneId', 'deliveryMethod', 'status', 'distributedCharge', 'taxPercentage', 'subTotal', 'chargeDiscount', 'chargeFee', 'chargeTax', 'chargeTip', 'chargeTotal', 'cycleNotes', 'createdAt', 'updatedAt' ];

// Remove fields from metabolism.CellGraph[].CycleSequence: createdAt, updatedAt, deletedAt
// cycleSequenceAttributes = [ 'cycleSequenceId', 'cycleId', 'productId', 'cycleLifeId', 'position', 'charge', 'quantity' ];

// Remove fields from metabolism.CellGraph[].CycleLife: createdAt, updatedAt, deletedAt
var cycleLifeAttributes = [ 'cycleLifeId', 'cycleId', 'lifeId', 'outsiderId', 'status', 'signalMethod', 'dictionaryGeneId', 'signalingReferenceNumber', 'genomicsGeneId', 'genomicsReferenceNumber', 'communicationsGeneId', 'communicationsReferenceNumber' ];

var includeCycle          = { model: null, as: 'Cycle',     attributes: cycleAttributes };
//  includeCycleAudit     = { model: null, as: 'Audits',    attributes: attributesCycleAudit };
var includeCycleSequence  = { model: null, as: 'Sequences', attributes: attributesCycleSequence };
var includeCycleLife      = { model: null, as: 'Lives',     attributes: attributesCycleLife };

var copyIncludeProperties = function(obj, model) {
    return { model: model, as: obj.as, attributes: obj.attributes};
};

// -----------------------------------------------------------------------------
// GET ROUTES
// -----------------------------------------------------------------------------
// /cell/:id/cycles
// --- retrieve array of cycles for cell (:id)
router.get('/:id/cycles', function(req, res) {
    debug('[GET] /cell/:id/cycles');
    var cellId = req.params.id.toString();

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellGraph[cellId].Cycle
        .findAll({
            attributes: cycleAttributes
        })
        .then(function(cycles) {
            res.status(200).send(Blockages.respMsg(res, true, cycles));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/cycle/:cycleId
// --- retrieve info on cycle (:cycleId) for cell (:id)
router.get('/:id/cycle/:cycleId', function(req, res) {
    debug('[GET] /cell/:id/cycle/:cycleId');
    var cellId  = req.params.id.toString();
    var cycleId = req.params.cycleId;

    verbose('  cellId  = ' + cellId);
    verbose('  cycleId = ' + cycleId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    var tempIncludes = [];
    tempIncludes.push(copyIncludeProperties(includeCycleSequence, metabolism.CellGraph[cellId].CycleSequence));
    tempIncludes.push(copyIncludeProperties(includeCycleLife,     metabolism.CellGraph[cellId].CycleLife));

    metabolism.CellGraph[cellId].Cycle
        .find({
            where: {cycleId: cycleId},
            include: tempIncludes,
            attributes: cycleAttributes
        })
        .then(function(cycle) {
            if (!cycle)
                throw new Blockages.NotFoundError('Cycle not found');

            res.status(200).send(Blockages.respMsg(res, true, cycle.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/cycle/:cycleId/sequences
// --- retrieve array of cycle sequences of cycle (:cycleId) for cell (:id)
router.get('/:id/cycle/:cycleId/sequences', function(req, res) {
    debug('[GET] /cell/:id/cycle/:cycleId/sequences');
    var cellId  = req.params.id.toString();
    var cycleId = req.params.cycleId;

    verbose('  cellId  = ' + cellId);
    verbose('  cycleId = ' + cycleId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellGraph[cellId].CycleSequence
        .findAll({
            where: {cycleId: cycleId},
            attributes: attributesCycleSequence
        })
        .then(function(sequences) {
            res.status(200).send(Blockages.respMsg(res, true, sequences));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/cycle/:cycleId/sequence/:sequenceId
// --- retrieve info on cycle sequence (:sequenceId) of cycle (:cycleId) for cell (:id)
router.get('/:id/cycle/:cycleId/sequence/:sequenceId', function(req, res) {
    debug('[GET] /cell/:id/cycle/:cycleId/sequence/:sequenceId');
    var cellId          = req.params.id.toString();
    var cycleId         = req.params.cycleId;
    var cycleSequenceId = req.params.sequenceId;

    verbose('  cellId      = ' + cellId);
    verbose('  cycleId     = ' + cycleId);
    verbose('  cycleSequenceId = ' + cycleSequenceId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellGraph[cellId].CycleSequence
        .find({
            where: {
                cycleSequenceId: cycleSequenceId,
                cycleId: cycleId
            },
            attributes: attributesCycleSequence
        })
        .then(function(sequence) {
            if (!sequence)
                throw new Blockages.NotFoundError('Cycle sequence not found');

            res.status(200).send(Blockages.respMsg(res, true, sequence.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/cycle/:cycleId/lives
// --- retrieve array of cycle lives of cycle (:cycleId) for cell (:id)
router.get('/:id/cycle/:cycleId/lives', function(req, res) {
    debug('[GET] /cell/:id/cycle/:cycleId/lives');
    var cellId     = req.params.id.toString();
    var cycleId    = req.params.cycleId;

    verbose('  cellId  = ' + cellId);
    verbose('  cycleId = ' + cycleId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellGraph[cellId].CycleLife
        .findAll({
            where: {cycleId: cycleId},
            attributes: attributesCycleLife
        })
        .then(function(lives) {
            res.status(200).send(Blockages.respMsg(res, true, lives));
        })
        .catch(function(error) {
            res.status(500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/cycle/:cycleId/life/:lifeId
// --- retrieve info on cycle life (:lifeId) of cycle (:cycleId) for cell (:id)
router.get('/:id/cycle/:cycleId/life/:lifeId', function(req, res) {
    debug('[GET] /cell/:id/cycle/:cycleId/life/:lifeId');
    var cellId      = req.params.id.toString();
    var cycleId     = req.params.cycleId;
    var cycleLifeId = req.params.lifeId;

    verbose('  cellId      = ' + cellId);
    verbose('  cycleId     = ' + cycleId);
    verbose('  cycleLifeId = ' + cycleLifeId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellGraph[cellId].CycleLife
        .find({
            where: {
                cycleLifeId: cycleLifeId,
                cycleId: cycleId
            },
            attributes: attributesCycleLife
        })
        .then(function(life) {
            if (!life)
                throw new Blockages.NotFoundError('Cycle life not found');

            res.status(200).send(Blockages.respMsg(res, true, life.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/cycle/:cycleId/outsider/:outsiderId
// --- retrieve info on cycle outsider (:outsiderId) of cycle (:cycleId) for cell (:id)
router.get('/:id/cycle/:cycleId/outsider/:outsiderId', function(req, res) {
    debug('[GET] /cell/:id/cycle/:cycleId/outsider/:outsiderId');
    var cellId          = req.params.id.toString();
    var cycleId         = req.params.cycleId;
    var cycleOutsiderId = req.params.outsiderId;

    verbose('  cellId          = ' + cellId);
    verbose('  cycleId         = ' + cycleId);
    verbose('  cycleOutsiderId = ' + cycleOutsiderId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellGraph[cellId].CycleOutsider
        .find({
            where: {
                cycleOutsiderId: cycleOutsiderId,
                cycleId: cycleId
            },
            attributes: attributesOutsider
        })
        .then(function(outsider) {
            if (!outsider)
                throw new Blockages.NotFoundError('Cycle outsider life not found');

            res.status(200).send(Blockages.respMsg(res, true, outsider.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// PUT ROUTES
// -----------------------------------------------------------------------------
// /cell/:id/cycle/:cycleId
// --- update info of cycle (:cycleId) for cell (:id)
router.put('/:id/cycle/:cycleId', function(req, res) {
    debug('[PUT] /cell/:id/cycle/:cycleId');
    var cellId  = req.params.id;
    var cycleId = req.params.cycleId;

    verbose('  cellId  = ' + cellId);
    verbose('  cycleId = ' + cycleId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellGraph[cellId].Cycle
        .find({
            where: {cycleId: cycleId},
            attributes: cycleAttributes
        })
        .then(function(cycle) {
            if (!cycle)
                throw new Blockages.NotFoundError('Cycle not found');

          /*cycle.cycleId:               not accessible for change */
          /*cycle.cellType:              not accessible for change */
          /*cycle.instanceId:            not accessible for change */
          /*cycle.deviceId:              not accessible for change */
            cycle.originGeneId           = metabolism.CellGraph[cellId].Cycle.extractId(metabolism, req.body.originGeneId);
            cycle.stakeholderCreatorId   = metabolism.CellGraph[cellId].Cycle.extractId(metabolism, req.body.stakeholderCreatorId);
            cycle.stakeholderDelivererId = metabolism.CellGraph[cellId].Cycle.extractId(metabolism, req.body.stakeholderDelivererId);
            cycle.deliveryMethod         = validate.trim(validate.toString(req.body.deliveryMethod)).toUpperCase();
          /*cycle.table                  = null */
          /*cycle.status:                not accessible for change */
            cycle.cycleNotes             = metabolism.CellGraph[cellId].Cycle.extractCycleNotes(metabolism, req.body.notes);
            cycle.distributedCharge      = validate.trim(validate.toString(req.body.distributedCharge)).toUpperCase();
          /*cycle.taxPercentage:         not accessible for change */
          /*cycle.subTotal:              not accessible for change */
          /*cycle.chargeDiscount:        not accessible for change */
          /*cycle.chargeFee:             not accessible for change */
          /*cycle.chargeTax:             not accessible for change */
          /*cycle.chargeTip:             not accessible for change */
            cycle.chargeTotal            = validate.toFloat(req.body.chargeTotal);

            return cycle.save();
        })
        .then(function(cycle) {
                res.status(200).send(Blockages.respMsg(res, true, cycle.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/cycle/:cycleId/sequence/:sequenceId
// --- update sequence (:sequenceId) of cycle (:cycleId) for cell (:id)
router.put('/:id/cycle/:cycleId/sequence/:sequenceId', function(req, res) {
    debug('[PUT] /cell/:id/cycle/:cycleId/sequence/:sequenceId');
    var cellId          = req.params.id;
    var cycleId         = req.params.cycleId;
    var cycleSequenceId = req.params.sequenceId;

    verbose('  cellId          = ' + cellId);
    verbose('  cycleId         = ' + cycleId);
    verbose('  cycleSequenceId = ' + cycleSequenceId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellGraph[cellId].CycleSequence
        .find({
            where: {
                cycleSequenceId: cycleSequenceId,
                cycleId: cycleId
            },
            attributes: attributesCycleSequence
        })
        .then(function(sequence) {
            if (!sequence)
                throw new Blockages.NotFoundError('Cycle sequence not found');

          /*sequence.cycleSequenceId:  not accessible for change */
          /*sequence.parentSequenceId: not accessible for change */
          /*sequence.productId:        not accessible for change */
          /*sequence.productName:      not accessible for change */
            sequence.position          = metabolism.CellGraph[cellId].CycleSequence.extractPosition(metabolism, req.body.position);
          /*sequence.status:           not accessible for change */
            sequence.charge            = validate.toFloat(req.body.charge);
          /*sequence.unit:             not accessible for change */
            sequence.quantity          = validate.toFloat(req.body.quantity);
          /*sequence.cycleId:          not accessible for change */
            sequence.cycleLifeId       = metabolism.CellGraph[cellId].CycleSequence.extractId(metabolism, req.body.cycleLifeId);

            return sequence.save();
        })
        .then(function(sequence) {
                res.status(200).send(Blockages.respMsg(res, true, sequence.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/cycle/:cycleId/life/:lifeId
// --- update cycle life (:lifeId) of cycle (:cycleId) for cell (:id)
router.put('/:id/cycle/:cycleId/life/:lifeId', function(req, res) {
    debug('[PUT] /cell/:id/cycle/:cycleId/life/:lifeId');
    var cellId      = req.params.id;
    var cycleId     = req.params.cycleId;
    var cycleLifeId = req.params.lifeId;

    verbose('  cellId      = ' + cellId);
    verbose('  cycleId     = ' + cycleId);
    verbose('  cycleLifeId = ' + cycleLifeId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellGraph[cellId].CycleLife
        .find({
            where: {
                cycleSequenceId: cycleLifeId,
                cycleId: cycleId
            },
            attributes: attributesCycleLife
        })
        .then(function(life) {
            if (!life)
                throw new Blockages.NotFoundError('Cycle life not found');

          /*life.cycleLifeId:              not accessible for change */
          /*life.cycleId:                  not accessible for change */
          /*life.lifeId:                   not accessible for change */
          /*life.outsiderId:               not accessible for change */
          /*life.status:                   not accessible for change */
            life.signalMethod              = validate.trim(validate.toString(req.body.signalMethod)).toUpperCase();
            life.dictionaryGeneId           = metabolism.CellGraph[cellId].CycleLife.extractId(metabolism, req.body.dictionaryGeneId);
          /*life.signalingReferenceNumber: not accessible for change */
          //life.genomicsGeneId             = metabolism.CellGraph[cellId].CycleLife.extractId(metabolism, req.body.genomicsGeneId);
          /*life.genomicsReferenceNumber:   not accessible for change */
          //life.communicationsGeneId             = metabolism.CellGraph[cellId].CycleLife.extractId(metabolism, req.body.communicationsGeneId);
          /*life.communicationsReferenceNumber:   not accessible for change */

            return life.save();
        })
        .then(function(life) {
                res.status(200).send(Blockages.respMsg(res, true, life.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/cycle/:cycleId/outsider/:outsiderId
// --- update cycle outsider (:outsiderId) of cycle (:cycleId) for cell (:id)
router.put('/:id/cycle/:cycleId/outsider/:outsiderId', function(req, res) {
    debug('[PUT] /cell/:id/cycle/:cycleId/outsider/:outsiderId');
    var cellId          = req.params.id;
    var cycleId         = req.params.cycleId;
    var cycleOutsiderId = req.params.outsiderId;

    verbose('  cellId          = ' + cellId);
    verbose('  cycleId         = ' + cycleId);
    verbose('  cycleOutsiderId = ' + cycleOutsiderId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellGraph[cellId].CycleOutsider
        .find({
            where: {
                cycleOutsiderId: cycleOutsiderId,
                cycleId: cycleId
            },
            attributes: attributesOutsider
        })
        .then(function(outsider) {
            if (!outsider)
                throw new Blockages.NotFoundError('Cycle outsider life not found');

          /*outsider.outsiderId: not accessible for change */
            outsider.givenName   = metabolism.CellGraph[cellId].CycleOutsider.extractName(metabolism, req.body.givenName);
            outsider.familyName  = metabolism.CellGraph[cellId].CycleOutsider.extractName(metabolism, req.body.familyName);
            outsider.phone       = metabolism.CellGraph[cellId].CycleOutsider.extractPhone(metabolism, req.body.phone);
            outsider.extension   = metabolism.CellGraph[cellId].CycleOutsider.extractExtension(metabolism, req.body.extension);
            outsider.address1    = metabolism.CellGraph[cellId].CycleOutsider.extractAddress(metabolism, req.body.address1);
            outsider.address2    = metabolism.CellGraph[cellId].CycleOutsider.extractAddress(metabolism, req.body.address2);
            outsider.address3    = metabolism.CellGraph[cellId].CycleOutsider.extractAddress(metabolism, req.body.address3);
            outsider.address4    = metabolism.CellGraph[cellId].CycleOutsider.extractAddress(metabolism, req.body.address4);
            outsider.locality    = metabolism.CellGraph[cellId].CycleOutsider.extractLocality(metabolism, req.body.locality);
            outsider.region      = metabolism.CellGraph[cellId].CycleOutsider.extractRegion(metabolism, req.body.region);
            outsider.postalCode  = metabolism.CellGraph[cellId].CycleOutsider.extractPostalCode(metabolism, req.body.postalCode);

            return outsider.save();
        })
        .then(function(outsider) {
                res.status(200).send(Blockages.respMsg(res, true, outsider.get()));
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
// /cell/:id/cycle
// --- create a new cycle for existing cell (:id)
router.post('/:id/cycle', function(req, res) {
    debug('[POST] /cell/:id/cycle');
    var cellId     = req.params.id;
    var instanceId = req.body.instanceId;

    verbose('  cellId      = ' + cellId);
    verbose('  instanceId  = ' + instanceId);

    if (!Immunities.verifyNoRejectionFromCellInstance(cellId, instanceId, Immunities.AuthLevelStakeholder, false, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.Cell
        .find({
            where: {cellId: cellId},
            // attributes: default
        })
        .then(function(cell) {
            if (!cell)
                throw new Blockages.NotFoundError('Cell not found');

            // TODO: calculate the correct amounts throughout the life of the cycle
            var subTotal           = 0;
            // var chargeDiscount  = 0;
            // var chargeTax       = 0;
            // var chargeFee       = 0;
            // var chargeTip       = 0;

            // Create the cycle record
            var newCycle = {
              /*cycleId:                0,*/
                cellType:               cell.type,
                instanceId:             metabolism.CellGraph[cellId].Cycle.extractId(metabolism, req.body.instanceId),
                deviceId:               metabolism.CellGraph[cellId].Cycle.extractId(metabolism, req.body.deviceId),
                originGeneId:           metabolism.CellGraph[cellId].Cycle.extractId(metabolism, req.body.originGeneId),
                stakeholderCreatorId:   metabolism.CellGraph[cellId].Cycle.extractId(metabolism, req.body.stakeholderCreatorId),
                stakeholderDelivererId: metabolism.CellGraph[cellId].Cycle.extractId(metabolism, req.body.stakeholderDelivererId),
                deliveryMethod:         validate.trim(validate.toString(req.body.deliveryMethod)).toUpperCase(),
              /*table:                  null,*/
                status:                 0, // set status to open
                cycleNotes:             metabolism.CellGraph[cellId].Cycle.extractCycleNotes(metabolism, req.body.notes),
                distributedCharge:      validate.trim(validate.toString(req.body.distributedCharge)).toUpperCase(),
              /*taxPercentage:          null,*/
                subTotal:               subTotal,
                // chargeDiscount:      chargeDiscount,
                // chargeFee:           chargeFee,
                // chargeTax:           chargeTax,
                // chargeTip:           chargeTip,
                chargeTotal:            validate.toFloat(req.body.chargeTotal)
            };

            return metabolism.CellGraph[cellId].Cycle.create(newCycle);
        })
        .then(function(cycle) {
            res.status(201).send(Blockages.respMsg(res, true, cycle.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/cycle/:cycleId/sequence
// --- add an cycle sequence to cycle (:cycleId) for existing cell (:id)
router.post('/:id/cycle/:cycleId/sequence', function(req, res) {
    debug('[POST] /cell/:id/cycle/:cycleId/sequence');
    var cellId  = req.params.id;
    var cycleId = req.params.cycleId;

    verbose('  cellId  = ' + cellId);
    verbose('  cycleId = ' + cycleId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellGraph[cellId].Cycle
        .find({
            where: {cycleId: cycleId},
            attributes: cycleAttributes
        })
        .then(function(cycle) {
            if (!cycle)
                throw new Blockages.NotFoundError('Cycle not found');
            else {
                var newSequence = {
                  /*cycleSequenceId:  0,*/
                  /*parentSequenceId: null,*/
                  /*productId:        null,*/
                  /*productName:      null,*/
                    position:         metabolism.CellGraph[cellId].CycleSequence.extractPosition(metabolism, req.body.position),
                    status:           0,
                    charge:           validate.toFloat(req.body.charge),
                    unit:             null,
                    quantity:         validate.toFloat(req.body.quantity),
                    cycleId:          validate.toInt(cycleId),
                    cycleLifeId:      null
                };

                return metabolism.CellGraph[cellId].CycleSequence.create(newSequence);
            }
        })
        .then(function(sequence) {
            res.status(201).send(Blockages.respMsg(res, true, sequence));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/cycle/:cycleId/life
// --- add an cycle life to cycle (:cycleId) for existing cell (:id)
router.post('/:id/cycle/:cycleId/life', function(req, res) {
    debug('[POST] /cell/:id/cycle/:cycleId/life');
    var cellId  = req.params.id;
    var cycleId = req.params.cycleId;

    verbose('  cellId  = ' + cellId);
    verbose('  cycleId = ' + cycleId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellGraph[cellId].Cycle
        .find({
            where: {cycleId: cycleId},
            attributes: cycleAttributes
        })
        .then(function(cycle) {
            if (!cycle)
                throw new Blockages.NotFoundError('Cycle not found');
            else {
                var newCycleLife = {
                  /*cycleLifeId:                   0,*/
                    cycleId:                       validate.toInt(cycleId),
                    lifeId:                        metabolism.CellGraph[cellId].CycleLife.extractId(metabolism, req.body.lifeId),
                  /*outsiderId:                    null,*/
                    status:                        0,
                    signalMethod:                  validate.trim(validate.toString(req.body.signalMethod)).toUpperCase(),
                    dictionaryGeneId:              metabolism.CellGraph[cellId].CycleLife.extractId(metabolism, req.body.dictionaryGeneId),
                  /*signalingReferenceNumber:      null,*/
                    genomicsGeneId:                metabolism.CellGraph[cellId].CycleLife.extractId(metabolism, req.body.genomicsGeneId),
                  /*genomicsReferenceNumber:       null,*/
                    communicationsGeneId:          metabolism.CellGraph[cellId].CycleLife.extractId(metabolism, req.body.communicationsGeneId),
                  /*communicationsReferenceNumber: null*/
                };

                return metabolism.CellGraph[cellId].CycleLife.create(newCycleLife);
            }
        })
        .then(function(life) {
            res.status(201).send(Blockages.respMsg(res, true, life));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/cycle/:cycleId/life/outsider
// --- add an cycle life to cycle (:cycleId) for existing cell (:id)
router.post('/:id/cycle/:cycleId/life/outsider', function(req, res) {
    debug('[POST] /cell/:id/cycle/:cycleId/life/outsider');
    var cellId  = req.params.id;
    var cycleId = req.params.cycleId;

    verbose('  cellId  = ' + cellId);
    verbose('  cycleId = ' + cycleId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    metabolism.CellGraph[cellId].Cycle
        .find({
            where: {cycleId: cycleId},
            attributes: cycleAttributes
        }).bind({})
        .then(function(cycle) {
            if (!cycle)
                throw new Blockages.NotFoundError('Cycle not found');
            else {
                var newCycleLife = {
                  /*cycleLifeId:                   0,*/
                    cycleId:                       cycleId,
                  /*lifeId:                        null,*/
                    outsiderId:                    null,
                    status:                        0,
                    signalMethod:                  validate.trim(validate.toString(req.body.signalMethod)).toUpperCase(),
                    dictionaryGeneId:              metabolism.CellGraph[cellId].CycleLife.extractId(metabolism, req.body.dictionaryGeneId)
                  /*signalingReferenceNumber:      null,*/
                  /*genomicsGeneId:                null,*/
                  /*genomicsReferenceNumber:       null,*/
                  /*communicationsGeneId:          null,*/
                  /*communicationsReferenceNumber: null*/
                };

                this.newCycleLife = newCycleLife;

                var newOutsider = {
                  /*outsiderId:    0,*/
                    givenName:  metabolism.CellGraph[cellId].CycleOutsider.extractName(metabolism, req.body.givenName),
                    familyName: metabolism.CellGraph[cellId].CycleOutsider.extractName(metabolism, req.body.familyName),
                    phone:      metabolism.CellGraph[cellId].CycleOutsider.extractPhone(metabolism, req.body.phone),
                    extension:  metabolism.CellGraph[cellId].CycleOutsider.extractExtension(metabolism, req.body.extension),
                    address1:   metabolism.CellGraph[cellId].CycleOutsider.extractAddress(metabolism, req.body.address1),
                    address2:   metabolism.CellGraph[cellId].CycleOutsider.extractAddress(metabolism, req.body.address2),
                    address3:   metabolism.CellGraph[cellId].CycleOutsider.extractAddress(metabolism, req.body.address3),
                    address4:   metabolism.CellGraph[cellId].CycleOutsider.extractAddress(metabolism, req.body.address4),
                    locality:   metabolism.CellGraph[cellId].CycleOutsider.extractLocality(metabolism, req.body.locality),
                    region:     metabolism.CellGraph[cellId].CycleOutsider.extractRegion(metabolism, req.body.region),
                    postalCode: metabolism.CellGraph[cellId].CycleOutsider.extractPostalCode(metabolism, req.body.postalCode)
                };

                return metabolism.CellGraph[cellId].CycleOutsider.create(newOutsider);
            }
        })
        .then(function(outsider) {
            this.newCycleLife.outsiderId = outsider.cycleOutsiderId;

            return metabolism.CellGraph[cellId].CycleLife.create(this.newCycleLife);
        })
        .then(function(life) {
                res.status(201).send(Blockages.respMsg(res, true, life));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// /cell/:id/cycle/:cycleId/verify
// --- verify information in cycle (:cycleId) for cell (:id)
router.post('/:id/cycle/:cycleId/verify', function(req, res) {
    debug('[POST] /cell/:id/cycle/:cycleId/verify');
    var cellId  = req.params.id.toString();
    var cycleId = req.params.cycleId;

    verbose('  cellId  = ' + cellId);
    verbose('  cycleId = ' + cycleId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    var tempIncludes = [];
    tempIncludes.push(copyIncludeProperties(includeCycleSequence, metabolism.CellGraph[cellId].CycleSequence));
    tempIncludes.push(copyIncludeProperties(includeCycleLife,     metabolism.CellGraph[cellId].CycleLife));

    return metabolism.sequelize.transaction(function (t) {
        return metabolism.CellGraph[cellId].Cycle
                .find({
                    where: {cycleId: cycleId},
                    include: tempIncludes,
                    attributes: cycleAttributes
                })
                .bind({})
                .then(function(cycle) {
                    // TODO: add cycleOutsiders to the cycleLife object(s) thru associate()
                    if (!cycle)
                        throw new Blockages.NotFoundError('Cycle not found');
                    else if (cycle.status !== CycleType.cycleStatusType.ENUM.OPEN.status)
                        throw new Blockages.BadRequestError('Incorrect cycle status for verify stage');

                    this.cycle = cycle;
                    var cycleTypeProcessor = new Cycles[cycle.cellType.toString()](cellId, this.cycle);

                    // Process the cycle
                    return cycleTypeProcessor.process();
                })
                .then(function() {
                    res.status(200).send(Blockages.respMsg(res, true, this.cycle));
                })
                .catch(function(error) {
                    res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
                });
    });
});

// /cell/:id/cycle/:cycleId/process
// --- process an cycle (:cycleId) for cell (:id)
router.post('/:id/cycle/:cycleId/process', function(req, res) {
    debug('[POST] /cell/:id/cycle/:cycleId/process');
    var cellId  = req.params.id.toString();
    var cycleId = req.params.cycleId;

    verbose('  cellId  = ' + cellId);
    verbose('  cycleId = ' + cycleId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    var tempIncludes = [];
    tempIncludes.push(copyIncludeProperties(includeCycleSequence, metabolism.CellGraph[cellId].CycleSequence));
    tempIncludes.push(copyIncludeProperties(includeCycleLife,     metabolism.CellGraph[cellId].CycleLife));

    return metabolism.sequelize.transaction(function (t) {
        return metabolism.CellGraph[cellId].Cycle
                .find({
                    where: {cycleId: cycleId},
                    include: tempIncludes,
                    attributes: cycleAttributes
                })
                .bind({})
                .then(function(cycle) {
                    // TODO: add cycleOutsiders to the cycleLife object(s) thru associate()
                    if (!cycle)
                        throw new Blockages.NotFoundError('Cycle not found');
                    else if (!(cycle.status === CycleType.cycleStatusType.ENUM.RDYPRCS.status ||
                               cycle.status === CycleType.cycleStatusType.ENUM.PRCSNG.status))
                        throw new Blockages.BadRequestError('Incorrect cycle status for process stage');

                    this.cycle = cycle;
                    var cycleTypeProcessor = new Cycles[cycle.cellType.toString()](cellId, this.cycle);

                    // Process the cycle
                    return cycleTypeProcessor.process();
                })
                .then(function() {
                    res.status(200).send(Blockages.respMsg(res, true, this.cycle));
                })
                .catch(function(error) {
                    res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
                });
    });
});

// /cell/:id/cycle/:cycleId/life/:cycleLifeId/verify
// --- verify information in cycle life (:cycleLifeId) of cycle (:cycleId) for cell (:id)
router.post('/:id/cycle/:cycleId/life/:cycleLifeId/verify', function(req, res) {
    debug('[POST] /cell/:id/cycle/:cycleId/life/:cycleLifeId/verify');
    var cellId      = req.params.id.toString();
    var cycleId     = req.params.cycleId;
    var cycleLifeId = req.params.cycleLifeId;

    verbose('  cellId      = ' + cellId);
    verbose('  cycleId     = ' + cycleId);
    verbose('  cycleLifeId = ' + cycleLifeId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    var tempIncludes = [];
    tempIncludes.push(copyIncludeProperties(includeCycle,         metabolism.CellGraph[cellId].Cycle));
    tempIncludes.push(copyIncludeProperties(includeCycleSequence, metabolism.CellGraph[cellId].CycleSequence));

    return metabolism.sequelize.transaction(function (t) {
        return metabolism.CellGraph[cellId].CycleLife
                .find({
                    where: {
                        cycleLifeId: cycleLifeId,
                        cycleId: cycleId
                    },
                    include: tempIncludes,
                    attributes: cycleLifeAttributes
                })
                .bind({})
                .then(function(cycleLife) {
                    // TODO: add cycleOutsiders to the cycleLife object(s) thru associate()
                    if (!cycleLife)
                        throw new Blockages.NotFoundError('Cycle life not found');
                    else if (cycleLife.status !== CycleType.lifeStatusType.ENUM.OPEN.status)
                        throw new Blockages.BadRequestError('Incorrect cycle status for verify stage');

                    this.cycleLife = cycleLife;

                    // Retrieve the life account or outsider related to this cycleLife
                    var signals;
                    if (this.cycleLife.lifeId !== null) {
                        signals = [ metabolism.Life.find({ where: {lifeId: this.cycleLife.lifeId} }),
                                    metabolism.GeneSignalPathway.find({ where: {geneId: this.cycleLife.dictionaryGeneId, lifeId: this.cycleLife.lifeId} }),
                                    metabolism.GeneSignalPathway.find({ where: {geneId: this.cycleLife.dictionaryGeneId, cellId: cellId} })];

                        if (this.cycleLife.genomicsGeneId) {
                            signals.push(metabolism.GeneSignalPathway.find({ where: {geneId: this.cycleLife.genomicsGeneId, lifeId: this.cycleLife.lifeId} }));
                            signals.push(metabolism.GeneSignalPathway.find({ where: {geneId: this.cycleLife.genomicsGeneId, cellId: cellId} }));
                        }
                        else {
                            signals.push(metabolism.sequelize.Promise.resolve());
                            signals.push(metabolism.sequelize.Promise.resolve());
                        }

                        if (this.cycleLife.communicationsGeneId) {
                            signals.push(metabolism.GeneSignalPathway.find({ where: {geneId: this.cycleLife.communicationsGeneId, lifeId: this.cycleLife.lifeId} }));
                            signals.push(metabolism.GeneSignalPathway.find({ where: {geneId: this.cycleLife.communicationsGeneId, cellId: cellId} }));
                        }
                        else {
                            signals.push(metabolism.sequelize.Promise.resolve());
                            signals.push(metabolism.sequelize.Promise.resolve());
                        }
                    }
                    else {
                        signals = [ metabolism.CellGraph[cellId].CycleOutsider.find({ where: {cycleOutsiderId: this.cycleLife.get('outsiderId')} }) ];
                    }

                    return metabolism.sequelize.Promise.all(signals);
                })
                .spread(function(lifeOrOutsider, lifeDictionary, cellDictionary, lifeGenomics, cellGenomics, lifeCommunications, cellCommunications) {
                    
                    var cycleLifeProcessor;

                    if (this.cycleLife.lifeId !== null) {
                        if (!lifeOrOutsider)
                            throw new Blockages.NotFoundError('Cycle life not found');
                        if (!lifeDictionary)
                            throw new Blockages.NotFoundError('Cycle life signaling signal pathway not found');
                        if (!cellDictionary)
                            throw new Blockages.NotFoundError('Cycle cell signaling signal pathway not found');

                        this.cycleLife.Life = lifeOrOutsider;
                        var signalPathways = {
                            dictionary: {
                                life: lifeDictionary,
                                cell: cellDictionary
                            },
                            genomics: {
                                life: lifeGenomics,
                                cell: cellGenomics
                            },
                            communications: {
                                life: lifeCommunications,
                                cell: cellCommunications
                            }
                        };

                        var dictionaryGeneAPI = new Genes[this.cycleLife.dictionaryGeneId.toString()](metabolism);
                        cycleLifeProcessor = new CycleLives[this.cycleLife.Cycle.cellType.toString()](cellId, this.cycleLife, signalPathways, dictionaryGeneAPI);
                    }
                    else {
                        if (!lifeOrOutsider)
                            throw new Blockages.NotFoundError('Cycle outsider life not found');

                        this.cycleLife.Outsider = lifeOrOutsider;
                        cycleLifeProcessor = new CycleOutsiders[this.cycleLife.Cycle.cellType.toString()](cellId, this.cycleLife);
                    }

                    // Process the cycle
                    return cycleLifeProcessor.process();
                })
                .then(function() {
                    res.status(200).send(Blockages.respMsg(res, true, this.cycleLife));
                })
                .catch(function(error) {
                    res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
                });
    });
});

// /cell/:id/cycle/:cycleId/life/:cycleLifeId/process
// --- process an cycle life (:cycleLifeId) of cycle (:cycleId) for cell (:id)
router.post('/:id/cycle/:cycleId/life/:cycleLifeId/process', function(req, res) {
    debug('[POST] /cell/:id/cycle/:cycleId/life/:cycleLifeId/process');
    var cellId      = req.params.id.toString();
    var cycleId     = req.params.cycleId;
    var cycleLifeId = req.params.cycleLifeId;

    verbose('  cellId      = ' + cellId);
    verbose('  cycleId     = ' + cycleId);
    verbose('  cycleLifeId = ' + cycleLifeId);

    if (!Immunities.verifyNoRejectionFromCell(cellId, Immunities.AuthLevelStakeholder, false, true, false, res.locals.lifePacket))
        return res.status(403).send(Blockages.respMsg(res, false, 'Access is restricted'));

    var tempIncludes = [];
    tempIncludes.push(copyIncludeProperties(includeCycle,         metabolism.CellGraph[cellId].Cycle));
    tempIncludes.push(copyIncludeProperties(includeCycleSequence, metabolism.CellGraph[cellId].CycleSequence));

    return metabolism.sequelize.transaction(function (t) {
        return metabolism.CellGraph[cellId].CycleLife
                .find({
                    where: {
                        cycleLifeId: cycleLifeId,
                        cycleId: cycleId
                    },
                    include: tempIncludes,
                    attributes: cycleLifeAttributes
                })
                .bind({})
                .then(function(cycleLife) {
                    // TODO: add cycleOutsiders to the cycleLife object(s) thru associate()
                    if (!cycleLife)
                        throw new Blockages.NotFoundError('Cycle life not found');
                    else if (!(cycleLife.status   === CycleType.lifeStatusType.ENUM.OPEN.status    ||
                               cycleLife.status   === CycleType.lifeStatusType.ENUM.RDYPRCS.status ||
                               cycleLife.status   === CycleType.lifeStatusType.ENUM.PRCSDC.status))
                               cycleLife.status === CycleType.lifeStatusType.ENUM.PRCSGN.status  ||
                               cycleLife.status === CycleType.lifeStatusType.ENUM.PRCSCM.status))
                        throw new Blockages.BadRequestError('Incorrect cycle life status for process stage');

                    this.cycleLife = cycleLife;

                    // Retrieve the life account or outsider related to this cycleLife
                    var signals;
                    if (this.cycleLife.lifeId !== null) {
                        signals = [ metabolism.Life.find({ where: {lifeId: this.cycleLife.lifeId} }),
                                    metabolism.GeneSignalPathway.find({ where: {geneId: this.cycleLife.dictionaryGeneId, lifeId: this.cycleLife.lifeId} }),
                                    metabolism.GeneSignalPathway.find({ where: {geneId: this.cycleLife.dictionaryGeneId, cellId: cellId} })];

                        if (this.cycleLife.genomicsGeneId) {
                            signals.push(metabolism.GeneSignalPathway.find({ where: {geneId: this.cycleLife.genomicsGeneId, lifeId: this.cycleLife.lifeId} }));
                            signals.push(metabolism.GeneSignalPathway.find({ where: {geneId: this.cycleLife.genomicsGeneId, cellId: cellId} }));
                        }
                        else {
                            signals.push(metabolism.sequelize.Promise.resolve());
                            signals.push(metabolism.sequelize.Promise.resolve());
                        }

                        if (this.cycleLife.communicationsGeneId) {
                            signals.push(metabolism.GeneSignalPathway.find({ where: {geneId: this.cycleLife.communicationsGeneId, lifeId: this.cycleLife.lifeId} }));
                            signals.push(metabolism.GeneSignalPathway.find({ where: {geneId: this.cycleLife.communicationsGeneId, cellId: cellId} }));
                        }
                        else {
                            signals.push(metabolism.sequelize.Promise.resolve());
                            signals.push(metabolism.sequelize.Promise.resolve());
                        }
                    }
                    else {
                        signals = [ metabolism.CellGraph[cellId].CycleOutsider.find({ where: {cycleOutsiderId: this.cycleLife.get('outsiderId')} }) ];
                    }

                    return metabolism.sequelize.Promise.all(signals);
                })
                .spread(function(lifeOrOutsider, lifeDictionary, cellDictionary, lifeGenomics, cellGenomics, lifeCommunications, cellCommunications) {
                    
                    var cycleLifeProcessor;

                    if (this.cycleLife.lifeId !== null) {
                        if (!lifeOrOutsider)
                            throw new Blockages.NotFoundError('Cycle life not found');
                        if (!lifeDictionary)
                            throw new Blockages.NotFoundError('Cycle life signaling signalPathway not found');
                        if (!cellDictionary)
                            throw new Blockages.NotFoundError('Cycle cell signaling signalPathway not found');

                        this.cycleLife.Life = lifeOrOutsider;
                        var signalPathways = {
                            dictionary: {
                                life: lifeDictionary,
                                cell: cellDictionary
                            },
                            genomics: {
                                life: lifeGenomics,
                                cell: cellGenomics
                            },
                            communications: {
                                life: lifeCommunications,
                                cell: cellCommunications
                            }
                        };

                        var dictionaryGeneAPI = new Genes[this.cycleLife.dictionaryGeneId.toString()](metabolism);
                        cycleLifeProcessor = new CycleLives[this.cycleLife.Cycle.cellType.toString()](cellId, this.cycleLife, signalPathways, dictionaryGeneAPI);
                    }
                    else {
                        if (!lifeOrOutsider)
                            throw new Blockages.NotFoundError('Cycle outsider life not found');

                        this.cycleLife.Outsider = lifeOrOutsider;
                        cycleLifeProcessor = new CycleOutsiders[this.cycleLife.Cycle.cellType.toString()](cellId, this.cycleLife);
                    }

                    // Process the cycle
                    return cycleLifeProcessor.process();
                })
                .then(function() {
                    res.status(200).send(Blockages.respMsg(res, true, this.cycleLife));
                })
                .catch(function(error) {
                    res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
                });
    });
});

// -----------------------------------------------------------------------------
// DELETE ROUTES
// -----------------------------------------------------------------------------
// /cell/:id/cycle/:cycleId
// --- delete an existing cycle (:cycleId) for cell (:id)
router.delete('/:id/cycle/:cycleId', function(req, res) {
    debug('[DELETE] /cell/:id/cycle/:cycleId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /cell/:id/cycle/:cycleId/sequence/:sequenceId
// --- delete an existing cycle sequence (:sequenceId) of cycle (:cycleId) for existing cell (:id)
router.delete('/:id/cycle/:cycleId/sequence/:sequenceId', function(req, res) {
    debug('[DELETE] /cell/:id/cycle/:cycleId/sequence/:sequenceId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /cell/:id/cycle/:cycleId/life/:lifeId
// --- delete an existing cycle life (:lifeId) of cycle (:cycleId) for existing cell (:id)
router.delete('/:id/cycle/:cycleId/life/:lifeId', function(req, res) {
    debug('[DELETE] /cell/:id/cycle/:cycleId/life/:lifeId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// /cell/:id/cycle/:cycleId/outsider/:outsiderId
// --- delete an existing cycle outsider (:outsiderId) of cycle (:cycleId) for existing cell (:id)
router.delete('/:id/cycle/:cycleId/outsider/:outsiderId', function(req, res) {
    debug('[DELETE] /cell/:id/cycle/:cycleId/outsider/:outsiderId');
    res.status(501).send({ 'error': 'ROUTE INCOMPLETE' });
});

// -----------------------------------------------------------------------------
// CATCH-ALL ROUTES (error)
// -----------------------------------------------------------------------------
    // No catch-all routes are here because the are covered in the signaling
    // cell routes (cell.js)
