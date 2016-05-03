var CONFIG = require('./scripts/config.js');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var auth = require('./scripts/auth/authHandler.js');
var riot = require('./scripts/riot-api/riot.js');
var db = require('./scripts/db/database.js');


var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
};


db.connect( CONFIG.SERVER.DBURL + ':'+ CONFIG.SERVER.DBPORT +'/' + CONFIG.SERVER.DB);

db.open(function () {
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(allowCrossDomain);

    app.use(CONFIG.SETTINGS.BASEURL + '/summoner', require('./scripts/routes/summoner.js').setupRoutes(express));
    app.use(CONFIG.SETTINGS.BASEURL + '/user', require('./scripts/routes/user.js').setupRoutes(express));

    app.get('/:name?', function (req, res) {
        if(typeof req.params.name !== 'undefined') {
            var token = auth.createToken({name: req.params.name});
            res.json({
                token: token
            });
        } else {
            res.sendStatus(400);
        }
    });

    app.listen(CONFIG.SERVER.PORT);
    console.log('Server running on port: ' + CONFIG.SERVER.PORT);
});