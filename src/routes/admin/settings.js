'use strict';

const express = require('express');
const settingsService = require('../../services/settings.service');
const { csrfProtection } = require('../../middleware/security');
const site = require('../../config/site');

const router = express.Router();

router.get('/', (req, res) => {
  const s = settingsService.getSiteSettings();
  res.render('admin/settings', {
    layout: 'layouts/admin', title: 'Ustawienia', s, days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    dayLabels: { mon: 'Poniedziałek', tue: 'Wtorek', wed: 'Środa', thu: 'Czwartek', fri: 'Piątek', sat: 'Sobota', sun: 'Niedziela' },
  });
});

router.post('/', csrfProtection, (req, res) => {
  const b = req.body;

  settingsService.set('business_name', b.business_name || site.name);
  settingsService.set('contact', {
    ...site.contact,
    phone: b.phone, email: b.email, phoneEvents: b.phone_events, phoneB2B: b.phone_b2b, emailB2B: b.email_b2b,
  });
  settingsService.set('address', {
    ...site.address,
    street: b.street, postal: b.postal, city: b.city,
    lat: parseFloat(b.lat) || site.address.lat, lng: parseFloat(b.lng) || site.address.lng,
    mapsUrl: b.maps_url || site.address.mapsUrl,
  });
  settingsService.set('social', {
    ...site.social,
    instagram: b.instagram, facebook: b.facebook, tiktok: b.tiktok,
    instagramHandle: b.instagram_handle || site.social.instagramHandle,
  });

  // godziny otwarcia
  const hours = {};
  for (const d of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']) {
    const open = b[`${d}_open`];
    const close = b[`${d}_close`];
    hours[d] = open && close ? [[open, close]] : [];
  }
  settingsService.set('opening_hours', hours);
  settingsService.set('service_notes', {
    pl: b.service_notes_pl || site.serviceNotes.pl,
    en: b.service_notes_en || site.serviceNotes.en,
  });

  settingsService.set('analytics', {
    ga4: (b.ga4 || '').trim(), gtm: (b.gtm || '').trim(),
    metaPixel: (b.meta_pixel || '').trim(), tiktokPixel: (b.tiktok_pixel || '').trim(),
    clarity: (b.clarity || '').trim(),
  });
  settingsService.set('features', {
    shop: b.f_shop === 'on', reservations: b.f_reservations === 'on',
    newsletter: b.f_newsletter === 'on', instagram: b.f_instagram === 'on',
  });
  settingsService.set('reservation_widget_url', (b.reservation_widget_url || '').trim());
  settingsService.set('delivery_links', {
    wolt: (b.wolt || '').trim(), pyszne: (b.pyszne || '').trim(), ubereats: (b.ubereats || '').trim(),
  });

  settingsService.clearCache();
  req.session.flash = { type: 'success', text: 'Zapisano ustawienia.' };
  res.redirect('/admin/ustawienia');
});

module.exports = router;
