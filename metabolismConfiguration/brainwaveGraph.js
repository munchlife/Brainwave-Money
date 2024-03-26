
// brainwaveGraph.js

var metabolism = require('../models/database');

var modelCycle         = require('../modelsBrainwave/cycle');
var modelCycleOutsider = require('../modelsBrainwave/cycleOutsider');
var modelCycleSequence = require('../modelsBrainwave/cycleSequence');
var modelCycleLife     = require('../modelsBrainwave/cycleLife');
var modelCycleAudit    = require('../modelsBrainwave/cycleAudit');

var BrainwaveGraph = module.exports = {};

BrainwaveGraph.create = function(brainwaveId) {
    brainwaveId = brainwaveId.toString();
    var brainwaveGraph = metabolism.BrainwaveGraph[brainwaveId] = {};

    brainwaveGraph.Cycle         = modelCycle(metabolism.sequelize,         metabolism.Sequelize, brainwaveId);
    brainwaveGraph.CycleOutsider = modelCycleOutsider(metabolism.sequelize, metabolism.Sequelize, brainwaveId);
    brainwaveGraph.CycleSequence = modelCycleSequence(metabolism.sequelize, metabolism.Sequelize, brainwaveId);
    brainwaveGraph.CycleLife     = modelCycleLife(metabolism.sequelize,     metabolism.Sequelize, brainwaveId);
    brainwaveGraph.CycleAudit    = modelCycleAudit(metabolism.sequelize,    metabolism.Sequelize, brainwaveId);

    // Call associate() on each of the brainwave models
    Object.keys(brainwaveGraph).forEach(function(modelName) {
        if ('associate' in brainwaveGraph[modelName]) {
            brainwaveGraph[modelName].associate(brainwaveGraph);
        }
    });

    return metabolism.sequelize.sync();
};

BrainwaveGraph.sync = function() {

    metabolism.BrainwaveGraph = {};

    return metabolism.Brainwave
        .findAll()
        .each(function(brainwave) {
            var brainwaveId = brainwave.brainwaveId.toString();
            var brainwaveGraph = metabolism.BrainwaveGraph[brainwaveId] = {};

            brainwaveGraph.Cycle         = modelCycle(metabolism.sequelize,         metabolism.Sequelize, brainwaveId);
            brainwaveGraph.CycleOutsider = modelCycleOutsider(metabolism.sequelize, metabolism.Sequelize, brainwaveId);
            brainwaveGraph.CycleSequence = modelCycleSequence(metabolism.sequelize, metabolism.Sequelize, brainwaveId);
            brainwaveGraph.CycleLife     = modelCycleLife(metabolism.sequelize,     metabolism.Sequelize, brainwaveId);
            brainwaveGraph.CycleAudit    = modelCycleAudit(metabolism.sequelize,    metabolism.Sequelize, brainwaveId);

            // Call associate() on each of the brainwave models
            Object.keys(brainwaveGraph).forEach(function(modelName) {
                if ('associate' in brainwaveGraph[modelName]) {
                    brainwaveGraph[modelName].associate(brainwaveGraph);
                }
            });
        })
        .then(function() {
            return metabolism.sequelize.sync();
        });
};
