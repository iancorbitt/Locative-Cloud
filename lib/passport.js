'use strict';

var passport = require('passport');
var config = require('./config.js').getConfig();
var analytics = new (require('../lib/analytics'))();
var shortid = require('shortid');

// mongodb schemas
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('../models/user');
var Client = require('../models/client');
var Session = require('../models/session');
var AccessToken = require('../models/access_token');

var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;

exports.passport = passport;

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// passport local strategy
passport.use(new LocalStrategy(
  function(username, password, done) {
    const incorrectCredentialsMessage = 'Incorrect username or password.';
    User.findOne({$and: [{$or: [{username: username}, {email: username}]}, {locked: false}]}, function (err, user) {
      if (err) {
        analytics.track('login', 'password.error');
        return done(err);
      }
      if (!user) {
        analytics.track('login', 'password.invalid_user');
        return done(null, false, {
          message: incorrectCredentialsMessage
        });
      }
      if (!user.validPassword(password, user.password)) {
        console.log('INCORRECT PASSWORD');
        analytics.track('login', 'password.failure', user._id);
        return done(null, false, {
          message: incorrectCredentialsMessage
        });
      }
      analytics.track('login', 'password.success', user._id);
      console.log('SUCCESS!');
      user.loggedin_at = new Date;
      console.log('user: ' + JSON.stringify(user));
      user.save(function(err) {
        return done(null, user);
      });
    });
  }
));

// passport facebook strategy
passport.use(new FacebookStrategy({
    clientID: config.fb_app_id,
    clientSecret: config.fb_app_secret,
    callbackURL: config.fb_auth_callback,
    profileFields: ['id', 'email', 'name']
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(JSON.stringify(profile));
    // return;
    createAccount(profile, done)
  }
));

// passport google strategy
passport.use(new GoogleStrategy({
    clientID: config.google_app_id,
    clientSecret: config.google_app_secret,
    callbackURL: config.google_auth_callback
  },
  function(accessToken, refreshToken, profile, done) {
    console.log('Google Auth', JSON.stringify(profile));
    createAccount(profile, done);
  }
));

// passport twitter strategy
passport.use(new TwitterStrategy({
    consumerKey: config.tw_consumer_key,
    consumerSecret: config.tw_consumer_secret,
    callbackURL: config.tw_auth_callback
  },
  function(token, tokenSecret, profile, done) {
    console.log(JSON.stringify(profile));
    // return;
    createAccount(profile, done)
  }
));

// passport bearer strategy
passport.use(new BearerStrategy(
  function(token, done) {
    // User.findOne({ token: token }, function (err, user) {
    //   if (err) { return done(err); }
    //   if (!user) { return done(null, false); }
    //   return done(null, user, { scope: 'read' });
    // });
    AccessToken.findOne({token: token}, function(err, atoken) {
      if (err) {
        return done(err);
      }
      if (!atoken) {
        return done(null, false);
      }
      Client.findOne({clientId: atoken.clientId}, function (err, client) {
        if (err) {
          return done(err);
        }
        if (!client) {
          return done(null, false);
        }
        User.findOne({_id: atoken.userId}, function(err, user) {
          if (err) {
            return done(err);
          }
          if(!user) {
            return done(null, false);
          }
          return done(null, user, {scope: 'read'});
        });
      })
    });
  }
));

// passport basic strategy
passport.use(new BasicStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (!user.validPassword(password, user.password)) { return done(null, false); }
      return done(null, user);
    });
  }
));

// passport oauth2-client-password strategy
passport.use(new ClientPasswordStrategy(
  function(clientId, clientSecret, done) {
    Client.findOne({ clientId: clientId }, function (err, client) {
      if (err) {
        analytics.track('login', 'client.failure');
        return done(err);
      }
      if (!client) {
        analytics.track('login', 'client.failure.no_client');
        return done(null, false);
      }
      if (client.clientSecret != clientSecret) {
        analytics.track('login', 'client.failure.invalid_secret');
        return done(null, false);
      }
      analytics.track('login', 'client.success', client);
      return done(null, client);
    });
  }
));

function createAccount(profile, done) {
  analytics.track('login', 'social.attempt');
  var searchQuery = {};
  var facebookId = null;
  var twitterId = null;
  var googleId = null;
  var provider = profile.provider;
  if (provider === "facebook") {
    facebookId = profile.id;
    searchQuery = {facebookId: facebookId};
  } else if (provider === "twitter") {
    twitterId = profile.id;
    searchQuery = {twitterId: twitterId};
  } else if (provider === "google") {
    googleId  = profile.id;
    searchQuery = {googleId: googleId};
  }
  User.findOne(searchQuery, function (err, user) {
    if (err) {
      analytics.track('login', 'social.failure');
      return done(err);
    }
    if (!user) {
      analytics.track('login', 'social.signup');
      var finalUsername = profile.username || shortid.generate();
      User.findOne({username: finalUsername}, function (err, existingUser) {
        if (existingUser) {
          finalUsername = profile.id;
        }
        var email = '';
        if (profile.email) {
          email = profile.email;
        } else if (profile.emails) {
          email = (profile.emails.length > 0)?profile.emails[0].value:'';
        } else {
          email = 'user' + profile.id + '+' + provider + '@my.locative.io';
        }
        var newUser = new User({
          username: finalUsername,
          email: email,
          facebookId: facebookId,
          twitterId: twitterId,
          googleId: googleId
        });
        newUser.loggedin_at = new Date();
        newUser.save(function(err) {
          return done(err, newUser);
        });
      });
    } else {
      if (user.locked) {
        analytics.track('login', 'social.failure.locked', user._id);
        return done(null, null);
      }
      analytics.track('login', 'social.success', user._id);
      user.loggedin_at = new Date();
      user.save(function(err) {
        return done(err, user);
      })
    }
  });
}
