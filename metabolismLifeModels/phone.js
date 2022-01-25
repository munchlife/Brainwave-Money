'use strict';

// phone.js (model)

// http://www.itu.int/ITU-T/recommendations/rec.aspx?rec=E.164

var PHONE_NAME_MAX_LENGTH = 100;
var PHONE_NUMBER_MAX_LENGTH = 15;
var PHONE_EXTENSION_MAX_LENGTH = 10;

module.exports = function(sequelize, DataTypes) {
    var Phone = sequelize.define('Phone', {
        phoneId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING( PHONE_NAME_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, PHONE_NAME_MAX_LENGTH ],
                    msg: 'Phone number name can be no more than ' + PHONE_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        number: {
            type: DataTypes.STRING( PHONE_NUMBER_MAX_LENGTH ),
            allowNull: false,
            validate: {
                len: {
                    args: [ 1, PHONE_NUMBER_MAX_LENGTH ],
                    msg: 'Phone number must be inclusively between 1 and ' + PHONE_NUMBER_MAX_LENGTH + ' digits in length'
                }
            }
        },
        extension: {
            type: DataTypes.STRING( PHONE_EXTENSION_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, PHONE_EXTENSION_MAX_LENGTH ],
                    msg: 'Phone number extension can be no more than ' + PHONE_EXTENSION_MAX_LENGTH + ' digits in length'
                },
                isNumeric: {
                    msg: 'Phone number extension can only contain numeric characters'
                }
            }
        }
    }, {
        // timestamps: true,      // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,           // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true, // defaulted globally
        tableName: 'phones',      // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                Phone.belongsTo(models.Life,           { foreignKey: 'lifeId' });
                Phone.belongsTo(models.Cell,           { foreignKey: 'cellId' });
                Phone.belongsTo(models.CellInstance,   { foreignKey: 'instanceId' });
                Phone.belongsTo(models.Gene,           { foreignKey: 'geneId' });
                Phone.belongsTo(models.ChargeCell,     { foreignKey: 'chargeCellId' });
                Phone.belongsTo(models.ChargeInstance, { foreignKey: 'chargeInstanceId' });
            },
            extractName: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractExtension: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
        },
        instanceMethods: {
        }
    });

    return Phone;
};
