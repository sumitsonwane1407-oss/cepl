const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  try {
    const { search, category } = req.query;
    const products = db.getProducts({ search, category });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/inward', (req, res) => {
  try {
    const { name, category, mfgDate, expiryDate, buyingPrice, sellingPrice, quantity } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Product name is required' });

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ success: false, message: 'Valid quantity required' });

    const result = db.saveOrUpdateStock({ name, category, mfgDate, expiryDate, buyingPrice, sellingPrice, quantity: qty });
    res.status(result.isNew ? 201 : 200).json({
      success: true,
      isNew: result.isNew,
      message: result.isNew ? `Stock created: ${result.product.name}` : `Stock updated: +${qty} units of ${result.product.name}`,
      data: result.product
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.patch('/:id/check', (req, res) => {
  try {
    const updated = db.markProductChecked(req.params.id);
    if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product checked', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const deleted = db.deleteProduct(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
