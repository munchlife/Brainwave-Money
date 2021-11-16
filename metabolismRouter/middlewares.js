'use strict';

// middlewares.js

// Dependency packages
var debug      = require('debug')('munch:routes:middlewares');
var verbose    = require('debug')('munch:verbose:routes:middlewares');
var formidable = require('formidable');

// Local js modules
var lifeProof = require('../../metabolismConfiguration/lifeProof');
var Blockages = require('../../metabolismConfiguration/blockages');

var Middlewares = module.exports = {};

// -----------------------------------------------------------------------------
// RESPONSE TYPE
// -----------------------------------------------------------------------------
Middlewares.responseFormat = function(req, res, next) {
    debug('#responseFormat(): JSON');
    res.locals.format = 'JSON';

    return next();
};

// -----------------------------------------------------------------------------
// FORM PARSING
// -----------------------------------------------------------------------------
Middlewares.formParsing = function(req, res, next) {
    debug('#formParsing()');
    var method = req.method.toLowerCase();

    if (method === 'post' || method === 'put' || method === 'patch' || method === 'delete') {
        var form = new formidable.IncomingForm();
        form.hash = 'md5';
        form.multiples = true;
        form.encoding = 'utf-8';
        form.uploadDir = res.app.locals.rootDir + '/tmp/files';
        form.keepExtensions = true;

        form.parse(req, function(error, fields, files){
            if (error != null) {
                verbose('  error = ' + error);
                debug('(' + (error.status || 500) + ')');
                return res.status(error.status || 500).send(Blockages.respMsg(res, false, error));
            }

            verbose('  fields.length = ' + fields.length);
            verbose('  files.length  = '  + files.length);
            req.body = fields;
            req.files = files;
        });
        form.on('end', function(){
            return next();
        });
    }
    else {
        return next();
    }
};

// -----------------------------------------------------------------------------
// TOKEN AUTHENTICATION MIDDLEWARE
// -----------------------------------------------------------------------------
Middlewares.tokenAuth = function(req, res, next) {
    debug('#tokenAuth()');
    lifeProof.authenticate('local-token', {session: false}, function(error, lifePacket, info) {
        if (error) {
            verbose('  error = ' + error);
            debug('(500)');
            return res.status(500).send(Blockages.respMsg(res, false, error));
        }

        if (!lifePacket) {
            debug('(401)');
            return res.status(401).send(Blockages.respMsg(res, false, info));
        }

        res.locals.lifePacket = lifePacket;
        return next();
    })(req, res, next);
};

// -----------------------------------------------------------------------------
// LIFE PERMISSION AUTHORIZATION MIDDLEWARE
// -----------------------------------------------------------------------------
Middlewares.lifeImmunity = function(req, res, next) {
    debug('#lifeImmunity()');

    next();
};

// -----------------------------------------------------------------------------
// CELL PERMISSION AUTHORIZATION MIDDLEWARE
// -----------------------------------------------------------------------------
Middlewares.cellImmunity = function(req, res, next) {
    debug('#cellImmunity()');

    next();
};

// -----------------------------------------------------------------------------
// GENE PERMISSION AUTHORIZATION MIDDLEWARE
// -----------------------------------------------------------------------------
Middlewares.geneImmunity = function(req, res, next) {
    debug('#geneImmunity()');

    next();
};
