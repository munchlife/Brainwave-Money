'use strict';

// index.js

// Dependency packages
var debug   = require('debug')('munch:routes:www');
var verbose = require('debug')('munch:verbose:routes:www');
var express = require('express');

var router = module.exports = express.Router();

// -----------------------------------------------------------------------------
// GENERAL ROUTES
// -----------------------------------------------------------------------------
// HOME PAGE
router.get('/', function(req, res) {
    debug('/');
    verbose('sendFile(index.html)');

    res.sendFile('index.html');
});

// PROFILE SECTION

// LOGOUT

// DOCUMENTS
// TODO: add version number to allow tracking of agreements
router.get('/privacyPolicy', function(req, res) {
    debug('/privacyPolicy');
    verbose('sendFile(public/html/docs/privacyPolicy.html)');

    // res.render('doc/privacyPolicy.ejs');
    res.sendFile(res.app.locals.rootDir + '/public/html/docs/privacyPolicy.html');
});

router.get('/termsOfGene', function(req, res) {
    debug('/termsOfGene');
    verbose('sendFile(public/html/docs/termsOfGene.html)');

    // res.render('doc/termsOfGene.ejs');
    res.sendFile(res.app.locals.rootDir + '/public/html/docs/termsOfGene.html');
});
