'use strict';

// cycleLife.js (model)

var CycleType = require('../metabolismTypes/cycleTypes');

module.exports = function(sequelize, DataTypes, cellId) {
    var CycleLife = sequelize.define('CycleLife_' + cellId, {
        cycleLifeId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        lifeId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            // reference: 'lifes',
            // referencesKey: 'lifeId'
            // FOREIGN KEY (`lifeId`) REFERENCES lifes (`lifeId`)
        },
        outsiderId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            // reference: 'outsiders',
            // referencesKey: 'outsiderId'
            // FOREIGN KEY (`outsiderId`) REFERENCES outsiders (`outsiderId`)
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
            }
        },
        signalMethod: {
            type: DataTypes.CHAR(4),
            allowNull: false,
            validate: {
                isIn: {
                    args: [ CycleType.signalMethodType.abbrs ],
                    msg: 'Signal method is invalid'
                }
            }
        },
        dictionaryServiceId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            // reference: 'services',
            // referencesKey: 'serviceId'
            // FOREIGN KEY (`serviceId`) REFERENCES services (`serviceId`)
        },
        dictionaryReferenceNumber: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        genomicsServiceId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            // reference: 'services',
            // referencesKey: 'serviceId'
            // FOREIGN KEY (`serviceId`) REFERENCES services (`serviceId`)
        },
        genomicsReferenceNumber: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        communicationsServiceId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            // reference: 'services',
            // referencesKey: 'serviceId'
            // FOREIGN KEY (`serviceId`) REFERENCES services (`serviceId`)
        },
        communicationsReferenceNumber: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        }
    }, {
        // timestamps: true,                   // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,                        // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,              // defaulted globally
        tableName: 'cycleLifes_' + cellId, // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                CycleLife.belongsTo(models.Cycle,       { as: 'Cycle',     foreignKey: 'cycleId' });
                CycleLife.hasMany(models.CycleSequence, { as: 'Sequences', foreignKey: 'cycleLifeId' });
                CycleLife.hasMany(models.CycleAudit,    { as: 'Audits',    foreignKey: 'cycleLifeId', constraints: false });
            },
            extractId: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.toInt(value);
                if (isNaN(value))
                    value = null;

                return value;
            }
        },
        instanceMethods: {
        }
    });

    return CycleLife;
};
