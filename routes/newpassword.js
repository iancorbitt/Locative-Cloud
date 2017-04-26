var generatePassword = require('password-generator');
var crypto = require('crypto');
var sendgrid = new (require('../lib/sendgrid'))();

exports.index = function (req, res) {
    var token = req.params.token;
    req.gf.PasswordRequest.findOneAsync({token: token})
    .then((passwordRequest) => {
      if (!passwordRequest) {
        return res.render('newpassword', {
          title: req.gf.titleString,
          message: 'This link has already been used or is invalid.',
          color: 'red',
          token: token,
          hideForm: true
        });
      }
      if (req.method === 'get') {
        return res.render('newpassword', {
          title: req.gf.titleString,
          token: token
        });
      }
      if (typeof req.body.password === 'undefined' ||
      typeof req.body.password2 === 'undefined') {
        return res.render('newpassword', {
          title: req.gf.titleString,
          token: token
        });
      }
      if (req.body.password !== req.body.password2) {
        return res.render('newpassword', {
          title: req.gf.titleString,
          message: 'The passwords didn\'t match',
          color: 'red',
          token: token
        });
      }
      console.log('passwordRequest', passwordRequest);
      req.gf.User.findOneAsync({_id: passwordRequest.userId})
      .then((user) => {
        if (!user) {
          return res.render('newpassword', {
            title: req.gf.titleString,
            message: 'An error occured (#2)',
            color: 'red',
            token: token,
            hideForm: true
          });
        }
        user.password = crypto.createHash('sha1').update(req.body.password).digest('hex');
        user.save(function(err) {
          req.gf.PasswordRequest.removeAsync({token: token})
          .then(() => {
            res.render('newpassword', {
              title: req.gf.titleString,
              message: 'Your password has been reset. You may now login using your new password.',
              color: 'green',
              token: token,
              hideForm: true
            });
          });
        });
      })
      .error((err) => {
        res.render('newpassword', {
          title: req.gf.titleString,
          message: 'An error occured (#3)',
          color: 'red',
          token: token
        });
      });
  })
  .error((err) => {
    res.render('newpassword', {
      title: req.gf.titleString,
      message: 'An error occured (#4)',
      color: 'red'
    });
  });
}
