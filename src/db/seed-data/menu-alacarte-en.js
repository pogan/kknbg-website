'use strict';

/** À la carte menu (EN) — based on the NBG English card, 2026-08-29. Prices in PLN. */
module.exports = {
  type: 'a_la_carte',
  slug: 'menu-a-la-carte',
  locale: 'en',
  title: 'À la carte menu',
  intro: 'Snacks, soups, salads, burgers, wood-fired pizza and main courses. Breakfast menu daily 9:00–12:00.',
  sourcePdf: '/uploads/menus/nbg_menu_en.pdf',
  sections: [
    {
      name: 'Snacks',
      items: [
        { name: 'Beef tartare', weight: '100g', price: '44,9', description: 'with homemade pickles, house-baked bread, butter, lovage mayonnaise, onion, olive oil' },
        { name: 'American fries', weight: '450g', price: '34,5', description: 'baked with cheese, with Mexican chili con carne' },
        { name: 'Tacos (2 pieces)', weight: '250g', price: '29,9', description: 'wheat tacos with Mexican chili con carne, spring onions, guacamole, coriander' },
        { name: 'Chicken Wings (8 pieces)', weight: '350g', price: '36,5', description: 'chicken wings in BBQ sauce' },
        { name: 'Snack platter for 2 people', weight: '400g', price: '39,5', description: 'baked feta, Moroccan hummus, cucumber, naan bread, marinated olives, grilled peppers, roasted cherry tomatoes, tzatziki', tags: ['veg'] },
        { name: 'Aged meat board', weight: '450g', price: '65', description: 'dry-cured: duck breast, pork neck, pork loin; roasted: pork neck, bacon; creamy lard with garlic, house-baked bread' },
        { name: 'Kashubian cheese board', weight: '250g', price: '59', description: '4 varieties of regional Kashubian cheeses from Trzebielino, multiflora honey, grissini sticks, fruits, nuts', tags: ['veg'] },
      ],
    },
    {
      name: 'Soups',
      items: [
        { name: 'Polish sour soup with sausage and egg', weight: '300ml', price: '29,9', description: 'house-baked bread' },
        { name: 'Onion soup with cheese crouton', weight: '300ml', price: '24,5', description: 'white wine broth', tags: ['veg'] },
        { name: 'Fish soup', weight: '300ml', price: '27,5', description: 'fish stock, hake, fennel, parsley root, carrot, tomatoes, chilli, garlic' },
      ],
    },
    {
      name: 'Salads',
      items: [
        { name: 'American style salad', weight: '300g', price: '44,9', description: 'romaine lettuce, grilled chicken, tomato, cucumber, pepper, pineapple, American sauce, cheese, sesame, almonds, croutons' },
        { name: 'Caesar', weight: '300g', price: '38', priceNote: 'chicken 38 zł / shrimp 48 zł', description: 'romaine lettuce, parmesan, crispy croutons, cherry tomatoes, anchovy sauce, Dijon mustard, mayonnaise' },
        { name: 'Greek', weight: '300g', price: '36,9', description: 'feta cheese, olives, fresh cucumber, aubergine, grilled canned peppers, cherry tomatoes, onion, mixed leaves, balsamic, olive oil, oregano', tags: ['veg'] },
      ],
    },
    {
      name: 'Fish and sea food',
      items: [
        { name: 'Classic Fish & Chips', weight: '400g', price: '56,9', description: 'cod fish in beer batter, chips, tartar sauce' },
        { name: 'Butter and wine prawns (6 pieces)', weight: '200g', price: '44,9', description: 'garlic, chilli, white wine, butter, parsley, cherry tomatoes, croutons' },
      ],
    },
    {
      name: 'Burgers',
      items: [
        { name: 'American Classic Burger', price: '47,9', description: 'brioche bun, 100% beef burger, lettuce, tomato, cucumber, rocket, onion, bacon, cheddar, sticky Korean BBQ sauce' },
        { name: 'Cheese Smashburger', price: '47,9', description: 'brioche bun, 2x 100% beef smash burgers, cheddar, camembert, jalapeño, roasted onion, cucumber, lettuce, Miami sauce' },
        { name: 'Mexican Smash', price: '49,9', description: 'brioche bun, 2x 100% beef smash burgers, cheddar, tomato & jalapeño salsa, lettuce, onion, bacon, nachos, BBQ sauce' },
      ],
    },
    {
      name: 'Pizza ø30cm',
      note: 'Roman-style pizza on a thin, crispy crust from a wood-fired oven. Available Mon–Thu from 17:00 and Fri–Sun from 12:00.',
      items: [
        { name: 'Margherita', price: '28,9', description: 'tomato sauce, mozzarella, oregano', tags: ['veg'] },
        { name: 'Bianca', price: '35,9', description: 'creamy garlic sauce, ham, mushrooms, rocket, truffle oil, grana padano' },
        { name: 'Salami Piccante', price: '39,9', description: 'tomato sauce, mozzarella, Spianata Piccante salami, onion, mascarpone, rocket' },
        { name: 'Capricciosa', price: '34,9', description: 'tomato sauce, mozzarella, cooked ham, mushrooms, oregano' },
        { name: 'Vegetarian', price: '29,9', description: 'tomato sauce, mozzarella, mushrooms, onion, bell pepper, olives, oregano', tags: ['veg'] },
        { name: 'Parma', price: '39,9', description: 'tomato sauce, mozzarella, Parma ham, rocket, parmesan' },
      ],
    },
    {
      name: 'Main courses',
      items: [
        { name: 'Breaded pork chop', weight: '180g', price: '38,9' },
        { name: 'Crispy Bavarian pork knuckle', weight: '±600g', price: '58,9', description: 'served with fried cabbage, mustard and horseradish' },
        { name: 'American-style ribs', weight: '400g', price: '52,9', description: 'fat-free lean ribs, marinated in BBQ sauce with lime and ginger, served with BBQ sauce' },
        { name: 'Grilled chicken fillet', weight: '180g', price: '28,9', description: 'whole chicken breast in herbs' },
        { name: 'Pork tenderloin', weight: '180g', price: '55,9', description: 'sous vide cooked, in green pepper sauce, with blanched broccoli' },
        { name: 'De volaille', weight: '180g', price: '38,9', description: 'with mushrooms and cheese' },
        { name: 'Confit duck leg', weight: '±400g', price: '42,9', description: 'plum sauce, caramelised vegetables' },
        { name: 'Currywurst', weight: '350g', price: '38,9', description: 'our own currywurst pork sausage with garlic and parsley butter baguette, pickled onion, gherkin, curry sauce' },
        { name: 'Beef Kofta', weight: '450g', price: '47,9', description: 'lavash, pickled onion, cherry tomatoes, tzatziki sauce, cilantro-lime oil' },
      ],
    },
    {
      name: 'For kids',
      items: [
        { name: 'Chicken strips & fries', weight: '330g', price: '36,9', description: 'breaded tenderloins (3 pcs), ketchup' },
        { name: 'Smash cheeseburger', price: '33,9', description: '100% beef burger, brioche bun, cheddar, ketchup' },
      ],
    },
    {
      name: 'Desserts',
      items: [
        { name: 'Meringue with white chocolate', weight: '±150g', price: '23,9', description: 'meringue, white chocolate, mascarpone, cream, cherry', tags: ['veg'] },
        { name: 'Basque Pistachio Cheesecake', weight: '±150g', price: '27,9', description: 'cream cheese, pistachio paste, cream, white chocolate sauce', tags: ['veg'] },
        { name: 'Brownie', weight: '±150g', price: '23,9', description: 'served with a scoop of vanilla ice cream and cherry sauce', tags: ['veg'] },
      ],
    },
  ],
};
