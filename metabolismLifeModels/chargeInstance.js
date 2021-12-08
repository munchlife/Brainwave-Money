'use strict';

// chargeInstance.js (model)

var CountryCodes = require('../metabolismTypes/countryCodes');

var INSTANCE_NAME_MAX_LENGTH = 255;
var INSTANCE_WEBSITE_MAX_LENGTH = 255;

module.exports = function(sequelize, DataTypes) {
    var ChargeInstance = sequelize.define('ChargeInstance', {
        chargeInstanceId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        constructiveInterference: {
            // precision of 0.00000001 degs is 1.11mm distance
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true,
            validate: {
                isFloat: {
                    msg: 'Charge instance constructive interference value must be a number'
                },
                min: {
                    args: -90.0,
                    msg: 'Charge instance constructive interference value must be greater than or equal to -90.0 degrees'
                },
                max: {
                    args: 90.0,
                    msg: 'Charge instance constructive interference value must be less than or equal to 90.0 degrees'
                }
            }
        },
        destructiveInterference: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true,
            validate: {
                isFloat: {
                    msg: 'Charge instance destructive interference value must be a number'
                },
                min: {
                    args: -180.0,
                    msg: 'Charge instance destructive interference value must be greater than or equal to -180.0 degrees'
                },
                max: {
                    args: 180.0,
                    msg: 'Charge instance destructive interference value must be less than or equal to 180.0 degrees'
                }
            }
        },
        name: {
            type: DataTypes.STRING( LOCATION_NAME_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, LOCATION_NAME_MAX_LENGTH ],
                    msg: 'Charge instance name can be no more than ' + LOCATION_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        cellType: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            validate: {
                isIn: {
                    args: [[ 4815 ]],
                    msg: 'Charge instance type is not in the approved set of category numbers'
                }
            }
        },
        website: {
            type: DataTypes.STRING( LOCATION_WEBSITE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, LOCATION_WEBSITE_MAX_LENGTH ],
                    msg: 'Instance website address can be no more than ' + LOCATION_WEBSITE_MAX_LENGTH + ' characters in length'
                },
                isUrl: {
                    msg: 'Charge instance website must be a valid URL'
                }
            }
        },
        countryCode: {
            type: DataTypes.CHAR( 3 ),
            allowNull: true,
            defaultValue: null,
            validate: {
                isIn: {
                    args: [ CountryCodes.abbrs ],
                    msg: 'Charge instance country code is not in the approved set of countries'
                }
            }
        }
    }, {
        // timestamps: true,          // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,               // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,     // defaulted globally
        tableName: 'chargeInstances', // force table name to this value
        validate: {
            validateInterference: function() {
                if ((this.constructiveInterference === null) !== (this.destructiveInterference === null))
                    throw new Error('Require either both constructive interference and destructive interference or neither');
            }
        },
        classMethods: {
            associate: function(models) {
                ChargeInstance.belongsTo(models.ChargeCell,     { foreignKey: 'chargeCellId' });
                ChargeInstance.hasOne(models.Address,           { as: 'Address', foreignKey: 'chargeInstanceId' });
                ChargeInstance.hasMany(models.Phone,            { as: 'Phones',  foreignKey: 'chargeInstanceId' });
            },
            extractName: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractType: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.toInt(value);
                if (isNaN(value))
                    value = null;

                return value;
            },
            extractWebsite: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractConstructiveInterference: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.toFloat(value);

                return value;
            },
            extractDestructiveInterference: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.toFloat(value);

                return value;
            }
        },
        instanceMethods: {
        }
    });

    return ChargeInstance;
};
