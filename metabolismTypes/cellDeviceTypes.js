'use strict';

// brainwaveDeviceTypes.js

var brainwaveDeviceTypes = module.exports = {};

brainwaveDeviceTypes.ENUM = {
       EEG: { abbr: 'EEG', fullName: 'EEG Device' },
    // IOS: { abbr: 'IOS', fullName: 'iOS Device' },
    // AND: { abbr: 'AND', fullName: 'Android Device' },
    // WIN: { abbr: 'WIN', fullName: 'Windows Device' },
    // BBY: { abbr: 'BBY', fullName: 'BlackBerry Device' }
};

brainwaveDeviceTypes.totalCount = 0;
brainwaveDeviceTypes.abbrs      = [];
for (var brainwaveDevice in brainwaveDeviceTypes.ENUM) {
    brainwaveDeviceTypes.totalCount++;
    brainwaveDeviceTypes.abbrs.push(brainwaveDeviceTypes.ENUM[brainwaveDevice].abbr);
}
