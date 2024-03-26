'use strict';

// brainwaveInstance.js (model)

var CountryCodes = require('../metabolismTypes/countryCodes');
var charges = require('electric-field-demo');

var INSTANCE_NAME_MAX_LENGTH = 255;
var INSTANCE_WEBSITE_MAX_LENGTH = 255;
var INSTANCE_FIELD_MAJOR_MAX = 65535;

module.exports = function(sequelize, DataTypes) {
    var BrainwaveInstance = sequelize.define('BrainwaveInstance', {
        instanceId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        frequency: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true,
            validate: {
                isFloat: {
                    msg: 'Brainwave signal frequency value must be a number'
                },
                min: {
                    args: 0.0,
                    msg: 'Brainwave signal frequency value must be greater than or equal to 0hz'
                },
                max: {
                    args: 150.0,
                    msg: 'Brainwave signal frequency value must be less than or equal to 150hz'
                }
            }
        },
//         bandType: {
//             type: DataTypes.BIGINT.UNSIGNED,
//             allowNull: true,
//             defaultValue: null,
//             validate: {
//                 isIn: {
//                     args: [[ DELTA, THETA, ALPHA, BETA, LOW GAMMA, HIGH GAMMA ]],
//                     msg: 'Brainwave signal frequency is not in the valid set of band types'
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
        },
        major: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            validate: {
                isInt: {
                    msg: 'Field major value must be an integer'
                },
                min: {
                    args: 0,
                    msg: 'Field major value must be a positive number'
                },
                max: {
                    args: INSTANCE_FIELD_MAJOR_MAX,
                    msg: 'Field major value must be less than or equal to ' + INSTANCE_FIELD_MAJOR_MAX
                }
            }
        },
        constructiveInterference: {
            // precision per decimal place:
            //    0.000001   degs    111mm  distance
            //    0.0000001  degs    11.1mm distance
            //    0.00000001 degs    1.11mm distance
            type: DataTypes.DECIMAL(10, 8),
            allowNull: false,
            validate: {
                isFloat: {
                    msg: 'Instance constructive interference value must be a number'
                },
                min: {
                    args: -90.0,
                    msg: 'Instance constructive interference value must be greater than or equal to -90.0 degrees'
                },
                max: {
                    args: 90.0,
                    msg: 'Instance constructive interference value must be less than or equal to 90.0 degrees'
                }
            }
        },
        destructiveInterference: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: false,
            validate: {
                isFloat: {
                    msg: 'Instance destructive interference value must be a number'
                },
                min: {
                    args: -180.0,
                    msg: 'Instance destructive interference value must be greater than or equal to -180.0 degrees'
                },
                max: {
                    args: 180.0,
                    msg: 'Instance destructive interference value must be less than or equal to 180.0 degrees'
                }
            }
        },
        name: {
            type: DataTypes.STRING( INSTANCE_NAME_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, INSTANCE_NAME_MAX_LENGTH ],
                    msg: 'Instance name can be no more than ' + INSTANCE_NAME_MAX_LENGTH + ' characters in length'
                }
            }
        },
        brainwaveType: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
            validate: {
                isIn: {
                    args: [[ 0780 ]],
                    msg: 'Instance type is not in the approved set of category numbers'
                }
            }
        },
        website: {
            type: DataTypes.STRING( INSTANCE_WEBSITE_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ 1, INSTANCE_WEBSITE_MAX_LENGTH ],
                    msg: 'Instance website can be no more than ' + INSTANCE_WEBSITE_MAX_LENGTH + ' characters in length'
                },
                isUrl: {
                    msg: 'Instance website must be a valid URL'
                }
            }
        },
        countryCode: {
            type: DataTypes.CHAR( 3 ),
            allowNull: true,
            defaultValue: null,
            validate: {
                isIn: {
                    args: [ CountryCodes.abbrs ],
                    msg: 'Instance country code is not in the approved set of countries'
                }
            }
        }
    }, {
        // timestamps: true,            // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        paranoid: true,                 // adds deletedAt timestamp (won't actually delete entries)
        // freezeTableName: true,       // defaulted globally
        tableName: 'brainwaveInstances',     // force table name to this value
        validate: {
            validateInterference: function() {
                if ((this.constructiveInterference === null) !== (this.destructiveInterference === null))
                    throw new Error('Instance requires either both constructive interference and destructive interference are set or neither');
            }   
        },
        classMethods: {
            associate: function(models) {
                BrainwaveInstance.belongsTo(models.Brainwave,          {                           foreignKey: 'brainwaveId' });
                BrainwaveInstance.belongsTo(models.BrainwaveField,     {                           foreignKey: 'fieldId' });
                BrainwaveInstance.hasOne(models.Electromagnetism, { as: 'Electromagnetisms',  foreignKey: 'electromagnetismId' });
                BrainwaveInstance.hasMany(models.BrainwaveStakeholder, { as: 'StakeholderMembers', foreignKey: 'instanceId' });
                BrainwaveInstance.hasMany(models.BrainwaveDevice,      { as: 'Devices',            foreignKey: 'instanceId' });
                BrainwaveInstance.hasOne(models.Address,          { as: 'Address',            foreignKey: 'instanceId' });
                BrainwaveInstance.hasMany(models.Phone,           { as: 'Phones',             foreignKey: 'instanceId' });
            },
            extractName: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractType: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.toInt(value);
                if (isNaN(value))
                    value = null;

                return value;
            },
            extractWebsite: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.trim(metabolism.Sequelize.Validator.toString(value));
                if (metabolism.Sequelize.Validator.equals(value, ''))
                    value = null;

                return value;
            },
            extractConstructiveInterference: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.toFloat(value);
                if (isNaN(value))
                    value = null;

                return value;
            },
            extractDestructiveInterference: function(metabolism, value) {
                value = metabolism.Sequelize.Validator.toFloat(value);
                if (isNaN(value))
                    value = null;

                return value;
            }
        },
        instanceMethods: {
            calculateBrainwaveFieldId: function() {
                return Math.floor(this.instanceId / INSTANCE_FIELD_MAJOR_MAX) + 1;
            },
            calculateAndSetMajor: function() {
                this.major = this.instanceId % INSTANCE_FIELD_MAJOR_MAX;
            },
            calculateInstanceWaveform: function() {
                const DSP = require('dsp.js');

                // Function to simulate generating a waveform within a given timestep
                function calculateWaveformId(timestep) {
                const sampleRate = 1000; // Define your sample rate (samples per second)
                const signalFrequency = 5; // Define your signal frequency (Hz)
                const amplitude = 1; // Define your amplitude

                const numSamples = sampleRate * timestep; // Calculate the number of samples within the timestep

                // Generate a sine wave signal within the timestep duration
                const sineWave = new DSP.Sinewave(amplitude, signalFrequency);
                const waveform = new Array(numSamples);

                for (let i = 0; i < numSamples; i++) {
                waveform[i] = sineWave.next();
                }

                // Process the waveform data (perform analysis, if needed)
                // Calculate some unique identifier (waveformId) based on the waveform data

                // For the sake of example, let's just return a placeholder waveformId
                const waveformId = 'generated_waveform_id';

                return waveformId;
                }

                const timestepInSeconds = 1; // Specify the timestep duration in seconds
                const generatedWaveformId = calculateWaveformId(timestepInSeconds);

                // You can do further operations or store the generated waveformId here
                // For example:
                this.waveform = generatedWaveformId;

                return generatedWaveformId; // Return the generated waveformId
                },   
            calculateInstanceInterference: function() {
                // Placeholder for ionospheric resonance signal phase angle (for example purposes)
                const ionosphericResonancePhase = /* Define ionospheric resonance phase angle */;

                // Placeholder for the waveformId phase angle obtained from the generated waveform
                const waveformIdPhase = /* Obtain the phase angle from generated waveformId */;

                // Function to calculate interference degree based on phase comparison
                function calculateInterferenceDegree(waveformIdPhaseAngle) {
                const phaseDifference = Math.abs(waveformIdPhaseAngle - ionosphericResonancePhase) % 180;

                if (phaseDifference <= 90) {
                return 'Constructive Interference';
                } else {
                return 'Destructive Interference';
                }
            }

                const interferenceDegree = calculateInterferenceDegree(waveformIdPhase);
                // You can further process or store the interference degree here

                return interferenceDegree;
                }
            }
    });

    return BrainwaveInstance;
};
