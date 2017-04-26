var index = function (req, res) {
  res.render('account/mqtt', {title: 'Locative'});
}

exports.index = index;
