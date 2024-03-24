'use strict';

// cell.js (model)

var CountryCodes = require('../metabolismTypes/countryCodes');

var CELL_NAME_MAX_LENGTH = 255;
var CELL_WEBSITE_MAX_LENGTH = 255;

module.exports = function(sequelize, DataTypes) {
    var Cell = sequelize.define('Cell', {
        cellId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        // TODO: verify control of cell through manual contact (phone call/
        //       snail mail/etc); verify phone number through Google/Yelp/etc
        verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        name: {
            type: DataTypes.STRING( CELL_NAME_MAX_LENGTH ),
            allowNull: false,
            validate: {
                len: {
                    args: [ 1, CELL_NAME_MAX_LENGTH ],
                    msg: 'Cell name must be inclusively between 1 and ' + CELL_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        type: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            validate: {
                isIn: {
                    args: [[ 0780 ]],
                    msg: 'Cell type is not in the approved set of category numbers'
                }
            }
        },
        website: {
            type: DataTypes.STRING( CELL_WEBSITE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, CELL_WEBSITE_MAX_LENGTH ],
                    msg: 'Cell website can be no more than ' + CELL_WEBSITE_MAX_LENGTH + ' characters in length'
                },
                isUrl: {
                    msg: 'Cell website must be a valid URL'
                }
            }
        },
        countryCode: {
            type: DataTypes.CHAR( 3 ),
            allowNull: false,
            validate: {
                isIn: {
                    args: [ CountryCodes.abbrs ],
                    msg: 'Cell country code is not in the approved set of countries'
                }
            }
        }
    }, {
        // timestamps: true,      // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,           // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true, // defaulted globally
        tableName: 'cells',   // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                Cell.hasMany(models.CellInstance,      { as: 'Instances',          foreignKey: 'cellId' });
                Cell.hasMany(models.CellStakeholder,   { as: 'StakeholderMembers', foreignKey: 'cellId' });
                Cell.hasMany(models.ServiceSignalPathway, { as: 'SignalPathways',     foreignKey: 'cellId' });
                Cell.hasOne(models.Address,            { as: 'Address',            foreignKey: 'cellId' });
                Cell.hasMany(models.Phone,             { as: 'Phones',             foreignKey: 'cellId' });
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

    return Cell;
};
