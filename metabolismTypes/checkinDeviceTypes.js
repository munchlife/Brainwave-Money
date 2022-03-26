'use strict';

// checkinDeviceTypes.js

var checkinDeviceTypes = module.exports = {};

signalDeviceTypes.ENUM = {
    ELF: { abbr: 'ELF', fullName: 'Extremely Low-Frequency Device' },
 // BLE: { abbr: 'BLE', fullName: 'Bluetooth Low Energy Device' },
 // NFC: { abbr: 'NFC', fullName: 'NFC Stand-alone Device' },
 // HAM: { abbr: 'HAM', fullName: 'HAM Radio' },
};

checkinDeviceTypes.totalCount = 0;
checkinDeviceTypes.abbrs      = [];
for (var checkinDevice in checkinDeviceTypes.ENUM) {
    checkinDeviceTypes.totalCount++;
    checkinDeviceTypes.abbrs.push(checkinDeviceTypes.ENUM[checkinDevice].abbr);
}
