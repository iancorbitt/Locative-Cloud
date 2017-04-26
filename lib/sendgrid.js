'use strict';

var username = process.env.SENDGRID_USERNAME;
var password = process.env.SENDGRID_PASSWORD;

var Sendgrid = module.exports = function Sendgrid () {
  if (typeof username === 'undefined' || typeof password === 'undefined') {
    return;
  }
  this.sendgrid = require('sendgrid')(username, password);
};

Sendgrid.prototype.send = function send (obj, file) {
  if (!this.sendgrid) {
    return console.log('[Sendgrid] Sendgrid not set up, email not sent.', obj);
  }
  var email = new this.sendgrid.Email(obj);
  if (typeof file === 'object') {
    email.addFile(file);
  }
  this.sendgrid.send(email, null);
};
