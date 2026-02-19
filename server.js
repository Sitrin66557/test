const express = require('express');
const https   = require('https');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

const SYMBOLS = 'ORCL,GOOGL,MSFT,META,AMZN';
const FIELDS  = 'regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,shortName';
const YF_URL  = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${SYMBOLS}&fields=${FIELDS}`;

// Serve static files (index.html, style.css, script.js)
app.use(express.static(__dirname));

// Stock quote proxy — no CORS issue server-side
app.get('/api/quotes', (req, res) => {
  const options = {
    headers: {
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept':          'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  };

  https.get(YF_URL, options, apiRes => {
    let body = '';
    apiRes.on('data', chunk => { body += chunk; });
    apiRes.on('end', () => {
      try {
        const json = JSON.parse(body);
        res.set('Cache-Control', 'no-store');
        res.json(json);
      } catch (e) {
        console.error('[proxy] JSON parse error:', e.message);
        res.status(502).json({ error: 'Bad response from Yahoo Finance' });
      }
    });
  }).on('error', e => {
    console.error('[proxy] Request error:', e.message);
    res.status(502).json({ error: e.message });
  });
});

app.listen(PORT, () => {
  console.log(`\n🧛  Dracula's Market Crypt is rising...\n`);
  console.log(`   Open → http://localhost:${PORT}`);
  console.log(`   Stop → Ctrl+C\n`);
});
