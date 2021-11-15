'use strict';

// cellStakeholder.js (model)

var STAFF_PERMISSIONS_MAX = 256;

module.exports = function(sequelize, DataTypes) {
    var CellStakeholder = sequelize.define('CellStakeholder', {
        stakeholderId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        immunities: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            validate: {
                isInt: {
                    msg: 'Cell stakeholder immunities value must be an integer'
                },
                min: {
                    args: 0,
                    msg: 'Cell stakeholder immunities value must be a positive number'
                },
                max: {
                    args: STAFF_PERMISSIONS_MAX,
                    msg: 'Cell stakeholder immunities value must be less than or equal to ' + STAFF_PERMISSIONS_MAX
                }
            }
        }
    }, {
        // timestamps: true,        // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,             // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,   // defaulted globally
        tableName: 'cellStakeholder', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                CellStakeholder.belongsTo(models.Life,             { foreignKey: 'lifeId' });
                CellStakeholder.belongsTo(models.Cell,         { foreignKey: 'cellId' });
                CellStakeholder.belongsTo(models.CellInstance, { foreignKey: 'instanceId' });
                CellStakeholder.hasMany(models.Token,              { as: 'Tokens', foreignKey: 'cellStakeholderId' });
            }
        },
        instanceMethods: {
        }
    });

    return CellStakeholder;
};
