var crypto = require('crypto');

exports.index = function (req, res) {
  res.render('signup', {title: req.gf.titleString});
};

exports.create = function (req, res) {
  req.gf.User.findOne({$or: [{username: req.body.username}, {email: req.body.email}]}, function (err, user) {
    if (err) {
      req.gf.analytics.track('signup', 'failure');
      return res.render('signup', {title: req.gf.titleString, result: 'server_error'});
    }
    if (user) {
      req.gf.analytics.track('signup', 'failure.user_existing', user._id);
      console.log('FAILURE -> User already existing!');
      return res.render('signup', {title: req.gf.titleString, result: 'user_existing'});
    }

    console.log('SUCCESS -> No User found');
    var new_user = new req.gf.User({
      username: req.body.username,
      email: req.body.email,
      password: crypto.createHash('sha1').update(req.body.password).digest('hex')
    });

    new_user.save(function (err) {
      if (err) {
        req.gf.analytics.track('signup', 'failure.save_user', new_user._id);
        return res.render('signup', {title: req.gf.titleString, result: 'save_error'});
      }
      req.gf.analytics.track('signup', 'success', new_user._id);
      res.render('signup', {title: req.gf.titleString, result: 'success'});
    });

  });
};
