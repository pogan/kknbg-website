'use strict';

const env = require('./env');

/**
 * Statyczne dane firmy i nawigacji. Część z nich (godziny, social, NAP)
 * może być nadpisana przez tabelę `settings` w panelu admina — patrz
 * services/settings.service.js -> getSiteSettings().
 */
const site = {
  name: env.BUSINESS_NAME,
  tagline: {
    pl: 'Restauracja i browar rzemieślniczy w sercu Wrzeszcza',
    en: 'Craft brewery & restaurant in the heart of Wrzeszcz',
  },
  hashtag: '#ChodźnaBrowar',
  baseUrl: env.BASE_URL,
  locales: ['pl', 'en'],
  defaultLocale: 'pl',

  address: {
    street: env.BUSINESS_STREET,
    postal: env.BUSINESS_POSTAL,
    city: env.BUSINESS_CITY,
    region: 'pomorskie',
    country: 'PL',
    district: 'Wrzeszcz',
    lat: env.BUSINESS_LAT,
    lng: env.BUSINESS_LNG,
    mapsUrl: 'https://maps.google.com/?q=Nowy+Browar+Gdański,+Jana+Kilińskiego+7E,+Gdańsk',
  },

  contact: {
    phone: env.BUSINESS_PHONE,
    phoneEvents: '+48 881 230 302',
    phoneB2B: '+48 539 630 743',
    email: 'kontakt@nowybrowargdanski.pl',
    emailB2B: 'handel@nowybrowargdanski.pl',
  },

  social: {
    instagram: 'https://www.instagram.com/nowybrowargdanski/',
    facebook: 'https://www.facebook.com/NowyBrowarGdanski',
    tiktok: 'https://www.tiktok.com/@nowybrowargdanski',
    instagramHandle: '@nowybrowargdanski',
  },

  // Godziny otwarcia (domyślne — edytowalne w panelu). 24h format, dni 0=Nd..6=Sob wg ISO? tu: mon..sun
  openingHours: {
    mon: [['09:00', '23:00']],
    tue: [['09:00', '23:00']],
    wed: [['09:00', '23:00']],
    thu: [['09:00', '23:00']],
    fri: [['09:00', '01:00']],
    sat: [['10:00', '01:00']],
    sun: [['10:00', '22:00']],
  },
  serviceNotes: {
    pl: 'Menu śniadaniowe codziennie 9:00–12:00 · Pizza: pn–czw od 17:00, pt–nd od 12:00',
    en: 'Breakfast menu daily 9:00–12:00 · Pizza: Mon–Thu from 17:00, Fri–Sun from 12:00',
  },

  venue: {
    areaM2: 1200,
    seats: 450,
    screens: 35,
    breweryYear: 1873,
    historicName: 'Danziger Aktien-Bierbrauerei',
    productionPeakHl: 175000,
  },

  // Nawigacja główna — klucze i18n w locales/*.json (nav.*)
  nav: [
    { key: 'nav.about', path: '/o-browarze' },
    { key: 'nav.menu', path: '/menu' },
    { key: 'nav.beers', path: '/piwa' },
    { key: 'nav.promotions', path: '/promocje' },
    { key: 'nav.groups', path: '/oferta-dla-grup' },
    { key: 'nav.sport', path: '/sport' },
    { key: 'nav.shop', path: '/sklep' },
    { key: 'nav.b2b', path: '/wspolpraca-b2b' },
    { key: 'nav.contact', path: '/kontakt' },
  ],

  footerNav: [
    { key: 'nav.about', path: '/o-browarze' },
    { key: 'nav.menu', path: '/menu' },
    { key: 'nav.groups', path: '/oferta-dla-grup' },
    { key: 'nav.location', path: '/lokalizacja' },
    { key: 'nav.contact', path: '/kontakt' },
    { key: 'footer.privacy', path: '/polityka-prywatnosci' },
    { key: 'footer.terms', path: '/regulamin' },
    { key: 'footer.shopTerms', path: '/regulamin-sklepu' },
  ],

  // Piwa warzone w NBG (z karty menu). Rozszerzane w seed.
  beers: [
    { slug: 'bursztynowy-lager-gdanski', name: 'Bursztynowy Lager Gdański', style: 'Lager', abv: 5.0, plato: 12.5,
      untappd: 'https://untappd.com/', descPl: 'Jasny lager ukłon w stronę tradycyjnego piwowarstwa. Zbożowe nuty z delikatnie kwiatową nutą chmielu. Idealnie orzeźwia.' },
    { slug: 'katamaran-cold-ipa', name: 'Katamaran Cold IPA', style: 'Cold IPA', abv: 4.8, plato: 12.0,
      untappd: 'https://untappd.com/', descPl: 'Wytrawne, gorzkie IPA chmielone na zimno nowozelandzką odmianą Rhapsody. Intensywnie owocowe w aromacie.' },
    { slug: 'artus-pils-gdanski', name: 'Artus Pils Gdański', style: 'Pilsner', abv: 4.5, plato: 11.5,
      untappd: 'https://untappd.com/', descPl: 'Rasowe chmielowe piwo dolnej fermentacji. Rześkie, słodowe nuty i ziołowe akcenty chmieli z plantacji PolishHops.' },
    { slug: 'lager-light-bezglutenowy', name: 'Lager Light (bezglutenowy)', style: 'Light Lager / Gluten-free', abv: 3.5, plato: 9.0,
      untappd: 'https://untappd.com/', descPl: 'Jasne, delikatne piwo o obniżonej kaloryczności. Nuty chlebowo-zbożowe, delikatna goryczka chmielowa.' },
    { slug: 'hazy-ipa', name: 'Hazy IPA', style: 'New England IPA', abv: 6.0, plato: 15.0,
      untappd: 'https://untappd.com/', descPl: 'Najpopularniejszy styl piwnej rewolucji. Galaxy, Sabro, Mosaic, Riwaka, Superdelic — złożony owocowy aromat i porywa goryczką.' },
    { slug: 'lato-sour-ale', name: 'Lato Sour Ale', style: 'Sour Ale', abv: 5.8, plato: 13.5,
      untappd: 'https://untappd.com/', descPl: 'Kwaśne piwo z przecierem z wiśni i czarnej porzeczki. Rześkie, wysoce pijalne, o różowej barwie.' },
    { slug: 'lager-free-bezalkoholowe', name: 'Lager Free (bezalkoholowe)', style: 'Non-alcoholic Lager', abv: 0.4, plato: 0,
      untappd: 'https://untappd.com/', descPl: 'Bezalkoholowa wersja najpopularniejszego stylu piwa — jasnego lagera. Zbożowo słodowe nuty, aromat polskich odmian chmielu.' },
  ],
};

module.exports = site;
