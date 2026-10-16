const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  try {
    const sales = db.getSales();
    res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { productName, sellingPrice, quantity } = req.body;
    if (!productName || !productName.trim()) return res.status(400).json({ success: false, message: 'Product name required' });

    const price = parseFloat(sellingPrice);
    if (isNaN(price) || price <= 0) return res.status(400).json({ success: false, message: 'Valid selling price required' });

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ success: false, message: 'Valid quantity required' });

    const result = db.recordSale({ productName: productName.trim(), sellingPrice: price, quantity: qty });
    res.status(201).json({
      success: true,
      message: `Sale recorded. Net profit: ₹${result.sale.profit.toFixed(2)}`,
      data: result.sale,
      remainingStock: result.remainingStock
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
