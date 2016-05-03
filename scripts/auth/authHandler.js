var CONFIG = require('../config.js');
var jwt = require('jsonwebtoken');
// for json web token: https://github.com/auth0/node-jsonwebtoken

module.exports = {
    tokens: [],
    isVerified: function (req, callback) {
        jwt.verify(req.headers.authorization, CONFIG.SERVER.SECRET, function (err, decoded) {
            if(err) {
                callback(false);
            } else {
                callback(true);
            }
        });
    },
    createToken: function (userObj) {
        return jwt.sign({
            user: userObj,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (CONFIG.SERVER.USER_EXPTIME * 60 * 60)
        }, CONFIG.SERVER.SECRET);
    },
    getTokenData: function (req, callback) {
        jwt.verify(req.headers.authorization, CONFIG.SERVER.SECRET, function (err, decoded) {
            callback(decoded);
        });
    }
};