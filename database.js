const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

const defaultDatabase = {
  settings: {
    storeName: "Shree Ganesh Kirana Store",
    ownerName: "Team MindSpark",
  },
  language: 'en',
  products: [
    { id: "amul-milk", name: "Amul Milk 1L", category: "Dairy", quantity: 12, buyingPrice: 45, sellingPrice: 52, mfgDate: "2026-09-08", expiryDate: "2026-09-13", batch: "AM-203", checked: false },
    { id: "britannia-bread", name: "Britannia Bread", category: "Bakery", quantity: 4, buyingPrice: 28, sellingPrice: 35, mfgDate: "2026-09-09", expiryDate: "2026-09-14", batch: "BR-881", checked: false },
    { id: "yogurt-cup", name: "Yogurt Cup", category: "Dairy", quantity: 0, buyingPrice: 18, sellingPrice: 25, mfgDate: "2026-09-07", expiryDate: "2026-09-15", batch: "YG-109", checked: false },
    { id: "tata-salt", name: "Tata Salt 1kg", category: "Grocery", quantity: 25, buyingPrice: 24, sellingPrice: 28, mfgDate: "2026-08-01", expiryDate: "2027-08-01", batch: "TS-504", checked: false },
    { id: "fortune-oil", name: "Fortune Sunflower Oil 1L", category: "Grocery", quantity: 9, buyingPrice: 132, sellingPrice: 155, mfgDate: "2026-08-15", expiryDate: "2027-02-15", batch: "FO-920", checked: false }
  ],
  sales: [
    { id: "sale-1", date: new Date().toISOString().slice(0, 10), product: "Amul Milk 1L", buying: 45, selling: 52, quantity: 3, profit: 21 },
    { id: "sale-2", date: new Date().toISOString().slice(0, 10), product: "Britannia Bread", buying: 28, selling: 35, quantity: 2, profit: 14 }
  ],
  suppliers: [
    { id: "sup-1", agency: "Amul Logistics Pune", contact: "9820011223", category: "Dairy", items: "Amul Milk (50L), Butter (10kg)" },
    { id: "sup-2", agency: "Britannia Distributors", contact: "9876543210", category: "Bakery", items: "Britannia Bread (30 loaves), Milk Rusk" }
  ]
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDatabase, null, 2), 'utf-8');
      return defaultDatabase;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...defaultDatabase, ...parsed };
  } catch (err) {
    return defaultDatabase;
  }
}

function writeDb(data) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing DB file:', err);
  }
}

function getProducts(query = {}) {
  const db = readDb();
  let list = db.products || [];
  if (query.search) {
    const s = query.search.trim().toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(s) || (p.category && p.category.toLowerCase().includes(s)));
  }
  if (query.category) {
    list = list.filter(p => p.category.toLowerCase() === query.category.toLowerCase());
  }
  return list;
}

function getProductById(id) {
  const db = readDb();
  return (db.products || []).find(p => p.id === id);
}

function saveOrUpdateStock(stockData) {
  const db = readDb();
  const existingIndex = db.products.findIndex(p => p.name.trim().toLowerCase() === stockData.name.trim().toLowerCase());

  if (existingIndex >= 0) {
    const existing = db.products[existingIndex];
    const updated = {
      ...existing,
      quantity: Number(existing.quantity || 0) + Number(stockData.quantity || 0),
      category: stockData.category || existing.category,
      mfgDate: stockData.mfgDate || existing.mfgDate,
      expiryDate: stockData.expiryDate || existing.expiryDate,
      buyingPrice: stockData.buyingPrice !== undefined ? Number(stockData.buyingPrice) : existing.buyingPrice,
      sellingPrice: stockData.sellingPrice !== undefined ? Number(stockData.sellingPrice) : existing.sellingPrice,
      checked: false
    };
    db.products[existingIndex] = updated;
    writeDb(db);
    return { isNew: false, product: updated };
  } else {
    if (stockData.buyingPrice === undefined || stockData.sellingPrice === undefined) {
      throw new Error('Buying price and Selling price are required for a new product.');
    }
    const newProduct = {
      id: 'prod-' + Date.now(),
      name: stockData.name.trim(),
      category: stockData.category || 'General',
      quantity: Number(stockData.quantity) || 0,
      buyingPrice: Number(stockData.buyingPrice),
      sellingPrice: Number(stockData.sellingPrice),
      mfgDate: stockData.mfgDate || new Date().toISOString().slice(0, 10),
      expiryDate: stockData.expiryDate || '',
      batch: 'B-' + Math.floor(100 + Math.random() * 900),
      checked: false
    };
    db.products.unshift(newProduct);
    writeDb(db);
    return { isNew: true, product: newProduct };
  }
}

