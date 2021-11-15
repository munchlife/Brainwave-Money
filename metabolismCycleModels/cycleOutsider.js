'use strict';

// lifeOutsider.js (model)

var CYCLE_OUTSIDER_NAME_MAX_LENGTH = 255;
var CYCLE_OUTSIDER_PHONE_MAX_LENGTH = 15;
var CYCLE_OUTSIDER_EXTENSION_MAX_LENGTH = 10;
var CYCLE_OUTSIDER_ADDRESS_LINE_MAX_LENGTH = 255;
var CYCLE_OUTSIDER_ADDRESS_LOCALITY_MAX_LENGTH = 100;
var CYCLE_OUTSIDER_ADDRESS_REGION_MAX_LENGTH = 10;
var CYCLE_OUTSIDER_ADDRESS_POSTALCODE_MAX_LENGTH = 10;

module.exports = function(sequelize, DataTypes, cellId) {
    var CycleOutsider = sequelize.define('CycleOutsider_' + cellId, {
        cycleOutsiderId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        givenName: {
            type: DataTypes.STRING( CYCLE_OUTSIDER_NAME_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, CYCLE_OUTSIDER_NAME_MAX_LENGTH ],
                    msg: 'Given name can be no more than ' + CYCLE_OUTSIDER_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        familyName: {
            type: DataTypes.STRING( CYCLE_OUTSIDER_NAME_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, CYCLE_OUTSIDER_NAME_MAX_LENGTH ],
                    msg: 'Family name can be no more than ' + CYCLE_OUTSIDER_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        phone: {
            type: DataTypes.STRING( CYCLE_OUTSIDER_PHONE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            unique: true,
            validate: {
                len: {
                    args: [ 1, CYCLE_OUTSIDER_PHONE_MAX_LENGTH ],
                    msg: 'Phone number can be no more than ' + CYCLE_OUTSIDER_PHONE_MAX_LENGTH + ' digits in length'
                // },
                // isPhone: {
                //     args: this.countryCode,
                //     msg: 'Phone number has an invalid format for the associated country code'
                }
            }
        },
        extension: {
            type: DataTypes.STRING( CYCLE_OUTSIDER_EXTENSION_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, CYCLE_OUTSIDER_EXTENSION_MAX_LENGTH ],
                    msg: 'Phone number extension can be no more than ' + CYCLE_OUTSIDER_EXTENSION_MAX_LENGTH + ' digits in length'
                },
                isNumeric: {
                    msg: 'Phone number extension can only contain numeric characters'
                }
            }

        },
        address1: { // street
            type: DataTypes.STRING( CYCLE_OUTSIDER_ADDRESS_LINE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, CYCLE_OUTSIDER_ADDRESS_LINE_MAX_LENGTH ],
                    msg: 'Address line 1 can be no more than ' + CYCLE_OUTSIDER_ADDRESS_LINE_MAX_LENGTH + ' characters in length'
                }
            }
        },
        address2: {
            type: DataTypes.STRING( CYCLE_OUTSIDER_ADDRESS_LINE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, CYCLE_OUTSIDER_ADDRESS_LINE_MAX_LENGTH ],
                    msg: 'Address line 2 can be no more than ' + CYCLE_OUTSIDER_ADDRESS_LINE_MAX_LENGTH + ' characters in length'
                }
            }
        },
        address3: {
            type: DataTypes.STRING( CYCLE_OUTSIDER_ADDRESS_LINE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, CYCLE_OUTSIDER_ADDRESS_LINE_MAX_LENGTH ],
                    msg: 'Address line 3 can be no more than ' + CYCLE_OUTSIDER_ADDRESS_LINE_MAX_LENGTH + ' characters in length'
                }
            }
        },
        address4: {
            type: DataTypes.STRING( CYCLE_OUTSIDER_ADDRESS_LINE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, CYCLE_OUTSIDER_ADDRESS_LINE_MAX_LENGTH ],
                    msg: 'Address line 4 can be no more than ' + CYCLE_OUTSIDER_ADDRESS_LINE_MAX_LENGTH + ' characters in length'
                }
            }
        },
        locality: { // city
            type: DataTypes.STRING( CYCLE_OUTSIDER_ADDRESS_LOCALITY_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, CYCLE_OUTSIDER_ADDRESS_LOCALITY_MAX_LENGTH ],
                    msg: 'Locality (city) can be no more than ' + CYCLE_OUTSIDER_ADDRESS_LOCALITY_MAX_LENGTH + ' characters in length'
                }
            }
        },
        // TODO: check on size of region for abbr
        region: { // state
            type: DataTypes.STRING( CYCLE_OUTSIDER_ADDRESS_REGION_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, CYCLE_OUTSIDER_ADDRESS_REGION_MAX_LENGTH ],
                    msg: 'Region (state) can be no more than ' + CYCLE_OUTSIDER_ADDRESS_REGION_MAX_LENGTH + ' characters in length'
                }
            }
        },
        postalCode: {
            type: DataTypes.STRING( CYCLE_OUTSIDER_ADDRESS_POSTALCODE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, CYCLE_OUTSIDER_ADDRESS_POSTALCODE_MAX_LENGTH ],
                    msg: 'Postal can be no more than ' + CYCLE_OUTSIDER_ADDRESS_POSTALCODE_MAX_LENGTH + ' characters in length'
                }
            }
        }
    }, {
        // timestamps: true,                    // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,                         // adds deletedAt datetime (won't actually delete entries)
        // freezeTableName: true,               // defaulted globally
        tableName: 'cycleOutsiders_' + cellId, // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
            },
            extractName: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractPhone: function(metabolism, value, countryCode) {
                return metabolism.Sequelize.Validator.toPhone(value, countryCode);
            },
            extractExtension: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractAddress: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractLocality: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractRegion: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractPostalCode: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            }
        },
        instanceMethods: {
        }
    });

    return CycleOutsider;
};
