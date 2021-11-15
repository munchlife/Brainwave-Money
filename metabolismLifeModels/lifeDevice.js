'use strict';

// lifeDevice.js (model)

var LifeDeviceType = require('../data/lifeDeviceTypes');

var DEVICE_SERIAL_NUM_MAX_LENGTH = 100;
var DEVICE_DESCRIPTION_MAX_LENGTH = 255;

module.exports = function(sequelize, DataTypes) {
    var LifeDevice = sequelize.define('LifeDevice', {
        deviceId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: DataTypes.CHAR( 3 ),
            allowNull: false,
            unique: 'deviceIndex',
            validate: {
                isIn: {
                    args: [ LifeDeviceType.abbrs ],
                    msg: 'Life device type is invalid'
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
                    msg: 'Life device serial number must be inclusively between 1 and ' + DEVICE_SERIAL_NUM_MAX_LENGTH + ' characters in length'
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
                    msg: 'Life device description can be no more than ' + DEVICE_DESCRIPTION_MAX_LENGTH + ' characters in length'
                }
            }
        }
    }, {
        // timestamps: true,      // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,           // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true, // defaulted globally
        tableName: 'lifeDevices', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                LifeDevice.belongsTo(models.Life, { foreignKey: 'lifeId' });
            },
            extractDescription: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            }
        },
        instanceMethods: {
        }
    });

    return LifeDevice;
};
