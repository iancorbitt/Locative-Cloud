var sendgrid = new (require('../lib/sendgrid'))();
var crypto = require('crypto');

exports.index = function(req, res) {
    res.render('lostpassword', {title: req.gf.titleString});
}

exports.request = function(req, res) {
    console.log('Looking for: ' + req.body.username);
    req.gf.User.findOneAsync({$or: [{username: req.body.username}, {email: req.body.username}]})
    .then((user) => {
      if(!user) {
        return renderSuccess(req, res);
      }
      var password_token = crypto.createHash('sha1').update(user.username + Date.now).digest('hex');
      var new_password_request = new req.gf.PasswordRequest({
          userId: user._id,
          token: password_token
      });
      new_password_request.save(function(err) {
          if (err) {
            return res.render('lostpassword', {title: req.gf.titleString, message:'There was an error sending the Mail', color:'red'});
          }
          const newPasswordLink = req.root + "/newpassword/" + password_token;
          console.log('New password link:', newPasswordLink);
          sendgrid.send({
              from: req.gf.config.mail_from,
              to: user.email,
              subject: "Lost Locative Passwort",
              text: "Dear Locative user,\nplease use the following Link to retrieve your new password: " + newPasswordLink
          });
          renderSuccess(req, res);
      });
    })
    .error((err) => {
      res.render('lostpassword', {title: req.gf.titleString, message:'Server error', color:'red'});
    })
}

function renderSuccess(req, res) {
    res.render('lostpassword', {title: req.gf.titleString, message:'Please check your Inbox for new credentials', color:'green'});
}
