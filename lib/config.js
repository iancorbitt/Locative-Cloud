exports.getConfig = function(sut){
  var isSut = sut || false;
  var fs = require('fs');
  var config = {
    "hostname": process.env.HOSTNAME,
    "servername": process.env.SERVERNAME,

    "mongodb_url": process.env.MONGOLAB_URI,
    "redis_url": process.env.REDISCLOUD_URL,

    "status_mail_recipient": process.env.STATUS_MAIL_RCPT,

    "mail_from": process.env.MAIL_FROM,
    "mail_server": process.env.MAIL_SERVER,
    "mail_user": process.env.MAIL_USER,
    "mail_password": process.env.MAIL_PASSWORD,

    "fb_app_id": process.env.FB_APP_ID,
    "fb_app_secret": process.env.FB_APP_SECRET,
    "fb_auth_callback": process.env.FB_AUTH_CALLBACK,

    "google_app_id": process.env.GOOGLE_APP_ID,
    "google_app_secret": process.env.GOOGLE_APP_SECRET,
    "google_auth_callback": process.env.GOOGLE_AUTH_CALLBACK,

    "tw_consumer_key": process.env.TW_CONSUMER_KEY,
    "tw_consumer_secret": process.env.TW_CONSUMER_SECRET,
    "tw_auth_callback": process.env.TW_AUTH_CALLBACK,

    "is_json": false
  };

  if(!isSut && fs.existsSync('config.json')) {
    config = require('../config.json');
    config.is_json = true;
  }

  return config;
}
