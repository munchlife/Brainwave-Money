
// cellGraph.js

var metabolism = require('../models/database');

var modelCycle         = require('../modelsCell/cycle');
var modelCycleOutsider = require('../modelsCell/cycleOutsider');
var modelCycleItem     = require('../modelsCell/cycleItem');
var modelCycleLife     = require('../modelsCell/cycleLife');
var modelCycleAudit    = require('../modelsCell/cycleAudit');

var CellGraph = module.exports = {};

CellGraph.create = function(cellId) {
    cellId = cellId.toString();
    var cellGraph = metabolism.CellGraph[cellId] = {};

    cellGraph.Cycle         = modelCycle(metabolism.sequelize, metabolism.Sequelize, cellId);
    cellGraph.CycleOutsider = modelCycleOutsider(metabolism.sequelize, metabolism.Sequelize, cellId);
    cellGraph.CycleItem     = modelCycleItem(metabolism.sequelize, metabolism.Sequelize, cellId);
    cellGraph.CycleLife     = modelCycleLife(metabolism.sequelize, metabolism.Sequelize, cellId);
    cellGraph.CycleAudit    = modelCycleAudit(metabolism.sequelize, metabolism.Sequelize, cellId);

    // Call associate() on each of the cell models
    Object.keys(cellGraph).forEach(function(modelName) {
        if ('associate' in cellGraph[modelName]) {
            cellGraph[modelName].associate(cellGraph);
        }
    });

    return metabolism.sequelize.sync();
};

CellGraph.sync = function() {

    metabolism.CellGraph = {};

    return metabolism.Cell
        .findAll()
        .each(function(cell) {
            var cellId = cell.cellId.toString();
            var cellGraph = metabolism.CellGraph[cellId] = {};

            cellGraph.Cycle         = modelCycle(metabolism.sequelize, metabolism.Sequelize, cellId);
            cellGraph.CycleOutsider = modelCycleOutsider(metabolism.sequelize, metabolism.Sequelize, cellId);
            cellGraph.CycleItem     = modelCycleItem(metabolism.sequelize, metabolism.Sequelize, cellId);
            cellGraph.CycleLife     = modelCycleLife(metabolism.sequelize, metabolism.Sequelize, cellId);
            cellGraph.CycleAudit    = modelCycleAudit(metabolism.sequelize, metabolism.Sequelize, cellId);

            // Call associate() on each of the cell models
            Object.keys(cellGraph).forEach(function(modelName) {
                if ('associate' in cellGraph[modelName]) {
                    cellGraph[modelName].associate(cellGraph);
                }
            });
        })
        .then(function() {
            return metabolism.sequelize.sync();
        });
};