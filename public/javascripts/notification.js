$(document).ready(function () {
  $('#message').on('change keyup paste', function() {
    var btn = $('#send-button');
    var text = $(this).val();
    if (text.length > 0) {
      return btn.removeClass('disabled');
    }
    if (!btn.hasClass('disabled')) {
      btn.addClass('disabled');
    }
  });
});

function send() {
  function setStatus(class, html) {
    var status = $('#notification-status');
    status.removeClass('alert-danger alert-info alert-success hidden');
    status.addClass(class);
    if (html) {
      status.html(html);
    }
  };
  setStatus('alert-info', 'Sending notification…');
  $('#send-button').addClass('disabled');
  $.ajax({
    url: '/api/notifications',
    contentType: 'application/json',
    type: 'POST',
    data: JSON.stringify({
      sessionId: $('#session-id').val(),
      message: $('#message').val()
    }),
    success: function (response) {
      if (response.success === true) {
        setStatus('alert-success', 'Notification sent successfully !');
        return setTimeout(function () {
          cancel();
        }, 500);
      }
      $('#send-button').removeClass('disabled');
      setStatus(
        'alert-danger',
        ['Error sending notification:', JSON.stringify(response.error.reason)].join(' ')
      );
    },
    error: function (jqXHR, textStatus, errorThrown) {
      $('#send-button').removeClass('disabled');
      if (jqXHR.status === 401) {
        return setStatus('alert-danger', 'Could not send message because of invalid recipient / Session ID.');
      }
      setStatus('alert-danger', ['An error has occured:', textStatus].join(' '));
    }
  });
};

function cancel() {
  parent.$.colorbox.close();
};
