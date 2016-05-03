var auth = require('../auth/authHandler.js');
var riot = require('../riot-api/riot.js');

module.exports = {
  setupRoutes: function (express) {
      var route = express.Router();
      route.get('/by-name/:summoner?', function (req, res) {
          auth.isVerified(req, function (ver) {
             if (ver) {
                 riot.getSummonerByName(req, res);
             } else {
                 res.sendStatus(401);
             }
          });
      });

      route.get('/by-id/:id?', function (req, res) {
          auth.isVerified(req, function (ver) {
              if (ver) {
                  riot.getSummonerById(req.params.id, req, res);
              } else {
                  res.sendStatus(401);
              }
          });
      });

      route.get('/masteries/:id?', function (req, res) {
          res.send('Endpoint under construction.');
      });

      route.get('/runes/:id?', function (req, res) {
          res.send('Endpoint under construction.');
      });

      return route;
  }
};