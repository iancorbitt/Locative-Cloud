var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var FencelogSchema = new Schema({
    userId: {type: Schema.ObjectId},
    location: {type: [Number], index: '2dsphere'},
    locationId: {type: String, "default": ''},
    httpUrl: {type: String, "default":''},
    httpMethod: {type: String, "default":''},
    httpResponseCode : {type: Number},
    eventType: {type: String, "default":''},
    fenceType: {type: String, "default": 'geofence'},
    created_at: {type: Date, "default": Date.now},
    origin: {type: String, "default": "iOS App"}
});

module.exports = mongoose.model('fencelogs', FencelogSchema);
