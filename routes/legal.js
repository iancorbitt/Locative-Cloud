exports.index = function(req, res) {
    res.render('legal', {title: req.gf.titleString});
}
