var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PasswordRequestSchema = new Schema({
    userId: {type: Schema.ObjectId},
    username: {type: String, "default": ''},
    token: {type: String, "default": ''},
    created_at: {type: Date, "default": Date.now}
});

module.exports = mongoose.model('password_requests', PasswordRequestSchema);
