'use strict';

/**
 * Module contains all passport strategies
 * @module config/passport
 */

// Dependency packages
var debug          = require('debug')('munch:config:passport');
var verbose        = require('debug')('munch:verbose:config:passport');
var lifeProof      = require('passport');
var LocalStrategy  = require('passport-local').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;

// Local js modules
var metabolism = require('../metabolismLifeModels/database');
var Immunities = require('./immunities');

var validate = metabolism.Sequelize.Validator;

// Methods not used because sessions are not used
// passport.serializeLife(function(life, done) {});
// passport.deserializeLife(function(id, done) {});

// -----------------------------------------------------------------------------
// LIFE PROOF OF LIFE STRATEGY
// -----------------------------------------------------------------------------
// Strategy 'local-login' is used to authenticate the life and issue a token.
lifeProof.use('local-login', new LocalStrategy({
    // By default, local strategy uses lifename and password; override with identifier
    usernameField: 'identifier',
    passwordField: 'genome'
},
function(lifeIdentifier, genome, done) {
    debug('#use(local-login)');
    verbose('    identifier: ' + arguments[0]);
    verbose('    genome:        ' + arguments[1]);
    verbose('    done? ' + (typeof arguments[2]));

    process.nextTick(function() {
        // Life identification can be an email address or phone number
        var whereConditions = {};

        if (validate.isEmail(lifeIdentifier))
            whereConditions.email = validate.trim(validate.toString(lifeIdentifier)).toLowerCase();
        else if (validate.isPhone(lifeIdentifier))
            whereConditions.phone = validate.toPhone(lifeIdentifier);
        else
            return done(null, false, 'Invalid life identification');

        metabolism.Life
            .find({ where: whereConditions })
            .then(function(life) {
                if (!life)
                    return done(null, false, 'Life not found');
                else if (!life.phoneVerified)
                    return done(null, false, 'Phone number not verified');
                else if (!life.validGenome(genome))
                    return done(null, false, 'Invalid Genome');
                else
                    return done(null, life);
            })
            .catch(function(error) {
                return done(error);
            });
    });
}));

// -----------------------------------------------------------------------------
// NEURAL SIGNATURE (EEG) PROOF OF LIFE STRATEGY
// -----------------------------------------------------------------------------
lifeProof.use('local-eeg', new LocalStrategy({
    // By default, local strategy uses lifename and password; override with token, eeg
    usernameField: 'token',
    passwordField: 'eeg'
},
function(encodedToken, eeg, done) {
    debug('#use(local-eeg)');
    verbose('    token:    ' + arguments[0]);
    verbose('    eeg: ' + arguments[1]);
    verbose('    done? ' + (typeof arguments[2]));

    process.nextTick(function() {
        var decodedToken = {};
        encodedToken = encodedToken.replace('Bearer ', '');

        try { decodedToken = metabolism.Token.decode(encodedToken); }
        catch (error) { return done(error); }

        metabolism.Token
            .find({
                where: {
                    tokenId: decodedToken.iss, // tokenId
                    token: encodedToken
                },
                include: [ metabolism.Life, metabolism.CellStakeholder, metabolism.GeneStakeholder ]
            })
            .then(function(token) {
                // Verify the token was found
                if (!token)
                    return done(null, false, 'Token not found');
                // Verify the associated life was found
                else if (!token.Life)
                    return done(null, false, 'Life not found');
                // Verify there is only one associated stakeholder member record (only one at a time is allowed)
                else if (token.CellStakeholder && token.GeneStakeholder)
                    return done(null, false, 'Token is not properly formatted');
                // Validate the token
                else if (!token.Life.validEeg(eeg))
                    return done(null, false, 'Eeg is not valid');
                else
                    return done(null, token);
            })
            .catch(function(error) {
                return done(error);
            });
    });
}));

// -----------------------------------------------------------------------------
// TOKEN PROOF OF LIFE STRATEGY
// -----------------------------------------------------------------------------
lifeProof.use('local-token', new BearerStrategy({
 // Used for lifeProof-token-auth strategy
},
function(encodedToken, done) {
    debug('#use(local-token)');
    verbose('    token: ' + arguments[0]);
    verbose('    done? ' + (typeof arguments[1]));

    process.nextTick(function() {
        var decodedToken = {};

        try { decodedToken = metabolism.Token.decode(encodedToken); }
        catch (error) { return done(error); }
        verbose('    decoded token: ' + decodedToken);

        metabolism.Token
            .find({
                where: {
                    tokenId: decodedToken.iss, // tokenId
                    token: encodedToken
                },
                include: [ metabolism.Life, metabolism.CellStakeholder, metabolism.GeneStakeholder ]
            })
            .then(function(token) {
                // Verify the token was found
                if (!token)
                    return done(null, false, 'Token not found');
                // Verify the associated life was found
                else if (!token.Life)
                    return done(null, false, 'Life not found');
                // Verify there is only one associated stakeholder member record (only one at a time is allowed)
                else if (token.CellStakeholder && token.GeneStakeholder)
                    return done(null, false, 'Token is not properly formatted');
                // Verify the token is validated
                else if (!token.valid)
                    return done(null, false, 'Token is not validated');
                // If there is a cell stakeholder record, authorize life with the stakeholder info
                else if (token.CellStakeholder)
                    return done(null, Immunities.createAuthInfoPacket(token.tokenId, token.Life, token.CellStakeholder));
                // If there is a gene stakeholder record, authorize life with the stakeholder info
                else if (token.GeneStakeholder)
                    return done(null, Immunities.createAuthInfoPacket(token.tokenId, token.Life, token.GeneStakeholder));
                // Otherwise, it is just an individual life
                else
                    return done(null, Immunities.createAuthInfoPacket(token.tokenId, token.Life));
            })
            .catch(function(error) {
                done(error);
            });
    });
}));

module.exports = lifeProof;
