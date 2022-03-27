'use strict';

// cellCheckin.js (model)

var CheckinDeviceType = require('../metabolismTypes/checkinDeviceTypes');

var CHECKIN_FIELD_MAJOR_MAX     = 65535;
var CHECKIN_FIELD_MINOR_MAX     = 65535;
var CHECKIN_FIELD_PROXIMITY_MAX = 128;

module.exports = function(sequelize, DataTypes) {
    var CellCheckin = sequelize.define('CellCheckin', {
        checkinId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        field: {
            type: DataTypes.STRING(40),
            allowNull: false,
            validate: {
                isUUID: {
                    args: [ 4 ],
                    msg: 'field (UUID) is not in a UUIDv4 valid format'
                }
            }
        },
        major: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            validate: {
                isInt: {
                    msg: 'Field major value must be an integer'
                },
                min: {
                    args: 0,
                    msg: 'Field major value must be a positive number'
                },
                max: {
                    args: CHECKIN_FIELD_MAJOR_MAX,
                    msg: 'Field major value must be less than or equal to ' + CHECKIN_FIELD_MAJOR_MAX
                }
            }
        },
        minor: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            validate: {
                isInt: {
                    msg: 'Field minor value must be an integer'
                },
                min: {
                    args: 0,
                    msg: 'Field minor value must be a positive number'
                },
                max: {
                    args: CHECKIN_FIELD_MINOR_MAX,
                    msg: 'Field minor value must be less than or equal to ' + CHECKIN_FIELD_MINOR_MAX
                }
            }
        },
        proximity: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            validate : {
                isInt: {
                    msg: 'Field proximity value must be an integer'
                },
                min: {
                    args: 0,
                    msg: 'Field proximity value must be a positive number'
                },
                max: {
                    args: CHECKIN_FIELD_PROXIMITY_MAX,
                    msg: 'Field proximity value must be less than or equal to ' + CHECKIN_FIELD_PROXIMITY_MAX
                }
            }
        },
        deviceType: {
            type: DataTypes.CHAR( 3 ),
            allowNull: false,
            validate: {
                isIn: {
                    args: [ CheckinDeviceType.abbrs ],
                    msg: 'Checkin device type is invalid'
                }
            }
        }
        // The checkin time is auto-generated: 'updatedAt'
    }, {
        // timestamps: true,       // defaulted globally
        createdAt: false,
        // updatedAt:  true,
        paranoid: false,           // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,  // defaulted globally
        tableName: 'cellCheckins', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                CellCheckin.belongsTo(models.Life, { foreignKey: 'lifeId' });
            }
        },
        instanceMethods: {
        }
    });

    return CellCheckin;
};
