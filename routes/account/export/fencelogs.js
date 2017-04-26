var json2csv = require('json2csv');
var sendgrid = new (require('../../../lib/sendgrid'))();
var config = require('../../../lib/config').getConfig();

var fencelogs = function (req, res) {
  res.render('account/export/fencelogs');
}

var dispatchFencelogMail = function (req, fencelogs, type, filename) {
  sendgrid.send({
    from: config.mail_from,
    to: req.session.passport.user.email,
    subject: "Locative - Exported Fencelogs as " + type,
    text: "Hey there " + req.session.passport.user.username + "!\nAttached you'll find your Fencelogs as " + type + "!\n\nCheers,\nyour Locative!"
  }, {
    filename: filename,
    content: fencelogs
  });
};

var getAllFencelogs = function (req, cb) {
  req.gf.Fencelog.find({userId: req.session.passport.user._id}, {userId: 0}).sort('-created_at').exec(function(err, fencelogs) {
    var fencelogsResult = new Array();
    if (!err) {
      if (fencelogs) {
        for (var i = 0; i < fencelogs.length; i++) {
          var dbFencelog = fencelogs[i];
          var fencelog = {
            id: dbFencelog._id,
            longitude: dbFencelog.location[0],
            latitude: dbFencelog.location[1],
            created_at: dbFencelog.created_at,
            fenceType: dbFencelog.fenceType,
            eventType: dbFencelog.eventType,
            httpResponseCode: dbFencelog.httpResponseCode,
            httpMethod: dbFencelog.httpMethod,
            httpUrl: dbFencelog.httpUrl,
            locationId: dbFencelog.locationId
          }
          fencelogsResult.push(fencelog);
        }
      }
      cb(fencelogsResult);
    } else {
      cb();
    }
  });
}

var downloadAllFencelogsAsJson = function (req, res) {
  getAllFencelogs(req, function(fencelogsResult) {
    if (typeof(fencelogsResult) === 'object') {
      res.send(200);
      console.log('json:'+JSON.stringify(fencelogsResult));
      dispatchFencelogMail(req, JSON.stringify(fencelogsResult), "JSON", "fencelogs.json");
    } else {
      res.send(500);
    }
  });
}

var downloadAllFencelogsAsCsv = function (req, res) {
  getAllFencelogs(req, function(fencelogsResult) {
    if (typeof(fencelogsResult) === 'object') {
      json2csv({data: fencelogsResult, fields: ['id', 'longitude', 'latitude', 'created_at', 'fenceType', 'eventType', 'httpResponseCode', 'httpMethod', 'httpUrl', 'locationId']}, function(err, csv) {
        if (err) {
          res.send(500);
        } else {
          res.send(200);
          dispatchFencelogMail(req, csv, "CSV", "fencelogs.csv");
        }
      });
    } else {
      res.send(500);
    }
  });
}

module.exports = {
  fencelogs: fencelogs,
  downloadAllFencelogsAsCsv: downloadAllFencelogsAsCsv,
  downloadAllFencelogsAsJson: downloadAllFencelogsAsJson
}
