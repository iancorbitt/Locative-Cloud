'use strict';

module.exports = function (app, tfa, passport, login) {
  // private api
  app.post('/api/username', require('../../routes/api').username);
  app.get('/api/fencelogs/:sessionId', require('../../routes/api').fencelogs);
  app.post('/api/fencelogs/:sessionId', require('../../routes/api').fencelogsAdd);
  app.post('/api/signup', require('../../routes/api').signup);
  app.get('/api/session', require('../../routes/api').session);
  app.get('/api/session/:sessionId', require('../../routes/api').sessionCheck);
  app.put('/api/session/:sessionId', require('../../routes/api').sessionPut);
  app.get('/api/schedule', login.ensureLoggedIn('/login'), require('../../routes/api/schedule').schedule);
  app.get('/api/geofences', require('../../routes/api/geofences').get);
  app.get('/api/geofences/sync', require('../../routes/api/geofences').sync);
  app.post('/api/geofences/:sessionId', require('../../routes/api/geofences').add);
  app.put('/api/geofences/:sessionId/:geofenceId', require('../../routes/api/geofences').update);
  app.get('/api/today', require('../../routes/api').today);
  app.get('/api/notifications', require('../../routes/api/notifications').get);
  app.post('/api/notifications', require('../../routes/api/notifications').post);
  app.get('/api/account', require('../../routes/api').account);
};
