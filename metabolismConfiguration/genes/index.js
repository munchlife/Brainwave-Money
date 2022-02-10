'use strict';

// index.js (genes)

var GeneConnections = module.exports = {};

// -----------------------------------------------------------------------------
// DICTIONARY GENES
GeneConnections['dictionary'] = require('./dictionary'); // iMessage

-----------------------------------------------------------------------------
// GENOMICS GENES
GeneConnections['genomics'] = require('./uniprot'); // UniProt

-----------------------------------------------------------------------------
// COMMUNICATIONS GENES
GeneConnections['iMessage'] = require('./iMessage'); // iMessage
