/* Przegląd/korekta importu menu z PDF */
(function () {
  'use strict';
  var form = document.getElementById('reviewForm');
  if (!form) return;

  var sectionsEl = document.getElementById('sections');
  var tplSection = document.getElementById('tplSection');
  var tplItem = document.getElementById('tplItem');

  function refreshMoveOptions() {
    var names = Array.from(sectionsEl.querySelectorAll('.sec-name')).map(function (i) { return i.value.trim() || 'Sekcja'; });
    sectionsEl.querySelectorAll('select.i-move').forEach(function (sel) {
      var cur = sel.value;
      sel.innerHTML = '<option value="">— przenieś —</option>' + names.map(function (n, idx) {
        return '<option value="' + idx + '">' + escapeHtml(n) + '</option>';
      }).join('');
      sel.value = cur;
    });
  }
  function escapeHtml(s) { return s.replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  document.getElementById('addSection').addEventListener('click', function () {
    sectionsEl.appendChild(tplSection.content.cloneNode(true));
    sectionsEl.lastElementChild.querySelector('tbody').appendChild(tplItem.content.cloneNode(true));
    refreshMoveOptions();
  });

  sectionsEl.addEventListener('click', function (e) {
    if (e.target.classList.contains('sec-remove')) { e.target.closest('.menu-edit-section').remove(); refreshMoveOptions(); }
    else if (e.target.classList.contains('item-add')) { e.target.closest('.menu-edit-section').querySelector('tbody').appendChild(tplItem.content.cloneNode(true)); refreshMoveOptions(); }
    else if (e.target.classList.contains('item-remove')) { e.target.closest('tr').remove(); }
  });

  sectionsEl.addEventListener('input', function (e) {
    if (e.target.classList.contains('sec-name')) refreshMoveOptions();
  });

  sectionsEl.addEventListener('change', function (e) {
    if (e.target.classList.contains('i-move') && e.target.value !== '') {
      var targetIdx = parseInt(e.target.value, 10);
      var target = sectionsEl.querySelectorAll('.menu-edit-section')[targetIdx];
      if (target) {
        e.target.value = '';
        target.querySelector('tbody').appendChild(e.target.closest('tr'));
      }
    }
  });

  function parsePrice(v) {
    if (!v) return { price_grosze: null, price_note: '' };
    if (/[a-ząćęłńóśźż]/i.test(v) && v.indexOf('/') > -1) return { price_grosze: null, price_note: v.trim() };
    var n = parseFloat(String(v).replace(/[^\d.,]/g, '').replace(',', '.'));
    return isNaN(n) ? { price_grosze: null, price_note: v.trim() } : { price_grosze: Math.round(n * 100), price_note: '' };
  }

  function serialize() {
    var sections = [];
    sectionsEl.querySelectorAll('.menu-edit-section').forEach(function (sec) {
      var items = [];
      sec.querySelectorAll('tr.item-row').forEach(function (row) {
        var name = (row.querySelector('.i-name').value || '').trim();
        if (!name) return;
        var price = parsePrice(row.querySelector('.i-price').value);
        items.push({
          name: name,
          weight: (row.querySelector('.i-weight').value || '').trim(),
          price_grosze: price.price_grosze,
          price_note: price.price_note,
          description: (row.querySelector('.i-desc').value || '').trim(),
          tags: Array.from(row.querySelectorAll('.i-tags input:checked')).map(function (c) { return c.value; }),
          confidence: row.getAttribute('data-confidence') || 'mid',
        });
      });
      sections.push({ name: (sec.querySelector('.sec-name').value || 'Sekcja').trim(), note: (sec.querySelector('.sec-note').value || '').trim(), items: items });
    });
    return { sections: sections };
  }

  function sync() {
    var json = JSON.stringify(serialize());
    document.getElementById('reviewPayload').value = json;
    var ap = document.getElementById('applyPayload');
    if (ap) ap.value = json;
  }
  form.addEventListener('submit', sync);
  var applyForm = document.getElementById('applyForm');
  if (applyForm) applyForm.addEventListener('submit', sync);

  refreshMoveOptions();
})();
