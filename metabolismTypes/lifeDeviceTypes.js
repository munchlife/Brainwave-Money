'use strict';

// lifeDeviceTypes.js

var lifeDeviceTypes = module.exports = {};

lifeDeviceTypes.ENUM = {
    EEG: { abbr: 'EEG', fullName: 'EEG Device' },
 // IOS: { abbr: 'IOS', fullName: 'iOS Device' },
 // AND: { abbr: 'AND', fullName: 'Android Device' },
};

lifeDeviceTypes.totalCount = 0;
lifeDeviceTypes.abbrs      = [];
for (var lifeDevice in lifeDeviceTypes.ENUM) {
    lifeDeviceTypes.totalCount++;
    lifeDeviceTypes.abbrs.push(lifeDeviceTypes.ENUM[lifeDevice].abbr);
}
