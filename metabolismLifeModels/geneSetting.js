'use strict';

// geneSettings.js (model)

var GENE_SETTINGS_URL_MAX_LENGTH = 255;
var GENE_SETTINGS_SCOPE_MAX_LENGTH = 255;
var GENE_SETTINGS_PATH_MAX_LENGTH = 255;

module.exports = function(sequelize, DataTypes) {
    var GeneSetting = sequelize.define('GeneSetting', {
        geneId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            // FUTURE 3.2.0 references: { model: sequelize.models.Gene, key: 'geneId' },
            references: 'genes',
            referencesKey: 'geneId',
            onDelete: 'CASCADE'
        },
        host: {
            type: DataTypes.STRING( GENE_SETTINGS_URL_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, GENE_SETTINGS_URL_MAX_LENGTH ],
                    msg: 'Gene host URL address can be no more than ' + GENE_SETTINGS_URL_MAX_LENGTH + ' characters in length'
                },
                isUrl: {
                    msg: 'Gene host URL must be a valid URL'
                }
            }
        },
        apiHost: {
            type: DataTypes.STRING( GENE_SETTINGS_URL_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, GENE_SETTINGS_URL_MAX_LENGTH ],
                    msg: 'Gene API host URL address can be no more than ' + GENE_SETTINGS_URL_MAX_LENGTH + ' characters in length'
                },
                isUrl: {
                    msg: 'Gene API host URL must be a valid URL'
                }
            }
        },
        sandboxHost: {
            type: DataTypes.STRING( GENE_SETTINGS_URL_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, GENE_SETTINGS_URL_MAX_LENGTH ],
                    msg: 'Gene sanmetabolismox host URL address can be no more than ' + GENE_SETTINGS_URL_MAX_LENGTH + ' characters in length'
                },
                isUrl: {
                    msg: 'Gene sanmetabolismox host URL must be a valid URL'
                }
            }
        },
        scope: {
            type: DataTypes.STRING( GENE_SETTINGS_SCOPE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, GENE_SETTINGS_SCOPE_MAX_LENGTH ],
                    msg: 'OAuth2 scope can be no more than ' + GENE_SETTINGS_SCOPE_MAX_LENGTH + ' characters in length'
                }
            }
        },
        signupPath: {
            type: DataTypes.STRING( GENE_SETTINGS_PATH_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, GENE_SETTINGS_PATH_MAX_LENGTH ],
                    msg: 'OAuth2 signup URL path can be no more than ' + GENE_SETTINGS_PATH_MAX_LENGTH + ' characters in length'
                }
            }
        },
        authenticatePath: {
            type: DataTypes.STRING( GENE_SETTINGS_PATH_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, GENE_SETTINGS_PATH_MAX_LENGTH ],
                    msg: 'OAuth2 authenticate URL path can be no more than ' + GENE_SETTINGS_PATH_MAX_LENGTH + ' characters in length'
                }
            }
        },
        refreshPath: {
            type: DataTypes.STRING( GENE_SETTINGS_PATH_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, GENE_SETTINGS_PATH_MAX_LENGTH ],
                    msg: 'OAuth2 refresh URL path can be no more than ' + GENE_SETTINGS_PATH_MAX_LENGTH + ' characters in length'
                }
            }
        },
        balancePath: {
            type: DataTypes.STRING( GENE_SETTINGS_PATH_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, GENE_SETTINGS_PATH_MAX_LENGTH ],
                    msg: 'OAuth2 balance URL path can be no more than ' + GENE_SETTINGS_PATH_MAX_LENGTH + ' characters in length'
                }
            }
        },
        sendPath: {
            type: DataTypes.STRING( GENE_SETTINGS_PATH_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, GENE_SETTINGS_PATH_MAX_LENGTH ],
                    msg: 'OAuth2 send URL path can be no more than ' + GENE_SETTINGS_PATH_MAX_LENGTH + ' characters in length'
                }
            }
        },
        requestPath: {
            type: DataTypes.STRING( GENE_SETTINGS_PATH_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, GENE_SETTINGS_PATH_MAX_LENGTH ],
                    msg: 'OAuth2 request URL path can be no more than ' + GENE_SETTINGS_PATH_MAX_LENGTH + ' characters in length'
                }
            }
        },
        deauthenticatePath: {
            type: DataTypes.STRING( GENE_SETTINGS_PATH_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, GENE_SETTINGS_PATH_MAX_LENGTH ],
                    msg: 'OAuth2 deauthorization URL path can be no more than ' + GENE_SETTINGS_PATH_MAX_LENGTH + ' characters in length'
                }
            }
        }
    }, {
        // timestamps: true,          // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,               // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,     // defaulted globally
        tableName: 'geneSettings', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                // geneId foreign key reference handled above in field definition
              //GeneSetting.belongsTo(models.Setting, { foreignKey: 'geneId' });
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

    return GeneSetting;
};
