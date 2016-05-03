var auth = require('../auth/authHandler.js');
var db = require('../db/database.js');
var riot = require('../riot-api/riot.js');
var _ = require('underscore');

module.exports = {
    setupRoutes: function (express) {
        var route = express.Router();

        route.post('/login', function (req, res) {
            // Handle login here
            db.getUser({
                name: req.body.name,
                password: req.body.password
            }, function (doc) {
                if(doc === null) {
                    res.sendStatus(401);
                } else {
                    var token = auth.createToken({
                        name: doc.name,
                        email: doc.email,
                        admin: doc.admin,
                        lastLogin: doc.lastLogin
                    });
                    res.json({
                        token: token
                    });
                }
            });
        });

        route.post('/register', function (req, res) {
            if(typeof req.body.password === 'undefined' || req.body.password.length < 3) {
                res.send({saved: false, message: 'Password is not long enough!'});
                return;
            }

            if(typeof req.body.name === 'undefined' || req.body.name.length < 3){
                res.send({saved: false, message: 'Username is not long enough!'});
                return;
            }

            if(typeof req.body.email === 'undefined' || req.body.email.length < 3) {
                res.send({saved: false, message: 'Email is not valid!'});
                return;
            }

            db.createUser({
                name: req.body.name,
                password: req.body.password,
                email: req.body.email
            }, function (dbRes) {
                res.json(dbRes);
            });
        });

        route.get('/summoners', function (req, res) {
            auth.isVerified(req, function (ver) {
                if (ver) {
                    auth.getTokenData(req, function (decoded) {
                        db.getUser({
                            name: decoded.user.name
                        }, function(doc) {
                            res.json({summoners: doc.summoners});
                        });
                    });
                } else {
                    res.sendStatus(401);
                }
            });
        });

        route.post('/summoner', function (req, res) {
            var resp = res;
            auth.isVerified(req, function (ver){
                if(ver) {
                    // CHECK IF VALID SUMMONER
                    riot.serverGetSummonerIdByName(req.body.name, function (res) {
                        if(res.ok) {
                            var summoner = res.data;
                            auth.getTokenData(req, function(decoded) {
                                db.getUser({
                                    name: decoded.user.name
                                }, function(doc) {
                                    var contains = false;
                                    _.each(doc.summoners, function (_summoner) {
                                        if(_summoner.id == summoner.id)
                                            contains = true;
                                    });
                                    if(!contains) {
                                        doc.summoners.push(summoner);
                                        doc.save(function(err) {
                                            if(err !== null) {
                                                resp.status(500).json({message:'Internal server error(please contact the administrators)'});
                                            } else {
                                                resp.json({ok: true});
                                            }
                                        });
                                    } else {
                                        resp.status(400).json({message:"You already added this summoner!"});
                                    }
                                });
                            });
                        } else {
                            resp.status(400).json({message: "Summoner does not exists!" });
                        }
                    });
                } else {
                    resp.sendStatus(401);
                }
            })
        });

        return route;
    }
};