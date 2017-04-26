'use strict';

const ua = require('universal-analytics');

var Analytics = module.exports = function Analytics () {
  const trackingId = process.env.GA_TRACKING_ID;
  if (typeof trackingId === 'undefined' || trackingId === null) {
    return;
  }

  this.trackingId = trackingId;
};

Analytics.prototype.track = function track (category, event, userId) {
  if (!this.trackingId) {
    return console.log('[Analytics] Google Analytics not set up, event not tracked:', event, 'userId:', userId);
  }
  var visitor;
  if (typeof userId !== 'string') {
    visitor = ua(this.trackingId);
  } else {
    visitor = ua(this.trackingId, userId);
  }
  visitor.event(category, event).send();
};
