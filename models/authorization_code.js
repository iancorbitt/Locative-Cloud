var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AuthorizationCodeSchema = new Schema({
    userId: {type: Schema.ObjectId},
    clientId: {type: String, "default": ''},
    redirectUri: {type: String, "default": ''},
    code: {type: String, "default": ''},
    created_at: {type: Date, "default": Date.now}
});

module.exports = mongoose.model('authorization_codes', AuthorizationCodeSchema);
