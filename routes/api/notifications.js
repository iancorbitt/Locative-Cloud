'use strict';

const Promise = require('bluebird');
const Pusher = require('../../lib/pusher');

exports.get = (req, res) => {
  const sessionId = req.query.sessionId;
  if (typeof sessionId !== 'string') {
    return res.status(400).json({
      error: 'bad request'
    });
  }

  req.gf.Session.findOneAsync({
    sessionId: sessionId
  })
  .then((session) => {
    console.log('session', session);
    if (!session) {
      return res.status(401).json({
        error: 'unauthorized'
      });
    }

    req.gf.User.findOneAsync({
      _id: session.userId
    })
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          error: 'unauthorized'
        });
      }
      var allCount = 0;
      var currentPage = req.query.page;
      var limit = parseInt(req.query.limit) || 25;

      if (isNaN(currentPage) || currentPage < 1) {
        currentPage = 0;
      }
      const query = {
        userId: user._id,
      };
      req.gf.Notification.countAsync(query)
      .then((count) => {
        allCount = count;
        const totalPages = Math.ceil(allCount/limit)
        if (currentPage > (totalPages - 1)) {
          currentPage = totalPages - 1;
        }
        if (currentPage < 0) {
          currentPage = 0
        }
        req.gf.Notification.find(query).sort('-created_at').skip((currentPage) * limit).limit(limit).execAsync()
        .then(function (notifications) {
          return res.json({
            count: allCount,
            limit: limit,
            currentPage: currentPage,
            pages: (allCount === 0) ? 0 : totalPages,
            notifications: notifications.reverse().map((notification) => {
              return {
                id: notification.id,
                created_at: notification.created_at,
                message: notification.message,
                result: notification.result
              }
            })
          });
        });
      })
      .error((err) => {
        console.log('caught get notifications exception', err);
        res.status(500).json({
          error: 'internal server error'
        });
      });
    })
    .error((err) => {
      console.log('caught get notifications exception', err);
      res.status(500).json({
        error: 'internal server error'
      });
    });
  })
  .error((err) => {
    console.log('caught get notifications exception', err);
    res.status(500).json({
      error: 'internal server error'
    });
  });
};

exports.post = (req, res) => {
  const sessionId = req.body.sessionId;
  if (typeof sessionId !== 'string') {
    return res.status(400).json({
      error: 'bad request'
    });
  }

  req.gf.Session.findOneAsync({
    sessionId: sessionId
  })
  .then((session) => {
    console.log('session', session);
    if (!session) {
      return res.status(401).json({
        error: 'unauthorized'
      });
    }

    function isApn(session) {
      return typeof session.apns.token !== 'undefined' &&
        session.apns.token !== null;
    }

    function isFcm(session) {
      return typeof session.fcm.token !== 'undefined' &&
        session.fcm.token !== null;
    }

    function getPlatform(session) {
      if (typeof session.apns.token !== 'undefined' &&
        session.apns.token !== null &&
        session.apns.token.length > 0) {
          return 'apn';
      }
      if (typeof session.fcm.token !== 'undefined' &&
        session.fcm.token !== null &&
        session.fcm.token.length > 0) {
          return 'fcm';
      }
      return 'unknown';
    }

    function getToken(session) {
      if (typeof session.apns.token === 'string') {
        return session.apns.token;
      }
      if (typeof session.fcm.token === 'string') {
        return session.fcm.token;
      }
      return null;
    }

    const ns = {
      valid: isApn(session) || isFcm(session),
      platform: getPlatform(session),
      token: getToken(session),
      sandbox: (typeof session.apns.token === 'string' ? session.apns.sandbox : session.fcm.sandbox)
    };

    console.log('[API] Notifications NS', ns);

    if (ns.token === null) {
      return res.status(500).json({
        error: 'no apns or fcm entry'
      });
    }

    console.log('notification body', req.body);

    // all good, let's fire it up
    const apns = new Pusher(!ns.sandbox);
    return apns.sendNotification({
      token: ns.token,
      message: req.body.message,
      platform: ns.platform
    })
    .then((result) => {
      console.log('[Notifications] result', JSON.stringify(result));
      var resultMap = {};
      if (ns.platform === 'apn') {
        resultMap['success'] = (result.failed.length === 0);
        resultMap['errorReason'] = (result.failed.length === 0) ? null : result.failed[0].response.reason;
      } else if (ns.platform === 'fcm') {
        resultMap['success'] = (result.success === 1);
        resultMap['errorReason'] = Array.isArray(result.failed_registration_ids) ? JSON.stringify(result.failed_registration_ids) : null;
      }
      const notification = new Promise.promisifyAll(
          req.gf.Notification({
          userId: session.userId,
          sessionId: session.sessionId,
          message: req.body.message,
          result: resultMap
        })
      );
      notification.saveAsync()
      .then(function () {
        if (isApn(session)) {
          if (result.failed.length > 0) {
            return res.json({
              success: false,
              error: {
                reason: result.failed[0].response.reason
              }
            });
          }
        } else if (isFcm(session)) {
          if (result.success === 0) {
            return res.json({
              success: false,
              error: {
                reason: 'message dispatch failed'
              }
            });
          }
        }
        res.json({
          success: true,
          error: null
        });
      });
    });
  })
  .error((err) => {
    console.log('caught notification exception', err);
    res.status(500).json({
      error: 'internal server error'
    });
  });
};
