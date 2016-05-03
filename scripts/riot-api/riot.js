var request = require('request');
var CONFIG = require('../config.js');

module.exports = {
    getSummonerByName: function (req, res) {
        var resp = res;
        if(typeof req.params.summoner !== 'undefined'){
            request('https://euw.api.pvp.net/api/lol/euw/v1.4/summoner/by-name/' + req.params.summoner + '?api_key=' + CONFIG.API.KEY, function (err, res, body) {
                if(!err && res.statusCode === 200) {
                    var data = JSON.parse(body);
                    resp.json(data);
                } else {
                    resp.status(404).sendFile('/Git/lolanalytics-server/404.html');
                }
            });
        } else {
            res.sendStatus(400);
        }
    },
    getSummonerById: function (req, res) {
        var resp = res;
        if(typeof req.params.id !== 'undefined'){
            request('https://euw.api.pvp.net/api/lol/euw/v1.4/summoner/' + req.params.id + '?api_key=' + CONFIG.API.KEY, function (err, res, body) {
                if(!err && res.statusCode === 200) {
                    var data = JSON.parse(body);
                    resp.json(data);
                } else {
                    resp.status(404).sendFile('/Git/lolanalytics-server/404.html');
                }
            });
        } else {
            res.sendStatus(400);
        }
    }
};