
// product.js (model)

// TODO: add validate functions for individual fields

module.exports = function(sequelize, DataTypes, modelName, tableName) {
    var Product = sequelize.define(modelName, {
        productId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        sku: { // Stock Keeping Unit
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
            }
        },
        upc: { // Universal Product Code
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
            }
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
        },
        unitPrice: {
            type: DataTypes.DECIMAL(19,2),
            allowNull: false,
            defaultValue: 0,
            validate: {
            }
        }
        // TODO: other possible columns: recycle level, recycle quantity, supplier (cellId), MSRP, ??
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

    return Product;
};
