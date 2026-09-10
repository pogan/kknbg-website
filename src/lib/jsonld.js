'use strict';

const site = require('../config/site');
const { toDecimalString } = require('./money');

const DAY_MAP = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

function abs(pathname) {
  if (!pathname) return site.baseUrl;
  if (/^https?:\/\//.test(pathname)) return pathname;
  return site.baseUrl.replace(/\/$/, '') + pathname;
}

function openingHoursSpec(hours = site.openingHours) {
  return Object.entries(hours).flatMap(([day, ranges]) =>
    ranges.map(([opens, closes]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAY_MAP[day],
      opens,
      closes,
    })),
  );
}

/** LocalBusiness / Restaurant / Brewery — wspólny węzeł organizacji. */
function organization(settings = {}) {
  const addr = settings.address || site.address;
  const contact = settings.contact || site.contact;
  const social = settings.social || site.social;
  return {
    '@context': 'https://schema.org',
    '@type': ['Restaurant', 'Brewery', 'BarOrPub'],
    '@id': abs('/#organization'),
    name: site.name,
    url: site.baseUrl,
    logo: abs('/img/logo-mark.png'),
    image: [abs('/img/og/default.jpg')],
    description:
      'Restauracja i browar rzemieślniczy w sercu gdańskiego Wrzeszcza, w murach dawnego Danziger Aktien-Bierbrauerei (1873).',
    servesCuisine: ['Polska', 'Europejska', 'Pub food', 'Pizza'],
    priceRange: '$$',
    telephone: contact.phone,
    email: contact.email,
    currenciesAccepted: 'PLN',
    paymentAccepted: 'Gotówka, Karta płatnicza, BLIK',
    address: {
      '@type': 'PostalAddress',
      streetAddress: addr.street,
      postalCode: addr.postal,
      addressLocality: addr.city,
      addressRegion: addr.region,
      addressCountry: addr.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: addr.lat, longitude: addr.lng },
    hasMap: addr.mapsUrl,
    openingHoursSpecification: openingHoursSpec(settings.openingHours),
    sameAs: [social.instagram, social.facebook, social.tiktok].filter(Boolean),
    acceptsReservations: 'True',
  };
}

function website(locale = 'pl') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': abs('/#website'),
    url: site.baseUrl,
    name: site.name,
    inLanguage: locale,
    publisher: { '@id': abs('/#organization') },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${site.baseUrl}/szukaj?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

function breadcrumb(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

/** Menu -> schema.org/Menu z sekcjami i pozycjami. */
function menu(menuRow, sections = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: menuRow.title,
    inLanguage: menuRow.locale,
    url: abs(`/menu/${menuRow.slug}`),
    hasMenuSection: sections.map((s) => ({
      '@type': 'MenuSection',
      name: s.name,
      hasMenuItem: (s.items || []).map((it) => ({
        '@type': 'MenuItem',
        name: it.name,
        description: it.description || undefined,
        ...(it.price_grosze != null
          ? { offers: { '@type': 'Offer', price: toDecimalString(it.price_grosze), priceCurrency: 'PLN' } }
          : {}),
        ...(Array.isArray(it.tags) && it.tags.includes('veg')
          ? { suitableForDiet: 'https://schema.org/VegetarianDiet' }
          : {}),
      })),
    })),
  };
}

function product(p, mediaUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description || p.subtitle || undefined,
    image: mediaUrl ? [abs(mediaUrl)] : undefined,
    brand: { '@type': 'Brand', name: site.name },
    category: p.category,
    offers: {
      '@type': 'Offer',
      url: abs(`/sklep/${p.slug}`),
      price: toDecimalString(p.price_grosze),
      priceCurrency: 'PLN',
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@id': abs('/#organization') },
    },
  };
}

function event(e) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.name,
    startDate: e.startDate,
    endDate: e.endDate || undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: site.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        postalCode: site.address.postal,
        addressCountry: 'PL',
      },
    },
    organizer: { '@id': abs('/#organization') },
    description: e.description || undefined,
  };
}

function faq(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: { '@type': 'Answer', text: q.a },
    })),
  };
}

module.exports = { abs, organization, website, breadcrumb, menu, product, event, faq, openingHoursSpec };
