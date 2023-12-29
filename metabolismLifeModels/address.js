'use strict';

// address.js (model)

var ADDRESS_NAME_MAX_LENGTH = 100;
var ADDRESS_LINE_MAX_LENGTH = 255;
var ADDRESS_LOCALITY_MAX_LENGTH = 100;
var ADDRESS_REGION_MAX_LENGTH = 100;
var ADDRESS_POSTALCODE_MAX_LENGTH = 10;

module.exports = function(sequelize, DataTypes) {
    var Address = sequelize.define('Address', {
        addressId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING( ADDRESS_NAME_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, ADDRESS_NAME_MAX_LENGTH ],
                    msg: 'Address name can be no more than ' + ADDRESS_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        address1: { // i.e. brain; chromosome #; body part i.e. torso
            type: DataTypes.STRING( ADDRESS_LINE_MAX_LENGTH ),
            allowNull: false,
            validate: {
                len: {
                    args: [ 1, ADDRESS_LINE_MAX_LENGTH ],
                    msg: 'Address line 1 must be inclusively between 1 and ' + ADDRESS_LINE_MAX_LENGTH + ' characters in length'
                }
            }
        },
        address2: {
            type: DataTypes.STRING( ADDRESS_LINE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, ADDRESS_LINE_MAX_LENGTH ],
                    msg: 'Address line 2 can be no more than ' + ADDRESS_LINE_MAX_LENGTH + ' characters in length'
                }
            }
        },
        address3: {
            type: DataTypes.STRING( ADDRESS_LINE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, ADDRESS_LINE_MAX_LENGTH ],
                    msg: 'Address line 3 can be no more than ' + ADDRESS_LINE_MAX_LENGTH + ' characters in length'
                }
            }
        },
        address4: {
            type: DataTypes.STRING( ADDRESS_LINE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, ADDRESS_LINE_MAX_LENGTH ],
                    msg: 'Address line 4 can be no more than ' + ADDRESS_LINE_MAX_LENGTH + ' characters in length'
                }
            }
        },
        locality: { // i.e. hypothalamus
            type: DataTypes.STRING( ADDRESS_LOCALITY_MAX_LENGTH ),
            allowNull: false,
            validate: {
                len: {
                    args: [ 1, ADDRESS_LOCALITY_MAX_LENGTH ],
                    msg: 'Locality must be inclusively between 1 and ' + ADDRESS_LOCALITY_MAX_LENGTH + ' characters in length'
                }
            }
        },
        // TODO: consider adding field
        subLocality: { // i.e. paraventricular nucleus, supraoptic nucleus, suprachiasmatic nucleus etc
            type: DataTypes.STRING(ADDRESS_LOCALITY_MAX_LENGTH),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, ADDRESS_LOCALITY_MAX_LENGTH ],
                    msg: 'Sub-locality can be no more than ' + ADDRESS_LOCALITY_MAX_LENGTH + ' characters in length'
                }
            }
        },
        // TODO: check on size of region for abbr
        region: { // i.e. frontal lobe, parietal lobe, temporal lobe, occipital lobe; telomeres, centromere etc; epigastrium etc
            type: DataTypes.STRING( ADDRESS_REGION_MAX_LENGTH ),
            allowNull: false,
            validate: {
                len: {
                    args: [ 1, ADDRESS_REGION_MAX_LENGTH ],
                    msg: 'Region must be inclusively between 1 and ' + ADDRESS_REGION_MAX_LENGTH + ' characters in length'
                }
            }
        },
        // TODO: consider adding field
        subRegion: { // i.e. lateral part, polar part, orbital part, medial part; i.e. sub telomere 
            type: DataTypes.STRING(ADDRESS_REGION_MAX_LENGTH),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, ADDRESS_REGION_MAX_LENGTH ],
                    msg: 'Sub-region can be no more than ' + ADDRESS_REGION_MAX_LENGTH + ' characters in length'
                }
            }
        },
        postalCode: {
            type: DataTypes.STRING( ADDRESS_POSTALCODE_MAX_LENGTH ),
            allowNull: false,
            validate: {
                len: {
                    args: [ 1, ADDRESS_POSTALCODE_MAX_LENGTH ],
                    msg: 'Postal code must be inclusively between 1 and ' + ADDRESS_POSTALCODE_MAX_LENGTH + ' characters in length'
                }
            }
        }
    }, {
        // timestamps: true,      // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,           // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true, // defaulted globally
        tableName: 'addresses',   // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                Address.belongsTo(models.Life,           { foreignKey: 'lifeId' });
                Address.belongsTo(models.Cell,           { foreignKey: 'cellId' });
                Address.belongsTo(models.CellInstance,   { foreignKey: 'instanceId' });
                Address.belongsTo(models.Service,           { foreignKey: 'serviceId' });
                Address.belongsTo(models.ChargeCell,     { foreignKey: 'chargeCellId' });
                Address.belongsTo(models.ChargeInstance, { foreignKey: 'chargeInstanceId' });
            },
            extractName: function(metabolism, value) {
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
            }
        },
        instanceMethods: {
        }
    });

    return Address;
};
