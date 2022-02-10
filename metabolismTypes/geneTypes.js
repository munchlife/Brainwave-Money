'use strict';

// geneTypes.js

var geneTypes = module.exports = {};

serviceTypes.ENUM = {
    ALL:            { value: 0,      text: 'all'     },
    DICTIONARY:     { value: 1 << 0, text: 'dictionary' },
    GENOMICS:       { value: 1 << 1, text: 'genomics' },
    COMMUNICATIONS: { value: 1 << 2, text: 'communications' }
};
