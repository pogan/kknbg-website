/* Sklep — dodawanie do koszyka bez przeładowania */
(function () {
  'use strict';
  document.querySelectorAll('form[data-ajax-cart]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = '…'; }
      fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: new FormData(form),
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (btn) { btn.textContent = '✓ Dodano'; }
          var badge = document.querySelector('[data-cart-count]');
          if (badge && d.count != null) { badge.textContent = d.count; badge.hidden = false; }
          if (window.dataLayer) window.dataLayer.push({ event: 'add_to_cart' });
          setTimeout(function () { if (btn) { btn.disabled = false; btn.textContent = label; } }, 1400);
        })
        .catch(function () { if (btn) { btn.disabled = false; btn.textContent = label; } });
    });
  });
})();
