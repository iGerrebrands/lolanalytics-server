var auth = require('../auth/authHandler.js');
var db = require('../db/database.js');
var riot = require('../riot-api/riot.js');
var _ = require('underscore');

module.exports = {
    setupRoutes: function (express) {
        var route = express.Router();

        // post: api/user/login  body: name, password
        route.post('/login', function (req, res) {
            db.getUser({
                name: req.body.name,
                password: req.body.password
            }, function (doc) {
                if(doc === null) {
                    res.status(400).json({ok: false, message: 'Invalid login credentails'});
                } else {
                    var token = auth.createToken({
                        name: doc.name,
                        email: doc.email,
                        admin: doc.admin,
                        lastLogin: doc.lastLogin
                    });
                    res.json({
                        ok: true,
                        message: 'Logged in successfully',
                        token: token
                    });
                    console.log('Login: User ' + req.body.name + ' just logged in!');
                }
            });
        });

        // post: api/user/register body: name, password, email
        route.post('/register', function (req, res) {
            if(typeof req.body.password === 'undefined' || req.body.password.length < 3) {
                res.send({ok: false, message: 'Password is not long enough'});
                return;
            }

            if(typeof req.body.name === 'undefined' || req.body.name.length < 3){
                res.send({ok: false, message: 'Username is not long enough'});
                return;
            }

            if(typeof req.body.email === 'undefined' || req.body.email.length < 3) {
                res.send({ok: false, message: 'Email is not valid'});
                return;
            }

            db.createUser({
                name: req.body.name,
                password: req.body.password,
                email: req.body.email
            }, function (dbRes) {
                res.json(dbRes);
                console.log('Register: User ' + req.body.name + ' just registered!');
            });
        });

        // get: api/user/summoners body: none
        route.get('/summoners', function (req, res) {
            auth.isVerified(req, function (ver) {
                if (ver) {
                    auth.getTokenData(req, function (decoded) {
                        db.getUser({
                            name: decoded.user.name
                        }, function(doc) {
                            res.json({ok: true, summoners: doc.summoners});
                        });
                    });
                } else {
                    res.status(401).json({ok: false, message: 'Unauthorized'});
                }
            });
        });

        // post: api/user/summoner body: name
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
                                                resp.status(500).json({ok: false, message:'Internal server error(please contact the administrators)'});
                                            } else {
                                                resp.json({ok: true, message: 'Summoner added successfully'});
                                            }
                                        });
                                    } else {
                                        resp.status(400).json({ok: false, message:"You already added this summoner"});
                                    }
                                });
                            });
                        } else {
                            resp.status(400).json({ok: false, message: "Summoner does not exists" });
                        }
                    });
                } else {
                    resp.status(401).json({ok: false, message: 'Unauthorized'});
                }
            })
        });

        // TODO: endpoint
        route.delete('/summoner', function (req, res) {
               auth.isVerified(req, function (ver) {
                    if(ver) {
                        // delete summoner by id
                    } else {
                        res.status(401).json({ok: false, message: 'Unautorized'});
                    }
               });
        });

        return route;
    }
};