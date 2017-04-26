'use strict';

var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var Schema = mongoose.Schema;

var NotificationSchema = new Schema({
  created_at: {type: Date, default: Date.now},
  userId: {type: Schema.ObjectId},
  sessionId: {type: String},
  message: {type: String},
  result: {
    success: {type: Boolean, default: false},
    errorReason: {type: String}
  }
});

module.exports = mongoose.model('notifications', NotificationSchema);
