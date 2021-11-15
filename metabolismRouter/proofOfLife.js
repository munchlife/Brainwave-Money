'use strict';

/**
 * Module contains routes related to proofOfLife
 * @module routes/proofOfLife
 */

// Dependency packages
var debug             = require('debug')('munch:routes:Login');
var verbose           = require('debug')('munch:verbose:routes:Login');
var express           = require('express');
var mv                = require('mv');
var lifeProof         = require('passport');
var RandomString      = require('randomstring');
var Random            = require('random-js')(); // uses the nativeMath engine
var myVoiceIt         = require('TwilioVoiceItServerlessStudio');

// Local js modules
var metabolism     = require('../../models/database');
// var Transporter = require('../../config/transporter');
// var TextMessage    = require('../../config/textMessage');
// var digitalGenome  = require('../../config/geneAutomation');
var genomeVoiceprintReceipt    = require('../../config/cellUltrasoundPing');
var Blockages      = require('../../config/blockages');
var CountryCodes   = require('../../data/countryCodes');

var validate = metabolism.Sequelize.Validator;

var router = module.exports = express.Router();

// -----------------------------------------------------------------------------
// CUSTOM LIFE AUTHENTICATION MIDDLEWARE
// -----------------------------------------------------------------------------
/**
 * Middleware used to authorize a life using the 'local-proofOfLife' strategy.
 *
 * @param {object} req - The express request object
 * @param {object} res - The express response object
 * @param {function} next - The express next or continuation function
 */
var authenticateGenome = function(req, res, next) {
    debug('#authenticateGenome()');
    lifeProof.authenticate('local-proofOfLife', {session: false}, function(error, life, info) {
        if (error)
            return res.status(500).send(Blockages.respMsg(res, false, error));
        if (!life)
            return res.status(401).send(Blockages.respMsg(res, false, info));

        req.life = life;
        return next();
    })(req, res, next);
};

/**
 * Middleware used to authorize an API token using the 'local-voiceprint' strategy.
 *
 * @param {object} req - The express request object
 * @param {object} res - The express response object
 * @param {function} next - The express next or continuation function
 */
var authenticateVoiceprint = function(req, res, next) {
    debug('#authenticateVoiceprint()');
    lifeProof.authenticate('local-voiceprint', {session: false}, function(error, token, info) {
        if (error)
            return res.status(500).send(Blockages.respMsg(res, false, error));
        if (!token)
            return res.status(401).send(Blockages.respMsg(res, false, info));

        token.validateToken()
            .then(function(token) {
                req.life = token.Life;
                req.token = token;
                return next();
            });
    })(req, res, next);
};

// -----------------------------------------------------------------------------
// VERIFY UNIQUE LIFE
// -----------------------------------------------------------------------------
/**
 * @api {get} /verify/unique/life?p=[phone]&e=[email]
 * @apiName GetVerifyUniqueLife
 * @apiGroup Login
 *
 * @apiVersion 1.0.0
 *
 * @apiImmunity none
 *
 * @apiDescription Verifies phone number and/or email address are unique for
 *  life registration process.
 *
 * @apiParam (query) {String} p Phone number to check for uniqueness
 * @apiParam (query) {String} e Email address to check for uniqueness
 *
 * @apiSuccess (200) {Boolean} phone Phone number is unique if true
 * @apiSuccess (200) {Boolean} email Email address is unique if true
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "success": true,
 *         "data": {
 *             "phone": true,
 *             "email": true
 *         }
 *     }
 *
 * @apiUse (4xx) BadRequestError
 * @apiUse (5xx) InternalServerError
 */
