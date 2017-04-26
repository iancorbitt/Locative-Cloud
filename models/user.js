var mongoose = require('mongoose');
var crypto = require('crypto');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    username: {type: String, "default": '', index: {unique: true}},
    password: {type: String, "default": ''},
    email: {type: String, "default": ''},
    locked: {type: Boolean, "default": false},
    facebookId: {type: String, "default": null},
    twitterId: {type: String, "default": null},
    googleId: {type: String, "default": null},
    created_at: {type: Date, "default": Date.now},
    loggedin_at: {type: Date},
    permissions: {type: Array, "default": []},
    tfa: {type: Object, "default": {
        enabled: false,
        method: 'authenticator',
        secret: null
    }},
    mobileNo: {type: String, "default": null}
});

UserSchema.methods.validPassword = function(pwd, userPassword) {
    var hash = crypto.createHash('sha1').update(pwd).digest('hex');
    return (hash === userPassword);
};

module.exports = mongoose.model('users', UserSchema);
