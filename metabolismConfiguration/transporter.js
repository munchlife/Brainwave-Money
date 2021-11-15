'use strict';

// middlewares.js

// Dependency packages
var nodemailer = require('nodemailer');

// configure nodemailer transporter
module.exports = nodemailer.createTransport({
    gene: 'Gmail',
    auth: {
        life: 'demo-developers@munchmode.com',
        pass: 'under0ver999^'
    }
});
