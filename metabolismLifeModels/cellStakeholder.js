'use strict';

// brainwaveStakeholder.js (model)

var STAKEHOLDER_IMMUNITIES_MAX = 256;

module.exports = function(sequelize, DataTypes) {
    var BrainwaveStakeholder = sequelize.define('BrainwaveStakeholder', {
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
                    msg: 'Brainwave stakeholder immunities value must be an integer'
                },
                min: {
                    args: 0,
                    msg: 'Brainwave stakeholder immunities value must be a positive number'
                },
                max: {
                    args: STAKEHOLDER_IMMUNITIES_MAX,
                    msg: 'Brainwave stakeholder immunities value must be less than or equal to ' + STAKEHOLDER_IMMUNITIES_MAX
                }
            }
        }
    }, {
        // timestamps: true,        // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,             // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,   // defaulted globally
        tableName: 'brainwaveStakeholder', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                BrainwaveStakeholder.belongsTo(models.Life,         {               foreignKey: 'lifeId' });
                BrainwaveStakeholder.belongsTo(models.Brainwave,         {               foreignKey: 'brainwaveId' });
                BrainwaveStakeholder.belongsTo(models.BrainwaveInstance, {               foreignKey: 'instanceId' });
                BrainwaveStakeholder.hasMany(models.Token,          { as: 'Tokens', foreignKey: 'brainwaveStakeholderId' });
            }
        },
        instanceMethods: {
        }
    });

    return BrainwaveStakeholder;
};
