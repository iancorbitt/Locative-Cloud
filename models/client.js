var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ClientSchema = new Schema({
    userId: {type: Schema.ObjectId},
    name: {type: String, "default": ''},
    clientId: {type: String, "default": '', index: true},
    clientSecret: {type: String, "default": ''},
    redirectUri: {type: String, "default": 'urn:ietf:wg:oauth:2.0:oob'},
    created_at: {type: Date, "default": Date.now},
    webhook: {type: String, default: ''},
    webhookResult: {type: String, default: null}
});

module.exports = mongoose.model('clients', ClientSchema);
