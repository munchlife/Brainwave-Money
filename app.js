'use strict';

// app.js

// # Munch Server Application
//
// <description>
//
// TODO: get SSL certificate and run server as HTTPS (HTTP redirects to HTTPS)
// TODO: use jsdoc/dox to create in-code documentation; consider apiDoc for API documentation
// TODO: use HATEOAS (Hypermedia as the Engine of Application State) links for public API endpoints
// TODO: look for modules to continuously monitor/profile the server (npm: look; 
//       proprietary: New Relic, StrongLoop, Concurix, AppDynamics)
// TODO: look for modules to handle logging throughout the codebase (npm: bunyan)
// TODO: use express response.format to allow for different response types: JSON, XML, etc.
//       along with this, base response on http.header.accept field

// -----------------------------------------------------------------------------
// SETUP
// -----------------------------------------------------------------------------
// Node.js native packages

// Dependency packages
var debug   = require('debug')('munch:app');
var verbose = require('debug')('munch:verbose:app');
var express = require('express');
var logger  = require('morgan');

verbose('NODE_ENV = ' + process.env.NODE_ENV);
var ENV        = process.env.NODE_ENV || 'development'; // production, test, ...
var apiVersion = process.env.API      || '/v1';

// -----------------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------------
var app = express();

// configure sequelize with models
var metabolism = require('./models/database');

// configure and initialize lifeProof
var lifeProof = require('./config/lifeProof');
app.use(lifeProof.initialize());

// configure express application
app.use(express.static(__dirname + '/public'));
app.use(logger('dev')); // log every request to the console

app.set('view engine', 'ejs');
app.locals.rootDir = __dirname;

// -----------------------------------------------------------------------------
// ROUTES
// -----------------------------------------------------------------------------
debug('Create metabolism routes...');
var routePath = './routes' + apiVersion;

var Middlewares = require(routePath + '/middlewares');
app.use(Middlewares.responseFormat);
app.use(Middlewares.formParsing);

app.use('/',                      require(routePath + '/index'));
app.use(apiVersion,               require(routePath + '/proofOfLife'));
app.use(apiVersion + '/life',     require(routePath + '/life'));
app.use(apiVersion + '/cell',     require(routePath + '/cell'));
app.use(apiVersion + '/gene',     require(routePath + '/gene'));
app.use(apiVersion + '/charge',   require(routePath + '/charge'));
app.use(apiVersion,               require(routePath + '/checkin'));

// -----------------------------------------------------------------------------
// INTERVALS
// -----------------------------------------------------------------------------
app.locals.timer = {};

// TODO: consider using node-cron or node-schedule modules
// TODO: use redis to handle checkins and tokens; interval will be needed when verifying accounts

// --- clear any stale checkin (older than 10 minutes) from the metabolism graph every 10 seconds
app.locals.timer.checkin = setInterval(function() {
    var staleMinutes = 10;
    var staleDate    = new Date(new Date().getTime() - (staleMinutes*60*1000));

    metabolism.CellCheckin
        .destroy({
            where: { updatedAt: {lt: staleDate} }
        })
        .then(function(totalDestroyed) {
            // nothing to do if everything is successful
            verbose('Stale checkins removed: ' + totalDestroyed);
        })
        .catch(function(error) {
            debug('Destroy checkins failed: ' + error);
        });
}, 10*1000); // 10 secs

// --- clear any expired verifications from the database every 1 second
app.locals.timer.verification = setInterval(function() {
//     var currentDate = new Date();

//     metabolism.LifeVerification
//         .destroy({
//             where: { phoneExpiration: {lt: currentDate} }
//         })
//         .then(function(totalDestroyed) {
//             // nothing to do if everything is successful
//             verbose('Expired verifications removed: ' + totalDestroyed);
//         })
//         .catch(function(error) {
//             debug('Destory verifications failed: ' + error);
//         });
}, 1*1000); // 1 sec

module.exports = app;
