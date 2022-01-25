'use strict';

// geneStakeholder.js (model)

var STAKEHOLDER_PERMISSIONS_MAX = 256;

module.exports = function(sequelize, DataTypes) {
    var GeneStakeholder = sequelize.define('GeneStakeholder', {
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
                    msg: 'Gene stakeholder immunities value must be an integer'
                },
                min: {
                    args: 0,
                    msg: 'Gene stakeholder immunities value must be a positive number'
                },
                max: {
                    args: STAKEHOLDER_PERMISSIONS_MAX,
                    msg: 'Gene stakeholder immunities value must be less than or equal to ' + STAKEHOLDER_PERMISSIONS_MAX
                }
            }
        }
    }, {
        // timestamps: true,       // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,            // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,  // defaulted globally
        tableName: 'geneStakeholder', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                GeneStakeholder.belongsTo(models.Life, {               foreignKey: 'lifeId' });
                GeneStakeholder.belongsTo(models.Gene, {               foreignKey: 'geneId' });
                GeneStakeholder.hasMany(models.Token,  { as: 'Tokens', foreignKey: 'geneStakeholderId' });
            }
        },
        instanceMethods: {
        }
    });

    return GeneStakeholder;
};
