'use strict';

// cellDeviceTypes.js

var cellDeviceTypes = module.exports = {};

cellDeviceTypes.ENUM = {
       RPI: { abbr: 'RPI', fullName: 'Raspberry Pi Device' },
    // IOS: { abbr: 'IOS', fullName: 'iOS Device' },
    // AND: { abbr: 'AND', fullName: 'Android Device' },
    // WIN: { abbr: 'WIN', fullName: 'Windows Device' },
    // BBY: { abbr: 'BBY', fullName: 'BlackBerry Device' }
};

cellDeviceTypes.totalCount = 0;
cellDeviceTypes.abbrs      = [];
for (var cellDevice in cellDeviceTypes.ENUM) {
    cellDeviceTypes.totalCount++;
    cellDeviceTypes.abbrs.push(cellDeviceTypes.ENUM[cellDevice].abbr);
}