function markProductChecked(id) {
  const db = readDb();
  const product = db.products.find(p => p.id === id);
  if (!product) return null;
  product.checked = true;
  writeDb(db);
  return product;
}

function deleteProduct(id) {
  const db = readDb();
  const initialLen = db.products.length;
  db.products = db.products.filter(p => p.id !== id);
  if (db.products.length !== initialLen) {
    writeDb(db);
    return true;
  }
  return false;
}

function recordSale({ productName, sellingPrice, quantity }) {
  const db = readDb();
  const prodIndex = db.products.findIndex(p => p.name.trim().toLowerCase() === productName.trim().toLowerCase());

  if (prodIndex < 0) {
    throw new Error('Product not found in inventory.');
  }

  const prod = db.products[prodIndex];
  const qty = Number(quantity) || 1;
  const sPrice = Number(sellingPrice);

  if (prod.quantity < qty) {
    throw new Error(`Insufficient stock. Available: ${prod.quantity} units.`);
  }

  const profit = (sPrice - prod.buyingPrice) * qty;

  const newSale = {
    id: 'sale-' + Date.now(),
    date: new Date().toISOString().slice(0, 10),
    product: prod.name,
    buying: prod.buyingPrice,
    selling: sPrice,
    quantity: qty,
    profit: Number(profit.toFixed(2))
  };

  db.products[prodIndex].quantity = Math.max(0, prod.quantity - qty);
  db.sales.unshift(newSale);
  writeDb(db);

  return { sale: newSale, remainingStock: db.products[prodIndex].quantity };
}

function getSales() {
  const db = readDb();
  return db.sales || [];
}

function getSuppliers() {
  const db = readDb();
  return db.suppliers || [];
}

function addSupplier(supplierData) {
  const db = readDb();
  const newSupplier = {
    id: 'sup-' + Date.now(),
    agency: supplierData.agency.trim(),
    contact: supplierData.contact.trim(),
    category: supplierData.category || 'General',
    items: supplierData.items.trim()
  };
  db.suppliers.unshift(newSupplier);
  writeDb(db);
  return newSupplier;
}

function deleteSupplier(id) {
  const db = readDb();
  const initialLen = db.suppliers.length;
  db.suppliers = db.suppliers.filter(s => s.id !== id);
  if (db.suppliers.length !== initialLen) {
    writeDb(db);
    return true;
  }
  return false;
}

function getSettings() {
  const db = readDb();
  return {
    settings: db.settings || defaultDatabase.settings,
    language: db.language || 'en'
  };
}

function updateSettings(settings, language) {
  const db = readDb();
  if (settings) db.settings = { ...db.settings, ...settings };
  if (language) db.language = language;
  writeDb(db);
  return { settings: db.settings, language: db.language };
}

function getStats() {
  const db = readDb();
  const products = db.products || [];
  const sales = db.sales || [];

  const totalProducts = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
  const outOfStock = products.filter(p => Number(p.quantity) <= 0).length;

  const todayTime = new Date().setHours(0, 0, 0, 0);
  const expiringAlerts = products
    .map(p => {
      const exp = new Date(p.expiryDate).getTime();
      const days = isNaN(exp) ? 999 : Math.ceil((exp - todayTime) / (1000 * 60 * 60 * 24));
      return { ...p, days };
    })
    .filter(p => p.days <= 10 && !p.checked);

  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStr = todayStr.slice(0, 7);

  const todaySales = sales.filter(s => s.date === todayStr);
  const monthSales = sales.filter(s => s.date.startsWith(monthStr));

  const todayRevenue = todaySales.reduce((acc, s) => acc + (s.selling * s.quantity), 0);
  const todayProfit = todaySales.reduce((acc, s) => acc + s.profit, 0);
  const monthlyRevenue = monthSales.reduce((acc, s) => acc + (s.selling * s.quantity), 0);
  const monthlyProfit = monthSales.reduce((acc, s) => acc + s.profit, 0);

  return {
    totalProducts,
    totalStockUnits,
    outOfStock,
    expiringSoonCount: expiringAlerts.length,
    expiringAlerts,
    todayRevenue: Number(todayRevenue.toFixed(2)),
    todayProfit: Number(todayProfit.toFixed(2)),
    monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
    monthlyProfit: Number(monthlyProfit.toFixed(2))
  };
}

module.exports = {
  readDb,
  writeDb,
  getProducts,
  getProductById,
  saveOrUpdateStock,
  markProductChecked,
  deleteProduct,
  recordSale,
  getSales,
  getSuppliers,
  addSupplier,
  deleteSupplier,
  getSettings,
  updateSettings,
  getStats
};
