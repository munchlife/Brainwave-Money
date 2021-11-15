'use strict';

// lifeVerificationTypes.js

var lifeVerificationTypes = module.exports = {};

lifeVerificationTypes.ENUM = {
    EML: { abbr: 'EML', fullName: 'Primary Email' },
    PHN: { abbr: 'PHN', fullName: 'Phone Number' },
    REM: { abbr: 'REM', fullName: 'Receipt Email' },
};

lifeVerificationTypes.totalCount = 0;
lifeVerificationTypes.abbrs      = [];
for (var verificationType in lifeVerificationTypes.ENUM) {
    lifeVerificationTypes.totalCount++;
    lifeVerificationTypes.abbrs.push(lifeVerificationTypes.ENUM[verificationType].abbr);
}
