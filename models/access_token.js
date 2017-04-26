var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AccessTokenSchema = new Schema({
    userId: {type: Schema.ObjectId},
    clientId: {type: String, "default": '', index: true},
    token: {type: String, "default": ''},
    created_at: {type: Date, "default": Date.now}
});

module.exports = mongoose.model('access_tokens', AccessTokenSchema);
