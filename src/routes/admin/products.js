'use strict';
const express = require('express');
const router = express.Router();
router.get('/', (req, res) => res.render('admin/placeholder', { layout: 'layouts/admin', title: 'products', module: 'products' }));
module.exports = router;
