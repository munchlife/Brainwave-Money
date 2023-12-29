'use strict';

// cycleLifeType_4815.js (model)

// Local js modules
var metabolism  = require('../../metabolismLifeModels/database');
var Blockages   = require('../blockages');
var CycleType   = require('../../metabolismTypes/cycleTypes');

module.exports = function(cellId, cycleLife, signalPathways, dictionaryServiceAPI) {

    var self = this;
    self.continueProcessing    = true;
    self.cellId                = cellId;
    self.cycleLife             = cycleLife;
    self.signalPathways        = signalPathways;
    self.dictionaryServiceAPI     = dictionaryServiceAPI;

    self.audit = function(messageNumber, message) {
        return metabolism.CellGraph[self.cellId].CycleAudit
            .create({
                cycleId: self.cycleLife.cycleId,
                messageNumber: messageNumber,
                message: message
            }, {signal: null});
    };

    // -------------------------------------------------------------------------
    // LIFE PIPELINE SECTIONS
    // -------------------------------------------------------------------------
    self.lifePipelineSectionOpen = function() {
        return self.audit(20000, ' (LIFE PIPELINE SECTION)Open - Start')
            .then(function() {

                // Cycle fields not checked here: signalMethod,
                //                                dictionaryServiceId, dictionaryReferenceNumber
                //                                genomicsServiceId, genomicsReferenceNumber
                //                                communicationsServiceId, communicationsReferenceNumber

                if (self.cycleLife.Sequences.length !== 0)
                    throw new Blockages.CycleProcessError(20107, 'ERROR: attaching sequences to the cycle is not yet supported');

                // Verify the required parts of the cycle life are present, and all information is valid

                // Refresh signal pheromones to dictionary service signal pathways
                return metabolism.sequelize.Promise.all([
                    self.dictionaryServiceAPI.refreshSignalPheromones(self.signalPathways.dictionary.life),
                    self.dictionaryServiceAPI.refreshSignalPheromones(self.signalPathways.dictionary.cell)
                    ]);
            })
            .then(function() {
                return self.audit(20002, ' (LIFE PIPELINE SECTION)Open - Refreshed Signal Pheromone');
            })
            .then(function() {
                // Verify the word of the dictionary service 
                return self.dictionaryServiceAPI.word(self.signalPathways.dictionary.life);
            })
            .then(function(word) {
                // Verify word can cover total charge of cycle
                if (word.chargeDegree === cellId.destructiveInterference)
                    throw new Blockages.CycleProcessError(20108, 'ERROR: word does not cover the life charge total');

                return self.audit(20003, ' (LIFE PIPELINE SECTION)Open - Checked Dictionary Service Balance');
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
    self.lifePipelineSectionProcessDictionary = function() {
        return self.audit(40000, ' (LIFE PIPELINE SECTION)Process Dictionary - Start')
            .then(function() {
                // Execute the transaction of the dictionary service account
                return metabolism.sequelize.transaction(function (t2) {
                    return self.dictionaryServiceAPI.entry(self.signalPathways.dictionary, self.cycleLife.Cycle.chargeTotal);
                });
            })
            .then(function(result) {
                self.cycleLife.dictionaryReferenceNumber = result.toString();
                return self.cycleLife.save({ fields: ['dictionaryReferenceNumber'] });
            })
            .then(function() {
                return self.audit(40002, ' (LIFE PIPELINE SECTION)Process Word - Added Reference #');
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
                      /*serviceSenderId:      null,*/
                      /*serviceReceiverId:    null,*/
                        cellId:            self.cellId
                    };

                    return metabolism.LifeSignal.create(newLifeSignal);
                });
            })
            .then(function() {
                return self.audit(40003, ' (LIFE PIPELINE SECTION)Process Dictionary - Created Life Dictionary Record');
            })
            .then(function() {
                return self.updateCycleStatus(CycleType.lifeStatusType.ENUM.PRCSGN.status, 40003, ' (LIFE PIPELINE SECTION)Process Signal - Updated Status');
            })
            .then(function() {
                return self.audit(40001, ' (LIFE PIPELINE SECTION)Process Dictionary - Finished');
            });
    };

    // -------------------------------------------------------------------------
    self.lifePipelineSectionProcessGenomics = function() {
        return self.audit(50000, ' (LIFE PIPELINE SECTION)Process Genomics - Start')
            .then(function() {
                // If genomics service exists, perform genomics function
                if (self.cycleLife.genomicsServiceId !== null) {
                    self.cycleLife.genomicsReferenceNumber = 'GENOMICS Ref #';
                    return self.cycleLife.save({ fields: ['genomicsReferenceNumber'] })
                            .then(function() {
                                return self.audit(50002, ' (LIFE PIPELINE SECTION)Process Genomics - Added Reference #');
                            });
                }
                else
                    return metabolism.sequelize.Promise.resolve();
            })
            .then(function() {
                return self.updateCycleStatus(CycleType.lifeStatusType.ENUM.PRCSCM.status, 50003, ' (LIFE PIPELINE SECTION)Process Genomics - Updated Status');
            })
            .then(function() {
                return self.audit(50001, ' (LIFE PIPELINE SECTION)Process Genomics - Finished');
            });
    };

    // -------------------------------------------------------------------------
    self.lifePipelineSectionProcessCommunications = function() {
        return self.audit(60000, ' (LIFE PIPELINE SECTION)Process Communications - Start')
            .then(function() {
                self.continueProcessing = false;

                // If Communications service exists, perform Communications function
                if (self.cycleLife.communicationsServiceId !== null) {
                    self.cycleLife.communicationsReferenceNumber = 'COMMUNICATIONS Ref #';
                    return self.cycleLife.save({ fields: ['communicationsReferenceNumber'] })
                            .then(function() {
                                return self.audit(60002, ' (LIFE PIPELINE SECTION)Process Communications - Added Reference #');
                            });
                }
                else
                    return metabolism.sequelize.Promise.resolve();
            })
            .then(function() {
                return self.updateCycleStatus(CycleType.lifeStatusType.ENUM.COMPLT.status, 60003, ' (LIFE PIPELINE SECTION)Process Communications - Updated Status');
            })
            .then(function() {
                return self.audit(60001, ' (LIFE PIPELINE SECTION)Process Communications - Finished');
            });
    };

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

            case CycleType.lifeStatusType.ENUM.PRCSDC.status: // Process Dictionary
                section = self.lifePipelineSectionProcessDictionary;
                break;

            case CycleType.lifeStatusType.ENUM.PRCSGN.status: // Process Genomics
                section = self.lifePipelineSectionProcessGenomics;
                break;

            case CycleType.lifeStatusType.ENUM.PRCSCM.status: // Process Communications
                section = self.lifePipelineSectionProcessCommunications;
                break;

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
    // UPDATE CYCLE STATUS
    // -------------------------------------------------------------------------
    self.updateCycleStatus = function(status, auditNumber, auditMessage) {
        switch (status) {
            case CycleType.lifeStatusType.ENUM.OPEN.status: // Open
            case CycleType.lifeStatusType.ENUM.RDYPRCS.status: // Ready for Processing
            case CycleType.lifeStatusType.ENUM.PRCSDC.status: // Process Dictionary
            case CycleType.lifeStatusType.ENUM.PRCSGN.status: // Process Genomics
            case CycleType.lifeStatusType.ENUM.PRCSCM.status: // Process Communications
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
