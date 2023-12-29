'use strict';

// serviceSignalPathway.js (model)

var SIGNAL_PATHWAY_SIGNAL_PHEROMONE_MAX_LENGTH = 255;
var SIGNAL_PATHWAY_OPTIONAL_MAX_LENGTH = 255;

module.exports = function(sequelize, DataTypes) {
    var ServiceSignalPathway = sequelize.define('ServiceSignalPathway', {
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
        signalPheromone: { 
            type: DataTypes.STRING( SIGNAL_PATHWAY_SIGNAL_PHEROMONE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate : {
                len: {
                    args: [ 1, SIGNAL_PATHWAY_SIGNAL_PHEROMONE_MAX_LENGTH ],
                    msg: 'Signal pathway signal pheromone can be no more than ' + SIGNAL_PATHWAY_SIGNAL_PHEROMONE_MAX_LENGTH + ' characters in length'
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
        // timestamps: true,             // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,                  // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,        // defaulted globally
        tableName: 'serviceSignalPathways', // force table name to this value
        validate: {
        },
        getterMethods: {
            attached: function() { return this.getDataValue('pheromone') !== null; }
        },
        classMethods: {
            associate: function(models) {
                ServiceSignalPathway.belongsTo(models.Life, { foreignKey: 'lifeId' });
                ServiceSignalPathway.belongsTo(models.Cell, { foreignKey: 'cellId' });
                ServiceSignalPathway.belongsTo(models.Service, { foreignKey: 'serviceId' });
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

    return ServiceSignalPathway;
};
