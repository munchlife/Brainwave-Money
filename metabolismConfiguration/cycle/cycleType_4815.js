'use strict';

// cycleType_4815.js (model)

// Local js modules
var metabolism = require('../../metabolismLifeModels/database');
var Blockages  = require('../blockages');
var CycleType  = require('../../metabolismTypes/cycleTypes');

module.exports = function(cellId, cycle) {

    var validate = metabolism.Sequelize.Validator;

    var self = this;
    self.continueProcessing = true;
    self.cellId             = cellId;
    self.cycle              = cycle;

    self.audit = function(messageNumber, message) {
        return metabolism.CellGraph[self.cellId].CycleAudit
            .create({
                cycleId: self.cycle.cycleId,
                messageNumber: messageNumber,
                message: message
            }, {transaction: null});
    };

    // -------------------------------------------------------------------------
    self.psOpen = function() {
        return self.audit(20000, ' (PS)Open - Start')
            .then(function() {
                if (validate.toInt(self.cycle.cellType) !== 4815)
                    throw new Blockages.CycleProcessError(20101, 'ERROR: cellType invalid');

                if (self.cycle.instanceId === null)
                    throw new Blockages.CycleProcessError(20102, 'ERROR: instanceId not set');

                if (self.cycle.deviceId === null)
                    throw new Blockages.CycleProcessError(20103, 'ERROR: deviceId not set');

                // TODO: consider bringing in later when multi-login support is in cell app
                // if (self.cycle.stakeholderCreatorId === null)
                //     throw new Blockages.CycleProcessError(20104, 'ERROR: stakeholderCreatorId not set');

                // Cycle fields not checked here: stakeholderDelivererId, originGeneId, deliveryMethod, status

                if (self.cycle.distributedCharge !== CycleType.distributedChargeType.ENUM.SGL_LIFE.abbr)
                    throw new Blockages.CycleProcessError(20105, 'ERROR: distributedCharge invalid');

                // Cycle fields not checked here: taxPercentage, subTotal, chargeDiscount, chargeFee, chargeTax, chargeTip

                if (!validate.isFloat(self.cycle.chargeTotal))
                    throw new Blockages.CycleProcessError(20106, 'ERROR: chargeTotal invalid');

                if (self.cycle.chargeTotal <= 0)
                    throw new Blockages.CycleProcessError(20106, 'ERROR: chargeTotal invalid');

                if (validate.toFloat(self.cycle.chargeTotal) !==
                    validate.toFloat(self.cycle.chargeTotal.toFixed(2)))
                    throw new Blockages.CycleProcessError(20106, 'ERROR: chargeTotal invalid');

                // Cycle fields not checked here: cycleNotes

                if (self.cycle.Sequences.length !== 0)
                    throw new Blockages.CycleProcessError(20107, 'ERROR: attaching sequences to the cycle is not allowed');

                self.continueProcessing = false;
                return self.updateCycleStatus(CycleType.cycleStatusType.ENUM.RDYPRCS.status, 20002, ' (PS)Open - Updated Status');
            })
            .then(function() {
                return self.audit(20001, ' (PS)Open - Finished');
            });
    };

    self.psReadyForProcessing = function() {
        return self.audit(30000, ' (PS)Ready for Processing - Start')
            .then(function() {
                return self.updateCycleStatus(CycleType.cycleStatusType.ENUM.PRCSNG.status, 30002, ' (PS)Ready for Processing - Updated Status');
            })
            .then(function() {
                return self.audit(30001, ' (PS)Ready for Processing - Finished');
            });
    };

    self.psProcessing = function() {
        return self.audit(40000, ' (PS)Processing - Start')
            .then(function() {
                self.continueProcessing = false;

                // Be sure the life is processed before completing the cycle
                // if (self.cycle.Lifes.length !== 1 ||
                //     self.cycle.Lifes[0].status !== CycleType.lifeStatusType.ENUM.COMPLT.status)
                //     return metabolism.sequelize.Promise.resolve();
                // else
                    return self.updateCycleStatus(CycleType.cycleStatusType.ENUM.COMPLT.status, 40002, ' (PS)Processing - Updated Status');
            })
            .then(function() {
                return self.audit(40001, ' (PS)Processing - Finished');
            });
    };

    // -------------------------------------------------------------------------
    self.process = function() {
        self.continueProcessing = true;

        return self.audit(10000, 'Cycle Processor - Start')
            .then(function() {
                return metabolism.sequelize.Promise.while(
                    function() { return self.continueProcessing === true; },
                    function() { return self.getCurrentPipelineSection(self.cycle.status)(); }
                );
            })
            .catch(function(error) {
                self.audit(error.code || 10101, 'Error process(): ' + error.message);

                throw new Blockages.CycleProcessError(0, 'Error occurred during cycle processing; processing aborted.');
            })
            .finally(function() {
                self.audit(10001, 'Cycle Processor - Finished');
            });
    };

    // -------------------------------------------------------------------------
    self.getCurrentPipelineSection = function(status) {
        var section;

        switch (status) {
            case CycleType.cycleStatusType.ENUM.OPEN.status: // Open
                section = self.psOpen;
                break;

            case CycleType.cycleStatusType.ENUM.RDYPRCS.status: // Ready for Processing
                section = self.psReadyForProcessing;
                break;

            case CycleType.cycleStatusType.ENUM.PRCSNG.status: // Processing
                section = self.psProcessing;
                break;

            case CycleType.cycleStatusType.ENUM.COMPLT.status: // Complete
                throw new Error('Cycle already marked as COMPLETE');

            case CycleType.cycleStatusType.ENUM.CNCLLD.status: // Cancelled
                throw new Error('Cannot process cycle marked as CANCELLED');

            default: // UNKNOWN STATUS
                throw new Error('Unknown status in cycle');
        }

        return section;
    };

    // -------------------------------------------------------------------------
    self.updateCycleStatus = function(status, auditNumber, auditMessage) {
        switch (status) {
            case CycleType.cycleStatusType.ENUM.OPEN.status: // Open
            case CycleType.cycleStatusType.ENUM.RDYPRCS.status: // Ready for Processing
            case CycleType.cycleStatusType.ENUM.PRCSNG.status: // Processing
            case CycleType.cycleStatusType.ENUM.COMPLT.status: // Complete
            case CycleType.cycleStatusType.ENUM.CNCLLD.status: // Cancelled
                self.cycle.status = status;
                break;

            default: // UNKNOWN STATUS
                throw new Error('Cell cycle type \'4815\' does not support this status');
        }

        return self.cycle.save({ fields: ['status'] })
                .then(function() {
                    return self.audit(auditNumber, auditMessage);
                });
    };
};
