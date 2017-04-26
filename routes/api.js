'use strict';

const Promise = require('bluebird');
const crypto = require('crypto');

exports.username = function (req, res) {
    console.log(req.body.username);
    req.gf.User.findOne({username: req.body.username}, function (err, user) {
        console.log('Error: ' + err + ' User: ' + user);
        if(!err) {
            if(user) {
                res.send({error: 'Username not available'});
            } else {
                res.send({success: 'User not existing'});
            }
        } else {
            res.send({error: 'Server error'});
        }
    });
};

exports.fencelogs = function (req, res) {
  function findQuery(req, user) {
    const limit = parseInt(req.query.limit);
    if (!isNaN(limit) && limit > 0) {
      return req.gf.Fencelog.find({userId: user._id}, {userId: 0, _id: 0, __v: 0}).sort('-created_at').limit(limit);
    }
    return req.gf.Fencelog.find({userId: user._id}, {userId: 0, _id: 0, __v: 0}).sort('-created_at');
  };

  req.gf.Session.findOne({sessionId: req.params.sessionId}, function(err, session) {
    if (err) {
      return res.status(500).json({error: 'server error'});
    }
    if (!session) {
      return res.status(401).json({error: 'session invalid'});
    }
    req.gf.User.findOne({_id: session.userId}, function (err, user) {
        if(err) {
          return res.status(500).json({error: 'Internal Server error'});
        }
        if (!user) {
          return res.status(404).json({error: 'User not found'});
        }
        findQuery(req, user).exec(function (err, docs) {
            if (err) {
              return res.status(500).json({error: 'Internal Server error'});
            }
            res.json({success: 'OK', fencelogs: docs});
        });
    });
  });
};

exports.fencelogsAdd = function (req, res) {
    var Trigger = require('../lib/trigger');
    var trigger = new Trigger();
    req.gf.Session.findOne({sessionId: req.params.sessionId}, function (err, session) {
        if (!err) {
            if (session) {
                req.gf.User.findOne({_id: session.userId}, function (err, user) {
                    if (!err) {
                        if (user) {
                          var origin = ((typeof req.body.origin) === 'string') ? req.body.origin : 'Unknown';
                          var newFencelog = new req.gf.Fencelog({
                              userId: user._id,
                              location: [req.body.longitude, req.body.latitude],
                              locationId: req.body.locationId,
                              httpUrl: req.body.httpUrl,
                              httpMethod: req.body.httpMethod,
                              httpResponseCode : req.body.httpResponseCode,
                              eventType: req.body.eventType,
                              fenceType: req.body.fenceType,
                              origin: origin
                          });
                          newFencelog.save(function(err) {
                              console.log('Fencelog Save Error: ' + err);
                              if (!err) {
                                  if (typeof req.gf.socketClients[user.username] === 'object') {
                                      var socket = req.gf.socketClients[user.username];
                                      socket.emit('fencelog', {event: 'add', fencelog: newFencelog});
                                  }
                                  trigger.triggerFencelog(newFencelog, function () {
                                      console.log('All triggers done');
                                      req.gf.analytics.track('fencelog', 'trigger', user._id);
                                  });
                                  res.send({success: 'OK', 'userId': user._id}, 200);
                              } else {
                                  res.send({error: 'Fencelog save failed', 'userId': user._id}, 500);
                              }
                          });
                        } else {
                            res.send({error: 'User not found'}, 404);
                        }
                    } else {
                        res.send({error: 'Internal Server error'}, 500);
                    }
                });
            } else {
                res.send({error: 'session invalid'}, 401);
            }
        } else {
            res.send({error: 'server error'}, 500);
        }
    });
};

exports.signup = function (req, res) {

    if (crypto.createHash('sha1').update(req.body.username + ':' + req.body.password + '%' + req.body.email).digest('hex') !== req.body.token) {
        res.send({error: 'unauthorized'}, 401);
        return;
    }

    req.gf.User.findOne({$or: [{username: req.body.username}, {email: req.body.email}]}, function (err, user) {
        if (!err) {
            if (!user) {

                var new_user = new req.gf.User({
                    username: req.body.username,
                    email: req.body.email,
                    password: crypto.createHash('sha1').update(req.body.password).digest('hex')
                });

                new_user.save(function (err) {
                    if (err) {
                        res.send({error: 'signup error'}, 500);
                    } else {
                        res.send({success: 'signup success'}, 200);
                    }
                });

            } else {
                res.send({error: 'user existing'}, 409);
            }
        } else {
            res.send({error: 'server error'}, 500);
        }
    });
}

