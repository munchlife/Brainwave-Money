'use strict';

// serviceSettings.js (model)

var SERVICE_SETTINGS_URL_MAX_LENGTH = 255;
var SERVICE_SETTINGS_SCOPE_MAX_LENGTH = 255;
var SERVICE_SETTINGS_PATH_MAX_LENGTH = 255;

module.exports = function(sequelize, DataTypes) {
    var ServiceSetting = sequelize.define('ServiceSetting', {
        serviceId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            // FUTURE 3.2.0 references: { model: sequelize.models.Service, key: 'serviceId' },
            references: 'services',
            referencesKey: 'serviceId',
            onDelete: 'CASCADE'
        },
        host: {
            type: DataTypes.STRING( SERVICE_SETTINGS_URL_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SERVICE_SETTINGS_URL_MAX_LENGTH ],
                    msg: 'Service host URL address can be no more than ' + SERVICE_SETTINGS_URL_MAX_LENGTH + ' characters in length'
                },
                isUrl: {
                    msg: 'Service host URL must be a valid URL'
                }
            }
        },
        apiHost: {
            type: DataTypes.STRING( SERVICE_SETTINGS_URL_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SERVICE_SETTINGS_URL_MAX_LENGTH ],
                    msg: 'Service API host URL address can be no more than ' + SERVICE_SETTINGS_URL_MAX_LENGTH + ' characters in length'
                },
                isUrl: {
                    msg: 'Service API host URL must be a valid URL'
                }
            }
        },
        sandboxHost: {
            type: DataTypes.STRING( SERVICE_SETTINGS_URL_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SERVICE_SETTINGS_URL_MAX_LENGTH ],
                    msg: 'Service sanmetabolismox host URL address can be no more than ' + SERVICE_SETTINGS_URL_MAX_LENGTH + ' characters in length'
                },
                isUrl: {
                    msg: 'Service sanmetabolismox host URL must be a valid URL'
                }
            }
        },
        scope: {
            type: DataTypes.STRING( SERVICE_SETTINGS_SCOPE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SERVICE_SETTINGS_SCOPE_MAX_LENGTH ],
                    msg: 'OAuth2 scope can be no more than ' + SERVICE_SETTINGS_SCOPE_MAX_LENGTH + ' characters in length'
                }
            }
        },
        signupPath: {
            type: DataTypes.STRING( SERVICE_SETTINGS_PATH_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SERVICE_SETTINGS_PATH_MAX_LENGTH ],
                    msg: 'OAuth2 signup URL path can be no more than ' + SERVICE_SETTINGS_PATH_MAX_LENGTH + ' characters in length'
                }
            }
        },
        authenticatePath: {
            type: DataTypes.STRING( SERVICE_SETTINGS_PATH_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SERVICE_SETTINGS_PATH_MAX_LENGTH ],
                    msg: 'OAuth2 authenticate URL path can be no more than ' + SERVICE_SETTINGS_PATH_MAX_LENGTH + ' characters in length'
                }
            }
        },
        refreshPath: {
            type: DataTypes.STRING( SERVICE_SETTINGS_PATH_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SERVICE_SETTINGS_PATH_MAX_LENGTH ],
                    msg: 'OAuth2 refresh URL path can be no more than ' + SERVICE_SETTINGS_PATH_MAX_LENGTH + ' characters in length'
                }
            }
        },
        balancePath: {
            type: DataTypes.STRING( SERVICE_SETTINGS_PATH_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SERVICE_SETTINGS_PATH_MAX_LENGTH ],
                    msg: 'OAuth2 balance URL path can be no more than ' + SERVICE_SETTINGS_PATH_MAX_LENGTH + ' characters in length'
                }
            }
        },
        sendPath: {
            type: DataTypes.STRING( SERVICE_SETTINGS_PATH_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SERVICE_SETTINGS_PATH_MAX_LENGTH ],
                    msg: 'OAuth2 send URL path can be no more than ' + SERVICE_SETTINGS_PATH_MAX_LENGTH + ' characters in length'
                }
            }
        },
        requestPath: {
            type: DataTypes.STRING( SERVICE_SETTINGS_PATH_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SERVICE_SETTINGS_PATH_MAX_LENGTH ],
                    msg: 'OAuth2 request URL path can be no more than ' + SERVICE_SETTINGS_PATH_MAX_LENGTH + ' characters in length'
                }
            }
        },
        deauthenticatePath: {
            type: DataTypes.STRING( SERVICE_SETTINGS_PATH_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SERVICE_SETTINGS_PATH_MAX_LENGTH ],
                    msg: 'OAuth2 deauthorization URL path can be no more than ' + SERVICE_SETTINGS_PATH_MAX_LENGTH + ' characters in length'
                }
            }
        }
    }, {
        // timestamps: true,          // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,               // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,     // defaulted globally
        tableName: 'serviceSettings', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                // serviceId foreign key reference handled above in field definition
              //ServiceSetting.belongsTo(models.Setting, { foreignKey: 'serviceId' });
            },
            extractHost: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractApiHost: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractSandboxHost: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractScope: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractSignupPath: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractAuthenticatePath: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractRefreshPath: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractBalancePath: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractSendPath: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractRequestPath: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractDeauthenticatePath: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            }
        },
        instanceMethods: {
        }
    });

    return ServiceSetting;
};
