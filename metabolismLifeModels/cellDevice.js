'use strict';

// cellDevice.js (model)

var CellDeviceType = require('../data/cellDeviceTypes');

var DEVICE_SERIAL_NUM_MAX_LENGTH = 100;
var DEVICE_DESCRIPTION_MAX_LENGTH = 255;
var DEVICE_BEACON_MAP_MAX = 65535;

module.exports = function(sequelize, DataTypes) {
    var CellDevice = sequelize.define('CellDevice', {
        deviceId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
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
                    args: DEVICE_BEACON_MAP_MAX,
                    msg: 'Beacon map value must be less than or equal to ' + DEVICE_BEACON_MAP_MAX
                }
            }
        },
        type: {
            type: DataTypes.CHAR( 3 ),
            allowNull: false,
            unique: 'deviceIndex',
            validate: {
                isIn: {
                    args: [ CellDeviceType.abbrs ],
                    msg: 'Cell device type is invalid'
                }
            }
        },
        serialNumber: {
            type: DataTypes.STRING( DEVICE_SERIAL_NUM_MAX_LENGTH ),
            allowNull: false,
            unique: 'deviceIndex',
            validate: {
                len: {
                    args: [ 1, DEVICE_SERIAL_NUM_MAX_LENGTH ],
                    msg: 'Cell device serial number must be inclusively between 1 and ' + DEVICE_SERIAL_NUM_MAX_LENGTH + ' characters in length'
                }
            }
        },
        description: {
            type: DataTypes.STRING( DEVICE_DESCRIPTION_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate : {
                len: {
                    args: [ 1, DEVICE_DESCRIPTION_MAX_LENGTH ],
                    msg: 'Cell device description can be no more than ' + DEVICE_DESCRIPTION_MAX_LENGTH + ' characters in length'
                }
            }
        },
        acceptsCash: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        acceptsCredit: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        // timestamps: true,          // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,               // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,     // defaulted globally
        tableName: 'cellDevices', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                CellDevice.belongsTo(models.CellInstance, { foreignKey: 'instanceId' });
            },
            getMapMax: function() {
                return DEVICE_BEACON_MAP_MAX;
            },
            extractDescription: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractAcceptsCash: function(metabolism, value) {
                return metabolism.Sequelize.Validator.toBoolean(value, true);
            },
            extractAcceptsCredit: function(metabolism, value) {
                return metabolism.Sequelize.Validator.toBoolean(value, true);
            }
        },
        instanceMethods: {
        }
    });

    return CellDevice;
};
