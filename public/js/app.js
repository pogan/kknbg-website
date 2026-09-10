/* Nowy Browar Gdański — skrypt frontu (prototyp) */
(function () {
  'use strict';

  // --- Header: stan po przewinięciu ------------------------------------
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // --- Aktywny link w nawigacji ---------------------------------------
  var path = window.location.pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  document.querySelectorAll('.primary-nav a').forEach(function (a) {
    var href = a.getAttribute('href').replace(/^\/en(?=\/|$)/, '') || '/';
    if (href !== '/' && path.indexOf(href) === 0) a.setAttribute('aria-current', 'page');
  });

  // --- Formularze AJAX ----------------------------------------------
  document.querySelectorAll('form[data-ajax-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = form.querySelector('.form-message');
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: new FormData(form),
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (msg) {
            msg.textContent = res.d.text || '';
            msg.style.color = res.ok ? 'var(--success)' : 'var(--danger)';
          }
          if (res.ok) {
            form.reset();
            if (window.dataLayer) window.dataLayer.push({ event: 'form_submit', form_type: form.action.split('/').pop() });
          }
        })
        .catch(function () { if (msg) { msg.textContent = 'Błąd połączenia.'; msg.style.color = 'var(--danger)'; } })
        .finally(function () { if (btn) btn.disabled = false; });
    });
  });

  // --- Cookie bar --------------------------------------------------
  var bar = document.getElementById('cookieBar');
  if (bar) {
    var stored = null;
    try { stored = JSON.parse(bar.getAttribute('data-consent')); } catch (e) {}
    if (!stored) bar.hidden = false;

    var save = function (consent) {
      document.cookie =
        'nbg_consent=' + encodeURIComponent(JSON.stringify(consent)) +
        ';path=/;max-age=' + (60 * 60 * 24 * 180) + ';samesite=lax';
      bar.hidden = true;
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: consent.analytics ? 'granted' : 'denied',
          ad_storage: consent.marketing ? 'granted' : 'denied',
          ad_user_data: consent.marketing ? 'granted' : 'denied',
          ad_personalization: consent.marketing ? 'granted' : 'denied',
        });
      }
      // przeładuj, by dociągnąć skrypty analityki po zgodzie
      if (consent.analytics || consent.marketing) setTimeout(function () { location.reload(); }, 150);
    };

    bar.querySelector('[data-cookie-accept]').addEventListener('click', function () {
      save({ necessary: true, analytics: true, marketing: true });
    });
    bar.querySelector('[data-cookie-reject]').addEventListener('click', function () {
      save({ necessary: true, analytics: false, marketing: false });
    });
    var prefs = bar.querySelector('.cookie-bar__prefs');
    bar.querySelector('[data-cookie-toggle-prefs]').addEventListener('click', function () {
      prefs.hidden = !prefs.hidden;
      bar.querySelector('[data-cookie-save]').hidden = prefs.hidden;
    });
    var saveBtn = bar.querySelector('[data-cookie-save]');
    if (saveBtn) saveBtn.addEventListener('click', function () {
      var consent = { necessary: true };
      prefs.querySelectorAll('[data-consent-key]').forEach(function (cb) {
        consent[cb.getAttribute('data-consent-key')] = cb.checked;
      });
      save(consent);
    });
  }
  document.querySelectorAll('[data-cookie-open]').forEach(function (b) {
    b.addEventListener('click', function () { if (bar) bar.hidden = false; });
  });

  // --- Menu: filtry wege/bezgluten --------------------------------
  var menuRoot = document.querySelector('[data-menu-filters]');
  if (menuRoot) {
    var applyFilters = function () {
      var active = Array.from(menuRoot.querySelectorAll('.menu-filter input:checked')).map(function (i) { return i.value; });
      document.querySelectorAll('.menu-item').forEach(function (item) {
        var tags = (item.getAttribute('data-tags') || '').split(',');
        var show = active.every(function (a) { return tags.indexOf(a) !== -1; });
        item.classList.toggle('is-hidden', !show);
      });
    };
    menuRoot.addEventListener('change', applyFilters);
  }

  // --- Admin: tryb edycji treści ---------------------------------
  var toggleEdit = document.querySelector('[data-admin-toggle-edit]');
  if (toggleEdit) {
    toggleEdit.addEventListener('click', function () {
      var on = document.body.classList.toggle('admin-edit-mode');
      toggleEdit.textContent = on ? 'Zakończ edycję' : 'Tryb edycji';
      if (on) enableInlineEditing();
    });
  }

  function enableInlineEditing() {
    document.querySelectorAll('.editable:not([data-wired])').forEach(function (el) {
      el.setAttribute('data-wired', '1');
      el.addEventListener('click', function (ev) {
        if (!document.body.classList.contains('admin-edit-mode')) return;
        ev.preventDefault();
        openInlineEditor(el);
      });
    });
  }

  function openInlineEditor(el) {
    var key = el.getAttribute('data-block-key');
    var loc = el.getAttribute('data-block-locale');
    var current = el.innerHTML.trim();
    var next = window.prompt('Edycja bloku „' + key + '" (' + loc + '). HTML dozwolony:', current);
    if (next == null || next === current) return;
    var toolbar = document.getElementById('adminToolbar');
    var endpoint = toolbar ? toolbar.getAttribute('data-edit-endpoint') : '/admin/tresc/inline';
    var csrf = (document.querySelector('input[name="_csrf"]') || {}).value || '';
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify({ key: key, locale: loc, bodyHtml: next }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.ok) { el.innerHTML = d.html || next; }
        else alert('Nie udało się zapisać: ' + (d.error || 'błąd'));
      })
      .catch(function () { alert('Błąd połączenia przy zapisie.'); });
  }

  if (document.body.classList.contains('admin-edit-mode')) enableInlineEditing();

  // --- Service worker (PWA) ------------------------------------------
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }
})();

