
// seed.js

module.exports = function(db) {

// Disable foreign key checks when populating the database with test/seed data;
// run in sequential Promise calls ensure seeding is complete before enabling
// the foreign key checks again (bottom of this file)
return db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { type: db.sequelize.QueryTypes.RAW })

// -----------------------------------------------------------------------------
// USERS
// -----------------------------------------------------------------------------
// TABLE `users` -- see /models/user.js for table description

// Fields not set in create call:
//      phoneVerified:        false
//      emailVerified:        false
//      receiptEmailVerified: false
//      createAt:             NOW()
//      updateAt:             NOW()
//      deleteAt:             null

// Creating user records with bulkCreate() allows the ability to turn off hooks,
// which in turn allows loading the passcode and pin fields in their encrypted state
// verses encrypting on each restart which takes noticable amounts of time. This
// also enables the use of 'illegally' formatted passwords for the test accounts.
.then(function() { return db.User.create({ userId: 1, phone: '+18585393060', phoneVerified: true, email: 'joe@munchmode.com',     receiptEmail: 'joe+receipt@munchmode.com',     /*passwordHash*/passcodeHash: '$2a$10$doxD8AWVAlAhlPuEhOgYVOMd.fZbMC54JDaeP8hAa49p7polgbAgq', passcodeExpiration: new Date(), pinHash: '$2a$10$zSzwVJdLCEACaCoTJsK/zO/41B3nBAbvV6zUr5QAwtN9SHR/NWNDm', referralCode:'sRmxsJr', givenName: 'Joseph',  middleName: 'L',  familyName: 'Kramer',   countryCode: 'USA' }); })
.then(function() { return db.User.create({ userId: 2, phone: '+16313551062', phoneVerified: true, email: 'marc@munchmode.com',    receiptEmail: 'marc+receipt@munchmode.com',    /*passwordHash*/passcodeHash: '$2a$10$Bk8lQCeJ3YglBb99/LiciubuDQf0FifTijKCDyPF7ZYmraDHkT0Ny', passcodeExpiration: new Date(), pinHash: '$2a$10$urN2FCIMAYaTP/fD2AVWfe.py7XivZ6W.qDeni4oviIAnA3ibSxUu', referralCode:'xaTVtos', givenName: 'Marc',    middleName: null, familyName: 'Igneri',   countryCode: 'USA' }); })
.then(function() { return db.User.create({ userId: 3, phone: '+19144143484', phoneVerified: true, email: 'stephen@munchmode.com', receiptEmail: 'stephen+receipt@munchmode.com', /*passwordHash*/passcodeHash: '$2a$10$z1nNa5dECgXlYSfSo.02TudB1/ycqBQOipzY7Wl6RE7yFWhmT0wXe', passcodeExpiration: new Date(), pinHash: '$2a$10$sr4D4VixsWuII2Rt3VSMRe3Z1tgw3rURtaYMEcoHEcSNBQTGz/.Xq', referralCode:'68pL3l7', givenName: 'Stephen', middleName: null, familyName: 'Wallace',  countryCode: 'USA' }); })
.then(function() { return db.User.create({ userId: 4, phone: '+13172070633', phoneVerified: true, email: 'robert@munchmode.com',  receiptEmail: 'robert+receipt@munchmode.com',  /*passwordHash*/passcodeHash: '$2a$10$wh26t/dOMUllHYdYQfjAjOaHAGrinGHWILXcrl28uoVwH7lmPxXOq', passcodeExpiration: new Date(), pinHash: '$2a$10$imvZZRewKpUNDVFAkqzSmOKt.gqPJXLinVTu3c6o2B2DXROHIgIta', referralCode:'O8py59b', givenName: 'Robert',  middleName: null, familyName: 'Amanfu', countryCode: 'USA' }); })
.then(function() { return db.User.create({ userId: 5, phone: '+12125551234', phoneVerified: true, email: null,                    receiptEmail: null,                            /*passwordHash*/passcodeHash: '$2a$10$Bk8lQCeJ3YglBb99/LiciubuDQf0FifTijKCDyPF7ZYmraDHkT0Ny', passcodeExpiration: new Date(), pinHash: '$2a$10$urN2FCIMAYaTP/fD2AVWfe.py7XivZ6W.qDeni4oviIAnA3ibSxUu', referralCode:'x35Vtos', givenName: 'Munch',   middleName: null, familyName: 'Life',     countryCode: 'USA' }); })
.then(function() { return db.sequelize.query('ALTER TABLE `users` AUTO_INCREMENT = 1000', { type: db.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// USER PREFERENCES
// -----------------------------------------------------------------------------
// TABLE `userPreferences` -- see /models/userPreference.js for table description

// Fields not set in create call:
//      loyaltySubscriptionId: <foreign key>
//      checkinSubscriptionId: <foreign key>
//      createAt:              NOW()
//      updateAt:              NOW()
//      deleteAt:              null
.then(function() { return db.UserPreference.create({ userId: 1, paymentSubscriptionId: null }); })
.then(function() { return db.UserPreference.create({ userId: 2, paymentSubscriptionId: null }); })
.then(function() { return db.UserPreference.create({ userId: 3, paymentSubscriptionId: null }); })
.then(function() { return db.UserPreference.create({ userId: 4, paymentSubscriptionId: null }); })
.then(function() { return db.UserPreference.create({ userId: 5, paymentSubscriptionId: null }); })

// -----------------------------------------------------------------------------
// SERVICES
// -----------------------------------------------------------------------------
// TABLE `services` -- see /models/service.js for table description

// Fields not set in create call:
//      verified:             false
//      supportEmail:         null
//      supportEmailVerified: false
//      supportWebsite:       null
//      supportVersion:       null
//      createAt:             NOW()
//      updateAt:             NOW()
//      deleteAt:             null
.then(function() { return db.Service.create({ serviceId: 1,    serviceType: 1, serviceName: 'Cash',       companyName: 'Cash',                  website: 'http://www.munchmode.com',  countryCode: 'USA' }); })
.then(function() { return db.Service.create({ serviceId: 2,    serviceType: 1, serviceName: 'Credit',     companyName: 'Credit',                website: 'http://www.munchmode.com',  countryCode: 'USA' }); })
//.then(function() { return db.Service.create({ serviceId: 1000, serviceType: 1, serviceName: 'Dwolla',     companyName: 'Dwolla, Inc.',          website: 'http://www.dwolla.com',     countryCode: 'USA' }); })
//.then(function() { return db.Service.create({ serviceId: 1001, serviceType: 1, serviceName: 'PayPal',     companyName: 'eBay Inc.',             website: 'http://www.paypal.com',     countryCode: 'USA' }); })
.then(function() { return db.Service.create({ serviceId: 1002, serviceType: 1, serviceName: 'Venmo',      companyName: 'Venmo Inc.',            website: 'http://www.venmo.com',      countryCode: 'USA' }); })
//.then(function() { return db.Service.create({ serviceId: 1003, serviceType: 2, serviceName: 'Perkville',  companyName: 'Perkville',             website: 'http://www.perkville.com',  countryCode: 'USA' }); })
//.then(function() { return db.Service.create({ serviceId: 1004, serviceType: 4, serviceName: 'Foursquare', companyName: 'Foursquare Labs, Inc.', website: 'http://foursquare.com',     countryCode: 'USA' }); })
//.then(function() { return db.Service.create({ serviceId: 1005, serviceType: 3, serviceName: 'LevelUp',    companyName: 'SCVNGR, Inc.',          website: 'http://www.thelevelup.com', countryCode: 'USA' }); })
//.then(function() { return db.Service.create({ serviceId: 1006, serviceType: 1, serviceName: 'Coinbase',   companyName: 'Coinbase',              website: 'http://www.coinbase.com',   countryCode: 'USA' }); })
.then(function() { return db.sequelize.query('ALTER TABLE `services` AUTO_INCREMENT = 1007', { type: db.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// SERVICE SETTINGS
// -----------------------------------------------------------------------------
// TABLE `serviceSettings` -- see /models/serviceSetting.js for table description

// Fields not set in create call:
//      signupPath:         null
//      requestPath:        null
//      deauthenticatePath: null
//      createAt:           NOW()
//      updateAt:           NOW()
//      deleteAt:           null
.then(function() { return db.ServiceSetting.create({ serviceId: 1,    host: null,                       apiHost: null,                          sandboxHost: null,                           scope: null,                                    authenticatePath: null,                     refreshPath: null,              balancePath: null,                  sendPath: null }); })
.then(function() { return db.ServiceSetting.create({ serviceId: 2,    host: null,                       apiHost: null,                          sandboxHost: null,                           scope: null,                                    authenticatePath: null,                     refreshPath: null,              balancePath: null,                  sendPath: null }); })
//.then(function() { return db.ServiceSetting.create({ serviceId: 1000, host: 'https://www.dwolla.com',   apiHost: null,                          sandboxHost: 'https://uat.dwolla.com',       scope: 'Send|Balance|Request',                  authenticatePath: '/oauth/v2/authenticate', refreshPath: '/oauth/v2/token', balancePath: '/oauth/rest/balance', sendPath: '/oauth/rest/transactions/send' }); })
//.then(function() { return db.ServiceSetting.create({ serviceId: 1001, host: null,                       apiHost: null,                          sandboxHost: null,                           scope: null,                                    authenticatePath: null,                     refreshPath: null,              balancePath: null,                  sendPath: null }); })
.then(function() { return db.ServiceSetting.create({ serviceId: 1002, host: null,                       apiHost: null,                          sandboxHost: null,                           scope: null,                                    authenticatePath: null,                     refreshPath: null,              balancePath: null,                  sendPath: null }); })
//.then(function() { return db.ServiceSetting.create({ serviceId: 1003, host: null,                       apiHost: null,                          sandboxHost: null,                           scope: null,                                    authenticatePath: null,                     refreshPath: null,              balancePath: null,                  sendPath: null }); })
//.then(function() { return db.ServiceSetting.create({ serviceId: 1004, host: null,                       apiHost: null,                          sandboxHost: null,                           scope: null,                                    authenticatePath: null,                     refreshPath: null,              balancePath: null,                  sendPath: null }); })
//.then(function() { return db.ServiceSetting.create({ serviceId: 1005, host: null,                       apiHost: null,                          sandboxHost: null,                           scope: null,                                    authenticatePath: null,                     refreshPath: null,              balancePath: null,                  sendPath: null }); })
//.then(function() { return db.ServiceSetting.create({ serviceId: 1006, host: 'https://www.coinbase.com', apiHost: 'https://api.coinbase.com/v1', sandboxHost: 'https://sandbox.coinbase.com', scope: 'balance user transfer send:bypass_2fa', authenticatePath: '/oauth/authorize',       refreshPath: '/oauth/token',    balancePath: null,                  sendPath: null }); })

// -----------------------------------------------------------------------------
// SERVICE STAFF
// -----------------------------------------------------------------------------
// TABLE `serviceStaff` -- see /models/serviceStaff.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
.then(function() { return db.ServiceStaff.create({ staffId: 1, permissions: 1, userId: 1, serviceId: 1002 }); })
// .then(function() { return db.ServiceStaff.create({ staffId: 2, permissions: 1, userId: 1, serviceId: 1001 }); })
// .then(function() { return db.ServiceStaff.create({ staffId: 3, permissions: 1, userId: 2, serviceId: 1000 }); })
// .then(function() { return db.ServiceStaff.create({ staffId: 4, permissions: 1, userId: 3, serviceId: 1000 }); })
// .then(function() { return db.ServiceStaff.create({ staffId: 5, permissions: 1, userId: 4, serviceId: 1000 }); })
.then(function() { return db.sequelize.query('ALTER TABLE `serviceStaff` AUTO_INCREMENT = 1000', { type: db.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// MERCHANTS
// -----------------------------------------------------------------------------
// TABLE `merchants` -- see /models/merchant.js for table description

// Fields not set in create call:
//      verified: false
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
.then(function() { return db.Merchant.create({ merchantId: 1, name: 'Munch Restaurant', type : 5814, website: 'http://www.munchmode.com', countryCode: 'USA' }); })
.then(function() { return db.sequelize.query('ALTER TABLE `merchants` AUTO_INCREMENT = 1000', { type: db.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// MERCHANT UUIDS
// -----------------------------------------------------------------------------
// TABLE `merchantUuids` -- see /models/merchantUuid.js for table description

// Fields not set in create call:
//      deleteAt: null
.then(function() { return db.MerchantUuid.create({ uuidId: 1, uuid: '7B740F59-AF69-4C1E-BB0D-58050CA06A06', active : true }); })
.then(function() { return db.sequelize.query('ALTER TABLE `merchantUuids` AUTO_INCREMENT = 2', { type: db.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// MERCHANT LOCATIONS
// -----------------------------------------------------------------------------
// TABLE `merchantLocations` -- see /models/merchantLocation.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
.then(function() { return db.MerchantLocation.create({ locationId: 1, major: 1, lat: 40.735366, lon: -73.991638, name: 'Munch Restaurant 1', merchantType: null, website: null, countryCode: null, merchantId: 1, uuidId: 1 }); })
.then(function() { return db.MerchantLocation.create({ locationId: 2, major: 2, lat: 40.733456, lon: -73.989960, name: 'Munch Restaurant 2', merchantType: null, website: null, countryCode: null, merchantId: 1, uuidId: 1 }); })
.then(function() { return db.sequelize.query('ALTER TABLE `merchantLocations` AUTO_INCREMENT = 1000', { type: db.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// MERCHANT STAFF
// -----------------------------------------------------------------------------
// TABLE `merchantStaff` -- see /models/merchantStaff.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
.then(function() { return db.MerchantStaff.create({ staffId: 1, permissions: 1, userId: 1, merchantId: 1, locationId: null }); })
.then(function() { return db.MerchantStaff.create({ staffId: 2, permissions: 2, userId: 1, merchantId: 1, locationId: 2,   }); })
.then(function() { return db.MerchantStaff.create({ staffId: 3, permissions: 2, userId: 2, merchantId: 1, locationId: 2,   }); })
.then(function() { return db.MerchantStaff.create({ staffId: 4, permissions: 2, userId: 3, merchantId: 1, locationId: 2,   }); })
.then(function() { return db.MerchantStaff.create({ staffId: 5, permissions: 2, userId: 4, merchantId: 1, locationId: 2,   }); })
.then(function() { return db.sequelize.query('ALTER TABLE `merchantStaff` AUTO_INCREMENT = 1000', { type: db.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// MERCHANT DEVICES
// -----------------------------------------------------------------------------
// TABLE `merchantDevices` -- see /models/merchantDevice.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
.then(function() { return db.MerchantDevice.create({ deviceId: 1, minor:0, type: 'IOS', serialNumber: '1', description: 'Example description for this device', acceptsCash: true, acceptsCredit: true, locationId: 2 }); })
.then(function() { return db.sequelize.query('ALTER TABLE `merchantDevices` AUTO_INCREMENT = 1000', { type: db.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// USER DEVICES
// -----------------------------------------------------------------------------
// TABLE `userDevices` -- see /models/userDevice.js for table description

// Fields not set in create call:
//      description: varchar(255)
//      createAt:    NOW()
//      updateAt:    NOW()
//      deleteAt:    null
.then(function() { return db.UserDevice.create({ deviceId: 1, type: 'NFC', serialNumber: '183134940',  userId: 1 }); })
.then(function() { return db.UserDevice.create({ deviceId: 2, type: 'NFC', serialNumber: '3130025692', userId: 2 }); })
.then(function() { return db.UserDevice.create({ deviceId: 3, type: 'NFC', serialNumber: '2059889372', userId: 3 }); })
.then(function() { return db.UserDevice.create({ deviceId: 4, type: 'NFC', serialNumber: '3127783643', userId: 4 }); })
.then(function() { return db.sequelize.query('ALTER TABLE `userDevices` AUTO_INCREMENT = 1000', { type: db.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// USER VERIFICATIONS
// -----------------------------------------------------------------------------
// TABLE `userVerifications` -- see /models/userVerification.js for table description
//                           -- does not contain any seed data

// Fields not set in create call:
//      verificationId:   auto_increment
//      verificationType: char(3)
//      phone:            varchar(40)
//      email:            varchar(100)
//      receiptEmail:     varchar(100)
//      createAt:         NOW()
//      updateAt:         NOW()
//      userId:           <foreign key>

// -----------------------------------------------------------------------------
// SERVICE SUBSCRIPTIONS
// -----------------------------------------------------------------------------
// TABLE `serviceSubscriptions` -- see /models/serviceSubscription.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 1,  pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: null, merchantId: 1,    serviceId: 1000 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 2,  pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: null, merchantId: 1,    serviceId: 1001 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 3,  pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: null, merchantId: 1,    serviceId: 1002 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 4,  pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: null, merchantId: 1,    serviceId: 1003 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 5,  pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: null, merchantId: 1,    serviceId: 1004 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 6,  pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: null, merchantId: 1,    serviceId: 1005 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 7,  pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: null, merchantId: 1,    serviceId: 1006 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 9,  pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: 1,    merchantId: null, serviceId: 1001 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 10, pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: 1,    merchantId: null, serviceId: 1002 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 11, pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: 1,    merchantId: null, serviceId: 1003 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 12, pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: 1,    merchantId: null, serviceId: 1004 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 13, pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: 1,    merchantId: null, serviceId: 1005 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 16, pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: 2,    merchantId: null, serviceId: 1001 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 17, pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: 2,    merchantId: null, serviceId: 1003 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 18, pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: 2,    merchantId: null, serviceId: 1004 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 19, pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: 2,    merchantId: null, serviceId: 1005 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 21, pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: 3,    merchantId: null, serviceId: 1003 }); })
// .then(function() { return db.ServiceSubscription.create({ subscriptionId: 23, pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: 4,    merchantId: null, serviceId: 1001 }); })
.then(function() { return db.sequelize.query('ALTER TABLE `serviceSubscriptions` AUTO_INCREMENT = 1000', { type: db.sequelize.QueryTypes.RAW }); })

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
//      userId:           <foreign key>
//      bountyMerchantId: <foreign key>

// -----------------------------------------------------------------------------
// BOUNTY MERCHANTS
// -----------------------------------------------------------------------------
// TABLE `bountyMerchants` -- see /models/bountyMerchant.js for table description
//                         -- does not contain any seed data

// Fields not set in create call:
//      bountyMerchantId: auto_increment
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
// TABLE `bountyLocations` -- see /models/bountyLocation.js for table description
//                         -- does not contain any seed data

// Fields not set in create call:
//      bountyLocationId: auto_increment
//      lat:              decimal(10,8)
//      lon:              decimal(11,8)
//      name:             varchar(255)
//      website:          varchar(255)
//      merchantType:     bigint(20) unsigned
//      countryCode:      char(3)
//      createAt:         NOW()
//      updateAt:         NOW()
//      deletedAt:        null
//      bountyMerchantId: <foreign key>

// -----------------------------------------------------------------------------
// ADDRESSES
// -----------------------------------------------------------------------------
// TABLE `addresses` -- see /models/address.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
.then(function() { return db.Address.create({ addressId: 1, name: 'Home',      address1: '830 Madison St',   address2: 'APT 230', address3: null, address4: null, locality: 'Hoboken',     region: 'NJ', postalCode: '07030', userId: 1,    merchantId: null, locationId: null, serviceId: null, bountyMerchantId: null, bountyLocationId: null }); })
.then(function() { return db.Address.create({ addressId: 2, name: 'Home',      address1: '2345 Long Rd',     address2: null,      address3: null, address4: null, locality: 'East Meadow', region: 'NY', postalCode: '10323', userId: 2,    merchantId: null, locationId: null, serviceId: null, bountyMerchantId: null, bountyLocationId: null }); })
.then(function() { return db.Address.create({ addressId: 3, name: '$$_locale', address1: '1 Union Square W', address2: null,      address3: null, address4: null, locality: 'New York',    region: 'NY', postalCode: '10003', userId: null, merchantId: null, locationId: 1,    serviceId: null, bountyMerchantId: null, bountyLocationId: null }); })
.then(function() { return db.Address.create({ addressId: 4, name: '$$_locale', address1: '134 4th Ave',      address2: null,      address3: null, address4: null, locality: 'New York',    region: 'NY', postalCode: '10003', userId: null, merchantId: null, locationId: 2,    serviceId: null, bountyMerchantId: null, bountyLocationId: null }); })
.then(function() { return db.sequelize.query('ALTER TABLE `addresses` AUTO_INCREMENT = 1000', { type: db.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// PHONES
// -----------------------------------------------------------------------------
// TABLE `phones` -- see /models/phone.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
//      deleteAt: null
.then(function() { return db.Phone.create({ phoneId: 1,  name: 'Work',       number: '+18583123656', extension: null,  userId: 1,    merchantId: null, locationId: null, serviceId: null, bountyMerchantId: null, bountyLocationId: null }); })
.then(function() { return db.Phone.create({ phoneId: 2,  name: 'Cell',       number: '+16313551062', extension: null,  userId: 2,    merchantId: null, locationId: null, serviceId: null, bountyMerchantId: null, bountyLocationId: null }); })
.then(function() { return db.Phone.create({ phoneId: 3,  name: 'Cell',       number: '+19144143484', extension: null,  userId: 3,    merchantId: null, locationId: null, serviceId: null, bountyMerchantId: null, bountyLocationId: null }); })
.then(function() { return db.Phone.create({ phoneId: 4,  name: 'Cell',       number: '+19142628540', extension: null,  userId: 4,    merchantId: null, locationId: null, serviceId: null, bountyMerchantId: null, bountyLocationId: null }); })
.then(function() { return db.Phone.create({ phoneId: 5,  name: 'Main',       number: '+12125551234', extension: null,  userId: null, merchantId: 1,    locationId: null, serviceId: null, bountyMerchantId: null, bountyLocationId: null }); })
.then(function() { return db.Phone.create({ phoneId: 6,  name: 'Support',    number: '+12125554564', extension: null,  userId: null, merchantId: 1,    locationId: null, serviceId: null, bountyMerchantId: null, bountyLocationId: null }); })
// .then(function() { return db.Phone.create({ phoneId: 8,  name: '$$_support', number: '+13035551231', extension: null,  userId: null, merchantId: null, locationId: null, serviceId: 1000, bountyMerchantId: null, bountyLocationId: null }); })
// .then(function() { return db.Phone.create({ phoneId: 9,  name: '$$_support', number: '+13035558483', extension: '123', userId: null, merchantId: null, locationId: null, serviceId: 1001, bountyMerchantId: null, bountyLocationId: null }); })
.then(function() { return db.Phone.create({ phoneId: 10, name: 'Main',       number: '+12125552345', extension: null,  userId: null, merchantId: null, locationId: 1,    serviceId: null, bountyMerchantId: null, bountyLocationId: null }); })
.then(function() { return db.Phone.create({ phoneId: 11, name: 'Main',       number: '+12125553456', extension: null,  userId: null, merchantId: null, locationId: 2,    serviceId: null, bountyMerchantId: null, bountyLocationId: null }); })
.then(function() { return db.sequelize.query('ALTER TABLE `phones` AUTO_INCREMENT = 1000', { type: db.sequelize.QueryTypes.RAW }); })

// -----------------------------------------------------------------------------
// MERCHANT CHECKINS
// -----------------------------------------------------------------------------
// TABLE `merchantCheckins` -- see /models/merchantCheckin.js for table description
//                          -- does not contain any seed data

// Fields not set in create call:
//      checkinId:  auto_increment
//      uuid:       varchar(40)
//      major:      int(10) unsigned
//      minor:      int(10) unsigned
//      proximity:  int(10) unsigned
//      deviceType: char(3)
//      updateAt:   NOW()
//      userId:     <foreign key>

// -----------------------------------------------------------------------------
// TOKENS
// -----------------------------------------------------------------------------
// TABLE `tokens` -- see /models/token.js for table description

// Fields not set in create call:
//      createAt: NOW()
//      updateAt: NOW()
.then(function() { return db.Token.create({ tokenId: 1, token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOjEsImlhdCI6MTQxNTI1NTQ3ODgyOCwianRpIjoiYVI3c0hkTDVNMiJ9.k-K6W9-XdtTMEYCA7R7DjtdPoQcuvIB4dEG5_O3YB0Q', valid: true, userId: 1, merchantStaffId: null, serviceStaffId: null }); })
.then(function() { return db.Token.create({ tokenId: 2, token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOjIsImlhdCI6MTQ0MDc5MTg1MDkzMCwianRpIjoiOXd2eHRsclRoWCJ9.K1MVuMs-38zh6bAfqqyEkwsbo6PXmTo1nxLOzSTb6oQ', valid: true, userId: 5, merchantStaffId: null, serviceStaffId: null }); })
.then(function() { return db.Token.create({ tokenId: 5, token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOjUsImlhdCI6MTQ0MTM5NDgwMDU1MSwianRpIjoiV0ZHRkpIUGlBYSJ9._tuR_EiJq-d3dwh7kypqR4OKF_tvEtkLFXwGrvst0Bw', valid: true, userId: 5, merchantStaffId: 1001, serviceStaffId: null }); })

// -----------------------------------------------------------------------------
// Enable foreign key checks
.then(function() { return db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { type: db.sequelize.QueryTypes.RAW }); })

.then(function() { return db.Merchant.create({ name: 'Cheeky Sandwiches', type : 5814, website: 'http://www.cheeky-sandwiches.com', countryCode: 'USA' }); })
.then(function() { return db.MerchantLocation.create({ major: 1000, lat: 40.7157255, lon: -73.9916807, merchantType: null, website: null, countryCode: null, merchantId: 1000, uuidId: 1 }); })
.then(function() { return db.MerchantStaff.create({ permissions: 1, userId: 1, merchantId: 1000, locationId: null }); })
.then(function() { return db.MerchantStaff.create({ permissions: 2, userId: 5, merchantId: 1000, locationId: null }); })
.then(function() { return db.MerchantDevice.create({ minor:1, type: 'IOS', serialNumber: '2', description: 'Demo device', acceptsCash: false, acceptsCredit: false, locationId: 1000 }); })
// .then(function() { return db.ServiceSubscription.create({ pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: null, merchantId: 1000,    serviceId: 1000 }); })
// .then(function() { return db.ServiceSubscription.create({ pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: null, merchantId: 1000,    serviceId: 1001 }); })
// .then(function() { return db.ServiceSubscription.create({ pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: null, merchantId: 1000,    serviceId: 1002 }); })
// .then(function() { return db.ServiceSubscription.create({ pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: null, merchantId: 1000,    serviceId: 1003 }); })
// .then(function() { return db.ServiceSubscription.create({ pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: null, merchantId: 1000,    serviceId: 1004 }); })
// .then(function() { return db.ServiceSubscription.create({ pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: null, merchantId: 1000,    serviceId: 1005 }); })
// .then(function() { return db.ServiceSubscription.create({ pheromone: null, wavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, reinforcementWavePheromoneExpiration: null, optional: null, userId: null, merchantId: 1000,    serviceId: 1006 }); })
.then(function() { return db.Address.create({ name: '$$_locale', address1: '35 Orchard St', locality: 'New York', region: 'NY', postalCode: '10002', locationId: 1000 }); })
.then(function() { return db.Phone.create({ name: 'Main', number: '+16465048132', locationId: 1000, }); })
.then(function() { return db.MerchantCheckin.create({ uuid: '7B740F59-AF69-4C1E-BB0D-58050CA06A06', major: 1000, minor: 1, proximity: 1, deviceType: 'BLE', userId: 5 }); });

};
