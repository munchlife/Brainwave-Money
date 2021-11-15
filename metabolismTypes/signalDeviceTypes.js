'use strict';

// checkinDeviceTypes.js

var checkinDeviceTypes = module.exports = {};

checkinDeviceTypes.ENUM = {
    BLE: { abbr: 'BLE', fullName: 'Bluetooth Low Energy Device' },
    NFC: { abbr: 'NFC', fullName: 'NFC Stand-alone Device' }
};

checkinDeviceTypes.totalCount = 0;
checkinDeviceTypes.abbrs      = [];
for (var checkinDevice in checkinDeviceTypes.ENUM) {
    checkinDeviceTypes.totalCount++;
    checkinDeviceTypes.abbrs.push(checkinDeviceTypes.ENUM[checkinDevice].abbr);
}
