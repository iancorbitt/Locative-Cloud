'use strict';

const apn = require('apn');
const FCM = require('fcm-node');

const Promise = require('bluebird');

function getOptions(isProduction) {
  return {
      token: {
          key: process.env.APNS_KEY,
          keyId: process.env.APNS_KEYID,
          teamId: process.env.APNS_TEAMID,
      },
      production: isProduction,
  };
};

function getNotification (isProd, message) {
  const note = new apn.Notification();
  note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
  note.sound = "whatsup.caf";
  note.alert = message;
  // note.payload = {'messageFrom': 'John Appleseed'};
  note.topic = isProd ? "com.marcuskida.Geofancy" : "io.kida.Geofancy";
  return note;
};

const Pusher = module.exports = function Pusher (isProd) {
  this.isProd = isProd;
  this.apnProvider = new apn.Provider(getOptions(isProd));
  this.fcmProvider = Promise.promisifyAll(new FCM(process.env.FCM_API_KEY));
};

Pusher.prototype.sendNotification = function (specs, cb) {
  return new Promise((resolve, reject) => {
    if (typeof specs.token !== 'string' &&
        typeof specs.message !== 'string') {
          return reject('invalid token or message');
    }
    if (specs.platform !== 'apn' && specs.platform !== 'fcm') {
      return reject('invalid platform');
    }
    console.log('[Pusher] Specs:', specs);
    if (specs.platform === 'apn') { // Apple Push Notifications
      console.log('sending message to ', specs.token, ' using ', this.isProd ? 'PROD' : 'SANDBOX');
      this.apnProvider.send(getNotification(this.isProd, specs.message), specs.token)
      .then((result) => {
        resolve(result);
      });
    } else if (specs.platform === 'fcm') { // Firebase Cloud Messaging
      this.fcmProvider.sendAsync({
        to: specs.token,
        notification: {
          title: 'Locative',
          body: specs.message
        }
      })
      .then((result) => {
        resolve(result);
      });
    }
  }).nodeify(cb);
};
