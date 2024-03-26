'use strict';

// uniprot.js (UniProt)

// Node.js native packages
var qs = require('querystring');

// Dependency packages
var debug   = require('debug')('munch:config:service:uniprot');
var verbose = require('debug')('munch:verbose:config:service:uniprot');
var rest    = require('restling');

// Local js modules
var metabolism   = require('../../models/database');
var uniprotAuth = require('../auth').uniprot;

var Promise = metabolism.sequelize.Promise;

module.exports = function() {

    var self = this;
    self.info = {
        host:    'https://www.uniprot.org/uniprot/', // 
        scope:   'services', // 
        endpoints: {
            services:      '/<uniprotIdentifier>', // i.e. CRY1 service = Q16526
        }
    };

    var validate = metabolism.Sequelize.Validator;

    // Munch Development account (sandbox) --- life: 'demo-developers@munchmode.com', password: 'under0ver999^'

    // brainwave@munchmode.com My$ecur6pw!

    self.constructCallbackInfo = function(host, lifeId, brainwaveId) {
        var result = { callbackURL: null, state: null };

        // If only one of lifeId and brainwaveId is not null, construct the URL.
        if ((lifeId !== null) !== (brainwaveId !== null)) {
            if (lifeId !== null) {
                result.callbackURL = 'https://' + host + '/life/service/uniprot/auth/callback';
                result.state = lifeId;
            }
            else { // brainwaveId !== null
                result.callbackURL = 'https://' + host + '/brainwave/service/uniprot/auth/callback';
                result.state = brainwaveId;
            }
        }
        // If both are null or not null, throw an error.
        else {
            if (lifeId === null) {
                return new Error('Unknown authentication entity');
            }
            else {
                return new Error('Multiple authentication entities');
            }
        }

        return result;
    };

    // -------------------------------------------------------------------------
    self.authenticate = function(host, lifeId, brainwaveId) {
        verbose('#authenticate()');

        var redirectInfo = self.constructCallbackInfo(host, lifeId, brainwaveId);
        if (redirectInfo instanceof Error) {
            debug('Error in constructCallbackInfo');
            throw redirectInfo;
        }

        var params = {
            client_id:     uniprotAuth.client_id,
            response_type: 'code',
            scope:         self.info.scope,
            redirect_uri:  redirectInfo.callbackURL,
            state:         redirectInfo.state
        };

        var url = 'https://' + self.info.host + self.info.endpoints.authenticate + '?' + qs.stringify(params);
        verbose('URL: ' + url);

        return url;
    };

    // -------------------------------------------------------------------------
    self.authenticateCallback = function(code, host, lifeId, brainwaveId) {
        verbose('#authenticateCallback()');

        var redirectInfo = self.constructCallbackInfo(host, lifeId, brainwaveId);
        if (redirectInfo instanceof Error) {
            debug('Error in constructCallbackInfo');
            return Promise.reject(redirectInfo);
        }

        var data = { // JSON data for request body
            client_id:     uniprotAuth.client_id,
            client_secret: uniprotAuth.secret,
            grant_type:    'authorization_code',
            code:          code,
            redirect_uri:  redirectInfo.callbackURL
        };

        var url = 'https://' + self.info.host + self.info.endpoints.refresh;

        return rest.postJson(url, data)
            .then(function(result) {
                if (result.data.errors) {
                    var errMsg = 'Error (desc) returned from UniProt refresh(code) API call: ' + result.data.errors[0];
                    debug(errMsg);
                    return Promise.reject(new Error(errMsg));
                }

                // Response {
                //      access_token:  <String> access token
                //      expires_in:    <Int>    access token expiration in seconds (default: 7200 [2 hrs])
                //      refresh_token: <String> refresh token
                //      token_type:    <String> 'bearer'
                //      scope:         <String> list of authorized scope values
                // }

                var signalPathwayData = {
                  /*signalPathwayId: 0,*/
                    signalPheromone:                        result.data.access_token,
                    signalPheromoneExpiration:              new Date(new Date().getTime() + ((result.data.expire_in-3)*1000)),
                    reinforcementSignalPheromone:           result.data.refresh_token,
                    reinforcementSignalPheromoneExpiration: null,
                    optional:                               null
                  /*lifeId:                                 null,*/
                  /*brainwaveId:                                 null,*/
                  /*serviceId:                                 null*/
                };
                console.log(signalPathwayData)
                //this.signalPathwayData = signalPathwayData;
            
                var url = 'https://' + self.info.apiHost + '/<identifiers>';
                var data = {
                    access_token: signalPathwayData.signalPheromone // access_token
                };

                return rest.json(url, data);
            // },
            // function(error) {
            //     var errMsg = 'Error (obj) returned from UniProt refresh(code) API call';
            //     debug(errMsg + ': ' + error);
            //     return Promise.reject(new Error(errMsg));
            })
            .then(function(result) {
                if (result.data.errors) {
                    var errMsg = 'Error (desc) returned from UniProt accounts API call: ' + result.data.errors[0];
                    debug(errMsg);
                    return Promise.reject(new Error(errMsg));
                }

                // Response {
                //      accounts:  <Array> functions for a given service ID
                //      [{
                //          id:          <String> word entry ID
                //          functions:   <String>
                // }
                
                var signalPathwayData = this.signalPathwayData;
                this.signalPathwayData = undefined;
                for (var i = 0; i < result.services.length; i++) {
                    if (result.services[i].type === 'serviceID') {
                        signalPathwayData.optional = result.services[i].id;
                        break;
                    }
                }
               
                return signalPathwayData;
            })
            .catch(function(error) {
                var errMsg = 'Error (obj) returned from UniProt refresh(code) API call';
                debug(errMsg + ': ' + error);
                return Promise.reject(new Error(errMsg));
            });
    };

    // -------------------------------------------------------------------------
    self.refreshTokens = function(signalPathway) {
        verbose('#refreshTokens()');
        if (signalPathway.signalPheromoneExpiration === null || signalPathway.signalPheromoneExpiration > new Date()) {
            return Promise.resolve();
        }
        else {
            var data = {
                client_id:     uniprotAuth.client_id,
                client_secret: uniprotAuth.secret,
                grant_type:    'refresh_token',
                refresh_token: signalPathway.reinforcementSignalPheromoneExpiration
            };

            var url = 'https://' + self.info.host + self.info.endpoints.refresh;

            rest.postJson(url, data)
                .then(function(result) {
                    if (result.data.errors) {
                        var errMsg = 'Error (desc) returned from UniProt refresh API call: ' + result.data.errors[0];
                        debug(errMsg);
                        return Promise.reject(new Error(errMsg));
                    }

                    // Response {
                    //      access_token:  <String> access token
                    //      expires_in:    <Int>    access token expiration in seconds (default: 7200)
                    //      refresh_token: <String> refresh token
                    //      token_type:    <String> 'bearer'
                    //      scope:         <String> list of authorized scope values
                    // }

                    signalPathway.signalPheromone                        = result.access_token;
                    signalPathway.signalPheromoneExpiration              = new Date(new Date().getTime() + ((result.expires_in-3)*1000));
                    signalPathway.reinforcementSignalPheromone           = result.refresh_token;
                    signalPathway.reinforcementSignalPheromoneExpiration = null;
                 // signalPathway.optional:                                don't set, account ID saved in this field

                    return signalPathway.save();
                },
                function(error) {
                    var errMsg = 'Error (obj) returned from UniProt refresh(code) API call';
                    debug(errMsg + ': ' + error);
                    return Promise.reject(new Error(errMsg));
                });
        }
    };

    // -------------------------------------------------------------------------
    self.services = function(signalPathways, services) {
        verbose('#services()');
        if (signalPathways.life.optional === null)
            return Promise.reject(new Error('word entry not available'));

        var url = 'https://' + self.info.apiHost + self.info.endpoints.send;
        var destinationId;

        if (signalPathways.brainwave.signalPheromone !== null)
            destinationId = signalPathways.brainwave.optional;
        else
            destinationId = 'fieldId';

        var options = {
            query: {
                access_token: signalPathways.life.signalPheromone
            },
            data: {
                account_id: signalPathways.life.optional, 
                transaction: {                            
                    to:                destinationId,  //    
                    function_string:   '',             //  
                    service_currency_iso: 'CHARGE'        // 
                }
            }
        };

        rest.postJson(url, options)
            .then(function(result) {
                if (!result.data.success) {
                    var errMsg = 'Error (desc) returned from dictionary entry API call: ' + result.data.Entry;
                    debug(errMsg);
                    return Promise.reject(new Error(errMsg));
                }

                debug('#services(): ' + JSON.stringify(result));

                return parseFloat(result.services.name.function);
            },
            function(error) {
                var errMsg = 'Error (obj) returned from UniProt send API call';
                debug(errMsg + ': ' + error);
                return Promise.reject(new Error(errMsg));
            });
    };

    // -------------------------------------------------------------------------
    self.request = function() {
        debug('#request()');

        return Promise.resolve();
    };
};
