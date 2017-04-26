var sendgrid = new (require('../lib/sendgrid'))();

exports.index = function (req, res) {
  res.render('support', {
    title: req.gf.titleString,
    supportUrl: 'https://twitter.com/locativehq'
  });
}

exports.sendRequest = function (req, res) {
  sendgrid.send({
    from: req.body.email,
    to: req.gf.config.mail_from,
    subject: "Locative Support",
    text: "User: " + req.body.username + "\n" + "E-Mail: " + req.body.email + "\nMessage:\n\n" + req.body.message
  });
  res.render('support', {title: req.gf.titleString, result: 'success'});
}
