const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  try {
    const data = db.getSettings();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/', (req, res) => {
  try {
    const { storeName, ownerName, language } = req.body;
    const settingsUpdate = (storeName || ownerName) ? { storeName, ownerName } : undefined;
    const data = db.updateSettings(settingsUpdate, language);
    res.json({ success: true, message: 'Settings saved successfully', data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