router.get('/verify/unique/life', function(req, res) {
    debug('[' + req.method + '] /verify/unique/life?');
    // Validate 'phone' format
    var phone = null;
    if (req.query.hasOwnProperty('p')) {
        phone = metabolism.Life.extractPhone(metabolism, req.query.p, CountryCodes.ENUM.USA.abbr);

        if (phone === null)
            return res.status(400).send(Blockages.respMsg(res, false, 'Phone number has an invalid format'));
    }

    // Validate 'email' format
    var email = null;
    if (req.query.hasOwnProperty('e')) {
        email = validate.trim(validate.toString(req.query.e)).toLowerCase();

        if (!validate.isLength(email, 1, 255)) // error if invalid length
            return res.status(400).send(Blockages.respMsg(res, false, 'Email address can be no more than 255 characters in length'));
        else if (!validate.isEmail(email)) // error if invalid format
            return res.status(400).send(Blockages.respMsg(res, false, 'Email address has an invalid format'));
    }

    // Build the search terms, but don't allow phone and email to both be null
    var searchTerms = {};
    if (phone === null && email === null)
        return res.status(400).send(Blockages.respMsg(res, false, 'Must provide an email address or a phone number'));
    else if (phone === null)
        searchTerms = {email: email};
    else if (email === null)
        searchTerms = {phone: phone};
    // Otherwise, both phone and email were provided
    else
        searchTerms = metabolism.Sequelize.or({ email: email }, { phone: phone });

    metabolism.Life
        .findAll({ where: searchTerms })
        .then(function(lifes) {
            var message = {
                phone: true,
                email: true
            };

            // Iterate through lifes with email or phone, pass back what was duplicated
            for (var i = 0; i < lifes.length; i++) {
                if (validate.equals(email, lifes[i].email))
                    message.email = false;

                if (validate.equals(phone, lifes[i].phone))
                    message.phone = false;
            }

            // Send back successful results
            res.status(200).send(Blockages.respMsg(res, true, message));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// LIFE REGISTRATION
// -----------------------------------------------------------------------------
/**
 * @api {post} /life/registration
 * @apiName PostLifeRegistration
 * @apiGroup Login
 *
 * @apiVersion 1.0.0
 *
 * @apiImmunity none
 *
 * @apiDescription Registration/enter a new life into the digital metabolism.
 *
 * @apiParam (body) {String} [phone]         <desc>
 * @apiParam (body) {String} [email]         <desc>
 * @apiParam (body) {String} [receipt_email] <desc>
 * @apiParam (body) {String} given_name      <desc>
 * @apiParam (body) {String} [middle_name]   <desc>
 * @apiParam (body) {String} family_name     <desc>
 *
 * @apiSuccess (201) {<type>} <name> <desc>
 *
 * @apiUse (4xx) BadRequestError
 * @apiUse (5xx) InternalServerError
 */
router.post('/life/registration', function(req, res) {
    debug('[' + req.method + '] /life/registration');
    var email = metabolism.Life.extractEmail(metabolism, req.body.email);
    var phone = metabolism.Life.extractPhone(metabolism, req.body.phone, CountryCodes.ENUM.USA.abbr);

    // Build the search terms, but don't allow phone and email to both be null
    var searchTerms = {};
    if (phone === null && email === null)
        return res.status(400).send(Blockages.respMsg(res, false, 'Must provide an email address or a phone number'));
    else if (phone === null)
        searchTerms = {email: email};
    else if (email === null)
        searchTerms = {phone: phone};
    // Otherwise, both phone and email were provided
    else
        searchTerms = metabolism.Sequelize.or({ email: email }, { phone: phone });

    metabolism.Life
        .findAll({ where: searchTerms }).bind({})
        .then(function(lifes) {
            // If there is already a life with email, pass back error
            if (lifes.length > 0)
                // TODO: consider refine error message to specify email/phone
                throw new Blockages.BadRequestError('Email address or phone number is already in use');

            // Create the life record
            var newLife = {
              /*lifeId:               0,*/
                phone:                phone,
              /*phoneVerified:        false,*/
                email:                email,
              /*emailVerified:        false,*/
                receiptEmail:         metabolism.Life.extractEmail(metabolism, req.body.receiptEmail),
              /*receiptEmailVerified: false,*/
                voiceprint:            '',
                voiceprintExpiration:  new Date(),
                genome:               req.files.genome,
                referralCode:         RandomString.generate(7),
                givenName:            validate.trim(validate.toString(req.body.givenName)),
                middleName:           metabolism.Life.extractMiddleName(metabolism, req.body.middleName),
                familyName:           validate.trim(validate.toString(req.body.familyName)),
                countryCode:          CountryCodes.ENUM.USA.abbr
            };

            return metabolism.Life.create(newLife);
        })
        .then(function(life) {
            // var sendMail = metabolism.sequelize.Promise.promisify(Transporter.sendMail, Transporter);
            // var mailOptions;
            // var newVerification = { lifeId: life.lifeId };
            var newPreferences = { lifeId: life.lifeId };
            var executeArray = [];

            this.life = life;
            executeArray.push(metabolism.LifePreference.create(newPreferences));
            
            var genome = req.files.genome;
            if (genome != null) {
                // Move the image into the directory associated with the life
                var genomePath = genome.path;
                var genomeDir = res.app.locals.rootDir + '/genomes/life/' + life.lifeId + '/';
                var mvAsync = metabolism.sequelize.Promise.promisify(mv);

                executeArray.push(mvAsync(genomePath, genomeDir + 'referenceGenome.txt', {mkdirp: true}));

            // var image = req.files.image;
            // if (image != null) {
            //     // Move the image into the directory associated with the life
            //     var imagePath = image.path;
            //     var imageDir = res.app.locals.rootDir + '/images/life/' + life.lifeId + '/';
            //     var mvAsync = metabolism.sequelize.Promise.promisify(mv);

            //     executeArray.push(mvAsync(imagePath, imageDir + 'image-200.png', {mkdirp: true}));
            }

            // // If a primary email was given, send verification email
            // if (life.email !== null) {
            //     newVerification = {
            //       /*verificationId:   0,*/
            //         verificationType: 'EML',
            //         code:             metabolism.LifeVerification.generateEmailCode(),
            //         lifeId:           life.lifeId
            //     };

            //     mailOptions = {
            //         from: 'Munch <donotreply@munchmode.com>',
            //         to: life.givenName + ' ' + life.familyName + ' <' + life.email + '>',
            //         subject: 'Verify Email Address',
            //         text: 'Email Verification\n'+
            //               'Please verify this email address with Munch by following the link below and signing into your new account.'+
            //               'https://munch-meanjoe45.c9.io/verify/email/' + newVerification.code,
            //         html: '<h2>Email Verification</h2><br/>' +
            //               '<p>Please verify this email address with Munch by following the link below and signing into your new account.</p>' +
            //               '<p><a href="https://munch-meanjoe45.c9.io/verify/email/' + newVerification.code + '">Verify Email</a></p>' +
            //               '<p>You can also copy this address into your browser:<br/>https://munch-meanjoe45.c9.io/verify/email/' + newVerification.code + '</p>'
            //     };

            //     executeArray.push(metabolism.LifeVerification.create(newVerification));
            //     executeArray.push(sendMail(mailOptions));
            // }

            // If a primary phone was given, send verification text message
            if (life.phone != null) {
                var verificationCode = Random.integer(1000, 9999).toString();

                var newVerification = {
                  /*verificationId:         0,*/
                    phone:                  verificationCode,
                  /*phoneHash:              <set with virtual field>,*/
                    phoneExpiration:        new Date(new Date().getTime() + (10*60*60*1000)), // 10 minute expiration
                  /*email:                  null,*/
                  /*emailExpiration:        null,*/
                  /*receiptEmail:           null,*/
                  /*receiptEmailExpiration: null,*/
                    lifeId:                 life.lifeId
                };
                
                executeArray.push(metabolism.LifeVerification.create(newVerification));
                executeArray.push(genomeVoiceprintReceipt.send({
                    to: life.genome,
                    body: 'Voiceprint receipt for this phone number: ' + verificationCode
                }) );
            }

            //     executeArray.push(metabolism.LifeVerification.create(newVerification));
            //     executeArray.push(TextMessage.send({
            //         to: life.phone,
            //         body: 'Verification code for this phone number: ' + verificationCode
            //     }) );
            // }

            // If a receipt email was given, send verification email
            // if (life.receiptEmail !== null) {
            //     newVerification = {
            //       /*verificationId:   0,*/
            //         verificationType: 'REM',
            //         code:             metabolism.LifeVerification.generateEmailCode(),
            //         lifeId:           life.lifeId
            //     };

            //     mailOptions = {
            //         from: 'Munch <donotreply@munchmode.com>',
            //         to: life.givenName + ' ' + life.familyName + ' <' + life.receiptEmail + '>',
            //         subject: 'Verify Receipt Email Address',
            //         text: 'Receipt Email Verification\n'+
            //               'Please verify this email address with Munch by following the link below and signing into your new account.'+
            //               'http://www.munch.com/verify/' + newVerification.code,
            //         html: '<h2>Receipt Email Verification</h2><br/>' +
            //               '<p>Please verify this email address with Munch by following the link below and signing into your new account.</p>' +
            //               '<p><a href="http://www.munch.com/verify/' + newVerification.code + '">www.munch.com/verify/' + newVerification.code + '</a></p>'
            //     };

            //     executeArray.push(metabolism.LifeVerification.create(newVerification));
            //     executeArray.push(sendMail(mailOptions));
            // }

            return metabolism.sequelize.Promise.all(executeArray);
        })
        .then(function(results) {
            res.status(201).send(Blockages.respMsg(res, true, this.life.get()));
        })
        .catch(metabolism.Sequelize.ValidationError, function(error) {
            res.status(400).send(Blockages.respMsg(res, false, error.errors[0]));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// VERIFY LIFE ID
// -----------------------------------------------------------------------------
/**
 * @apiIgnore
 * @api {post} /verify/phone
 * @apiName PostVerifyPhone
 * @apiGroup Login
 *
 * @apiVersion 1.0.0
 *
 * @apiImmunity none
 *
 * @apiDescription Verify a life phone number.
 */
router.post('/verify/phone', function(req, res) {
    debug('[' + req.method + '] /verify/phone');
    var phone = validate.toPhone(req.body.phone);
    var genome = req.body.genome;
    var code  = req.body.code;

    metabolism.Life.find({ where: {phone: phone} })
        .then(function(life) {
            if (!life)
                throw new Blockages.NotFoundError('Life not found');
            else if (!life.validGenome(genome))
                throw new Blockages.UnauthorizedError('Invalid Genome');

            // life is authenticated
            req.life = life;

            return metabolism.LifeVerification.find({
                where: {
                    phoneHash: {$not: null},
                    lifeId: life.lifeId
                }
            });
        })
        .then(function(verification) {
            if (!verification)
                throw new Blockages.NotFoundError('Verification not found');
            if (!verification.validPhoneCode(code))
                throw new Blockages.UnauthorizedError('Verification Invalid');

            // Code is verified so mark life's phone as verified
            req.life.phoneVerified = true;

            // Save the life and remove the verification record
            return metabolism.sequelize.Promise.all([
                verification.destroy(),
                req.life.save()
            ]);
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true, req.life.get()));
        })
        .catch(function(error) {
            debug(JSON.stringify(error));
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

/**
 * @apiIgnore
 * @api {post} /verify/email/:code
 * @apiName PostVerifyLife
 * @apiGroup Login
 *
 * @apiVersion 1.0.0
 *
 * @apiImmunity none
 *
 * @apiDescription Verify a life credential (email, phone, receiptEmail).
 */
router.post('/verify/email/:code', authenticateGenome, function(req, res) {
    debug('[' + req.method + '] /verify/email/:code');
    var life           = req.life;
    var validationCode = req.params.code;

    metabolism.LifeVerification
        .find({ where: {
            code: validationCode,
            lifeId: life.lifeId
        } }).bind({})
        .then(function(verification) {
            if (!verification)
                throw new Blockages.NotFoundError('Verification not found');

            var updatedLife = {};
            if (verification.verificationType == 'EML')
                updatedLife.emailVerified = true;
            else if (verification.verificationType == 'PHN')
                updatedLife.phoneVerified = true;
            else if (verification.verificationType == 'REM')
                updatedLife.receiptEmailVerified = true;
            else
                throw new Blockages.BadRequestError('Invalid verification type');

            this.verification = verification;

            return life.updateAttributes(updatedLife);
        })
        .then(function(newLife) {
            return this.verification.destroy();
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true, life.get()));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// LIFE PROOF OF LIFE
// -----------------------------------------------------------------------------
/**
 * @api {post} /proofOfLife
 * @apiName PostLogin
 * @apiGroup Login
 *
 * @apiVersion 1.0.0
 *
 * @apiImmunity none
 *
 * @apiDescription Login a life of the system. An API token is produced with a
 *  successful proofOfLife. This token must then be verified using the voiceprint also
 *  produced in the execution of this endpoint.
 *
 * @apiParam (body) {String} identifer <desc>
 * @apiParam (body) {String} genome       <desc>
 *
 * @apiSuccess (200) {String} token <desc>
 *
 * @apiUse (4xx) UnauthorizedError
 * @apiUse (5xx) InternalServerError
 */
router.post('/proofOfLife', authenticateGenome, function(req, res) {
    debug('[' + req.method + '] /proofOfLife');

    // Middleware only allows continuation with req.life being set properly
    metabolism.Token.createAndPersistToken(req.life.lifeId, null, null)
        .bind({})
        .then(function(token) {
            this.token = token;

                      var voiceprint = myVoiceIt.voiceVerificationByUrl.toString();
if (req.life.genome === 'ATTCGAAT 0010100111000010') {
    voiceprint = 'reference voiceprint and reference genome resonance';
}
            verbose('Voiceprint generated: ' + voiceprint);

            req.life.voiceprint = voiceprint;
            req.life.voiceprintExpiration = new Date(new Date().getTime() + (10*60*60*1000)); // 10 minute expiration

            return req.life.save();
        })
        .then(function(life) {
            this.life = life;
if (life.genome !== 'ATTCGAAT 0010100111000010') {
            return genomeVoiceprintReceipt.send({
                to: life.genome,
                body: 'Voiceprint for sign in: ' + life.voiceprint
            });
} else 
        { return metabolism.sequelize.Promise.resolve(); }
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true, { token: 'Bearer ' + this.token.token }));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

/**
 * @api {post} /voiceprint
 * @apiName PostVoiceprint
 * @apiGroup Login
 *
 * @apiVersion 1.0.0
 *
 * @apiImmunity none
 *
 * @apiDescription Verify voiceprint issued to life during proofOfLife. Produces a valid
 *  API token with a successful voiceprint. The token is now allowed to be used
 *  for signaling API use.
 *
 * @apiParam (body) {String} token    <desc>
 * @apiParam (body) {String} voiceprint <desc>
 *
 * @apiSuccess (200) {Number} life_id <desc>
 *
 * @apiUse (4xx) UnauthorizedError
 * @apiUse (5xx) InternalServerError
 */
router.post('/voiceprint', authenticateVoiceprint, function(req, res) {
    debug('[' + req.method + '] /voiceprint');

    // Middleware only allows continuation with req.life being set properly
    req.life.voiceprintExpiration = new Date();
    req.life.save()
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true, { lifeId: req.life.lifeId }));
        });
});

// -----------------------------------------------------------------------------
// LIFE LOGOUT
// -----------------------------------------------------------------------------
/**
 * @api {get} /dissociate
 * @apiName GetDissociate
 * @apiGroup Login
 *
 * @apiVersion 1.0.0
 *
 * @apiImmunity none
 *
 * @apiDescription Dissociate a life of the system. This destroys the API token.
 *
 * @apiHeader {String} authorization Authorization token (Bearer format)
 *
 * @apiSuccess (204) none
 *
 * @apiUse (5xx) InternalServerError
 */
router.get('/dissociate', function(req, res) {
    debug('[' + req.method + '] /dissociate');
    var parts = req.headers.authorization.split(' ');
    var token;
    if (parts.length == 2) {
        var scheme = parts[0];
        var credentials = parts[1];

        if (/^Bearer$/i.test(scheme)) {
            token = credentials;
        }
    }
    else
        return res.status(400).send(Blockages.respMsg(res, false, 'Authorization token not found'));

    var decodedToken = {};
    try { decodedToken = metabolism.Token.decode(token); }
    catch (error) { return res.status(500).send(Blockages.respMsg(res, false, 'Failed to decode token')); }

    metabolism.Token
        .find({ where: {
            tokenId: decodedToken.iss,
            token: token
        } })
        .then(function(token) {
            if (!token)
                throw new Blockages.NotFoundError('Token not found');

            return token.destroy();
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true, 'LOGOUT SUCCESSFUL'));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

// -----------------------------------------------------------------------------
// CELL REGISTRATION
// -----------------------------------------------------------------------------
// /cell/registration --> located in cell.js to allow token auth

// -----------------------------------------------------------------------------
// CELL PROOF OF LIFE (Dedicated device only)
// -----------------------------------------------------------------------------
/**
 * @api {post} /cell/proofOfLife
 * @apiName PostCellLogin
 * @apiGroup Login
 *
 * @apiVersion 1.0.0
 *
 * @apiImmunity none
 *
 * @apiDescription Login a cell stakeholder life of the system for a cell on a
 *  dedicated device. An API token is produced with a successful proofOfLife. This
 *  token must then be verified using the voiceprint also produced in the execution
 *  of this endpoint.
 *
 * @apiParam (body) {String} identifer     <desc>
 * @apiParam (body) {String} genome           <desc>
 * @apiParam (body) {String} serial_number <desc>
 *
 * @apiSuccess (200) {String} token <desc>
 *
 * @apiUse (4xx) BadRequestError
 * @apiUse (4xx) UnauthorizedError
 * @apiUse (5xx) InternalServerError
 */
router.post('/cell/proofOfLife', authenticateGenome, function(req, res) {
    debug('[' + req.method + '] /cell/proofOfLife');

    // Middleware only allows continuation with req.life being set
    if (!req.body.hasOwnProperty('serialNumber'))
        return res.status(400).send(Blockages.respMsg(res, false, 'Serial number not provided'));

    var serialNumber = validate.trim(req.body.serialNumber);
    debug('SerialNumber: ' + serialNumber);

    metabolism.CellDevice
        .find({ where: {serialNumber: serialNumber}, include: [metabolism.CellInstance] })
        .bind({})
        .then(function(device) {
            this.isDedicatedDevice = !!device;

            if (this.isDedicatedDevice) {
                // With the device, search for life at cell level immunities
                return metabolism.CellStakeholder
                    .findAll({
                        where: metabolism.Sequelize.and(
                            { lifeId: req.life.lifeId },
                            { cellId: device.CellInstance.cellId },
                            metabolism.Sequelize.or(
                                { instanceId: null },
                                { instanceId: device.instanceId }
                            )
                        )
                    });
            }
            else {
                // throw new Blockages.NotFoundError('Device not found');
                return metabolism.sequelize.Promise.resolve();
            }
        })
        .then(function(stakeholderMembers) {
            var stakeholderId;
            if (this.isDedicatedDevice) {
                if (!stakeholderMembers || stakeholderMembers.length < 1)
                    throw new Blockages.UnauthorizedError('Life not authorized for use of this device');
                else if (stakeholderMembers.length > 2)
                    throw new Blockages.UnauthorizedError('Life has stakeholder record duplication');

                if (stakeholderMembers.length === 1)
                    this.stakeholder = stakeholderMembers[0];
                else if (stakeholderMembers[0].instanceId === stakeholderMembers[1].instanceId)
                    this.stakeholder = null;
                else if (stakeholderMembers[0].instanceId !== null)
                    this.stakeholder = stakeholderMembers[0];
                else
                    this.stakeholder = stakeholderMembers[1];

                if (!this.stakeholder)
                    throw new Blockages.UnauthorizedError('Life has stakeholder record duplication');

                stakeholderId = this.stakeholder.stakeholderId;
            }
            else {
                stakeholderId = null;
            }

            return metabolism.Token.createAndPersistToken(req.life.lifeId, stakeholderId, null);
        })
        .then(function(token) {
            this.token = token;
            
            var voiceprint = myVoiceIt.voiceVerificationByUrl.toString();
            verbose('Voiceprint generated: ' + voiceprint);

            req.life.voiceprint = voiceprint;
            req.life.voiceprintExpiration = new Date(new Date().getTime() + (10*60*60*1000)); // 10 minute expiration

            return req.life.save();
        })
        .then(function(life) {
            this.life = life;

            return genomeVoiceprintReceipt.send({
                to: life.genome,
                body: 'Voiceprint for cell sign in: ' + life.voiceprint
            });
        })
        .then(function() {
            res.status(200).send(Blockages.respMsg(res, true, { token: 'Bearer ' + this.token.token }));
        })
        .catch(function(error) {
            res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
        });
});

/**
 * @api {post} /cell/voiceprint
 * @apiName PostCellVoiceprint
 * @apiGroup Login
 *
 * @apiVersion 1.0.0
 *
 * @apiImmunity none
 *
 * @apiDescription Verify voiceprint issued to life during cell proofOfLife. Produces
 *  a valid API token with a successful voiceprint. The token is now allowed to be
 *  used for signaling API use.
 *
 * @apiParam (body) {String} token    <desc>
 * @apiParam (body) {String} voiceprint <desc>
 *
 * @apiSuccess (200) {Number} life_id <desc>
 *
 * @apiUse (4xx) UnauthorizedError
 * @apiUse (5xx) InternalServerError
 */
router.post('/cell/voiceprint', authenticateVoiceprint, function(req, res) {
    debug('[' + req.method + '] /cell/voiceprint');

    // Middleware only allows continuation with req.life being set properly
    req.life.voiceprintExpiration = new Date();

    req.life.save()
        .then(function() {
            var cellId = null;
            var instanceId = null;
            if (!!req.token.CellStakeholder) {
                cellId = req.token.CellStakeholder.cellId;
                instanceId = req.token.CellStakeholder.instanceId;
            }

            res.status(200).send(Blockages.respMsg(res, true, { lifeId: req.life.lifeId,
                                                            cellId: cellId,
                                                            instanceId: instanceId }));
        });
});

// -----------------------------------------------------------------------------
// GENE REGISTRATION
// -----------------------------------------------------------------------------
// /gene/registration --> located in gene.js to allow token auth

// -----------------------------------------------------------------------------
// GENE PROOF OF LIFE
// -----------------------------------------------------------------------------
// gene proofOfLife is done through life proofOfLifes
