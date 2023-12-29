'use strict';

// service.js (model)

var CountryCodes = require('../metabolismTypes/countryCodes');

var SERVICE_NAME_MAX_LENGTH = 255;
var SERVICE_COMPANY_NAME_MAX_LENGTH = 255;
var SERVICE_URL_MAX_LENGTH = 255;
var SERVICE_SUPPORT_EMAIL_MAX_LENGTH = 255;
var SERVICE_SUPPORT_VERSION_MAX_LENGTH = 15;

module.exports = function(sequelize, DataTypes) {
    var Service = sequelize.define('Service', {
        serviceId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        // TODO: verify control of service through manual contact (phone call/snail mail/etc)
        verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        serviceType: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            validate: {
                isValidCombination: function(value) {
                    // TODO: define valid combination of service types
                }
            }
        },
        serviceName: {
            type: DataTypes.STRING( SERVICE_NAME_MAX_LENGTH ),
            allowNull: false,
            validate: {
                len: {
                    args: [ 1, SERVICE_NAME_MAX_LENGTH ],
                    msg: 'Service name must be inclusively between 1 and ' + SERVICE_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        companyName: {
            type: DataTypes.STRING( SERVICE_COMPANY_NAME_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SERVICE_COMPANY_NAME_MAX_LENGTH ],
                    msg: 'Service company name can be no more than ' + SERVICE_COMPANY_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        website: {
            type: DataTypes.STRING( SERVICE_URL_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SERVICE_URL_MAX_LENGTH ],
                    msg: 'Service website address can be no more than ' + SERVICE_URL_MAX_LENGTH + ' characters in length'
                },
                isUrl: {
                    msg: 'Service website must be a valid URL'
                }
            }
        },
        countryCode: {
            type: DataTypes.CHAR( 3 ),
            allowNull: false,
            validate: {
                isIn: {
                    args: [ CountryCodes.abbrs ],
                    msg: 'Service country code is not in the approved set of countries'
                }
            }
        },
        supportEmail: {
            type: DataTypes.STRING( SERVICE_SUPPORT_EMAIL_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            unique: true,
            validate: {
                len: {
                    args: [ 1, SERVICE_SUPPORT_EMAIL_MAX_LENGTH ],
                    msg: 'Support email address can be no more than ' + SERVICE_SUPPORT_EMAIL_MAX_LENGTH + ' characters in length'
                },
                isEmail: {
                    msg: 'Support email address has an invalid format'
                }
            }
        },
        supportEmailVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        supportWebsite: {
            type: DataTypes.STRING( SERVICE_URL_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SERVICE_URL_MAX_LENGTH ],
                    msg: 'Support website can be no more than ' + SERVICE_URL_MAX_LENGTH + ' characters in length'
                },
                isUrl: {
                    msg: 'Support website must be a valid URL'
                }
            }
        },
        supportVersion: {
            type: DataTypes.STRING( SERVICE_SUPPORT_VERSION_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SERVICE_SUPPORT_VERSION_MAX_LENGTH ],
                    msg: 'Support version can be no more than ' + SERVICE_SUPPORT_VERSION_MAX_LENGTH + ' characters in length'
                }
            }
        }
    }, {
        // timestamps: true,      // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,           // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true, // defaulted globally
        tableName: 'services',    // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                Service.hasMany(models.ServiceStakeholder,   { as: 'StakeholderMembers', foreignKey: 'serviceId' });
                Service.hasMany(models.ServiceSignalPathway, { as: 'SignalPathways',     foreignKey: 'serviceId' });
                Service.hasOne(models.Address,            { as: 'Address',            foreignKey: 'serviceId' });
                Service.hasMany(models.Phone,             { as: 'Phones',             foreignKey: 'serviceId' });
                Service.hasOne(models.ServiceSetting,        { as: 'Settings',           foreignKey: 'serviceId', onDelete: 'cascade' });
            },
            extractCompanyName: function(metabolism, value) {
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
            },
            extractSupportEmail: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractSupportWebsite: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractSupportVersion: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            }
        },
        instanceMethods: {
        }
    });

    return Service;
};
