'use strict';

// CycleSequence.js (model)

// TODO: add validate functions for individual fields

module.exports = function(sequelize, DataTypes, cellId) {
    var CycleSequence = sequelize.define('CycleSequence_' + cellId, {
        cycleSequenceId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        parentSequenceId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            // reference: 'cycleSequences',
            // referencesKey: 'cycleSequenceId'
            // FOREIGN KEY (`cycleSequenceId`) REFERENCES cycleSequences (`cycleSequenceId`)
        },
        productId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            // reference: 'products',
            // referencesKey: 'productId'
            // FOREIGN KEY (`productId`) REFERENCES products (`productId`)
        },
        productName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
            validate: {
            }
        },
        position: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            validate: {
            }
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
            }
        },
        charge: {
            type: DataTypes.DECIMAL(19,2),
            allowNull: false,
            validate: {
                isFloat: {
                    msg: 'Charge must be a number'
                },
                min: {
                    args: 0.0,
                    msg: 'Charge must be greater than or equal to 0'
                }
            }
        },
        unit: { // unit of measure where appropriate
            type: DataTypes.DECIMAL(19,2),
            allowNull: true,
            defaultValue: null,
            validate: {
            }
        },
        quantity: {
            type: DataTypes.DECIMAL(19,2),
            allowNull: false,
            validate: {
                isFloat: {
                    msg: 'Quantity value must be a number'
                },
                min: {
                    args: 0.0,
                    msg: 'Quantity value must be greater than or equal to 0'
                }
            }
        }
    }, {
        // timestamps: true,                   // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,                        // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,              // defaulted globally
        tableName: 'cycleSequences_' + cellId, // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                CycleSequence.belongsTo(models.Cycle,     { foreignKey: 'cycleId' });
                CycleSequence.belongsTo(models.CycleLife, { foreignKey: 'cycleLifeId' });
            },
            extractId: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.toInt(value);
                if (isNaN(value))
                    value = null;

                return value;
            },
            extractPosition: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.toInt(value);
                if (isNaN(value))
                    value = null;

                return value;
            },
        },
        instanceMethods: {
        }
    });

    return CycleSequence;
};
