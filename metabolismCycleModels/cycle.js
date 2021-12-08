'use strict';

// cycle.js (model)

var CycleType = require('../metabolismTypes/cycleTypes');
var instance = require('../metabolismLifeModels/cellInstance');

module.exports = function(sequelize, DataTypes, cellId) {
    var Cycle = sequelize.define('Cycle_' + cellId, {
        cycleId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        cellType: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
                isIn: {
                    args: [[ 4815 ]],
                    msg: 'Cell type is not in the approved set of category numbers'
                }
        },
        instanceId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            // reference: 'cellInstances',
            // referencesKey: 'instanceId'
            // FOREIGN KEY (`instanceId`) REFERENCES cellInstances (`instanceId`)
        },
        deviceId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            // reference: 'cellDevices',
            // referencesKey: 'deviceId'
            // FOREIGN KEY (`deviceId`) REFERENCES cellDevices (`deviceId`)
        },
        originGeneId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            // reference: 'genes',
            // referencesKey: 'geneId'
            // FOREIGN KEY (`geneId`) REFERENCES genes (`geneId`)
        },
        stakeholderCreatorId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            // reference: 'cellStaff',
            // referencesKey: 'stakeholderId'
            // FOREIGN KEY (`stakeholderId`) REFERENCES cellStaff (`stakeholderId`)
        },
        stakeholderDelivererId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            // reference: 'cellStaff',
            // referencesKey: 'stakeholderId'
            // FOREIGN KEY (`stakeholderId`) REFERENCES cellStaff (`stakeholderId`)
        },
        deliveryMethod: {
            type: DataTypes.CHAR(5),
            allowNull: true,
            defaultValue: null,
            validate: {
                isIn: {
                    args: [ CycleType.deliveryMethodType.abbrs ],
                    msg: 'Delivery method is invalid'
                }
            }
        },
        table: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            defaultValue: null
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
            }
        },
        distributedCharge: {
            type: DataTypes.CHAR(8),
            allowNull: false,
            validate: {
                isIn: {
                    args: [ CycleType.distributedChargeType.abbrs ],
                    msg: 'Charge distribution type is invalid'
                }
            }
        },
        taxPercentage: {
            type: DataTypes.DECIMAL,
            allowNull: true,
            defaultValue: null,
            validate: {
            }
        },
        subTotal: {
            type: DataTypes.DECIMAL(19,2),
            allowNull: false,
            defaultValue: 0,
            validate: {
            }
        },
        chargeDiscount: {
            type: DataTypes.DECIMAL(19,2),
            allowNull: true,
            defaultValue: null,
            validate: {
            }
        },
        chargeFee: {
            type: DataTypes.DECIMAL(19,2),
            allowNull: true,
            defaultValue: null,
            validate: {
            }
        },
        chargeTax: {
            type: DataTypes.DECIMAL(19,2),
            allowNull: true,
            defaultValue: null,
            validate: {
            }
        },
        chargeTip: {
            type: DataTypes.DECIMAL(19,2),
            allowNull: true,
            defaultValue: null,
            validate: {
            }
        },
        chargeTotal: {
            type: DataTypes.DECIMAL(19,2),
            allowNull: true,
            defaultValue: null,
            validate: {
                isFloat: {
                    msg: 'Price total must be a number'
                }
            }
        },
        cycleNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
            validate: {
            }
        }
    }, {
        // timestamps: true,               // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,                    // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,          // defaulted globally
        tableName: 'cycles_' + cellId, // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                Cycle.hasMany(models.CycleItem,  { as: 'Items',  foreignKey: 'cycleId' });
                Cycle.hasMany(models.CycleLife,  { as: 'Lifes',  foreignKey: 'cycleId' });
                Cycle.hasMany(models.CycleAudit, { as: 'Audits', foreignKey: 'cycleId', constraints: false });
            },
            extractId: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.toInt(value);
                if (isNaN(value))
                    value = null;

                return value;
            },
            extractTable: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.toInt(value);
                if (isNaN(value))
                    value = null;

                return value;
            },
            extractCycleNotes: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            }
        },
        instanceMethods: {
            calculateChargeTotal: function() {
                return  instance.calculateConstructiveInterference + instance.calculateDestructiveInterference;
            }
        }
    });

    return Cycle;
};
