'use strict';

const Promise = require('bluebird');
const crypto = require('crypto');

exports.get = (req, res) => {
  const origin = (typeof req.query.origin) !== 'string' ? 'Unknown App' : req.query.origin;
  req.gf.Session.removeAsync({userId: req.session.passport.user._id, origin: origin})
  .then(() => {
    const msec = new Date().getTime().toString();
    const aSessId = crypto.createHash('sha1').update(req.session.passport.user.username + '%' + msec).digest('hex');
    var newSession = new req.gf.Session({
        userId: req.session.passport.user._id,
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
    newSession.saveAsync()
    .then((session) => {
      const redirectUrl = 'locative://login?token=' + newSession.sessionId;
      console.log('[Mobile Login] Redirecting to', redirectUrl)
      res.redirect(redirectUrl);
    })
    .error((err) => {
      const redirectUrl = 'locative://login?error=Something went wrong';
      console.log('[Mobile Login] Redirecting to', redirectUrl)
      res.redirect(redirectUrl);
    });
  });
};
