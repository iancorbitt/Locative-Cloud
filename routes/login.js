exports.index = function (req, res) {
  res.render('login', {title: req.gf.titleString, message: req.flash('error')});
};
