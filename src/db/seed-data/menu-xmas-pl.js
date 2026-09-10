'use strict';

/** Biesiada wigilijna (PL) — na podstawie karty wigilijnej NBG. */
module.exports = {
  type: 'xmas',
  slug: 'biesiada-wigilijna',
  locale: 'pl',
  title: 'Biesiada wigilijna',
  intro: 'Trzy warianty menu na firmowe i rodzinne spotkania wigilijne. Ceny za osobę. Dodatkowy pakiet przekąsek 85 zł/os.',
  sourcePdf: '/uploads/menus/nbg_menu_wigilia.pdf',
  sections: [
    {
      name: 'Menu Biesiada Wigilijna I — 180 zł / os.',
      items: [
        { name: 'Zupa serwowana', description: 'Barszcz czerwony na wędzonce z suszonymi śliwkami, pasztecik z kapustą i grzybami' },
        { name: 'Dania główne w stole', description: 'Udziec z kurczaka faszerowany mięsem mielonym i pieczarką, sos rozmarynowy · Polędwiczka wieprzowa, sos pieprzowy · Morszczuk smażony, szpinak, pomidory · Pierogi z kapustą i grzybami, okrasa z białej cebuli' },
        { name: 'Dodatki do dań głównych', description: 'Domowe kopytka · Ziemniaki opiekane · Surówka z buraka · Warzywa blanszowane' },
        { name: 'Deser', description: 'Christmas Cheescake' },
        { name: 'Napoje', description: 'Piwo z naszego browaru · Woda gazowana / niegazowana' },
      ],
    },
    {
      name: 'Menu Biesiada Wigilijna II — 230 zł / os.',
      items: [
        { name: 'Zupa serwowana', description: 'Zupa grzybowa z kluskami lanymi lub Barszcz czerwony z suszoną śliwką, pasztecik z kapustą i grzybami' },
        { name: 'Dania główne w stole', description: 'Policzki wołowe wolnopieczone, sos własny · Filet z morszczuka smażony, szpinak, pomidorki cherry · Pierogi z kapustą i grzybami, okrasa z białej cebuli · Pierś z kaczki pieczona, sos jagodowy' },
        { name: 'Dodatki do dań głównych', description: 'Domowe kopytka · Ziemniaki gotowane · Kapusta kiszona zasmażana · Sałatka ze świeżych warzyw' },
        { name: 'Deser', description: 'Christmas Cheescake · Rolada makowa' },
        { name: 'Napoje', description: 'Piwo z naszego browaru · Woda gazowana / niegazowana' },
      ],
    },
    {
      name: 'Menu Wigilijne — Oferta Specjalna — 99 zł / os.',
      note: 'Dostępna od niedzieli do środy oraz w czwartek, piątek i sobotę w godzinach lunchowych.',
      items: [
        { name: 'Zupa', description: 'Barszcz czerwony z suszoną śliwką, pasztecik z kapustą i grzybami' },
        { name: 'Danie główne', description: 'Pierogi z kapustą i grzybami, okrasa z białej cebuli' },
        { name: 'Przekąski zimne', description: 'Sałatka jarzynowa · Ryba po grecku · Deska mięs pieczonych: boczek, schab ze śliwką, pasztet · Pieczywo własnego wypieku · Masło' },
        { name: 'Napoje', description: 'Piwo z naszego browaru · Woda gazowana / niegazowana' },
      ],
    },
    {
      name: 'Dodatkowy pakiet przekąsek — 85 zł / os.',
      items: [
        { name: 'Pakiet przekąsek', description: 'Tatar z pstrąga · Sałatka jarzynowa · Ryba po grecku · Deska mięs pieczonych: boczek, schab ze śliwką, pasztet · Pieczywo własnego wypieku · Masło' },
      ],
    },
  ],
};
