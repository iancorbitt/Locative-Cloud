'use strict';

const Promise = require('bluebird');
const socketio = require('socket.io')
const crypto = require('crypto');
const User = Promise.promisifyAll(require('../models/user'));
const Session = Promise.promisifyAll(require('../models/session'));
const Fencelog = Promise.promisifyAll(require('../models/fencelog'));

module.exports.listen = function(app, socketClients){
  const io = socketio.listen(app)
  const origin = 'Socket.io';

  io.sockets.on('connection', function(socket){
    socket.on('session', function (credentials) {
      if (typeof credentials.username !== 'string' || typeof credentials.password !== 'string') {
        return socket.emit('error', {error: 'invalid credentials'});
      }
      User.findOneAsync({$and: [{username: credentials.username}, {password: crypto.createHash('sha1').update(credentials.password).digest('hex')}]})
      .then(function (user) {
        console.log('[Socket.io] Authentication from ' + socket.handshake.address + ':', user ? 'Succeeded' : 'Failed');
        if (!user) {
          console.log('[Socket.io] Invalid credentials');
          return socket.emit('session', {error: 'invalid credentials'});
        }
        Session.removeAsync({$and: [{userId: user._id}, {origin: origin}]})
        .then((removed) => {
          var msec = new Date().getTime().toString();
          var sessid = crypto.createHash('sha1').update(user.username + '%' + msec).digest('hex');
          var new_session = Promise.promisifyAll(
            new Session({
              userId: user._id,
              sessionId: sessid,
              origin: origin
            })
          );
          new_session.saveAsync()
          .then((session) => {
            console.log('[Socket.io] Issues new session to user "', user.username, '"');
            socketClients[credentials.username] = socket;
            socket.emit('session', {session_id: sessid});
          })
          .error((err) => {
            if (err) {
              console.log('[Socket.io] Error', err);
              return socket.emit('session', {error: 'failed when generating session_id'});
            }
          });
        })
        .error((err) => {
          if (err) {
            console.log('[Socket.io] Error', err);
            return socket.emit('session', {error: 'server error'});
          }
        });
      })
      .error(function (err) {
        if (err) {
          console.log('[Socket.io] Error', err);
          return socket.emit('session', {error: 'server error'});
        }
      });
    });

    socket.on('fencelogs', (credentials) => {
      Session.findOneAsync({sessionId: credentials.session_id})
      .then((session) => {
        if (!session) {
          return socket.emit('error', {error: 'invalid session'});
        }
        Promise.promisifyAll(
          Fencelog.find({userId: session.userId}, {userId: 0, _id: 0, __v: 0})
          .sort('-created_at').limit(100)
        ).execAsync()
        .then((fencelogs) => {
          socket.emit('fencelog', {event: 'list', fencelogs: fencelogs});
        });
      });
    });
  });

  return io
}
