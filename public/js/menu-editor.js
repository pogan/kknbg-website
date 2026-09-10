/* Edytor menu — dodawanie/usuwanie sekcji i pozycji + serializacja do payload JSON */
(function () {
  'use strict';
  var form = document.getElementById('menuForm');
  if (!form) return;

  var sectionsEl = document.getElementById('sections');
  var tplSection = document.getElementById('tplSection');
  var tplItem = document.getElementById('tplItem');
  var payloadEl = document.getElementById('menuPayload');

  function addItem(tbody) {
    tbody.appendChild(tplItem.content.cloneNode(true));
  }

  document.getElementById('addSection').addEventListener('click', function () {
    var frag = tplSection.content.cloneNode(true);
    sectionsEl.appendChild(frag);
    var last = sectionsEl.lastElementChild;
    addItem(last.querySelector('tbody'));
  });

  sectionsEl.addEventListener('click', function (e) {
    if (e.target.classList.contains('sec-remove')) {
      e.target.closest('.menu-edit-section').remove();
    } else if (e.target.classList.contains('item-add')) {
      addItem(e.target.closest('.menu-edit-section').querySelector('tbody'));
    } else if (e.target.classList.contains('item-remove')) {
      e.target.closest('tr').remove();
    }
  });

  function parsePrice(v) {
    if (!v) return null;
    var n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
    return isNaN(n) ? null : Math.round(n * 100);
  }

  function serialize() {
    var sections = [];
    sectionsEl.querySelectorAll('.menu-edit-section').forEach(function (sec) {
      var items = [];
      sec.querySelectorAll('tr.item-row').forEach(function (row) {
        var name = (row.querySelector('.i-name').value || '').trim();
        if (!name) return;
        var tags = Array.from(row.querySelectorAll('.i-tags input:checked')).map(function (o) { return o.value; });
        items.push({
          name: name,
          weight: (row.querySelector('.i-weight').value || '').trim(),
          price_grosze: parsePrice(row.querySelector('.i-price').value),
          description: (row.querySelector('.i-desc').value || '').trim(),
          tags: tags,
        });
      });
      sections.push({
        name: (sec.querySelector('.sec-name').value || 'Sekcja').trim(),
        note: (sec.querySelector('.sec-note').value || '').trim(),
        items: items,
      });
    });
    return { sections: sections };
  }

  form.addEventListener('submit', function () {
    payloadEl.value = JSON.stringify(serialize());
  });
})();
