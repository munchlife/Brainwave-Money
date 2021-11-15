'use strict';

// gene.js (model)

var CountryCodes = require('../data/countryCodes');

var GENE_NAME_MAX_LENGTH = 255;
var GENE_COMPANY_NAME_MAX_LENGTH = 255;
var GENE_URL_MAX_LENGTH = 255;
var GENE_SUPPORT_EMAIL_MAX_LENGTH = 255;
var GENE_SUPPORT_VERSION_MAX_LENGTH = 15;

module.exports = function(sequelize, DataTypes) {
    var Gene = sequelize.define('Gene', {
        geneId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        // TODO: verify control of gene through manual contact (phone call/snail mail/etc)
        verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        geneType: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            validate: {
                isValidCombination: function(value) {
                    // TODO: define valid combination of gene types
                }
            }
        },
        geneName: {
            type: DataTypes.STRING( GENE_NAME_MAX_LENGTH ),
            allowNull: false,
            validate: {
                len: {
                    args: [ 1, GENE_NAME_MAX_LENGTH ],
                    msg: 'Gene name must be inclusively between 1 and ' + GENE_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        companyName: {
            type: DataTypes.STRING( GENE_COMPANY_NAME_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, GENE_COMPANY_NAME_MAX_LENGTH ],
                    msg: 'Gene company name can be no more than ' + GENE_COMPANY_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        website: {
            type: DataTypes.STRING( GENE_URL_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, GENE_URL_MAX_LENGTH ],
                    msg: 'Gene website address can be no more than ' + GENE_URL_MAX_LENGTH + ' characters in length'
                },
                isUrl: {
                    msg: 'Gene website must be a valid URL'
                }
            }
        },
        countryCode: {
            type: DataTypes.CHAR( 3 ),
            allowNull: false,
            validate: {
                isIn: {
                    args: [ CountryCodes.abbrs ],
                    msg: 'Gene country code is not in the approved set of countries'
                }
            }
        },
        supportEmail: {
            type: DataTypes.STRING( GENE_SUPPORT_EMAIL_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            unique: true,
            validate: {
                len: {
                    args: [ 1, GENE_SUPPORT_EMAIL_MAX_LENGTH ],
                    msg: 'Support email address can be no more than ' + GENE_SUPPORT_EMAIL_MAX_LENGTH + ' characters in length'
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
            type: DataTypes.STRING( GENE_URL_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, GENE_URL_MAX_LENGTH ],
                    msg: 'Support website can be no more than ' + GENE_URL_MAX_LENGTH + ' characters in length'
                },
                isUrl: {
                    msg: 'Support website must be a valid URL'
                }
            }
        },
        supportVersion: {
            type: DataTypes.STRING( GENE_SUPPORT_VERSION_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, GENE_SUPPORT_VERSION_MAX_LENGTH ],
                    msg: 'Support version can be no more than ' + GENE_SUPPORT_VERSION_MAX_LENGTH + ' characters in length'
                }
            }
        }
    }, {
        // timestamps: true,      // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,           // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true, // defaulted globally
        tableName: 'genes',    // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                Gene.hasMany(models.GeneStakeholder,        { as: 'StakeholderMembers',  foreignKey: 'geneId' });
                Gene.hasMany(models.GeneSignalPathway, { as: 'SignalPathways', foreignKey: 'geneId' });
                Gene.hasOne(models.Address,              { as: 'Address',       foreignKey: 'geneId' });
                Gene.hasMany(models.Phone,               { as: 'Phones',        foreignKey: 'geneId' });
                Gene.hasOne(models.GeneSetting,       { as: 'Settings',      foreignKey: 'geneId', onDelete: 'cascade' });
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

    return Gene;
};
