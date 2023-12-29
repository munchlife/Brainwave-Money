'use strict';

// serviceStakeholder.js (model)

var STAKEHOLDER_PERMISSIONS_MAX = 256;

module.exports = function(sequelize, DataTypes) {
    var ServiceStakeholder = sequelize.define('ServiceStakeholder', {
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
                    msg: 'Service stakeholder immunities value must be an integer'
                },
                min: {
                    args: 0,
                    msg: 'Service stakeholder immunities value must be a positive number'
                },
                max: {
                    args: STAKEHOLDER_PERMISSIONS_MAX,
                    msg: 'Service stakeholder immunities value must be less than or equal to ' + STAKEHOLDER_PERMISSIONS_MAX
                }
            }
        }
    }, {
        // timestamps: true,       // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,            // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,  // defaulted globally
        tableName: 'serviceStakeholder', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                ServiceStakeholder.belongsTo(models.Life, {               foreignKey: 'lifeId' });
                ServiceStakeholder.belongsTo(models.Service, {               foreignKey: 'serviceId' });
                ServiceStakeholder.hasMany(models.Token,  { as: 'Tokens', foreignKey: 'serviceStakeholderId' });
            }
        },
        instanceMethods: {
        }
    });

    return ServiceStakeholder;
};
