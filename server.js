require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/database');

const productsRouter = require('./routes/products');
const salesRouter = require('./routes/sales');
const suppliersRouter = require('./routes/suppliers');
const settingsRouter = require('./routes/settings');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/chat', chatRouter);

// Database Dump & Sync
app.get('/api/db', (req, res) => {
  try {
    const fullDb = db.readDb();
    res.json(fullDb);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/db/sync', (req, res) => {
  try {
    const clientData = req.body;
    if (!clientData || typeof clientData !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }
    const current = db.readDb();
    const merged = {
      settings: clientData.settings || current.settings,
      language: clientData.language || current.language,
      products: clientData.products || current.products,
      sales: clientData.sales || current.sales,
      suppliers: clientData.suppliers || current.suppliers
    };
    db.writeDb(merged);
    res.json({ success: true, message: 'Database synchronized successfully', data: merged });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Perfect360 Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// SPA Fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) res.status(404).json({ error: 'Not found' });
    });
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Perfect360 Backend running on http://localhost:${PORT}`);
    console.log(`📡 Endpoints:`);
    console.log(`   - GET  /api/health`);
    console.log(`   - GET  /api/products`);
    console.log(`   - POST /api/products/inward`);
    console.log(`   - POST /api/sales`);
    console.log(`   - GET  /api/sales/stats`);
    console.log(`   - GET  /api/suppliers`);
    console.log(`   - POST /api/chat (Multilingual AI Assistant)`);
    console.log(`====================================================`);
  });
}

module.exports = app;
