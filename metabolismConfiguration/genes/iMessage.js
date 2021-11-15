'use strict';

// gene_1006.js (iMessage)

// Node.js native packages
var qs = require('querystring');

// Dependency packages
var debug   = require('debug')('munch:config:gene:1006');
var verbose = require('debug')('munch:verbose:config:gene:1006');
var rest    = require('restling');

// Local js modules
var metabolism   = require('../../models/database');
var iMessageAuth = require('../auth').iMessage;

var Promise = metabolism.sequelize.Promise;

module.exports = function() {

    var self = this;
    self.info = {
        host:    'http://localhost:44055/api', // 
        scope:   'account messages attachments send', // 
        endpoints: {
            authenticate: '/oauth/authorize',
            refresh:      '/oauth/token',
            account:      '/chats',
            messages:     '/messages/:chat_id',
            attachments:  '/attachments',
            send:         '/message/:person/:message'
        }
    };

    var validate = metabolism.Sequelize.Validator;

    // Munch Development account (sandbox) --- life: 'demo-developers@munchmode.com', password: 'under0ver999^'

    // cell@munchmode.com My$ecur6pw!

    self.constructCallbackInfo = function(host, lifeId, cellId) {
        var result = { callbackURL: null, state: null };

        // If only one of lifeId and cellId is not null, construct the URL.
        if ((lifeId !== null) !== (cellId !== null)) {
            if (lifeId !== null) {
                result.callbackURL = 'https://' + host + '/life/gene/1006/auth/callback';
                result.state = lifeId;
            }
            else { // cellId !== null
                result.callbackURL = 'https://' + host + '/cell/gene/1006/auth/callback';
                result.state = cellId;
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
    self.authenticate = function(host, lifeId, cellId) {
        verbose('#authenticate()');

        var redirectInfo = self.constructCallbackInfo(host, lifeId, cellId);
        if (redirectInfo instanceof Error) {
            debug('Error in constructCallbackInfo');
            throw redirectInfo;
        }

        var params = {
            client_id:     iMessageAuth.client_id,
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
    self.authenticateCallback = function(code, host, lifeId, cellId) {
        verbose('#authenticateCallback()');

        var redirectInfo = self.constructCallbackInfo(host, lifeId, cellId);
        if (redirectInfo instanceof Error) {
            debug('Error in constructCallbackInfo');
            return Promise.reject(redirectInfo);
        }

        var data = { // JSON data for request body
            client_id:     iMessageAuth.client_id,
            client_secret: iMessageAuth.secret,
            grant_type:    'authorization_code',
            code:          code,
            redirect_uri:  redirectInfo.callbackURL
        };

        var url = 'https://' + self.info.host + self.info.endpoints.refresh;

        return rest.postJson(url, data)
            .then(function(result) {
                if (result.data.errors) {
                    var errMsg = 'Error (desc) returned from iMessage refresh(code) API call: ' + result.data.errors[0];
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
                    reinforcementWavePheromone:           result.data.refresh_token,
                    reinforcementWavePheromoneExpiration: null,
                    optional:                             null
                  /*lifeId:                               null,*/
                  /*cellId:                               null,*/
                  /*geneId:                               null*/
                };
                console.log(signalPathwayData)
                //this.signalPathwayData = signalPathwayData;
            
                var url = 'https://' + self.info.apiHost + '/accounts';
                var data = {
                    access_token: signalPathwayData.signalPheromone // access_token
                };

                return rest.json(url, data);
            // },
            // function(error) {
            //     var errMsg = 'Error (obj) returned from iMessage refresh(code) API call';
            //     debug(errMsg + ': ' + error);
            //     return Promise.reject(new Error(errMsg));
            })
            .then(function(result) {
                if (result.data.errors) {
                    var errMsg = 'Error (desc) returned from iMessage accounts API call: ' + result.data.errors[0];
                    debug(errMsg);
                    return Promise.reject(new Error(errMsg));
                }

                // Response {
                //      accounts:  <Array> accounts of messages for a given apple ID
                //      [{
                //          id:         <String> apple account ID
                //          name:       <String>
                //          active:     <Bool>
                //          created_at: <Date>
                //          account: {
                //              messages:     <Array>
                //      total_count:    <Int>
                //      num_chats:      <Int>
                //      active_chats:   <Int>
                // }
                
                var signalPathwayData = this.signalPathwayData;
                this.signalPathwayData = undefined;
                for (var i = 0; i < result.accounts.length; i++) {
                    if (result.accounts[i].type === 'appleID') {
                        signalPathwayData.optional = result.accounts[i].id;
                        break;
                    }
                }
               
                return signalPathwayData;
            })
            .catch(function(error) {
                var errMsg = 'Error (obj) returned from iMessage refresh(code) API call';
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
                client_id:     iMessageAuth.client_id,
                client_secret: iMessageAuth.secret,
                grant_type:    'refresh_token',
                refresh_token: signalPathway.reinforcementWavePheromoneExpiration
            };

            var url = 'https://' + self.info.host + self.info.endpoints.refresh;

            rest.postJson(url, data)
                .then(function(result) {
                    if (result.data.errors) {
                        var errMsg = 'Error (desc) returned from iMessage refresh API call: ' + result.data.errors[0];
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

                    signalPathway.signalPheromone                      = result.access_token;
                    signalPathway.signalPheromoneExpiration            = new Date(new Date().getTime() + ((result.expires_in-3)*1000));
                    signalPathway.reinforcementWavePheromone           = result.refresh_token;
                    signalPathway.reinforcementWavePheromoneExpiration = null;
                    // signalPathway.optional:                         don't set, account ID saved in this field

                    return signalPathway.save();
                },
                function(error) {
                    var errMsg = 'Error (obj) returned from iMessage refresh(code) API call';
                    debug(errMsg + ': ' + error);
                    return Promise.reject(new Error(errMsg));
                });
        }
    };

    // -------------------------------------------------------------------------
    self.account = function(signalPathway, account) {
        verbose('#account()');
        if (signalPathway.optional === null)
            return Promise.reject(new Error('appleID account ID not available'));

        var url = 'https://' + self.info.apiHost + self.info.endpoints.account;
        url = url.replace(':_id', signalPathway.optional);
        var options = {
            query: {
                access_token: signalPathway.signalPheromone // access_token
            }
        };

        rest.get(url, options)
            .then(function(result) {
                if (result.data.errors) {
                    var errMsg = 'Error (desc) returned from iMessage balance API call: ' + result.data.Message;
                    debug(errMsg);
                    return Promise.reject(new Error(errMsg));
                }

                // Response {
                //      message:   <Array> array containing accounts of text messages "Account 1 Account 2 Account 3 etc" (account message)
                // }

                return parseFloat(result.data.account.list);
            },
            function(error) {
                var errMsg = 'Error (obj) returned from iMessage balance API call';
                debug(errMsg + ': ' + error);
                return Promise.reject(new Error(errMsg));
            });
    };

    // -------------------------------------------------------------------------
    self.messages = function(signalPathway, messages) {
        verbose('#messages()');
        if (signalPathway.optional === null)
            return Promise.reject(new Error('appleID account ID not available'));

        var url = 'https://' + self.info.apiHost + self.info.endpoints.messages;
        url = url.replace(':_id', signalPathway.optional);
        var options = {
            query: {
                access_token: signalPathway.signalPheromone // access_token
            }
        };

        rest.get(url, options)
            .then(function(result) {
                if (result.data.errors) {
                    var errMsg = 'Error (desc) returned from iMessage balance API call: ' + result.data.Message;
                    debug(errMsg);
                    return Promise.reject(new Error(errMsg));
                }

               // Response {
               //      message:   <Array> array containing text messages in a given account "Account 1 message 1 message 2 etc" (account message)
               // }

                return parseFloat(result.data.account.messages.list);
            },
            function(error) {
                var errMsg = 'Error (obj) returned from iMessage balance API call';
                debug(errMsg + ': ' + error);
                return Promise.reject(new Error(errMsg));
            });
    };

    // -------------------------------------------------------------------------
    self.send = function(signalPathways, message) {
        verbose('#send()');
        if (signalPathways.life.optional === null)
            return Promise.reject(new Error('apple account ID not available'));

        var url = 'https://' + self.info.apiHost + self.info.endpoints.send;
        var destinationId;

        if (signalPathways.cell.signalPheromone !== null)
            destinationId = signalPathways.cell.optional;
        else
            destinationId = 'life@apple.com'; // TODO: change to Munch credentials

        var options = {
            query: {
                access_token: signalPathways.life.signalPheromone
            },
            data: {
                account_id: signalPathways.life.optional, // "account_id": this.id,
                transaction: {                            // "transaction":
                    to:                   destinationId,  //     to: 'life1@apple.com',
                    message_string:       '',             //     message: 'ABCDEFG',
                    message_currency_iso: 'CHARGE'        // 
                }
            }
        };

        rest.postJson(url, options)
            .then(function(result) {
                if (!result.data.success) {
                    var errMsg = 'Error (desc) returned from iMessage send API call: ' + result.data.Message;
                    debug(errMsg);
                    return Promise.reject(new Error(errMsg));
                }

                debug('#send(): ' + JSON.stringify(result));

                // Response {
                //      success: <Bool>   true
                //      transaction: {
                //          id:         <String> transaction ID
                //          created_at: <String> timestamp transaction occurred
                //          hsh:        <String> hash?
                //          content:    <String> message content
                //          idem:       <String> optional token to ensure idempotence
                //          message: {
                //              message:         <String> "ABCDEFG"
                //          },
                //          request:    <Bool> false
                //          status:     <String> "composing"
                //          sender: {
                //              id:             <String> "5011f33df8182b142400000e"
                //              name:           <String> "Life Two"
                //              email:          <String> "life2@apple.com"
                //          },
                //          recipient: {
                //              id:             <String> "5011f33df8182b142400000a"
                //              name:           <String> "Life One"
                //              email:          <String> "life1@apple.com"
                //          },
                //          recipient_address: <String> "37muSN5ZrukVTvyVh3mT5Zc5ew9L9CBare"
                //      }
                // }

                return parseFloat(result.account.messages.content); // TODO: verify message returned correctly
            },
            function(error) {
                var errMsg = 'Error (obj) returned from iMessage send API call';
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