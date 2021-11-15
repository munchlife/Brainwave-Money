'use strict';

// lifeVerification.js (model)

var bcrypt       = require('bcryptjs');
var RandomString = require('randomstring');

var VERIFICATION_PHONE_HASH_MAX_LENGTH = 100;
var VERIFICATION_EMAIL_LENGTH = 100;
var GEN_SALT_ROUNDS = 10;

module.exports = function(sequelize, DataTypes) {
    var LifeVerification = sequelize.define('LifeVerification', {
        verificationId: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        phone: {
            type: DataTypes.VIRTUAL,
            set: function(value) {
                this.setDataValue('phone', value);
                this.setDataValue('phoneHash', LifeVerification.generateHash(value));
            },
            validate: {
            }
        },
        phoneHash: {
            type: DataTypes.STRING( VERIFICATION_PHONE_HASH_MAX_LENGTH ),
            allowNull: true,
            defaultValue: null
        },
        phoneExpiration: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },
        email: {
            type: DataTypes.STRING( VERIFICATION_EMAIL_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ VERIFICATION_EMAIL_LENGTH, VERIFICATION_EMAIL_LENGTH ],
                    msg: 'Life verification code must be exactly ' + VERIFICATION_EMAIL_LENGTH + ' characters in length'
                }
            }
        },
        emailExpiration: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },
        receiptEmail: {
            type: DataTypes.STRING( VERIFICATION_EMAIL_LENGTH ),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: {
                    args: [ VERIFICATION_EMAIL_LENGTH, VERIFICATION_EMAIL_LENGTH ],
                    msg: 'Life verification code must be exactly ' + VERIFICATION_EMAIL_LENGTH + ' characters in length'
                }
            }
        },
        receiptEmailExpiration: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },
    }, {
        // timestamps: true,            // defaulted globally
        // createdAt:  true,
        // updatedAt:  true,
        // paranoid: false,
        // freezeTableName: true,       // defaulted globally
        tableName: 'lifeVerifications', // force table name to this value
        validate: {
        },
        classMethods: {
            associate: function(models) {
                LifeVerification.belongsTo(models.Life, { foreignKey: 'lifeId' });
            },
            // Generate a hash for the given data (phone)
            generateHash: function(data) {
                return bcrypt.hashSync(data, bcrypt.genSaltSync(GEN_SALT_ROUNDS), null);
            },
            generateEmailCode: function() {
                return RandomString.generate(100); // random string; default length: 32
            }
        },
        instanceMethods: {
            // Validate a code against the saved code salt/hash
            validPhoneCode: function(code) {
                return (new Date() <= this.phoneExpiration && bcrypt.compareSync(code, this.phoneHash));
            }
        }
    });

    return LifeVerification;
};
