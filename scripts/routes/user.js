var auth = require('../auth/authHandler.js');
var db = require('../db/database.js');
var riot = require('../riot-api/riot.js');
var _ = require('underscore');
var emailPatt = new RegExp(/^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i);

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

            if(!emailPatt.test(req.body.email)){
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
                    if(typeof req.body.region === 'undefined' || req.body.region === null) {
                        req.body.region = 'euw';
                    }

                    riot.serverGetSummonerByName(req.body, function (res) {
                        if(res.ok) {
                            var summoner = res.data;
                            auth.getTokenData(req, function(decoded) {
                                db.getUser({
                                    name: decoded.user.name
                                }, function(doc) {
                                    var contains = false;
                                    _.each(doc.summoners, function (_summoner) {
                                        console.log(_summoner.region + ":" + summoner.region);
                                        if(_summoner.id == summoner.id && _summoner.region == summoner.region)
                                            contains = true;
                                    });
                                    if(!contains) {
                                        summoner.region = req.body.region;
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
            var resp = res;
            auth.isVerified(req, function (ver) {
                if(ver) {
                    if(typeof req.body.id === 'undefined' || req.body.id === null) {
                        resp.status(400).json({ok: false, message: 'You forgot the id'});
                        return;
                    }

                    if(typeof req.body.region === 'undefined' || req.body.region === null) {
                        resp.status(400).json({ok: false, message: 'You forgot the region'});
                        return;
                    }
                    // delete summoner by id and region
                    auth.getTokenData(req, function (decoded) {
                        db.getUser({
                            name: decoded.user.name
                        }, function (doc) {
                            var summoners = doc.summoners;
                            var id = -1;
                            _.each(summoners, function (summoner, ind) {
                                if(req.body.id == summoner.id && req.body.region == summoner.region) {
                                    id = ind;
                                }
                            });
                            if(id !== -1) {
                                summoners.splice(id, 1);
                            } else {
                                resp.status(400).json({ok: false, message:'Summoner not found'});
                                return;
                            }

                            doc.save(function(err) {
                                if(err !== null) {
                                    resp.status(500).json({ok: false, message:'Internal server error(please contact the administrators)'});
                                } else {
                                    resp.json({ok: true, message: 'Summoner removed successfully'});
                                }
                            });
                        });
                    });
                } else {
                    res.status(401).json({ok: false, message: 'Unautorized'});
                }
            });
        });

        return route;
    }
};