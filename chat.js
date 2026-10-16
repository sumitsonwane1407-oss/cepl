const express = require('express');
const router = express.Router();
const db = require('../db/database');

let GoogleGenAI = null;
try {
  const genaiPkg = require('@google/genai');
  GoogleGenAI = genaiPkg.GoogleGenAI;
} catch (e) {}

function generateLocalReply(message, language = 'en') {
  const lower = (message || '').toLowerCase();
  const stats = db.getStats();
  const products = db.getProducts();

  if (language === 'mr') {
    if (lower.includes('विक्री') || lower.includes('autofill')) {
      return {
        reply: "🎯 **विक्री किंमत (Selling Price) ऑटोफिल:**\n'स्टॉक जोडा' पर्यायातून नवीन माल नोंदवताना ठरवलेली विक्री किंमत डेटाबेसमध्ये सेव्ह होते. दैनिक विक्री नोंदवताना उत्पादन निवडताच विक्री किंमत आपोआप (Autofill) भरली जाते!",
        followUps: ["नफा आणि तोटा कसा मोजला जातो?", "मुदत संपणारे पदार्थ कोणते आहेत?"]
      };
    }
    return {
      reply: `📊 **Perfect360 सहाय्यक:**\nआजचा एकूण नफा: ₹${stats.todayProfit.toFixed(2)} | एकूण उत्पादने: ${stats.totalProducts}`,
      followUps: ["डॅशबोर्डवर विक्री किंमत कशी आपोआप भरली जाते?", "मुदत संपणारे पदार्थ कोणते आहेत?"]
    };
  } else if (language === 'hi') {
    if (lower.includes('बिक्री') || lower.includes('autofill')) {
      return {
        reply: "🎯 **बिक्री मूल्य (Selling Price) ऑटोफिल:**\nजब आप 'स्टॉक जोड़ें' स्क्रीन पर उत्पाद की बिक्री मूल्य दर्ज करते हैं, तो दैनिक बिक्री में उत्पाद चुनते ही तय की गई बिक्री मूल्य स्वतः (Autofill) भर जाती है!",
        followUps: ["दैनिक लाभ कैसे गिना जाता है?", "एक्सपायरी अलर्ट कैसे काम करता है?"]
      };
    }
    return {
      reply: `📊 **Perfect360 सहायक:**\nआज का शुद्ध लाभ: ₹${stats.todayProfit.toFixed(2)} | कुल उत्पाद: ${stats.totalProducts}`,
      followUps: ["डैशबोर्ड पर बिक्री मूल्य अपने आप कैसे भरता है?", "कम स्टॉक वाले उत्पाद कौन से हैं?"]
    };
  } else {
    return {
      reply: `📊 **Perfect360 Assistant:**\nStore inventory contains ${stats.totalProducts} products with ${stats.totalStockUnits} stock units. Today's profit: ₹${stats.todayProfit.toFixed(2)}.`,
      followUps: ["How does selling price autofill work on the dashboard?", "How do expiry alerts and mark-check work?"]
    };
  }
}

router.post('/', async (req, res) => {
  const { message, language = 'en' } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ success: false, message: 'Message required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && GoogleGenAI) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const stats = db.getStats();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
          systemInstruction: `You are the AI Assistant for "Perfect360" store inventory. Language: ${language}. Current Products: ${stats.totalProducts}. Today's profit: ₹${stats.todayProfit}. Reply in JSON format: {"reply":"...","followUps":["..."]}`,
          responseMimeType: 'application/json'
        }
      });
      const parsed = JSON.parse(response.text);
      return res.json({ success: true, reply: parsed.reply, followUps: parsed.followUps || [] });
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local engine:', err.message);
    }
  }

  const fallback = generateLocalReply(message, language);
  res.json({ success: true, reply: fallback.reply, followUps: fallback.followUps });
});

module.exports = router;
