var mongoose = require('mongoose');
var CONFIG = require('../config.js');

var User = mongoose.model('User', {
    name: {type: String, index: {unique: true}},
    password: String,
    email: String,
    admin: {type: Boolean, default: false},
    created: {type: Date, default: Date.now},
    edited: {type: Date, default: Date.now},
    lastLogin: {type: Date, default: Date.now},
    summoners: []
});

module.exports = {
    db: null,
    connect: function (url) {
        mongoose.connect(url);
        this.db = mongoose.connection;
        this.db.on('error', console.error.bind(console, 'connection error: '));
    },
    open: function (callback){
        this.db.once('open', callback);
        console.log("Connected to DB on port: " + CONFIG.SERVER.DBPORT);
    },
    createUser: function (obj, callback) {
        User.findOne({name: obj.name}, function (err, doc) {
            if(doc !== null) {
                callback({ok: false, message: 'Username Already Exists'});
                return;
            }
            new User({
                name: obj.name,
                password: obj.password,
                email: obj.email
            }).save(function (err) {
                if(err){
                    console.log(err);
                    callback({ok: false, message: 'Something went wrong with the DB'});
                } else {
                    callback({ok: true, message: 'You are registerd'});
                }
            });
        });
    },
    getUser: function (user, callback) {
        User.findOne(user, function (err, doc) {
            //TODO: ERROR
            callback(doc);
        });
    }
};