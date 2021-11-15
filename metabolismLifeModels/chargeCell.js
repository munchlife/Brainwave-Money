'use strict';

// chargeCell.js (model)

var CountryCodes = require('../data/countryCodes');

var MERCHANT_NAME_MAX_LENGTH = 255;
var MERCHANT_WEBSITE_MAX_LENGTH = 255;

module.exports = function(sequelize, DataTypes) {
    var ChargeCell = sequelize.define('ChargeCell', {
        chargeCellId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING( MERCHANT_NAME_MAX_LENGTH ),
            allowNull: false,
            validate: {
                len: {
                    args: [ 1, MERCHANT_NAME_MAX_LENGTH ],
                    msg: 'Charge cell name must be inclusively between 1 and ' + MERCHANT_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        type : {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            validate: {
                isIn: {
                    args: [[ 5814 ]],
                    msg: 'Charge cell type is not in the approved set of MCC numbers'
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
                    msg: 'Charge cell website address can be no more than ' + MERCHANT_WEBSITE_MAX_LENGTH + ' characters in length'
                },
                isUrl: {
                    msg: 'Charge cell website must be a valid URL'
                }
            }
        },
        countryCode: {
            type: DataTypes.CHAR( 3 ),
            allowNull: false,
            validate: {
                isIn: {
                    args: [ CountryCodes.abbrs ],
                    msg: 'Charge cell country code is not in the approved set of countries'
                }
            }
        }
    }, {
        // timestamps: true,          // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,               // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,     // defaulted globally
        tableName: 'chargeCells', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                ChargeCell.hasMany(models.ChargeInstance, { as: 'Instances', foreignKey: 'chargeCellId' });
                ChargeCell.hasMany(models.Charge,         { as: 'Bounties',  foreignKey: 'chargeCellId' });
                ChargeCell.hasOne(models.Address,         { as: 'Address',   foreignKey: 'chargeCellId' });
                ChargeCell.hasMany(models.Phone,          { as: 'Phones',    foreignKey: 'chargeCellId' });
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

    return ChargeCell;
};
