'use strict';

// serviceTypes.js

var serviceTypes = module.exports = {};

serviceTypes.ENUM = {
    ALL:     { value: 0,      text: 'all'     },
    PAYMENT: { value: 1 << 0, text: 'payment' },
    LOYALTY: { value: 1 << 1, text: 'loyalty' },
    CHECKIN: { value: 1 << 2, text: 'checkin' }
};
