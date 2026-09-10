'use strict';

/** Menu à la carte (PL) — na podstawie karty NBG z 2026-08-29. Ceny w zł. */
module.exports = {
  type: 'a_la_carte',
  slug: 'menu-a-la-carte',
  locale: 'pl',
  title: 'Menu à la carte',
  intro: 'Przekąski, zupy, sałatki, burgery, pizza z pieca opalanego drewnem i dania główne. Menu śniadaniowe codziennie 9:00–12:00.',
  sourcePdf: '/uploads/menus/nbg_menu_pl.pdf',
  sections: [
    {
      name: 'Przekąski',
      items: [
        { name: 'Tatar z wołowiny', weight: '100g', price: '44,9', description: 'z domowymi piklami, pieczywo własnej produkcji, majonez lubczykowy, cebula, oliwa' },
        { name: 'Amerykańskie frytki', weight: '450g', price: '34,5', description: 'zapiekane z serem, z dodatkiem meksykańskiego chili con carne' },
        { name: 'Tacos (2 szt.)', weight: '250g', price: '29,9', description: 'pszenne tacos z meksykańskim chili con carne, cebula dymka, guacamole, kolendra' },
        { name: 'Chicken Wings (8 szt.)', weight: '350g', price: '36,5', description: 'skrzydełka kurczaka w sosie BBQ' },
        { name: 'Deska przekąsek dla 2 osób', weight: '400g', price: '39,5', description: 'feta z pieca, hummus marokański, ogórek, chleb naan, marynowane oliwki, papryka grillowana, pieczone pomidorki cherry, tzatziki', tags: ['veg'] },
        { name: 'Deska mięs sezonowanych', weight: '450g', price: '65', description: 'długo dojrzewające: pierś z kaczki, karkówka, schab; pieczone: karkówka, boczek; kremowa słonina z czosnkiem, pieczywo naszego wypieku' },
        { name: 'Deska serów kaszubskich', weight: '250g', price: '59', description: '4 smaki regionalnych kaszubskich serów z Trzebielina, miód wielokwiatowy, paluszki grissini, owoce, orzechy', tags: ['veg'] },
      ],
    },
    {
      name: 'Zupy',
      items: [
        { name: 'Żur polski z kiełbasą i jajkiem', weight: '300ml', price: '29,9', description: 'pieczywo własnej produkcji' },
        { name: 'Cebulowa z grzanką serową', weight: '300ml', price: '24,5', description: 'wywar jarski na białym winie', tags: ['veg'] },
        { name: 'Rybna', weight: '300ml', price: '27,5', description: 'wywar rybny, morszczuk, fenkuł, korzeń pietruszki, marchew, pomidory, chilli, czosnek' },
      ],
    },
    {
      name: 'Sałatki',
      items: [
        { name: 'Amerykańska z kurczakiem', weight: '300g', price: '44,9', description: 'świeże sałaty, grillowane kawałki kurczaka, pomidor, ogórek, papryka, ananas, sos amerykański, ser, sezam, migdały, chrupiące grzanki' },
        { name: 'Cezar', weight: '300g', price: '38', priceNote: 'kurczak 38 zł / krewetki 48 zł', description: 'sałata rzymska, parmezan, chrupiące grzanki, pomidorki koktajlowe, sos z anchois, musztardy Dijon i majonezu' },
        { name: 'Grecka', weight: '300g', price: '36,9', description: 'ser feta, oliwki, świeże ogórki, bakłażan, grillowana papryka konserwowa, pomidorki cherry, cebula, mix sałat, balsamico, oliwa, oregano', tags: ['veg'] },
      ],
    },
    {
      name: 'Ryby i owoce morza',
      items: [
        { name: 'Klasyczne Fish & Chips', weight: '400g', price: '56,9', description: 'ryba w panierce piwnej, frytki, sos tatarski' },
        { name: 'Krewetki maślano-winne (6 szt.)', weight: '200g', price: '44,9', description: 'czosnek, chilli, białe wino, masło, pietruszka, pomidorki cherry, grzanki' },
      ],
    },
    {
      name: 'Burgery',
      items: [
        { name: 'Burger American Classic', weight: '', price: '47,9', description: 'bułka brioche, burger wołowy 100%, sałata, pomidor, ogórek, rukola, cebula, bekon, ser cheddar, sos sticky korean BBQ' },
        { name: 'Cheese Smashburger', weight: '', price: '47,9', description: 'bułka brioche, 2x smash burger 100% wołowiny, cheddar, camembert, jalapeño, prażona cebula, ogórek, sałata, sos Miami' },
        { name: 'Smash Meksykański', weight: '', price: '49,9', description: 'bułka brioche, 2x smash burger 100% wołowiny, cheddar, salsa z pomidorów i jalapeño, sałata, cebula, bekon, nachosy, sos BBQ' },
      ],
    },
    {
      name: 'Pizza ø30cm',
      note: 'Pizza w stylu „romana” na cienkim i chrupiącym cieście, z pieca opalanego drewnem. Dostępna pn–czw od 17:00 i pt–nd od 12:00.',
      items: [
        { name: 'Margherita', price: '28,9', description: 'sos pomidorowy, ser mozzarella, oregano', tags: ['veg'] },
        { name: 'Bianca', price: '35,9', description: 'sos śmietanowo-czosnkowy, szynka, pieczarki, rukola, oliwa truflowa, ser grana padano' },
        { name: 'Salami Piccante', price: '39,9', description: 'sos pomidorowy, ser mozzarella, salami Spianata Piccante, cebula, mascarpone, rukola' },
        { name: 'Capricciosa', price: '34,9', description: 'sos pomidorowy, ser mozzarella, szynka cotto, pieczarki, oregano' },
        { name: 'Vegetariano', price: '29,9', description: 'sos pomidorowy, ser mozzarella, pieczarki, cebula, papryka, oliwki, oregano', tags: ['veg'] },
        { name: 'Parma', price: '39,9', description: 'sos pomidorowy, ser mozzarella, szynka parmeńska, rukola, parmezan' },
        { name: 'Salami Napoli', price: '34,9', description: 'sos pomidorowy, ser mozzarella, salami, oregano' },
      ],
    },
    {
      name: 'Dania główne',
      items: [
        { name: 'Panierowany kotlet schabowy', weight: '180g', price: '38,9', description: '' },
        { name: 'Bawarska golonka', weight: '±500g', price: '58,9', description: 'podawana z kapustą zasmażaną, musztardą i chrzanem' },
        { name: 'Żebro w stylu amerykańskim', weight: '400g', price: '52,9', description: 'beztłuszczowe chude żeberka, marynowane w sosie BBQ z limonką i imbirem, podawane z sosem BBQ' },
        { name: 'Grillowany filet z kurczaka', weight: '180g', price: '28,9', description: 'cała pierś z kurczaka w ziołach' },
        { name: 'Polędwiczki wieprzowe', weight: '180g', price: '42,9', description: 'gotowane sous vide, w sosie z zielonego pieprzu, blanszowany brokuł' },
        { name: 'De volaille', weight: '180g', price: '38,9', description: 'z pieczarkami i serem' },
        { name: 'Konfitowana noga z kaczki', weight: '±550g', price: '55,9', description: 'sos śliwkowy, karmelizowane warzywa' },
        { name: 'Karkówka grillowana', weight: '±180g', price: '38,9', description: 'podawana z sosem tzatziki' },
        { name: 'Currywurst', weight: '350g', price: '38,9', description: 'wieprzowa kiełbasa currywurst naszego wyrobu, bagietka z masłem czosnkowo-pietruszkowym, piklowana czerwona cebula, ogórek konserwowy, sos curry' },
        { name: 'Kofta wołowa', weight: '350g', price: '47,9', description: 'lawasz, cebula marynowana, pomidorki cherry, sos tzatziki, oliwa kolendrowo-limonkowa' },
      ],
    },
    {
      name: 'Dla dzieci',
      items: [
        { name: 'Stripsy z kurczaka z frytkami', price: '36,9', description: 'panierowane polędwiczki (3 szt.), ketchup' },
        { name: 'Smash cheeseburger', price: '33,9', description: 'burger wołowy 100%, bułka brioche, ser cheddar, ketchup' },
      ],
    },
    {
      name: 'Desery',
      items: [
        { name: 'Beza z białą czekoladą', weight: '±150g', price: '23,9', description: 'beza, biała czekolada, mascarpone, śmietana, wiśnia', tags: ['veg'] },
        { name: 'Pistacjowy sernik baskijski', weight: '±150g', price: '27,9', description: 'kremowy serek, pasta pistacjowa, śmietanka, sos z białej czekolady', tags: ['veg'] },
        { name: 'Brownie', weight: '±150g', price: '23,9', description: 'podane z gałką lodów waniliowych i sosem wiśniowym', tags: ['veg'] },
      ],
    },
    {
      name: 'Dodatki',
      items: [
        { name: 'Ziemniaki gotowane z koperkiem', weight: '200g', price: '10,9', tags: ['veg'] },
        { name: 'Kopytka własnej produkcji', weight: '200g', price: '10,9', tags: ['veg'] },
        { name: 'Ziemniak z pieca', weight: '250g', price: '11,9', description: 'masło z ziołami i czosnkiem, śmietana', tags: ['veg'] },
        { name: 'Frytki', weight: '200g', price: '11,9', tags: ['veg'] },
        { name: 'Kapusta zasmażana', weight: '150g', price: '9', tags: ['veg'] },
        { name: 'Mizeria', weight: '150g', price: '10', tags: ['veg'] },
        { name: 'Sałatka coleslaw', weight: '150g', price: '10', tags: ['veg'] },
        { name: 'Sałatka ze świeżych warzyw', weight: '150g', price: '10', description: 'z sosem winegret', tags: ['veg'] },
        { name: 'Tzatziki klasyczny sos jogurtowy', weight: '110g', price: '7,5', tags: ['veg'] },
      ],
    },
  ],
};
