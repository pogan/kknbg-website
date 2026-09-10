'use strict';

/** Karta napojów (PL) — wybór z karty NBG. */
module.exports = {
  type: 'drinks',
  slug: 'karta-napojow',
  locale: 'pl',
  title: 'Karta napojów',
  intro: 'Piwa warzone w piwnicach Nowego Browaru Gdańskiego, koktajle, wina, domowe nalewki i napoje bezalkoholowe.',
  sourcePdf: '/uploads/menus/nbg_menu_pl.pdf',
  sections: [
    {
      name: 'Piwa z naszego browaru',
      items: [
        { name: 'Bursztynowy Lager Gdański', weight: '0,3 / 0,5 / 1 l', price: '16,5', priceNote: '16,5 / 18,5 / 30,5 zł', description: '12,5° ekstraktu, 5,0% alk. Jasny lager — ukłon w stronę tradycyjnego piwowarstwa.' },
        { name: 'Katamaran Cold IPA', weight: '0,3 / 0,5 / 1 l', price: '17,5', priceNote: '17,5 / 19,5 / 34,5 zł', description: '12° ekstraktu, 4,8% alk. Wytrawne, gorzkie, chmielone na zimno odmianą Rhapsody.' },
        { name: 'Artus Pils Gdański', weight: '0,3 / 0,5 / 1 l', price: '16,5', priceNote: '16,5 / 18,5 / 30,5 zł', description: '11,5° ekstraktu, 4,5% alk. Rasowe chmielowe piwo dolnej fermentacji.' },
        { name: 'Lager Light (bezglutenowy)', weight: '0,3 / 0,5 / 1 l', price: '16,5', priceNote: '16,5 / 18,5 / 30,5 zł', description: '9° ekstraktu, 3,5% alk. Jasne, delikatne, o obniżonej kaloryczności.', tags: ['gf'] },
        { name: 'Hazy IPA', weight: '0,3 / 0,5 / 1 l', price: '17,5', priceNote: '17,5 / 19,5 / 34,5 zł', description: '15° ekstraktu, 6,0% alk. Galaxy, Sabro, Mosaic, Riwaka, Superdelic.' },
        { name: 'Lato Sour Ale', weight: '0,3 / 0,5 / 1 l', price: '17,5', priceNote: '17,5 / 19,5 / 34,5 zł', description: '13,5° ekstraktu, 5,8% alk. Kwaśne piwo z przecierem z wiśni i czarnej porzeczki.' },
        { name: 'Lager Free (bezalkoholowe)', weight: '0,3 / 0,5 / 1 l', price: '15,5', priceNote: '15,5 / 17,5 / 29,9 zł', description: '<0,5% alk. Bezalkoholowa wersja jasnego lagera.' },
      ],
    },
    {
      name: 'Piwo na wynos',
      items: [
        { name: 'Artus Pils / Bursztynowy Lager', price: '7,9', description: 'butelka' },
        { name: 'IPA Free, Lager Free', price: '7,9' },
        { name: 'Hazy IPA', price: '14,9' },
        { name: 'Lato Sour Ale / FestBier', price: '9,9' },
      ],
    },
    {
      name: 'Koktajle (wybór)',
      items: [
        { name: 'Aperol Spritz', weight: '', price: '34', description: '6cl Aperol, 10cl Prosecco, soda' },
        { name: 'Mojito', price: '29', description: '4cl Captain Morgan White, limonka, cukier trzcinowy, mięta, soda' },
        { name: 'Whisky Sour', price: '32', description: '4cl Johnnie Walker Black Label, sok z cytryny, syrop cukrowy, białko, Angostura' },
        { name: 'Negroni', price: '27', description: '3cl Gordon\'s, 3cl Campari, 3cl Martini Rosso' },
        { name: 'Long Island Ice Tea', price: '43', description: 'Ketel One, Gordon\'s, Captain Morgan White, Olmeca Blanco, Triple Sec, sok z cytryny, Coca-Cola' },
      ],
    },
    {
      name: 'Napoje bezalkoholowe',
      items: [
        { name: 'Lemoniada (klasyczna / mango-limonka / marakuja-ogórek / brzoskwinia-mięta)', price: '15', priceNote: '15–16 zł', tags: ['veg'] },
        { name: 'Soki wyciskane ze świeżych owoców', weight: '0,3l', price: '14', tags: ['veg'] },
        { name: 'Kawa (espresso / americano / cappuccino / latte)', price: '9', priceNote: '9–15 zł', tags: ['veg'] },
      ],
    },
  ],
};
