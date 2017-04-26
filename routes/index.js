var welcome = null;

exports.index = function(req, res){
    welcome = (typeof req.query.welcome === 'string');
    if (!req.session.passport.user) {
        // return res.render('index_logged_out', {title: req.gf.titleString, welcome: welcome});
        return res.redirect([
          req.protocol, '://', req.gf.config.hostname, '/login'
        ].join(''));
    }
    loadFencelogs(req, res);
};

function loadFencelogs (req, res) {
    req.gf.Fencelog.find({userId: req.session.passport.user._id}, {_id: 1, location: 1}).sort('-created_at').limit(25).exec(function(err, fencelogs) {
        var markerCoords = new Array();
        for (var i = 0; i < fencelogs.length; i++) {
            markerCoords.push('['+fencelogs[i].location[0]+', '+fencelogs[i].location[1]+', \''+fencelogs[i]._id+'\']');
        }
        res.render('index', {title: req.gf.titleString , fencelogs: markerCoords, welcome: welcome});
    });
}
