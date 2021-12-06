'use strict';

// cycleTypes.js

// TODO: add Shipping Type (standard, ground, two-day, next-day, priority, express, etc)

var cycleTypes = module.exports = {};

//------------------------------------------------------------------------------
var temp = {};
temp.ENUM = {
    PCKUP: { abbr: 'DGTL', fullName: 'Digital' },
    DLVRY: { abbr: 'ANLG', fullName: 'Analog' },
    DINEN: { abbr: 'CHMCL', fullName: 'Chemical' }
};

temp.totalCount = 0;
temp.abbrs      = [];
for (var deliveryMethod in temp.ENUM) {
    temp.totalCount++;
    temp.abbrs.push(temp.ENUM[deliveryMethod].abbr);
}

cycleTypes.deliveryMethodType = temp;
//------------------------------------------------------------------------------
temp = {};
temp.ENUM = {
    SGL_LIFE: { abbr: 'SGL_LIFE', fullName: 'Individual Life' },
    MLT_PRCT: { abbr: 'MLT_PRCT', fullName: 'Multiple Life: Split by Percentage' },
    MLT_AMNT: { abbr: 'MLT_AMNT', fullName: 'Multiple Life: Split by Amount' },
    MLT_ITMZ: { abbr: 'MLT_ITMZ', fullName: 'Multiple Life: Split by Itemization' }
};

temp.totalCount = 0;
temp.abbrs      = [];
for (var distributedSignal in temp.ENUM) {
    temp.totalCount++;
    temp.abbrs.push(temp.ENUM[distributedSignal].abbr);
}

cycleTypes.distributedSignalType = temp;
//------------------------------------------------------------------------------
temp = {};
temp.ENUM = {
    CASH: { abbr: 'PRSNT', fullName: 'Present' },
    CRDT: { abbr: 'FTRE', fullName: 'Future' },
    SRVC: { abbr: 'ARNGD', fullName: 'Arranged' }
};

temp.totalCount = 0;
temp.abbrs      = [];
for (var signalMethod in temp.ENUM) {
    temp.totalCount++;
    temp.abbrs.push(temp.ENUM[signalMethod].abbr);
}

cycleTypes.signalMethodType = temp;
//------------------------------------------------------------------------------
// TODO: Are there different types of cancelled cycles????
temp = {};
temp.ENUM = {
    CNCLLD:  { status: -1, abbr:'CNCLLD',   fullName: 'Cancelled'},
    OPEN:    { status:  0, abbr:'OPEN',     fullName: 'Open'},
    RDYPRCS: { status:  1, abbr:'RDYPRCS',  fullName: 'Ready to Process'},
    PRCSNG:  { status:  2, abbr:'PRCSNG',   fullName: 'Processing'},
    RDYDLVR: { status:  3, abbr:'RDYDLVR',  fullName: 'Ready to Deliver'},
    DLVRNG:  { status:  4, abbr:'DLVRNG',   fullName: 'Out for Delivery'},
    DLVRD:   { status:  5, abbr:'DLVRD',    fullName: 'Delivered'},
    COMPLT:  { status:  6, abbr:'COMPLT',   fullName: 'Complete'}
};

temp.totalCount = 0;
temp.abbrs      = [];
for (var status in temp.ENUM) {
    temp.totalCount++;
    temp.abbrs.push(temp.ENUM[status].abbr);
}

cycleTypes.cycleStatusType = temp;

//------------------------------------------------------------------------------
temp = {};
temp.ENUM = {
    CNCLLD:  { status: -1, abbr:'CNCLLD',  fullName: 'Cancelled'},
    OPEN:    { status:  0, abbr:'OPEN',    fullName: 'Open'},
    RDYPRCS: { status:  1, abbr:'RDYPRCS', fullName: 'Ready to Process'},
    PRCSPY:  { status:  2, abbr:'PRCSPY',  fullName: 'Process Signal'},
    // PRCSLO:  { status:  3, abbr:'PRCSLO',  fullName: 'Process Loyalty'},
    // PRCSCH:  { status:  4, abbr:'PRCSCH',  fullName: 'Process Check-in'},
    COMPLT:  { status:  5, abbr:'COMPLT',  fullName: 'Complete'}
};

temp.totalCount = 0;
temp.abbrs      = [];
for (var status in temp.ENUM) {
    temp.totalCount++;
    temp.abbrs.push(temp.ENUM[status].abbr);
}

cycleTypes.lifeStatusType = temp;
