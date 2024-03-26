'use strict';

// brainwaveDevice.js (model)

var BrainwaveDeviceType = require('../metabolismTypes/brainwaveDeviceTypes');

var DEVICE_SERIAL_NUM_MAX_LENGTH = 100;
var DEVICE_DESCRIPTION_MAX_LENGTH = 255;
var DEVICE_FIELD_MINOR_MAX = 65535;

module.exports = function(sequelize, DataTypes) {
    var BrainwaveDevice = sequelize.define('BrainwaveDevice', {
        deviceId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        minor: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            validate: {
                isInt: {
                    msg: 'Field minor value must be an integer'
                },
                min: {
                    args: 0,
                    msg: 'Field minor value must be a positive number'
                },
                max: {
                    args: DEVICE_FIELD_MINOR_MAX,
                    msg: 'Field minor value must be less than or equal to ' + DEVICE_FIELD_MINOR_MAX
                }
            }
        },
        type: {
            type: DataTypes.CHAR( 3 ),
            allowNull: false,
            unique: 'deviceIndex',
            validate: {
                isIn: {
                    args: [ BrainwaveDeviceType.abbrs ],
                    msg: 'Brainwave device type is invalid'
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
                    msg: 'Brainwave device serial number must be inclusively between 1 and ' + DEVICE_SERIAL_NUM_MAX_LENGTH + ' characters in length'
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
                    msg: 'Brainwave device description can be no more than ' + DEVICE_DESCRIPTION_MAX_LENGTH + ' characters in length'
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
        tableName: 'brainwaveDevices', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                BrainwaveDevice.belongsTo(models.BrainwaveInstance, { foreignKey: 'instanceId' });
            },
            getMinorMax: function() {
                return DEVICE_FIELD_MINOR_MAX;
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

    return BrainwaveDevice;
};
