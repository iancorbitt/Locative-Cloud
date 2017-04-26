var Subscription = require('../models/subscription');
var Q = require('q');
var _ = require('lodash');
var Promise = require('bluebird');
var User = Promise.promisifyAll(require('../models/user'));
var AccessToken = Promise.promisifyAll(require('../models/access_token'));
var Client = Promise.promisifyAll(require('../models/client'));
var crypto = require('crypto');

var Trigger = module.exports = function Trigger () {};

Trigger.prototype.triggerFencelog = function triggerFencelog (fencelog, cb) {
  return new Promise(function (resolve, reject) {
    var aUser;
    var payload;
    User.findOneAsync({_id: fencelog.userId})
    .then(function (user) {
      aUser = user;
      payload = {
        time: Date.now(),
        location: {
          id: fencelog.locationId,
          longitude: fencelog.location[0],
          latitude: fencelog.location[1]
        },
        fencelog: {
          type: fencelog.fenceType,
          event: fencelog.eventType
        },
        http: {
          method: fencelog.httpMethod,
          url: fencelog.httpUrl,
          statusCode: fencelog.httpResponseCode
        }
      };
      // Find all the applications (clients) that the user has an accesstoken for.
      return AccessToken
        .findAsync({userId: aUser._id})
        .then(function(tokens) {
          return Client.findAsync({clientId: {'$in': _.map(tokens, function(token) {return token.clientId;})}});
        });
    }.bind(this))
    .then(function(clients) { // Invoke the webhook for all the clients.
        clients = _.filter(clients, function(client) {return client.webhook !== undefined && client.webhook !== ''});

        var requests = _.map(clients, function(client) {
          var output = JSON.stringify(sanitizeFencelog(fencelog));
          var options = {
            uri: client.webhook,
            method: 'POST',
            timeout: 3000,
            headers: {
              'Content-Type': 'application/json',
              'X-Locative-secret': crypto.createHmac('sha256', client.clientSecret).update(output).digest('hex')
            },
            body: output
          };
          return doHttpRequest(options)
            .then(function (res) {
              client.webhookResult = [
                new Date().toDateString(), ':', String(res.statusCode)
              ].join(' ');
              client.save(function (err) {
                if (err) { throw err; }
              });
              return res;
            })
            .catch(function (err) {
              client.webhookResult = [
                new Date().toDateString(), ':', err.toString()
              ].join(' ');
              client.save(function (err) {
                if (err) { throw err; }
              });
              console.log(err);
            });
        });
        return Q.all(requests);
    })
    .then(function () {
      triggerSubscriptions(fencelog, cb);
    });
  }.bind(this)).nodeify(cb)
};

function triggerSubscriptions (fencelog, cb) {
  var allRequests = [];
  Subscription.find({userId: fencelog.userId}, function (err, subscriptions) {
    if (!err) {
      if (subscriptions.length > 0) {
        for (var i = subscriptions.length - 1; i >= 0; i--) {
          var subscription = subscriptions[i];
          if (subscription.service === 'zapier') { // Zapier REST Hook Subscription
            var options = {
              uri: subscription.uri,
              method: 'POST',
              timeout: 3000,
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(sanitizeFencelog(fencelog))
            };
          }
          allRequests.push(doHttpRequest(options));
          Q.all(allRequests).then(function (data) {
            cb();
          });
        }
      } else {
        cb();
      }
    } else {
      cb();
    }
  });
}

function sanitizeFencelog(fencelog) {
  delete fencelog._v;
  delete fencelog.userId;
  delete fencelog._id;
  return fencelog;
}

function doHttpRequest(options) {
  var request = Q.denodeify(require('request'));
  return request(options).then(function(resultParams) {
    return resultParams[0];
  });
}
