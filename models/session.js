var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');
var crypto = require('crypto');

var SessionSchema = new Schema({
    userId: {type: Schema.ObjectId},
    sessionId: {type: String, default: ''},
    origin: {type: String, default: 'Unknown'},
    created_at: {type: Date, default: Date.now},
    modified_at: {type: Date, default: Date.now},
    apns: { type: Object, default: {
        token: null,
        sandbox: false
      }
    },
    fcm: { type: Object, default: {
        token: null,
        sandbox: false
      }
    }
});

module.exports = mongoose.model('sessions', SessionSchema);
