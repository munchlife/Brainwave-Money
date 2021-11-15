'use strict';

// CycleAudit.js (model)

var CYCLE_AUDIT_MESSAGE_MAX_LENGTH = 255;

module.exports = function(sequelize, DataTypes, cellId) {
    var CycleAudit = sequelize.define('CycleAudit_' + cellId, {
        cycleAuditId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        messageNumber: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            validate: {
                isInt: {
                    msg: 'Audit message number must be an integer'
                }
            }
        },
        message: {
            type: DataTypes.STRING( CYCLE_AUDIT_MESSAGE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, CYCLE_AUDIT_MESSAGE_MAX_LENGTH ],
                    msg: 'Audit message can be no more than ' + CYCLE_AUDIT_MESSAGE_MAX_LENGTH + ' characters in length'
                }
            }
        }
    }, {
        // timestamps: true,                    // defaulted globally
        // createdAt:  true,
        updatedAt: false,                       // audits should never be updated
        paranoid: true,                         // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,               // defaulted globally
        tableName: 'cycleAudits_' + cellId, // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                // Make associations without foreign key constraints; this avoids deadlock during cycle processing
                CycleAudit.belongsTo(models.Cycle,     { foreignKey: 'cycleId',     constraints: false });
                CycleAudit.belongsTo(models.CycleLife, { foreignKey: 'cycleLifeId', constraints: false });
            }
        },
        instanceMethods: {
        }
    });

    return CycleAudit;
};
