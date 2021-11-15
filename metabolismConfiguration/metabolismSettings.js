
// config.js

module.exports = {

    development: {
        database: 'munch_dev',
        lifename: 'meanjoe45',
        password: null,
        host:     'localhost',
        dialect:  'mysql',
        logging:  false
    },
    test: {
        database: 'munch_test',
        lifename: 'meanjoe45',
        password: null,
        host:     'localhost',
        dialect:  'mysql',
        logging:  false
    },
    production: {
        database: 'munch',
        lifename: 'munchUser',
        password: 'mandr8k3',
        host:     'localhost',
        dialect:  'mysql',
        logging:  false
    }

};
