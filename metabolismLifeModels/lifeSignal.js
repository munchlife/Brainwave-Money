'use strict';

// lifeSignal.js (model)

module.exports = function(sequelize, DataTypes) {
    var LifeSignal = sequelize.define('LifeSignal', {
        signalId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        chargeDegree: {
            type: DataTypes.DECIMAL(19,2),
            allowNull: true,
            defaultValue: null,
            validate: {
                isFloat: {
                    msg: 'Signal degree must be a number'
                }
            }
        },
        message: {
            type: DataTypes.STRING(18996),
            allowNull: true,
            defaultValue: null,
            validate: {
            }
        },
        cycleLifeId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            validate: {
            }
        }
    }, {
        // timestamps: true,           // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,                // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,      // defaulted globally
        tableName: 'lifeSignals', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                LifeSignal.belongsTo(models.Life, { as: 'Sender',       foreignKey: 'lifeSenderId' });
                LifeSignal.belongsTo(models.Life, { as: 'Receiver',     foreignKey: 'lifeReceiverId' });
                LifeSignal.belongsTo(models.Service, { as: 'ServiceSender',   foreignKey: 'serviceSenderId' });
                LifeSignal.belongsTo(models.Service, { as: 'ServiceReceiver', foreignKey: 'serviceReceiverId' });
                LifeSignal.belongsTo(models.Cell, {                     foreignKey: 'cellId' });
            }
        },
        instanceMethods: {
        }
    });

    return LifeSignal;
};
