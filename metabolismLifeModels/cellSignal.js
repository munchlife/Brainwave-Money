'use strict';

// cellSignal.js (model)

var SignalDeviceType = require('../metabolismTypes/signalDeviceTypes');

var SIGNAL_BEACON_ATLAS_MAX = 65535;
var SIGNAL_BEACON_MAP_MAX = 65535;
var SIGNAL_BEACON_PROXIMITY_MAX = 128;

module.exports = function(sequelize, DataTypes) {
    var CellSignal = sequelize.define('CellSignal', {
        signalId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        field: {
            type: DataTypes.STRING(40),
            allowNull: false,
            validate: {
                isUUID: {
                    args: [ 4 ],
                    msg: 'field (UUID) is not in a UUIDv4 valid format'
                }
            }
        },
        atlas: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            validate: {
                isInt: {
                    msg: 'Beacon atlas value must be an integer'
                },
                min: {
                    args: 0,
                    msg: 'Beacon atlas value must be a positive number'
                },
                max: {
                    args: SIGNAL_BEACON_ATLAS_MAX,
                    msg: 'Beacon atlas value must be less than or equal to ' + SIGNAL_BEACON_ATLAS_MAX
                }
            }
        },
        map: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            validate: {
                isInt: {
                    msg: 'Beacon map value must be an integer'
                },
                min: {
                    args: 0,
                    msg: 'Beacon map value must be a positive number'
                },
                max: {
                    args: SIGNAL_BEACON_MAP_MAX,
                    msg: 'Beacon map value must be less than or equal to ' + SIGNAL_BEACON_MAP_MAX
                }
            }
        },
        proximity: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            validate : {
                isInt: {
                    msg: 'Beacon proximity value must be an integer'
                },
                min: {
                    args: 0,
                    msg: 'Beacon proximity value must be a positive number'
                },
                max: {
                    args: SIGNAL_BEACON_PROXIMITY_MAX,
                    msg: 'Beacon proximity value must be less than or equal to ' + SIGNAL_BEACON_PROXIMITY_MAX
                }
            }
        },
        deviceType: {
            type: DataTypes.CHAR( 3 ),
            allowNull: false,
            validate: {
                isIn: {
                    args: [ SignalDeviceType.abbrs ],
                    msg: 'Signal device type is invalid'
                }
            }
        }
        // The signal time is auto-generated: 'updatedAt'
    }, {
        // timestamps: true,           // defaulted globally
        createdAt: false,
        // updatedAt:  true,
        paranoid: false,               // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,      // defaulted globally
        tableName: 'cellSignals', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                CellSignal.belongsTo(models.Life, { foreignKey: 'lifeId' });
            }
        },
        instanceMethods: {
        }
    });

    return CellSignal;
};
