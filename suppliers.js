const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  try {
    const suppliers = db.getSuppliers();
    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { agency, contact, category, items } = req.body;
    if (!agency || !agency.trim()) return res.status(400).json({ success: false, message: 'Agency name required' });
    if (!contact || !contact.trim()) return res.status(400).json({ success: false, message: 'Contact number required' });
    if (!items || !items.trim()) return res.status(400).json({ success: false, message: 'Items description required' });

    const newSupplier = db.addSupplier({ agency, contact, category, items });
    res.status(201).json({ success: true, message: 'Delivery saved successfully', data: newSupplier });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const deleted = db.deleteSupplier(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
