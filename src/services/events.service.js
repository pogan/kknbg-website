'use strict';

/**
 * Wydarzenia i terminarz sportowy — w prototypie dane mockowane.
 * Docelowo: CRUD w panelu + integracja z GoingApp / kalendarzem transmisji.
 */
const { dayjs } = require('../lib/dates');

function future(daysAhead, hour = 18) {
  return dayjs().add(daysAhead, 'day').hour(hour).minute(0).second(0).toISOString();
}

const EVENTS = [
  {
    slug: 'degustacja-piw-rzemieslniczych',
    name: 'Degustacja piw rzemieślniczych z piwowarem',
    nameEn: 'Craft beer tasting with the brewer',
    startDate: future(5, 19),
    endDate: future(5, 22),
    priceFrom: 12900,
    description: 'Sześć piw z naszej piwnicy, opowieść o warzeniu i zejście do fermentowni. Miejsca ograniczone.',
    descriptionEn: 'Six beers from our cellar, the story of brewing and a walk down to the fermentation room. Limited seats.',
    image: '/img/covers/cover_cheers.jpg',
    tag: 'degustacja',
  },
  {
    slug: 'zwiedzanie-browaru',
    name: 'Zwiedzanie browaru — trasa historyczna',
    nameEn: 'Brewery tour — the historic route',
    startDate: future(12, 12),
    endDate: future(12, 14),
    priceFrom: 5900,
    description: 'Historia Danziger Aktien-Bierbrauerei, warzelnia i tanki. Na koniec piwo degustacyjne.',
    descriptionEn: 'The history of Danziger Aktien-Bierbrauerei, the brewhouse and the tanks. A tasting beer to finish.',
    image: '/img/covers/cover_restaurant.jpg',
    tag: 'zwiedzanie',
  },
  {
    slug: 'sobota-z-koszykowka',
    name: 'Wieczór z koszykówką na 35 ekranach',
    nameEn: 'Basketball night on 35 screens',
    startDate: future(3, 20),
    endDate: future(3, 23),
    priceFrom: 0,
    description: 'Deska kibica, promo na piwo w trakcie meczu i najlepsze miejsca przy ekranach — rezerwuj stolik.',
    descriptionEn: 'Fan platter, beer deals during the game and the best seats by the screens — book a table.',
    image: '/img/covers/cover_screens.jpg',
    tag: 'sport',
  },
];

const FIXTURES = [
  { league: 'Ekstraklasa', match: 'Lechia Gdańsk — Legia Warszawa', when: future(2, 17) },
  { league: 'Premier League', match: 'Arsenal — Manchester City', when: future(4, 18) },
  { league: 'Liga Mistrzów', match: 'FC Barcelona — Bayern Monachium', when: future(6, 21) },
  { league: 'NBA', match: 'Lakers — Celtics', when: future(7, 2) },
];

function upcoming(locale = 'pl', limit = 10) {
  return EVENTS.slice()
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, limit)
    .map((e) => localize(e, locale));
}

function bySlug(slug, locale = 'pl') {
  const e = EVENTS.find((x) => x.slug === slug);
  return e ? localize(e, locale) : null;
}

function localize(e, locale) {
  if (locale === 'en') {
    return { ...e, name: e.nameEn || e.name, description: e.descriptionEn || e.description };
  }
  return e;
}

function fixtures() {
  return FIXTURES.slice().sort((a, b) => new Date(a.when) - new Date(b.when));
}

module.exports = { upcoming, bySlug, fixtures };
