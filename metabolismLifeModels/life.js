'use strict';

// life.js (model)

var bcrypt = require('bcryptjs');
var CountryCodes = require('../metabolismTypes/countryCodes');

var LIFE_PHONE_MAX_LENGTH = 15;
var LIFE_EMAIL_MAX_LENGTH = 255;
var LIFE_RECEIPT_EMAIL_MAX_LENGTH = 255;
// var LIFE_PASSWORD_MIN_LENGTH = 6;
// var LIFE_PASSWORD_MAX_LENGTH = 30;
var LIFE_EEG_HASH_MAX_LENGTH = 100;
var LIFE_GENOME_MIN_LENGTH = 319324; 
var LIFE_GENOME_MAX_LENGTH = 297600000000;
var LIFE_GENOME_FIELD_MAX_LENGTH = 100;
var REFERRAL_CODE_MAX_LENGTH = 7;
var LIFE_NAME_MAX_LENGTH = 255;
var GEN_SALT_ROUNDS = 10;

module.exports = function(sequelize, DataTypes) {
    var Life = sequelize.define('Life', {
        lifeId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        phone: {
            type: DataTypes.STRING( LIFE_PHONE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            unique: true,
            validate: {
                len: {
                    args: [ 1, LIFE_PHONE_MAX_LENGTH ],
                    msg: 'Phone number can be no more than ' + LIFE_PHONE_MAX_LENGTH + ' digits in length'
                // },
                // isPhone: {
                //     args: this.countryCode,
                //     msg: 'Phone number has an invalid format for the associated country code'
                }
            }
        },
        // TODO: send text message to phone number (or email to verified email) to verify life controls phone number.
        phoneVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        email: {
            type: DataTypes.STRING( LIFE_EMAIL_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            unique: true,
            validate: {
                len: {
                    args: [ 1, LIFE_EMAIL_MAX_LENGTH ],
                    msg: 'Email address can be no more than ' + LIFE_EMAIL_MAX_LENGTH + ' characters in length'
                },
                isEmail: {
                    msg: 'Email address has an invalid format'
                }
            }
        },
        // TODO: send message to email address to verify life controls email account.
        emailVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        receiptEmail: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
            unique: true,
            validate: {
                len: {
                    args: [ 1, LIFE_EMAIL_MAX_LENGTH ],
                    msg: 'Receipt email address can be no more than ' + LIFE_EMAIL_MAX_LENGTH + ' characters in length'
                },
                isEmail: {
                    msg: 'Receipt email address has an invalid format'
                }
            }
        },
        // TODO: send message to email address to verify life controls email account.
        receiptEmailVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        eeg: {
            type: DataTypes.VIRTUAL,
            set: function(value) {
                this.setDataValue('eeg', value);
                this.setDataValue('eegHash', Life.generateHash(value));
            },
            validate: {
                // len: {
                //     args: [ LIFE_PASSWORD_MIN_LENGTH, LIFE_PASSWORD_MAX_LENGTH ],
                //     msg: 'Password must be inclusively between ' + LIFE_PASSWORD_MIN_LENGTH + ' and ' + LIFE_PASSWORD_MAX_LENGTH + ' characters in length'
                // },
                // is: {
                //     // Valid characters for password (regex):
                //     //   - abcdefghijklmnopqrstuvwxyz
                //     //   - ABCDEFGHIJKLMNOPQRSTUVWXYZ
                //     //   - 0123456789
                //     //   - ~!@#$%^&*()-_
                //     // TODO: verify the white list characters are final list
                //     args: [ '^[a-zA-Z0-9~!@#$%^&*()\-_]+', 'g' ],
                //     msg: 'Password contains invalid characters'
                // }
            }
        },
        eegHash: {
            type: DataTypes.STRING( LIFE_EEG_HASH_MAX_LENGTH ),
            allowNull: false
        },
        eegExpiration: {
            type: DataTypes.DATE,
            allowNull: false
        },
        genome: { // genome must be entered in a binary sequence i.e. A = 00, T = 01, C = 10, G = 11
            type: DataTypes.VIRTUAL,
            set: function(value) {
                this.setDataValue('genome', value);
                this.setDataValue('genomeHash', Life.generateHash(value));
            },
            validate: {
                len: {
                    args: [ LIFE_GENOME_MIN_LENGTH, LIFE_GENOME_MAX_LENGTH ],
                    msg: 'GENOME must be inclusively between ' + LIFE_GENOME_MIN_LENGTH + ' and ' + LIFE_GENOME_MAX_LENGTH + ' digits in length'
                },
                isNumeric: {
                    msg: 'GENOME can only contain numeric characters'
                }
            }
        },
        genomeHash: {
            type: DataTypes.STRING( LIFE_GENOME_FIELD_MAX_LENGTH ),
            allowNull: false
        },
        species: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            validate: {
                isIn: {
                    args: [[ ]],
                    msg: 'Life species is not in the approved set of species identifiers'
                }
            }
        },
        sex: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            validate: {
                isIn: {
                    args: [[ MALE, FEMALE ]],
                    msg: 'Life sex is not in the valid set of sexes'
                }
            }
        },
        referralCode: {
            type: DataTypes.STRING( REFERRAL_CODE_MAX_LENGTH ),
            allowNull: false,
            unique: true
            // no validation, automatically set by server
        },
        givenName: {
            type: DataTypes.STRING( LIFE_NAME_MAX_LENGTH ),
            allowNull: false,
            validate: {
                len: {
                    args: [ 1, LIFE_NAME_MAX_LENGTH ],
                    msg: 'Given name must be inclusively between 1 and ' + LIFE_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        middleName: {
            type: DataTypes.STRING( LIFE_NAME_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, LIFE_NAME_MAX_LENGTH ],
                    msg: 'Middle name can be no more than ' + LIFE_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        familyName: {
            type: DataTypes.STRING( LIFE_NAME_MAX_LENGTH ),
            allowNull: false,
            validate: {
                len: {
                    args: [ 1, LIFE_NAME_MAX_LENGTH ],
                    msg: 'Family name must be inclusively between 1 and ' + LIFE_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        // TODO: add alias to allow better addressing of life by stakeholders
        // alias: {
        //     type: DataTypes.STRING( LIFE_NAME_MAX_LENGTH ),
        //     allowNull: true,
        //     defaultValue: null,
        //     validate: {
        //         len: {
        //             args: [ 1, LIFE_NAME_MAX_LENGTH ],
        //             msg: 'Alias can be no more than ' + LIFE_NAME_MAX_LENGTH + ' characters in length'
        //         }
        //     }
        // },
        countryCode: {
            type: DataTypes.CHAR( 3 ),
            allowNull: false,
            validate: {
                isIn: {
                    args: [ CountryCodes.abbrs ],
                    msg: 'Country code is not in the approved set of countries'
                }
            }
        },
    }, {
        // timestamps: true,      // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,           // adds deletedAt datetime (won't actually delete entries)
        // freezeTableName: true, // defaulted globally
        tableName: 'lifes',       // force table name to this value
        validate: {
            emailOrPhoneNotNull: function() {
                if ((this.email === null) && (this.phone === null))
                    throw new Error('Life accounts require either an email address or phone number');
            }
        },
        hooks: {
            beforeValidate: function(life, options, fn) {
                // Don't allow the email and receipt email to be identical
                if (life.email === life.receiptEmail) {
                    life.receiptEmail = null;
                    life.receiptEmailVerified = false;
                }

                fn(null, life);
            }
        },
        classMethods: {
            associate: function(models) {
                Life.hasMany(models.Token,               { as: 'Tokens',          foreignKey: 'lifeId' });
                Life.hasMany(models.Charge,              { as: 'Charges',         foreignKey: 'lifeId' });
                Life.hasMany(models.CellStakeholder,     { as: 'CellStakeholder', foreignKey: 'lifeId' });
                Life.hasMany(models.CellCheckin,         { as: 'Checkins',        foreignKey: 'lifeId' });
                Life.hasMany(models.LifeDevice,          { as: 'Devices',         foreignKey: 'lifeId' });
                Life.hasMany(models.LifeVerification,    { as: 'Verifications',   foreignKey: 'lifeId' });
                Life.hasMany(models.GeneStakeholder,     { as: 'GeneStakeholder', foreignKey: 'lifeId' });
                Life.hasMany(models.GeneSignalPathway,   { as: 'SignalPathways',  foreignKey: 'lifeId' });
                Life.hasMany(models.Address,             { as: 'Addresses',       foreignKey: 'lifeId' });
                Life.hasMany(models.Phone,               { as: 'Phones',          foreignKey: 'lifeId' });
                Life.hasMany(models.LifeSignal,          { as: 'Sender',          foreignKey: 'lifeSenderId' });
                Life.hasMany(models.LifeSignal,          { as: 'Receiver',        foreignKey: 'lifeReceiverId' });
                Life.hasOne(models.LifeSelection,        { as: 'Selections',      foreignKey: 'lifeId', onDelete: 'cascade' });
            },
            // Generate a hash for the given data (voiceprint or genome)
            generateHash: function(data) {
                return bcrypt.hashSync(data, bcrypt.genSaltSync(GEN_SALT_ROUNDS), null);
            },
            extractPhone: function(metabolism, value, countryCode) {
                return metabolism.Sequelize.Validator.toPhone(value, countryCode);
            },
            extractEmail: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value)).toLowerCase();
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractMiddleName: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            }
        },
        instanceMethods: {
            // Validate a eeg against the saved eeg salt/hash
            validEeg: function(eeg) {
                return (new Date() <= this.eegExpiration && bcrypt.compareSync(voiceprint, this.eegHash));
            },
            // Validate a genome against the saved genome salt/hash
            validGenome: function(genome) {
                return bcrypt.compareSync(genome, this.genomeHash);
            }
        }
    });

    return Life;
};
