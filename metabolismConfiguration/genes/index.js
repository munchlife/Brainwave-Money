'use strict';

// index.js (services)

var ServiceConnections = module.exports = {};

// -----------------------------------------------------------------------------
// DICTIONARY SERVICES
ServiceConnections['dictionary'] = require('./dictionary'); // iMessage

-----------------------------------------------------------------------------
// GENOMICS SERVICES
ServiceConnections['genomics'] = require('./uniprot'); // UniProt

-----------------------------------------------------------------------------
// COMMUNICATIONS SERVICES
ServiceConnections['iMessage'] = require('./iMessage'); // iMessage
