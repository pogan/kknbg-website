/* Leaflet + OpenStreetMap — bez klucza API */
(function () {
  'use strict';
  var el = document.getElementById('map');
  if (!el || typeof L === 'undefined') return;

  var lat = parseFloat(el.getAttribute('data-lat')) || 54.38228;
  var lng = parseFloat(el.getAttribute('data-lng')) || 18.6013;
  var label = el.getAttribute('data-label') || 'Nowy Browar Gdański';

  var map = L.map(el, { scrollWheelZoom: false }).setView([lat, lng], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);

  L.marker([lat, lng]).addTo(map)
    .bindPopup('<strong>' + label + '</strong><br>ul. Jana Kilińskiego 7E, Gdańsk')
    .openPopup();

  el.addEventListener('click', function () { map.scrollWheelZoom.enable(); });
})();
