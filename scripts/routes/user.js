var auth = require('../auth/authHandler.js');
var db = require('../db/database.js');

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
                res.send('Password is not long enough!');
                return;
            }

            if(typeof req.body.name === 'undefined' || req.body.name.length < 3){
                res.send('Username is not long enough!');
                return;
            }

            if(typeof req.body.email === 'undefined' || req.body.email.length < 3) {
                res.send('Email is not valid!');
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
            auth.isVerified(req, function (ver){
                if(ver) {
                    // CHECK IF VALID SUMMONER ID
                    auth.getTokenData(req, function(decoded) {
                        db.getUser({
                            name: decoded.user.name
                        }, function(doc) {
                            doc.summoners.push(req.body.id);
                            doc.save(function(err) {
                                if(err) {
                                    res.sendStatus(500);
                                } else {
                                    res.sendStatus(200);
                                }
                            });

                        });
                    });
                } else {
                    res.sendStatus(401);
                }
            })
        });

        return route;
    }
};