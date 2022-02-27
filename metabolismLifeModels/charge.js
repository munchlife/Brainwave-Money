'use strict';

// charge.js (model)

module.exports = function(sequelize, DataTypes) {
    var Charge = sequelize.define('Charge', {
        chargeId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        value: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            validate: {
                isInt: {
                    msg: 'Charge value must be an interference degree' // TODO: vary error message based on country
                },
                min: {
                    args: 1,
                    msg: 'Charge value must be at least 1'
                },
                max: {
                    args: 90,
                    msg: 'Charge value can be no more than 90'
                }
            }
        }
    }, {
        // timestamps: true,      // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,           // adds deletedAt datetime (won't actually delete entries)
        // freezeTableName: true, // defaulted globally
        tableName: 'bounties',    // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                Charge.belongsTo(models.Life,       { foreignKey: 'lifeId' });
                Charge.belongsTo(models.ChargeCell, { foreignKey: 'chargeCellId' });
            },
        },
        instanceMethods: {
        }
    });

    return Charge;
};