exports.session = function (req, res) {
  var aUser, aSessId;
  const origin = (typeof req.query.origin) !== 'string' ? 'Unknown App' : req.query.origin;

  return new Promise((resolve, reject) => {
    if (req.session.passport.user) {
      return resolve(req.session.passport.user);
    }

    // username & password strategy (old way)
    if ((typeof req.query.username) !== 'string' || (typeof req.query.password) !== 'string') {
        return reject(new Error('user not existing'));
    };

    if (req.query.username.length === 0 || req.query.password.length === 0) {
      return reject(new Error('user not existing'));
    }

    req.gf.User.findOneAsync({
      $and: [{$or: [{username: req.query.username}, {email: req.query.username}]},
       {password: crypto.createHash('sha1').update(req.query.password).digest('hex')}]
     })
     .then((user) => {
       resolve(user);
     })
     .error((err) => {
       reject(err);
     });
  })
 .then((user) => {
   if (!user) {
     return res.status(404).json({
       error: 'user not existing'
     });
   }
   aUser = user;
   req.gf.Session.removeAsync({userId: user._id, origin: origin})
   .then((numberRemoved) => {
     var msec = new Date().getTime().toString();
     aSessId = crypto.createHash('sha1').update(aUser.username + '%' + msec).digest('hex');
     var new_session = new req.gf.Session({
         userId: aUser._id,
         sessionId: aSessId,
         origin: origin,
         apns: {
           token: req.query.apns || null,
           sandbox: (req.query.sandbox === 'true') || false
         },
         fcm: {
           token: req.query.fcm || null,
           sandbox: (req.query.sandbox === 'true') || false
         }
     });
     return new_session.saveAsync();
   })
   .then((success) => {
     console.log('[API] Get Session Save:', success);
     res.json({
       success: aSessId
     });
   })
   .error((err) => {
     console.log('[API] Get Session Error:', err.message);
     if (err.message === 'user not existing') {
       return res.status(404).json({
         error: 'user not existing'
       });
     }
     res.status(500).json({
       error: 'internal server error'
     });
   });
 })
 .error((err) => {
   console.log('[API] Get Session Error:', err.message);
   if (err.message === 'user not existing') {
     return res.status(404).json({
       error: 'user not existing'
     });
   }
   res.status(500).json({
     error: 'internal server error'
   });
 });
};

exports.sessionPut = (req, res) => {
  console.log('[API] Session PUT Body', req.body);
  req.gf.Session.findOneAsync({
    sessionId: req.params.sessionId
  })
  .then((session) => {
    if (!session) {
      return res.status(401).json({
        error: 'unauthorized'
      });
    }
    const aSession = Promise.promisifyAll(session);
    if (typeof req.body.apns === 'object') {
      aSession.apns = {
        token: req.body.apns.token,
        sandbox: (req.body.apns.sandbox === 'true') || false
      }
      aSession.saveAsync()
      .then(() => {
        res.status(200).json({
          result: 'success'
        });
      });
      return;
    } else if (typeof req.body.fcm === 'object') {
      aSession.fcm = {
        token: req.body.fcm.token,
        sandbox: (req.body.fcm.sandbox === 'true') || false
      }
      aSession.saveAsync()
      .then(() => {
        res.status(200).json({
          result: 'success'
        });
      });
      return;
    }
    res.status(500).json({
      error: 'internal server error'
    });
  });
};

exports.sessionCheck = function (req, res) {
    req.gf.Session.findOne({sessionId: req.params.sessionId},function (err, session) {
      if (err) {
        return res.send({error: 'server error'}, 500);
      }

      if (!session) {
        return res.send({error: 'session invalid'}, 401);
      }

      if ((typeof req.query.origin) === 'string') {
        session.origin = req.query.origin;
      }

      req.gf.async.series([
        function (cb) {
          session.save(function(){
            cb();
          });
        },
        function () {
          res.send({success: 'session valid'}, 200);
        }
        ]);
    });
}

function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

exports.account = (req, res) => {
  req.gf.Session.findOneAsync({
    sessionId: req.query.sessionId
  })
  .then((session) => {
    if (!session) {
      return res.status(401).json({
        error: 'unauthorized'
      });
    }
    return req.gf.User.findOneAsync({
      _id: session.userId
    });
  })
  .then((user) => {
    if (!user) {
      return res.status(404).json({
        error: 'user not found'
      });
    }
    if (user.locked === true) {
      return res.status(401).json({
        error: 'unauthorized'
      });
    }
    res.json({
      username: user.username,
      email: user.email,
      avatar: [
        'https://www.gravatar.com/avatar/',
        crypto.createHash('md5').update(user.email).digest("hex")
      ].join('')
    });
  })
  .error((err) => {
    res.status(500).json({
      error: 'internal server error'
    });
  });
};

exports.today = function (req, res) {
  var aSession;
  var aUser;
  req.gf.async.series([
    function (cb) {
      req.gf.Session.findOne({sessionId: req.query.sessionId},function (err, session) {
        if (err) {
          return res.json({error: 'internal server error'}, 500);
        }
        if (!session) {
          return res.json({error: 'unauthorized'}, 401);
        }
        aSession = session;
        cb();
      });
    },
    function (cb) {
      req.gf.User.findOne({_id: aSession.userId}, function (err, user) {
        if (err || !user) {
          return res.json({error: 'internal server error'}, 500);
        }
        aUser = user;
        cb();
      });
    },
    function (cb) {
      req.gf.Fencelog.findOne({userId: aUser._id}).sort({created_at:-1}).exec(function (err, fencelog) {
        if (err) {
          return res.json({error: 'internal server error'}, 500);
        }
        if (!fencelog) {
          return res.json({error: 'not found'}, 404);
        }
        res.json({error: false, fencelog: fencelog});
      });
    }
  ]);
}
