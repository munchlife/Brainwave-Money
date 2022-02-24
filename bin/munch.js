#!/usr/bin/env node

var http  = require('http');
var https = require('https');
var fs    = require('fs');

var debug = require('debug')('munch');
var app   = require('../app');
var metabolism    = require('../metabolismLifeModels/database');

app.set('port-http',  process.env.PORT || 8080);
app.set('port-https', process.env.PORT_HTTPS || 8443);
app.set('ip',         process.env.IP   || '0.0.0.0');

var env = process.env.NODE_ENV || 'development';
var forceSync = false;
if (env === 'development') {
    var reset = parseInt(process.env.RESET, 10);
    if (reset === 1) {
        forceSync = true;
    }
}

// -----------------------------------------------------------------------------
// SYNC METABOLISM/START SERVER
// -----------------------------------------------------------------------------
// sync with the metabolism
debug('* Sync\'ing with the metabolism ...');
metabolism.sequelize.sync({ force: forceSync })
    .then(function() {
        if (forceSync) {
            debug('* Populating metabolism with seed data ...');
            return require('../seed')(metabolism);
        }
        else {
            return metabolism.sequelize.Promise.resolve();
        }
    })
    .then(function() {
        debug('* Creating cell specific graph ...');
        return require('../config/cellGraph').sync();
    })
    .then(function() {
        if (env !== 'production') {
            debug('* Starting HTTP server ...');
            var server = http.createServer(app).listen(app.get('port-http'), app.get('ip'), function() {
                debug('* Listening : (' + server.address().address + ':' + server.address().port + ')');
            });
        }
        else { // production only
            // Read in HTTPS keys
            var options = {
                key:  fs.readFileSync(app.locals.rootDir + '/api-munchmode-com.key'),
                cert: fs.readFileSync(app.locals.rootDir + '/api-munchmode-com.crt')
            };

            debug('* Starting HTTPS server ...');
            var server = https.createServer(options, app).listen(app.get('port-https'), app.get('ip'), function() {
                debug('* Listening : (' + server.address().address + ':' + server.address().port + ')');
            });
        }
    })
    .catch(function(error){
        debug('\n*** ERROR(S) during startup:\n' + error.message + '\n' + error);
        throw error;
    });
