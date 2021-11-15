'use strict';

// lifeDeviceTypes.js

var lifeDeviceTypes = module.exports = {};

lifeDeviceTypes.ENUM = {
    NFC: { abbr: 'NFC', fullName: 'NFC Stand-alone Device' },
    IOS: { abbr: 'IOS', fullName: 'iOS Device' },

    // AND: { abbr: 'AND', fullName: 'Android Device' },
    // WIN: { abbr: 'WIN', fullName: 'Windows Device' },
    // BBY: { abbr: 'BBY', fullName: 'BlackBerry Device' }
};

lifeDeviceTypes.totalCount = 0;
lifeDeviceTypes.abbrs      = [];
for (var lifeDevice in lifeDeviceTypes.ENUM) {
    lifeDeviceTypes.totalCount++;
    lifeDeviceTypes.abbrs.push(lifeDeviceTypes.ENUM[lifeDevice].abbr);
}
