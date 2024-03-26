'use strict';

// chargeBrainwave.js (model)

var CountryCodes = require('../metabolismTypes/countryCodes');

var BRAINWAVE_NAME_MAX_LENGTH = 255;
var BRAINWAVE_WEBSITE_MAX_LENGTH = 255;

module.exports = function(sequelize, DataTypes) {
    var ChargeBrainwave = sequelize.define('ChargeBrainwave', {
        chargeBrainwaveId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING( BRAINWAVE_NAME_MAX_LENGTH ),
            allowNull: false,
            validate: {
                len: {
                    args: [ 1, BRAINWAVE_NAME_MAX_LENGTH ],
                    msg: 'Charge brainwave name must be inclusively between 1 and ' + BRAINWAVE_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        type : {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            validate: {
                isIn: {
                    args: [[ 4815 ]],
                    msg: 'Charge brainwave type is not in the approved set of category numbers'
                }
            }
        },
        website: {
            type: DataTypes.STRING( MERCHANT_WEBSITE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, MERCHANT_WEBSITE_MAX_LENGTH ],
                    msg: 'Charge brainwave website address can be no more than ' + MERCHANT_WEBSITE_MAX_LENGTH + ' characters in length'
                },
                isUrl: {
                    msg: 'Charge brainwave website must be a valid URL'
                }
            }
        },
        countryCode: {
            type: DataTypes.CHAR( 3 ),
            allowNull: false,
            validate: {
                isIn: {
                    args: [ CountryCodes.abbrs ],
                    msg: 'Charge brainwave country code is not in the approved set of countries'
                }
            }
        }
    }, {
        // timestamps: true,          // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,               // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,     // defaulted globally
        tableName: 'chargeBrainwaves', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                ChargeBrainwave.hasMany(models.ChargeInstance, { as: 'Instances', foreignKey: 'chargeBrainwaveId' });
                ChargeBrainwave.hasMany(models.Charge,         { as: 'Bounties',  foreignKey: 'chargeBrainwaveId' });
                ChargeBrainwave.hasOne(models.Address,         { as: 'Address',   foreignKey: 'chargeBrainwaveId' });
                ChargeBrainwave.hasMany(models.Phone,          { as: 'Phones',    foreignKey: 'chargeBrainwaveId' });
            },
            extractType: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractWebsite: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            }
        },
        instanceMethods: {
        }
    });

    return ChargeBrainwave;
};
