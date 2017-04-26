var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SubscriptionSchema = new Schema({
    userId: {type: Schema.ObjectId},
    service: {type: String, "default": ''},
    uri: {type: String, "default": ''},
    event: {type: String, "default": ''}

});

module.exports = mongoose.model('subscriptions', SubscriptionSchema);
