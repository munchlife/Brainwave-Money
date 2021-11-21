
// seed.js

module.exports = function(metabolism) {

// Disable foreign key checks when populating the database with test/seed data;
// run in sequential Promise calls ensure seeding is complete before enabling
// the foreign key checks again (bottom of this file)
return metabolism.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { type: metabolism.sequelize.QueryTypes.RAW })

// -----------------------------------------------------------------------------
// LIFE
// -----------------------------------------------------------------------------
// TABLE `lifes` -- see /models/life.js for table description

// Fields not set in create call:
//      phoneVerified:        false
//      emailVerified:        false
//      receiptEmailVerified: false
//      createAt:             NOW()
//      updateAt:             NOW()
//      deleteAt:             null

// Creating life records with bulkCreate() allows the ability to turn off hooks,
// which in turn allows loading the passcode and pin fields in their encrypted state
// verses encrypting on each restart which takes noticable amounts of time. This
// also enables the use of 'illegally' formatted passwords for the test accounts.
.then(function() { return metabolism.Life.create({ lifeId: 1, phone: '+18585393060', phoneVerified: true, email: 'joe@munchmode.com',     receiptEmail: 'joe+receipt@munchmode.com',     /*passwordHash*/passcodeHash: '$2a$10$doxD8AWVAlAhlPuEhOgYVOMd.fZbMC54JDaeP8hAa49p7polgbAgq', passcodeExpiration: new Date(), pinHash: '$2a$10$zSzwVJdLCEACaCoTJsK/zO/41B3nBAbvV6zUr5QAwtN9SHR/NWNDm', referralCode:'sRmxsJr', givenName: 'Joseph',  middleName: 'L',  familyName: 'Kramer',   countryCode: 'USA' }); })
.then(function() { return metabolism.Life.create({ lifeId: 2, phone: '+16313551062', phoneVerified: true, email: 'marc@munchmode.com',    receiptEmail: 'marc+receipt@munchmode.com',    /*passwordHash*/passcodeHash: '$2a$10$Bk8lQCeJ3YglBb99/LiciubuDQf0FifTijKCDyPF7ZYmraDHkT0Ny', passcodeExpiration: new Date(), pinHash: '$2a$10$urN2FCIMAYaTP/fD2AVWfe.py7XivZ6W.qDeni4oviIAnA3ibSxUu', referralCode:'xaTVtos', givenName: 'Marc',    middleName: null, familyName: 'Igneri',   countryCode: 'USA' }); })
.then(function() { return metabolism.Life.create({ lifeId: 3, phone: '+19144143484', phoneVerified: true, email: 'stephen@munchmode.com', receiptEmail: 'stephen+receipt@munchmode.com', /*passwordHash*/passcodeHash: '$2a$10$z1nNa5dECgXlYSfSo.02TudB1/ycqBQOipzY7Wl6RE7yFWhmT0wXe', passcodeExpiration: new Date(), pinHash: '$2a$10$sr4D4VixsWuII2Rt3VSMRe3Z1tgw3rURtaYMEcoHEcSNBQTGz/.Xq', referralCode:'68pL3l7', givenName: 'Stephen', middleName: null, familyName: 'Wallace',  countryCode: 'USA' }); })
.then(function() { return metabolism.Life.create({ lifeId: 4, phone: '+13172070633', phoneVerified: true, email: 'robert@munchmode.com',  receiptEmail: 'robert+receipt@munchmode.com',  /*passwordHash*/passcodeHash: '$2a$10$wh26t/dOMUllHYdYQfjAjOaHAGrinGHWILXcrl28uoVwH7lmPxXOq', passcodeExpiration: new Date(), pinHash: '$2a$10$imvZZRewKpUNDVFAkqzSmOKt.gqPJXLinVTu3c6o2B2DXROHIgIta', referralCode:'O8py59b', givenName: 'Robert',  middleName: null, familyName: 'Amanfu', countryCode: 'USA' }); })
.then(function() { return metabolism.Life.create({ lifeId: 5, phone: '+12125551234', phoneVerified: true, email: null,                    receiptEmail: null,                            /*passwordHash*/passcodeHash: '$2a$10$Bk8lQCeJ3YglBb99/LiciubuDQf0FifTijKCDyPF7ZYmraDHkT0Ny', passcodeExpiration: new Date(), pinHash: '$2a$10$urN2FCIMAYaTP/fD2AVWfe.py7XivZ6W.qDeni4oviIAnA3ibSxUu', referralCode:'x35Vtos', givenName: 'Munch',   middleName: null, familyName: 'Life',     countryCode: 'USA' }); })
.then(function() { return metabolism.sequelize.query('ALTER TABLE `lifes` AUTO_INCREMENT = 1000', { type: metabolism.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// LIFE PREFERENCES
// -----------------------------------------------------------------------------
// TABLE `lifePreferences` -- see /models/lifePreference.js for table description

// Fields not set in create call:
//      loyaltySignalPathwayId: <foreign key>
//      checkinSignalPathwayId: <foreign key>
//      createAt:              NOW()
//      updateAt:              NOW()
//      deleteAt:              null
.then(function() { return metabolism.LifePreference.create({ lifeId: 1, signalingSignalPathwayId: null }); })
.then(function() { return metabolism.LifePreference.create({ lifeId: 2, signalingSignalPathwayId: null }); })
.then(function() { return metabolism.LifePreference.create({ lifeId: 3, signalingSignalPathwayId: null }); })
.then(function() { return metabolism.LifePreference.create({ lifeId: 4, signalingSignalPathwayId: null }); })
.then(function() { return metabolism.LifePreference.create({ lifeId: 5, signalingSignalPathwayId: null }); })

// -----------------------------------------------------------------------------
// GENES
// -----------------------------------------------------------------------------
// TABLE `genes` -- see /models/gene.js for table description

// Fields not set in create call:
//      verified:             false
//      supportEmail:         null
//      supportEmailVerified: false
//      supportWebsite:       null
//      supportVersion:       null
//      createAt:             NOW()
//      updateAt:             NOW()
//      deleteAt:             null
.then(function() { return metabolism.Gene.create({ geneId: 1,    geneType: 1, geneName: 'Cash',       companyName: 'Cash',                  website: 'http://munch.life',  countryCode: 'USA' }); })
.then(function() { return metabolism.Gene.create({ geneId: 2,    geneType: 1, geneName: 'Credit',     companyName: 'Credit',                website: 'http://munch.life',  countryCode: 'USA' }); })
.then(function() { return metabolism.Gene.create({ geneId: 1008, geneType: 1, geneName: 'iMessage',   companyName: 'Apple',                 website: 'https://apple.com',     countryCode: 'USA' }); })
.then(function() { return metabolism.sequelize.query('ALTER TABLE `genes` AUTO_INCREMENT = 1007', { type: metabolism.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// GENE SETTINGS
// -----------------------------------------------------------------------------
// TABLE `geneSettings` -- see /models/geneSetting.js for table description

// Fields not set in create call:
//      signupPath:         null
//      requestPath:        null
//      deauthenticatePath: null
//      createAt:           NOW()
//      updateAt:           NOW()
//      deleteAt:           null
.then(function() { return metabolism.GeneSetting.create({ geneId: 1,    host: null,                       apiHost: null,                          sandboxHost: null,                           scope: null,                                    authenticatePath: null,                     refreshPath: null,              balancePath: null,                  sendPath: null }); })
.then(function() { return metabolism.GeneSetting.create({ geneId: 2,    host: null,                       apiHost: null,                          sandboxHost: null,                           scope: null,                                    authenticatePath: null,                     refreshPath: null,              balancePath: null,                  sendPath: null }); })
.then(function() { return metabolism.GeneSetting.create({ geneId: 1008, host: 'https://apple.com',        apiHost: 'http://localhost:44055/api',  sandboxHost: null,                           scope: 'account|messages|attachments|send',     authenticatePath: null,                     refreshPath: null,              balancePath: null,                  sendPath: '/message/:person/:message' }); })



// -----------------------------------------------------------------------------
// GENE STAFF
// -----------------------------------------------------------------------------
// TABLE `geneStakeholder` -- see /models/geneStakeholder.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
.then(function() { return metabolism.GeneStakeholder.create({ stakeholderId: 1, immunities: 1, lifeId: 1, geneId: 1002 }); })
// .then(function() { return metabolism.GeneStakeholder.create({ stakeholderId: 2, immunities: 1, lifeId: 1, geneId: 1001 }); })
// .then(function() { return metabolism.GeneStakeholder.create({ stakeholderId: 3, immunities: 1, lifeId: 2, geneId: 1000 }); })
// .then(function() { return metabolism.GeneStakeholder.create({ stakeholderId: 4, immunities: 1, lifeId: 3, geneId: 1000 }); })
// .then(function() { return metabolism.GeneStakeholder.create({ stakeholderId: 5, immunities: 1, lifeId: 4, geneId: 1000 }); })
.then(function() { return metabolism.sequelize.query('ALTER TABLE `geneStakeholder` AUTO_INCREMENT = 1000', { type: metabolism.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// CELLS
// -----------------------------------------------------------------------------
// TABLE `cells` -- see /models/cell.js for table description

// Fields not set in create call:
//      verified: false
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
.then(function() { return metabolism.Cell.create({ cellId: 1, name: 'Munch Restaurant', type : 4815, website: 'http://www.munchmode.com', countryCode: 'USA' }); })
.then(function() { return metabolism.sequelize.query('ALTER TABLE `cells` AUTO_INCREMENT = 1000', { type: metabolism.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// CELL FIELDS
// -----------------------------------------------------------------------------
// TABLE `cellFields` -- see /models/cellField.js for table description

// Fields not set in create call:
//      deleteAt: null
.then(function() { return metabolism.CellField.create({ fieldId: 1, field: '7B740F59-AF69-4C1E-BB0D-58050CA06A06', active : true }); })
.then(function() { return metabolism.sequelize.query('ALTER TABLE `cellFields` AUTO_INCREMENT = 2', { type: metabolism.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// CELL LOCATIONS
// -----------------------------------------------------------------------------
// TABLE `cellInstances` -- see /models/cellInstance.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
.then(function() { return metabolism.CellInstance.create({ instanceId: 1, atlas: 1, constructiveInterference: null, destructiveInterference: null, name: 'Climate Engineering Instance 1', cellType: null, website: null, countryCode: null, cellId: 1, fieldId: 1 }); })
.then(function() { return metabolism.CellInstance.create({ instanceId: 2, atlas: 2, constructiveInterference: null, destructiveInterference: null, name: 'Climate Engineering Instance 2', cellType: null, website: null, countryCode: null, cellId: 1, fieldId: 1 }); })
.then(function() { return metabolism.sequelize.query('ALTER TABLE `cellInstances` AUTO_INCREMENT = 1000', { type: metabolism.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// CELL STAFF
// -----------------------------------------------------------------------------
// TABLE `cellStakeholder` -- see /models/cellStakeholder.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
.then(function() { return metabolism.CellStakeholder.create({ stakeholderId: 1, immunities: 1, lifeId: 1, cellId: 1, instanceId: null }); })
.then(function() { return metabolism.CellStakeholder.create({ stakeholderId: 2, immunities: 2, lifeId: 1, cellId: 1, instanceId: 2,   }); })
.then(function() { return metabolism.CellStakeholder.create({ stakeholderId: 3, immunities: 2, lifeId: 2, cellId: 1, instanceId: 2,   }); })
.then(function() { return metabolism.CellStakeholder.create({ stakeholderId: 4, immunities: 2, lifeId: 3, cellId: 1, instanceId: 2,   }); })
.then(function() { return metabolism.CellStakeholder.create({ stakeholderId: 5, immunities: 2, lifeId: 4, cellId: 1, instanceId: 2,   }); })
.then(function() { return metabolism.sequelize.query('ALTER TABLE `cellStakeholder` AUTO_INCREMENT = 1000', { type: metabolism.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// CELL DEVICES
// -----------------------------------------------------------------------------
// TABLE `cellDevices` -- see /models/cellDevice.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
.then(function() { return metabolism.CellDevice.create({ deviceId: 1, map:0, type: 'IOS', serialNumber: '1', description: 'Example description for this device', acceptsCash: true, acceptsCredit: true, instanceId: 2 }); })
.then(function() { return metabolism.sequelize.query('ALTER TABLE `cellDevices` AUTO_INCREMENT = 1000', { type: metabolism.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// LIFE DEVICES
// -----------------------------------------------------------------------------
// TABLE `lifeDevices` -- see /models/lifeDevice.js for table description

// Fields not set in create call:
//      description: varchar(255)
//      createAt:    NOW()
//      updateAt:    NOW()
//      deleteAt:    null
.then(function() { return metabolism.LifeDevice.create({ deviceId: 1, type: 'NFC', serialNumber: '183134940',  lifeId: 1 }); })
.then(function() { return metabolism.LifeDevice.create({ deviceId: 2, type: 'NFC', serialNumber: '3130025692', lifeId: 2 }); })
.then(function() { return metabolism.LifeDevice.create({ deviceId: 3, type: 'NFC', serialNumber: '2059889372', lifeId: 3 }); })
.then(function() { return metabolism.LifeDevice.create({ deviceId: 4, type: 'NFC', serialNumber: '3127783643', lifeId: 4 }); })
.then(function() { return metabolism.sequelize.query('ALTER TABLE `lifeDevices` AUTO_INCREMENT = 1000', { type: metabolism.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// LIFE VERIFICATIONS
// -----------------------------------------------------------------------------
// TABLE `lifeVerifications` -- see /models/lifeVerification.js for table description
//                           -- does not contain any seed data

// Fields not set in create call:
//      verificationId:   auto_increment
//      verificationType: char(3)
//      phone:            varchar(40)
//      email:            varchar(100)
//      receiptEmail:     varchar(100)
//      createAt:         NOW()
//      updateAt:         NOW()
//      lifeId:           <foreign key>

// -----------------------------------------------------------------------------
// GENE SUBSCRIPTIONS
// -----------------------------------------------------------------------------
// TABLE `geneSignalPathways` -- see /models/geneSignalPathway.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 1,  signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: null, cellId: 1,    geneId: 1000 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 2,  signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: null, cellId: 1,    geneId: 1001 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 3,  signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: null, cellId: 1,    geneId: 1002 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 4,  signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: null, cellId: 1,    geneId: 1003 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 5,  signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: null, cellId: 1,    geneId: 1004 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 6,  signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: null, cellId: 1,    geneId: 1005 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 7,  signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: null, cellId: 1,    geneId: 1006 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 9,  signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: 1,    cellId: null, geneId: 1001 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 10, signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: 1,    cellId: null, geneId: 1002 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 11, signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: 1,    cellId: null, geneId: 1003 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 12, signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: 1,    cellId: null, geneId: 1004 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 13, signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: 1,    cellId: null, geneId: 1005 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 16, signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: 2,    cellId: null, geneId: 1001 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 17, signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: 2,    cellId: null, geneId: 1003 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 18, signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: 2,    cellId: null, geneId: 1004 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 19, signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: 2,    cellId: null, geneId: 1005 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 21, signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: 3,    cellId: null, geneId: 1003 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPathwayId: 23, signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromone: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: 4,    cellId: null, geneId: 1001 }); })
.then(function() { return metabolism.sequelize.query('ALTER TABLE `geneSignalPathways` AUTO_INCREMENT = 1000', { type: metabolism.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// BOUNTIES
// -----------------------------------------------------------------------------
// TABLE `bounties` -- see /models/bounty.js for table description
//                  -- does not contain any seed data

// Fields not set in create call:
//      bountyId:         auto_increment
//      value:            int(10) unsigned
//      createAt:         NOW()
//      updateAt:         NOW()
//      deletedAt:        null
//      lifeId:           <foreign key>
//      bountyCellId: <foreign key>

// -----------------------------------------------------------------------------
// BOUNTY CELLS
// -----------------------------------------------------------------------------
// TABLE `bountyCells` -- see /models/bountyCell.js for table description
//                         -- does not contain any seed data

// Fields not set in create call:
//      bountyCellId: auto_increment
//      name:             varchar(255)
//      type:             bigint(20) unsigned
//      website:          varchar(255)
//      countryCode:      char(3)
//      createAt:         NOW()
//      updateAt:         NOW()
//      deletedAt:        null

// -----------------------------------------------------------------------------
// BOUNTY LOCATIONS
// -----------------------------------------------------------------------------
// TABLE `bountyInstances` -- see /models/bountyInstance.js for table description
//                         -- does not contain any seed data

// Fields not set in create call:
//      bountyInstanceId: auto_increment
//      constructiveInterference:              decimal(10,8)
//      destructiveInterference:              decimal(11,8)
//      name:             varchar(255)
//      website:          varchar(255)
//      cellType:     bigint(20) unsigned
//      countryCode:      char(3)
//      createAt:         NOW()
//      updateAt:         NOW()
//      deletedAt:        null
//      bountyCellId: <foreign key>

// -----------------------------------------------------------------------------
// ADDRESSES
// -----------------------------------------------------------------------------
// TABLE `addresses` -- see /models/address.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
.then(function() { return metabolism.Address.create({ addressId: 1, name: 'Home',      address1: '830 Madison St',   address2: 'APT 230', address3: null, address4: null, locality: 'Hoboken',     region: 'NJ', postalCode: '07030', lifeId: 1,    cellId: null, instanceId: null, geneId: null, chargeCellId: null, chargeInstanceId: null }); })
.then(function() { return metabolism.Address.create({ addressId: 2, name: 'Home',      address1: '2345 Long Rd',     address2: null,      address3: null, address4: null, locality: 'East Meadow', region: 'NY', postalCode: '10323', lifeId: 2,    cellId: null, instanceId: null, geneId: null, chargeCellId: null, chargeInstanceId: null }); })
.then(function() { return metabolism.Address.create({ addressId: 3, name: '$$_locale', address1: '1 Union Square W', address2: null,      address3: null, address4: null, locality: 'New York',    region: 'NY', postalCode: '10003', lifeId: null, cellId: null, instanceId: 1,    geneId: null, chargeCellId: null, chargeInstanceId: null }); })
.then(function() { return metabolism.Address.create({ addressId: 4, name: '$$_locale', address1: '134 4th Ave',      address2: null,      address3: null, address4: null, locality: 'New York',    region: 'NY', postalCode: '10003', lifeId: null, cellId: null, instanceId: 2,    geneId: null, chargeCellId: null, chargeInstanceId: null }); })
.then(function() { return metabolism.sequelize.query('ALTER TABLE `addresses` AUTO_INCREMENT = 1000', { type: metabolism.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// PHONES
// -----------------------------------------------------------------------------
// TABLE `phones` -- see /models/phone.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
.then(function() { return metabolism.Phone.create({ phoneId: 1,  name: 'Work',       number: '+18583123656', extension: null,  lifeId: 1,    cellId: null, instanceId: null, geneId: null, chargeCellId: null, chargeInstanceId: null }); })
.then(function() { return metabolism.Phone.create({ phoneId: 2,  name: 'Cell',       number: '+16313551062', extension: null,  lifeId: 2,    cellId: null, instanceId: null, geneId: null, chargeCellId: null, chargeInstanceId: null }); })
.then(function() { return metabolism.Phone.create({ phoneId: 3,  name: 'Cell',       number: '+19144143484', extension: null,  lifeId: 3,    cellId: null, instanceId: null, geneId: null, chargeCellId: null, chargeInstanceId: null }); })
.then(function() { return metabolism.Phone.create({ phoneId: 4,  name: 'Cell',       number: '+19142628540', extension: null,  lifeId: 4,    cellId: null, instanceId: null, geneId: null, chargeCellId: null, chargeInstanceId: null }); })
.then(function() { return metabolism.Phone.create({ phoneId: 5,  name: 'Main',       number: '+12125551234', extension: null,  lifeId: null, cellId: 1,    instanceId: null, geneId: null, chargeCellId: null, chargeInstanceId: null }); })
.then(function() { return metabolism.Phone.create({ phoneId: 6,  name: 'Support',    number: '+12125554564', extension: null,  lifeId: null, cellId: 1,    instanceId: null, geneId: null, chargeCellId: null, chargeInstanceId: null }); })
// .then(function() { return metabolism.Phone.create({ phoneId: 8,  name: '$$_support', number: '+13035551231', extension: null,  lifeId: null, cellId: null, instanceId: null, geneId: 1000, chargeCellId: null, chargeInstanceId: null }); })
// .then(function() { return metabolism.Phone.create({ phoneId: 9,  name: '$$_support', number: '+13035558483', extension: '123', lifeId: null, cellId: null, instanceId: null, geneId: 1001, chargeCellId: null, chargeInstanceId: null }); })
.then(function() { return metabolism.Phone.create({ phoneId: 10, name: 'Main',       number: '+12125552345', extension: null,  lifeId: null, cellId: null, instanceId: 1,    geneId: null, chargeCellId: null, chargeInstanceId: null }); })
.then(function() { return metabolism.Phone.create({ phoneId: 11, name: 'Main',       number: '+12125553456', extension: null,  lifeId: null, cellId: null, instanceId: 2,    geneId: null, chargeCellId: null, chargeInstanceId: null }); })
.then(function() { return metabolism.sequelize.query('ALTER TABLE `phones` AUTO_INCREMENT = 1000', { type: metabolism.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// CELL CHECKINS
// -----------------------------------------------------------------------------
// TABLE `cellSignals` -- see /models/cellSignal.js for table description
//                          -- does not contain any seed data

// Fields not set in create call:
//      checkinId:  auto_increment
//      field:       varchar(40)
//      atlas:      int(10) unsigned
//      map:      int(10) unsigned
//      proximity:  int(10) unsigned
//      deviceType: char(3)
//      updateAt:   NOW()
//      lifeId:     <foreign key>

// -----------------------------------------------------------------------------
// TOKENS
// -----------------------------------------------------------------------------
// TABLE `tokens` -- see /models/token.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
.then(function() { return metabolism.Token.create({ tokenId: 1, token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOjEsImlhdCI6MTQxNTI1NTQ3ODgyOCwianRpIjoiYVI3c0hkTDVNMiJ9.k-K6W9-XdtTMEYCA7R7DjtdPoQcuvIB4dEG5_O3YB0Q', valid: true, lifeId: 1, cellStakeholderId: null, geneStakeholderId: null }); })
.then(function() { return metabolism.Token.create({ tokenId: 2, token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOjIsImlhdCI6MTQ0MDc5MTg1MDkzMCwianRpIjoiOXd2eHRsclRoWCJ9.K1MVuMs-38zh6bAfqqyEkwsbo6PXmTo1nxLOzSTb6oQ', valid: true, lifeId: 5, cellStakeholderId: null, geneStakeholderId: null }); })
.then(function() { return metabolism.Token.create({ tokenId: 5, token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOjUsImlhdCI6MTQ0MTM5NDgwMDU1MSwianRpIjoiV0ZHRkpIUGlBYSJ9._tuR_EiJq-d3dwh7kypqR4OKF_tvEtkLFXwGrvst0Bw', valid: true, lifeId: 5, cellStakeholderId: 1001, geneStakeholderId: null }); })

// -----------------------------------------------------------------------------
// Enable foreign key checks
.then(function() { return metabolism.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { type: metabolism.sequelize.QueryTypes.RAW }); })

.then(function() { return metabolism.Cell.create({ name: 'Climate Engineering Task Force', type: 4815, website: null, countryCode: 'USA' }); })
.then(function() { return metabolism.CellInstance.create({ atlas: 1000, constructiveInterference: null, destructiveInterference: null, cellType: null, website: null, countryCode: null, cellId: 1000, fieldId: 1 }); })
.then(function() { return metabolism.CellStakeholder.create({ immunities: 1, lifeId: 1, cellId: 1000, instanceId: null }); })
.then(function() { return metabolism.CellStakeholder.create({ immunities: 2, lifeId: 5, cellId: 1000, instanceId: null }); })
.then(function() { return metabolism.CellDevice.create({ map:1, type: 'IOS', serialNumber: '2', description: 'Demo device', acceptsCash: false, acceptsCredit: false, instanceId: 1000 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromoneExpiration: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: null, cellId: 1000,    geneId: 1000 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromoneExpiration: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: null, cellId: 1000,    geneId: 1001 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromoneExpiration: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: null, cellId: 1000,    geneId: 1002 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromoneExpiration: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: null, cellId: 1000,    geneId: 1003 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromoneExpiration: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: null, cellId: 1000,    geneId: 1004 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromoneExpiration: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: null, cellId: 1000,    geneId: 1005 }); })
// .then(function() { return metabolism.GeneSignalPathway.create({ signalPheromone: null, signalPheromoneExpiration: null, reinforcementSignalPheromoneExpiration: null, reinforcementSignalPheromoneExpiration: null, optional: null, lifeId: null, cellId: 1000,    geneId: 1006 }); })
.then(function() { return metabolism.Address.create({ name: '$$_locale', address1: '?', locality: 'New York', region: 'NY', postalCode: '10001', instanceId: 1000 }); })
.then(function() { return metabolism.Phone.create({ name: 'Main', number: '+16465048132', instanceId: 1000, }); })
.then(function() { return metabolism.CellSignal.create({ field: '7B740F59-AF69-4C1E-BB0D-58050CA06A06', atlas: 1000, map: 1, proximity: 1, deviceType: 'HAM', lifeId: 5 }); });

};
