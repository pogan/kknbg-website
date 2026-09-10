/* Panel administracyjny — skrypty (prototyp) */
(function () {
  'use strict';

  // Potwierdzenia dla akcji destrukcyjnych
  document.querySelectorAll('form[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.confirm(form.getAttribute('data-confirm'))) e.preventDefault();
    });
  });

  // Dynamiczne wiersze (menu, review PDF)
  document.querySelectorAll('[data-add-row]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tplId = btn.getAttribute('data-add-row');
      var tpl = document.getElementById(tplId);
      var target = document.querySelector(btn.getAttribute('data-target'));
      if (tpl && target) {
        var clone = tpl.content.cloneNode(true);
        target.appendChild(clone);
      }
    });
  });

  document.addEventListener('click', function (e) {
    var rm = e.target.closest('[data-remove-row]');
    if (rm) {
      var row = rm.closest(rm.getAttribute('data-remove-row') || 'tr');
      if (row) row.remove();
    }
  });

  // Auto-slug z nazwy
  document.querySelectorAll('[data-slug-source]').forEach(function (src) {
    var target = document.querySelector(src.getAttribute('data-slug-target'));
    if (!target) return;
    src.addEventListener('blur', function () {
      if (target.value) return;
      target.value = src.value
        .toLowerCase()
        .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
        .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź|ż/g, 'z')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    });
  });
})();
