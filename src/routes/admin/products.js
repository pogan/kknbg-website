'use strict';

const express = require('express');
const db = require('../../db');
const shop = require('../../services/shop.service');
const mediaService = require('../../services/media.service');
const { csrfProtection } = require('../../middleware/security');
const { slugify } = require('../../lib/slug');
const { parsePriceToGrosze } = require('../../lib/money');

const router = express.Router();

const insert = db.prepare(`INSERT INTO products
  (slug, name, subtitle, description, style, abv, ibu, plato, volume_ml, pack_size, price_grosze, stock,
   media_id, untappd_url, category, is_active, is_featured, position)
  VALUES (@slug,@name,@subtitle,@description,@style,@abv,@ibu,@plato,@volume_ml,@pack_size,@price_grosze,@stock,
   @media_id,@untappd_url,@category,@is_active,@is_featured,@position)`);
const update = db.prepare(`UPDATE products SET
  name=@name, subtitle=@subtitle, description=@description, style=@style, abv=@abv, ibu=@ibu, plato=@plato,
  volume_ml=@volume_ml, pack_size=@pack_size, price_grosze=@price_grosze, stock=@stock, media_id=@media_id,
  untappd_url=@untappd_url, category=@category, is_active=@is_active, is_featured=@is_featured, position=@position
  WHERE id=@id`);
const del = db.prepare('DELETE FROM products WHERE id = ?');

router.get('/', (req, res) => {
  res.render('admin/products', { layout: 'layouts/admin', title: 'Sklep — produkty', products: shop.listAll() });
});

router.get('/nowy', (req, res) => {
  res.render('admin/product-edit', {
    layout: 'layouts/admin', title: 'Nowy produkt', isNew: true,
    product: { id: null, category: 'beer', pack_size: 1, is_active: 1, stock: 0 },
    media: mediaService.list(80),
  });
});

router.get('/:id', (req, res, next) => {
  const p = shop.byId(Number(req.params.id));
  if (!p) return next();
  res.render('admin/product-edit', {
    layout: 'layouts/admin', title: `Produkt: ${p.name}`, isNew: false,
    product: p, media: mediaService.list(80),
  });
});

function normalize(body) {
  return {
    name: String(body.name || '').trim(),
    subtitle: String(body.subtitle || '').trim(),
    description: String(body.description || '').trim(),
    style: String(body.style || '').trim(),
    abv: body.abv ? Number(body.abv) : null,
    ibu: body.ibu ? Number(body.ibu) : null,
    plato: body.plato ? Number(body.plato) : null,
    volume_ml: body.volume_ml ? Number(body.volume_ml) : null,
    pack_size: Number(body.pack_size) || 1,
    price_grosze: parsePriceToGrosze(body.price) || 0,
    stock: Number(body.stock) || 0,
    media_id: body.media_id ? Number(body.media_id) : null,
    untappd_url: String(body.untappd_url || '').trim(),
    category: ['beer', 'set', 'merch', 'voucher'].includes(body.category) ? body.category : 'beer',
    is_active: body.is_active === 'on' ? 1 : 0,
    is_featured: body.is_featured === 'on' ? 1 : 0,
    position: Number(body.position) || 0,
  };
}

router.post('/', csrfProtection, (req, res) => {
  const data = normalize(req.body);
  const slug = req.body.slug ? slugify(req.body.slug) : slugify(data.name);
  const id = insert.run({ ...data, slug }).lastInsertRowid;
  req.session.flash = { type: 'success', text: 'Dodano produkt.' };
  res.redirect(`/admin/produkty/${id}`);
});

router.post('/:id', csrfProtection, (req, res) => {
  update.run({ ...normalize(req.body), id: Number(req.params.id) });
  req.session.flash = { type: 'success', text: 'Zapisano produkt.' };
  res.redirect('/admin/produkty');
});

router.post('/:id/usun', csrfProtection, (req, res) => {
  del.run(Number(req.params.id));
  req.session.flash = { type: 'success', text: 'Usunięto produkt.' };
  res.redirect('/admin/produkty');
});

module.exports = router;
