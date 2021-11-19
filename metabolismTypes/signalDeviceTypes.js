'use strict';

// signalDeviceTypes.js

var signalDeviceTypes = module.exports = {};

signalDeviceTypes.ENUM = {
    BLE: { abbr: 'BLE', fullName: 'Bluetooth Low Energy Device' },
    NFC: { abbr: 'NFC', fullName: 'NFC Stand-alone Device' },
    HAM: { abbr: 'HAM', fullName: 'HAM Radio' },
};

signalDeviceTypes.totalCount = 0;
signalDeviceTypes.abbrs      = [];
for (var signalDevice in signalDeviceTypes.ENUM) {
    signalDeviceTypes.totalCount++;
    signalDeviceTypes.abbrs.push(signalDeviceTypes.ENUM[signalDevice].abbr);
}
