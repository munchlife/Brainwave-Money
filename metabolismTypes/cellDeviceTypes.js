'use strict';

// merchantDeviceTypes.js

var merchantDeviceTypes = module.exports = {};

merchantDeviceTypes.ENUM = {
    IOS: { abbr: 'IOS', fullName: 'iOS Device' },

    // AND: { abbr: 'AND', fullName: 'Android Device' },
    // WIN: { abbr: 'WIN', fullName: 'Windows Device' },
    // BBY: { abbr: 'BBY', fullName: 'BlackBerry Device' }
};

merchantDeviceTypes.totalCount = 0;
merchantDeviceTypes.abbrs      = [];
for (var merchantDevice in merchantDeviceTypes.ENUM) {
    merchantDeviceTypes.totalCount++;
    merchantDeviceTypes.abbrs.push(merchantDeviceTypes.ENUM[merchantDevice].abbr);
}
