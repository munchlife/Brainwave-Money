'use strict';

// geneSignalPathway.js (model)

var SIGNAL_PATHWAY_PHEROMONE_MAX_LENGTH = 255;
var SIGNAL_PATHWAY_OPTIONAL_MAX_LENGTH = 255;

module.exports = function(sequelize, DataTypes) {
    var GeneSignalPathway = sequelize.define('GeneSignalPathway', {
        signalPathwayId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        // auth_standard: {
        //     type: DataTypes.INTEGER.UNSIGNED,
        //     allowNull: false,
        //     validate : {
        //         isIn: {
        //             args: [[ 'OAUTH', 'OPNID' ]],
        //             msg: 'Authorization standard is invalid'
        //         }
        //     }
        // },
        pheromone: {
            type: DataTypes.STRING( SIGNAL_PATHWAY_PHEROMONE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate : {
                len: {
                    args: [ 1, SIGNAL_PATHWAY_PHEROMONE_MAX_LENGTH ],
                    msg: 'Signal pathway pheromone can be no more than ' + SIGNAL_PATHWAY_PHEROMONE_MAX_LENGTH + ' characters in length'
                }
            }
        },
        signalPheromoneExpiration: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
            validate: {
                isDate: {
                    msg: 'Signal pathway wave pheromone expiration must be a date'
                }
            }
        },
        reinforcementSignalPheromone: {
            type: DataTypes.STRING( SIGNAL_PATHWAY_PHEROMONE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate : {
                len: {
                    args: [ 1, SIGNAL_PATHWAY_PHEROMONE_MAX_LENGTH ],
                    msg: 'Signal pathway reinforcement wave pheromone can be no more than ' + SIGNAL_PATHWAY_PHEROMONE_MAX_LENGTH + ' characters in length'
                }
            }
        },
        reinforcementSignalPheromoneExpiration: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
            validate: {
                isDate: {
                    msg: 'Signal pathway reinforcement wave pheromone expiration must be a date'
                }
            }
        },
        optional: {
            type: DataTypes.STRING( SIGNAL_PATHWAY_OPTIONAL_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, SIGNAL_PATHWAY_OPTIONAL_MAX_LENGTH ],
                    msg: 'Signal pathway optional can be no more than ' + SIGNAL_PATHWAY_OPTIONAL_MAX_LENGTH + ' characters in length'
                }
            }
        },
        attached: {
            type: DataTypes.VIRTUAL
        }
    }, {
        // timestamps: true,               // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,                    // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,          // defaulted globally
        tableName: 'geneSignalPathways', // force table name to this value
        validate: {
        },
        getterMethods: {
            attached: function() { return this.getDataValue('pheromone') !== null; }
        },
        classMethods: {
            associate: function(models) {
                GeneSignalPathway.belongsTo(models.Life, { foreignKey: 'lifeId' });
                GeneSignalPathway.belongsTo(models.Cell, { foreignKey: 'cellId' });
                GeneSignalPathway.belongsTo(models.Gene, { foreignKey: 'geneId' });
            },
            extractOptional: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            }
        },
        instanceMethods: {
        }
    });

    return GeneSignalPathway;
};
