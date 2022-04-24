'use strict';

// electromagnetism.js (model)

module.exports = function(sequelize, DataTypes) {
    var Electromagnetism = sequelize.define('Electromagnetism', {
        electromagnetismId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        frequency: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true,
            validate: {
                isFloat: {
                    msg: 'Electromagnetism frequency value must be a number'
                },
                min: {
                    args: 0.0,
                    msg: 'Electromagnetism frequency value must be greater than or equal to 0hz'
                },
                max: {
                    args: 150.0,
                    msg: 'Electromagnetism frequency value must be less than or equal to 150hz'
                }
            }
        },
//         bandType: {
//             type: DataTypes.BIGINT.UNSIGNED,
//             allowNull: true,
//             defaultValue: null,
//             validate: {
//                 isIn: {
//                     args: [[ DELTA, THETA, ALPHA, BETA, LOW GAMMA, HIGH GAMMA, ELF, VLF ]],
//                     msg: 'Electromagnetism frequency is not in the valid set of band types'
//                 }
//             }
//         },
        waveform: {
            type: DataTypes.BLOB,
            allowNull: false,
            defaultValue: null,
        },
        timestep: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: null,
            validate: {
                isDate: {
                    msg: 'Waveform timestep must be a date'
                } 
            }  
        }
    }, {
        // timestamps: true,            // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,                 // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,       // defaulted globally
        tableName: 'Electromagnetism',  // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                Electromagnetism.belongsTo(models.CellField,       {                           foreignKey: 'electromagnetismId' });
                Electromagnetism.belongsTo(models.IonosphereField, {                           foreignKey: 'electromagnetismId' });
            },
            extractFrequency: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.toFloat(value);
                if (isNaN(value))
                    value = null;

                return value;
            },
            extractBand: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.toInt(value);
                if (isNaN(value))
                    value = null;

                return value;
            },
            extractWaveform: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toBlob(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            }
        },
        instanceMethods: {
        }
    });

    return Electromagnetism;
};
