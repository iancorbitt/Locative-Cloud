exports.index = function (req, res) {
  res.render('account/schedule', {title: req.gf.titleString});
}
