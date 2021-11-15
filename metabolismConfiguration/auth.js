
// auth.js

module.exports = {

    local: {
        expressSecret: 'FgMe2sosSwJwCP6wan1YwLEL9AOzv4DOaiaExtqZn6sfojzzUX',
        tokenSecret:   'crSl2YVpB00B1sVuqHXhvNaqHnLoGNOVbD7zWAwC0ZFcRhNYax'
    },
    coinbase: {
        // Munch Development account (sandbox)
        client_id: '1847c77df2f60e880bd449271494034001b4c9c91453ae83f549e102a684bb3b', 
        secret:    'a5b808af35d68bc1672ffef98dcbd037a7a129a79ad27549302f72699b432fc8'
        // client_id: '5edca268fd973df46951997fb444390f9f8f478f490924cd711e0ba3902c8490',
        // secret:    '50f0030b2fd68a41ed8951631d43fd88a834d3b906513b1cdd7e21ab9621939b'
    },
    dwolla: {
        client_id: 'e49/Ro4T2Rffj/oxjhypFSww1l25UL1F3t9BnDtWisLnbs7kqQ',
        secret:    'X+2bomukGERmFK1McGn9Naxk4uhAupRLvjUEo5miqJr4OKptVm'
    },
    paypal: {
        client_id: '',
        secret:    ''
    },
    twilio: {
        account_num: '+16466933069',
        account_sid:   'ACdbba32824131d9c88771d05ff0bd256f', // live ID
        account_token: '078bb9fa75b2324d408df65d2291d922'    // live token
        // account_sid:   'AC4489a6a011ba01485f600f6b0226cdc8', // test ID
        // account_token: 'be8f55ff74f95798742ca832b1bcf105'    // test token
    },
    venmo: {
        client_id: '2640',
        secret:    'BNUhsMJydnYCfKZWR2PjZVvNcngcATf3'
    }

};
