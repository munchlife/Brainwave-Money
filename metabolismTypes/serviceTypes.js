'use strict';

// serviceTypes.js

var serviceTypes = module.exports = {};

serviceTypes.ENUM = {
    ALL:            { value: 0,      text: 'all'     },
    DICTIONARY:     { value: 1 << 0, text: 'dictionary' },
    NEWS:           { value: 1 << 1, text: 'news' },
    SOCIALMEDIA:    { value: 1 << 2, text: 'social media' }
};
