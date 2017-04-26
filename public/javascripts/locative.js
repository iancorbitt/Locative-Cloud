function Locative() {

}

Locative.prototype.showPersonalStats = function () {
  var gfs = $('#gfs');
  if (gfs.hasClass('hidden')) {
    gfs.removeClass('hidden');
  }
}

$(document).ready(function () {
  Locative = new Locative();
});
