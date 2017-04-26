'use strict';

var projectId = process.env.AIRBRAKE_PROJECT_ID;
var apiKey = process.env.AIRBRAKE_API_KEY;

var Airbrake = module.exports = function Airbrake () {
  if (typeof projectId === 'undefined' || typeof apiKey === 'undefined') {
    return console.log('[Airbrake] Not set up.');
  }

  let airbrake = require('airbrake').createClient(projectId, apiKey);
  airbrake.handleExceptions();

  // unhandled promise reejction handler using airbrake
  process.on('unhandledRejection', function(reason, p) {
    airbrake.notify(reason);
  });

  this.airbrake = airbrake;
  console.log('[Airbrake] Up and running 👍');
};

Airbrake.prototype.middleware = function middleware (app) {
  if (this.airbrake && app) {
    app.use(this.airbrake.expressHandler());
    console.log('[Airbake] Set up Express handler 👌');
  }
};

Airbrake.prototype.notify = function notify (ex) {
  if (this.airbrake) {
    this.airbrake.notify(ex);
  }
}
