'use strict';

exports.index = (req, res) => {
  res.render('notification', {
    sessionId: req.query.sessionId || ""
  });
};
