// peakform.ae/delete-account: sign in with email + password, then the delete-account server
// function (the same one the app uses) checks the password again and deletes the account.
(function () {
  var cfg = window.PEAKFORM || {};
  var $ = function (id) { return document.getElementById(id); };
  var form = $('del'), email = $('email'), password = $('password'), sure = $('sure'), go = $('go'), msg = $('msg');
  var ERRORS = {
    invalid: 'That email and password don’t match a Peak Form account.',
    not_confirmed: 'This email is not confirmed yet. Open the Peak Form app to confirm it, or email support@peakform.ae.',
    wrong_password: 'That email and password don’t match a Peak Form account.',
    too_many_tries: 'Too many tries. Wait a few minutes and try again.',
    coach_account: 'Coach accounts are closed through support: email support@peakform.ae.',
    network: 'No connection. Check your internet and try again.',
    server: 'Something went wrong. Try again later, or email support@peakform.ae.',
  };
  var ready = function () { go.disabled = !(email.value.trim() && password.value && sure.checked); };
  [email, password, sure].forEach(function (el) { el.addEventListener('input', ready); el.addEventListener('change', ready); });
  var show = function (key) { msg.textContent = ERRORS[key] || ERRORS.server; msg.hidden = false; };

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (go.disabled) return;
    msg.hidden = true;
    go.disabled = true;
    go.textContent = 'Deleting…';
    var headers = { apikey: cfg.publishableKey, 'Content-Type': 'application/json' };
    try {
      var r = await fetch(cfg.supabaseUrl + '/auth/v1/token?grant_type=password', {
        method: 'POST', headers: headers,
        body: JSON.stringify({ email: email.value.trim().toLowerCase(), password: password.value }),
      });
      var s = await r.json().catch(function () { return {}; });
      if (!r.ok || !s.access_token) {
        var code = s.error_code || s.code || '';
        show(code === 'email_not_confirmed' ? 'not_confirmed' : r.status === 429 ? 'too_many_tries' : 'invalid');
        return;
      }
      var d = await fetch(cfg.supabaseUrl + '/functions/v1/delete-account', {
        method: 'POST',
        headers: Object.assign({}, headers, { Authorization: 'Bearer ' + s.access_token }),
        body: JSON.stringify({ password: password.value }),
      });
      var body = await d.json().catch(function () { return {}; });
      if (d.ok && body.deleted) {
        form.hidden = true;
        $('done').hidden = false;
        password.value = '';
        return;
      }
      show(body.error || 'server');
    } catch (err) {
      show('network');
    } finally {
      go.textContent = 'Delete my account';
      ready();
    }
  });
})();
