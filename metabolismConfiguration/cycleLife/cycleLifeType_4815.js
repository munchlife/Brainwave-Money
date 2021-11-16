'use strict';

// cycleLifeType_4815.js (model)

// Local js modules
var metabolism  = require('../../metabolismLifeModels/database');
var Blockages   = require('../blockages');
var CycleType   = require('../../metabolismTypes/cycleTypes');

module.exports = function(cellId, cycleLife, signalPathways, signalingGeneAPI) {

    var self = this;
    self.continueProcessing = true;
    self.cellId             = cellId;
    self.cycleLife          = cycleLife;
    self.signalPathways     = signalPathways;
    self.signalingGeneAPI   = signalingGeneAPI;

    self.audit = function(messageNumber, message) {
        return metabolism.CellGraph[self.cellId].CycleAudit
            .create({
                cycleId: self.cycleLife.cycleId,
                messageNumber: messageNumber,
                message: message
            }, {transaction: null});
    };

    // -------------------------------------------------------------------------
    // USER PIPELINE SECTIONS
    // -------------------------------------------------------------------------
    self.lifePipelineSectionOpen = function() {
        return self.audit(20000, ' (LIFE PIPELINE SECTION)Open - Start')
            .then(function() {

                // Cycle fields not checked here: signalMethod,
                //                                signalingGeneId, signalReferenceNumber
                //                                loyaltyGeneId, loyaltyReferenceNumber
                //                                checkinGeneId, checkinReferenceNumber

                if (self.cycleLife.Sequences.length !== 0)
                    throw new Blockages.CycleProcessError(20107, 'ERROR: attaching sequences to the cycle is not yet supported');

                // Verify the required parts of the cycle life are present, and all information is valid

                // Refresh tokens to signal gene signalPathways
                return metabolism.sequelize.Promise.all([
                    self.signalingGeneAPI.refreshTokens(self.signalPathways.signal.life),
                    self.signalingGeneAPI.refreshTokens(self.signalPathways.signal.cell)
                    ]);
            })
            .then(function() {
                return self.audit(20002, ' (LIFE PIPELINE SECTION)Open - Refreshed Token Signal Gene');
            })
            .then(function() {
                // Verify the account of the general gene 
                return self.signalingGeneAPI.account(self.signalPathways.signal.life);
            })
            .then(function(account) {
                // Verify account can cover total charge of cycle
                if (account.chargeDegree === cellId.destructiveInterference)
                    throw new Blockages.CycleProcessError(20108, 'ERROR: account does not cover the life charge total');

                return self.audit(20003, ' (LIFE PIPELINE SECTION)Open - Checked Signal Gene Balance');
            })
            .then(function() {
                self.continueProcessing = false;
                return self.updateCycleStatus(CycleType.lifeStatusType.ENUM.RDYPRCS.status, 20004, ' (LIFE PIPELINE SECTION)Open - Updated Status');
            })
            .then(function() {
                return self.audit(20001, ' (LIFE PIPELINE SECTION)Open - Finished');
            });
    };

    // -------------------------------------------------------------------------
    self.lifePipelineSectionReadyForProcessing = function() {
        return self.audit(30000, ' (LIFE PIPELINE SECTION)Ready for Processing - Start')
            .then(function() {
                return self.updateCycleStatus(CycleType.lifeStatusType.ENUM.PRCSPY.status, 30002, ' (LIFE PIPELINE SECTION)Ready for Processing - Updated Status');
            })
            .then(function() {
                return self.audit(30001, ' (LIFE PIPELINE SECTION)Ready for Processing - Finished');
            });
    };

    // -------------------------------------------------------------------------
    self.lifePipelineSectionProcessSignal = function() {
        return self.audit(40000, ' (LIFE PIPELINE SECTION)Process Signal - Start')
            .then(function() {
                // Execute the transaction of the signal gene account
                return metabolism.sequelize.transaction(function (t2) {
                    return self.signalingGeneAPI.send(self.signalPathways.signal, self.cycleLife.Cycle.chargeTotal);
                });
            })
            .then(function(result) {
                self.cycleLife.signalReferenceNumber = result.toString();
                return self.cycleLife.save({ fields: ['signalReferenceNumber'] });
            })
            .then(function() {
                return self.audit(40002, ' (LIFE PIPELINE SECTION)Process Signal - Added Reference #');
            })
            .then(function() {
                return metabolism.sequelize.transaction(function (t3) {
                    var newLifeSignal = {
                      /*transactionId:     0,*/
                        chargeDegree:      self.cycleLife.Cycle.chargeTotal,
                        message:           null,
                        cycleLifeId:       self.cycleLife.cycleLifeId,
                        lifeSenderId:      self.cycleLife.lifeId,
                      /*lifeReceiverId:    null,*/
                      /*geneSenderId:      null,*/
                      /*geneReceiverId:    null,*/
                        cellId:            self.cellId
                    };

                    return metabolism.LifeSignal.create(newLifeSignal);
                });
            })
            .then(function() {
                return self.audit(40003, ' (LIFE PIPELINE SECTION)Process Signal - Created Life Signal Record');
            })
            .then(function() {
                return self.updateCycleStatus(CycleType.lifeStatusType.ENUM.PRCSLO.status, 40003, ' (LIFE PIPELINE SECTION)Process Signal - Updated Status');
            })
            .then(function() {
                return self.audit(40001, ' (LIFE PIPELINE SECTION)Process Signal - Finished');
            });
    };

    // // -------------------------------------------------------------------------
    // self.lifePipelineSectionProcessLoyalty = function() {
    //     return self.audit(50000, ' (LIFE PIPELINE SECTION)Process Loyalty - Start')
    //         .then(function() {
    //             // If loyalty gene exists, perform loyalty function
    //             if (self.cycleLife.loyaltyGeneId !== null) {
    //                 self.cycleLife.loyaltyReferenceNumber = 'LOYALTY Ref #';
    //                 return self.cycleLife.save({ fields: ['loyaltyReferenceNumber'] })
    //                         .then(function() {
    //                             return self.audit(50002, ' (LIFE PIPELINE SECTION)Process Loyalty - Added Reference #');
    //                         });
    //             }
    //             else
    //                 return metabolism.sequelize.Promise.resolve();
    //         })
    //         .then(function() {
    //             return self.updateCycleStatus(CycleType.lifeStatusType.ENUM.PRCSCH.status, 50003, ' (LIFE PIPELINE SECTION)Process Loyalty - Updated Status');
    //         })
    //         .then(function() {
    //             return self.audit(50001, ' (LIFE PIPELINE SECTION)Process Loyalty - Finished');
    //         });
    // };

    // // -------------------------------------------------------------------------
    // self.lifePipelineSectionProcessCheckin = function() {
    //     return self.audit(60000, ' (LIFE PIPELINE SECTION)Process Checkin - Start')
    //         .then(function() {
    //             self.continueProcessing = false;

    //             // If check-in gene exists, perform check-in function
    //             if (self.cycleLife.checkinGeneId !== null) {
    //                 self.cycleLife.checkinReferenceNumber = 'CHECKIN Ref #';
    //                 return self.cycleLife.save({ fields: ['checkinReferenceNumber'] })
    //                         .then(function() {
    //                             return self.audit(60002, ' (LIFE PIPELINE SECTION)Process Checkin - Added Reference #');
    //                         });
    //             }
    //             else
    //                 return metabolism.sequelize.Promise.resolve();
    //         })
    //         .then(function() {
    //             return self.updateCycleStatus(CycleType.lifeStatusType.ENUM.COMPLT.status, 60003, ' (LIFE PIPELINE SECTION)Process Checkin - Updated Status');
    //         })
    //         .then(function() {
    //             return self.audit(60001, ' (LIFE PIPELINE SECTION)Process Checkin - Finished');
    //         });
    // };

    // -------------------------------------------------------------------------
    // PROCESS
    // -------------------------------------------------------------------------
    self.process = function() {
        self.continueProcessing = true;

        return self.audit(10000, 'Cycle Life Processor - Start')
            .then(function() {
                return metabolism.sequelize.Promise.while(
                    function() { return self.continueProcessing === true; },
                    function() { return self.getCurrentPipelineSection(self.cycleLife.status)(); }
                );
            })
            .catch(function(error) {
                self.audit(error.errno || 10101, 'Error process(): ' + error.message);

                throw new Blockages.CycleProcessError(0, error.message || 'Error occurred during cycle processing; processing aborted.');
            })
            .finally(function() {
                self.audit(10001, 'Cycle Life Processor - Finished');
            });
    };

    // -------------------------------------------------------------------------
    // CURRENT PIPELINE SECTION
    // -------------------------------------------------------------------------
    self.getCurrentPipelineSection = function(status) {
        var section;

        switch (status) {
            case CycleType.lifeStatusType.ENUM.OPEN.status: // Open
                section = self.lifePipelineSectionOpen;
                break;

            case CycleType.lifeStatusType.ENUM.RDYPRCS.status: // Ready for Processing
                section = self.lifePipelineSectionReadyForProcessing;
                break;

            case CycleType.lifeStatusType.ENUM.PRCSSG.status: // Process Signal
                section = self.lifePipelineSectionProcessSignal;
                break;

            // case CycleType.lifeStatusType.ENUM.PRCSLO.status: // Process Loyalty
            //     section = self.lifePipelineSectionProcessLoyalty;
            //     break;

            // case CycleType.lifeStatusType.ENUM.PRCSCH.status: // Process Checkin
            //     section = self.lifePipelineSectionProcessCheckin;
            //     break;

            case CycleType.lifeStatusType.ENUM.COMPLT.status: // Complete
                throw new Error('Cycle Life already marked as COMPLETE');

            case CycleType.lifeStatusType.ENUM.CNCLLD.status: // Cancelled
                throw new Error('Cannot process cycle marked as CANCELLED');

            default: // UNKNOWN STATUS
                throw new Error('Unknown status in cycle');
        }

        return section;
    };

    // -------------------------------------------------------------------------
    // UPDATE ORDER STATUS
    // -------------------------------------------------------------------------
    self.updateCycleStatus = function(status, auditNumber, auditMessage) {
        switch (status) {
            case CycleType.lifeStatusType.ENUM.OPEN.status: // Open
            case CycleType.lifeStatusType.ENUM.RDYPRCS.status: // Ready for Processing
            case CycleType.lifeStatusType.ENUM.PRCSGN.status: // Process Signal
            // case CycleType.lifeStatusType.ENUM.PRCSLO.status: // Process Loyalty
            // case CycleType.lifeStatusType.ENUM.PRCSCH.status: // Process Checkin
            case CycleType.lifeStatusType.ENUM.COMPLT.status: // Complete
            case CycleType.lifeStatusType.ENUM.CNCLLD.status: // Cancelled
                self.cycleLife.status = status;
                break;

            default: // UNKNOWN STATUS
                throw new Error('Cycle Life type \'4815\' does not support this status');
        }

        return self.cycleLife.save({ fields: ['status'] })
                .then(function() {
                    return self.audit(auditNumber, auditMessage);
                });
    };

};
