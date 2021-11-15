'use strict';

// lifePreference.js (model)

module.exports = function(sequelize, DataTypes) {
    var LifePreference = sequelize.define('LifePreference', {
        lifeId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            // FUTURE 3.2.0 references: { model: sequelize.models.Life, key: 'lifeId' },
            references: 'lifes',
            referencesKey: 'lifeId',
            onDelete: 'CASCADE'
        }
    }, {
        // timestamps: true,          // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,               // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,     // defaulted globally
        tableName: 'lifePreferences', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                // lifeId foreign key reference handled above in field definition
              //LifePreference.belongsTo(models.Life,    { foreignKey: 'lifeId' });
                LifePreference.belongsTo(models.GeneSignalPathway, { foreignKey: 'paymentSignalPathwayId' });
                LifePreference.belongsTo(models.GeneSignalPathway, { foreignKey: 'loyaltySignalPathwayId' });
                LifePreference.belongsTo(models.GeneSignalPathway, { foreignKey: 'checkinSignalPathwayId' });
            }
        },
        instanceMethods: {
        }
    });

    return LifePreference;
};
