
// productCategory.js (model)

// TODO: add validate functions for individual fields

module.exports = function(sequelize, DataTypes, modelName, tableName) {
    var ProductCategory = sequelize.define(modelName, {
        productCategoryId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        parentCategoryId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            // reference: 'productCategories_<id>',
            // referencesKey: 'productCategoryId'
            // FOREIGN KEY (`productCategoryId`) REFERENCES productCategories_<id> (`productCategoryId`)
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
            validate: {
            }
        }
    }, {
        // timestamps: true,      // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,           // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true, // defaulted globally
        tableName: tableName,     // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
            }
        },
        instanceMethods: {
        }
    });

    return ProductCategory;
};
