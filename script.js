/* =============================================
   DRACULA'S MARKET CRYPT — SCRIPT
   ============================================= */

// ── STOCK CONFIG ────────────────────────────────────────────────────────────
const STOCKS = [
  { symbol: 'ORCL',  name: 'Oracle',    logo: 'ORCL',  logoClass: 'logo-orcl' },
  { symbol: 'GOOGL', name: 'Alphabet',  logo: 'GOOGL', logoClass: 'logo-googl' },
  { symbol: 'MSFT',  name: 'Microsoft', logo: 'MSFT',  logoClass: 'logo-msft' },
  { symbol: 'META',  name: 'Meta',      logo: 'META',  logoClass: 'logo-meta' },
  { symbol: 'AMZN',  name: 'Amazon',    logo: 'AMZN',  logoClass: 'logo-amzn' },
];

// Dracula messages for bitten stocks
const BITE_MESSAGES = [
  "Dracula has fed tonight.",
  "Your blood money… is mine.",
  "Mwahahaha! Another victim!",
  "The losses sustain me…",
  "I vant to suck your profits!",
  "A fine vintage of red ink.",
  "The market bleeds for me.",
  "Another soul for the crypt.",
];

// Positive messages for surviving stocks
const SURVIVE_MESSAGES = [
  "Escaped the Count tonight.",
  "The garlic held him off.",
  "Crosses and profits align.",
  "Survived another night.",
  "Dracula cannot touch this one.",
];

// ── CORS PROXIES ─────────────────────────────────────────────────────────────
const SYMBOLS = STOCKS.map(s => s.symbol).join(',');
const YAHOO_URL = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${SYMBOLS}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,shortName`;

const PROXIES = [
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
];

// ── STATE ─────────────────────────────────────────────────────────────────────
let refreshTimer = null;
let isFirstLoad = true;

// ── STARS ─────────────────────────────────────────────────────────────────────
function createStars() {
  const container = document.getElementById('stars');
  if (!container) return;
  const count = 120;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    const size = Math.random() * 2.5 + 0.5;
    const x = Math.random() * 100;
    const y = Math.random() * 70;
    const dur = Math.random() * 3 + 2;
    const delay = Math.random() * 5;
    star.style.cssText = `
      position: absolute;
      left: ${x}%;
      top: ${y}%;
      width: ${size}px;
      height: ${size}px;
      background: white;
      border-radius: 50%;
      animation: starTwinkle ${dur}s ${delay}s ease-in-out infinite;
      opacity: ${Math.random() * 0.6 + 0.2};
    `;
    container.appendChild(star);
  }

  // Inject twinkle keyframes
  if (!document.getElementById('starStyle')) {
    const s = document.createElement('style');
    s.id = 'starStyle';
    s.textContent = `
      @keyframes starTwinkle {
        0%, 100% { opacity: 0.2; transform: scale(1); }
        50%       { opacity: 1;   transform: scale(1.4); }
      }
    `;
    document.head.appendChild(s);
  }
}

// ── BATS ─────────────────────────────────────────────────────────────────────
function spawnBats(count = 5) {
  const container = document.getElementById('bats-container');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const bat = document.createElement('div');
    bat.className = 'bat';
    bat.textContent = '🦇';

    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight * 0.6;
    const dx = (Math.random() - 0.5) * window.innerWidth * 0.8;
    const dy = (Math.random() - 0.5) * window.innerHeight * 0.4;
    const dur = Math.random() * 12 + 8;
    const delay = Math.random() * 8;

    bat.style.cssText = `
      left: ${startX}px;
      top: ${startY}px;
      --bx: ${dx}px;
      --by: ${dy}px;
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
      font-size: ${Math.random() * 0.8 + 0.9}rem;
    `;
    container.appendChild(bat);
  }
}

// Extra bats for when many stocks are down
function spawnCrisisBats() {
  spawnBats(12);
}

// ── DATA FETCHING ─────────────────────────────────────────────────────────────
async function fetchStockData() {
  for (const makeProxy of PROXIES) {
    try {
      const proxyUrl = makeProxy(YAHOO_URL);
      const res = await fetch(proxyUrl, { cache: 'no-cache' });
      if (!res.ok) continue;

      const text = await res.text();
      let data;

      // allorigins wraps in { contents: "..." }
      if (proxyUrl.includes('allorigins')) {
        const wrapper = JSON.parse(text);
        data = JSON.parse(wrapper.contents);
      } else {
        data = JSON.parse(text);
      }

      const quotes = data?.quoteResponse?.result;
      if (!quotes || quotes.length === 0) continue;

      return quotes.map(q => ({
        symbol:        q.symbol,
        name:          q.shortName || q.longName || q.symbol,
        price:         q.regularMarketPrice,
        change:        q.regularMarketChange,
        changePercent: q.regularMarketChangePercent,
        prevClose:     q.regularMarketPreviousClose,
      }));
    } catch (e) {
      console.warn('Proxy failed:', e.message);
    }
  }

  // All proxies failed — return simulated live data with drift
  return generateMockData();
}

// ── MOCK DATA (fallback with random drift) ──────────────────────────────────
const MOCK_BASE = {
  ORCL:  { name: 'Oracle Corporation',    price: 167.42, seed: 1 },
  GOOGL: { name: 'Alphabet Inc.',         price: 195.87, seed: 2 },
  MSFT:  { name: 'Microsoft Corporation', price: 415.32, seed: 3 },
  META:  { name: 'Meta Platforms Inc.',   price: 592.10, seed: 4 },
  AMZN:  { name: 'Amazon.com Inc.',       price: 228.43, seed: 5 },
};

function generateMockData() {
  const now = Math.floor(Date.now() / 30000); // changes every 30s
  return STOCKS.map(s => {
    const base = MOCK_BASE[s.symbol];
    // Deterministic pseudo-random drift seeded by time + symbol
    const rng = (now * base.seed * 7919 + base.seed * 1013) % 1000;
    const change = ((rng / 1000) - 0.5) * base.price * 0.035;
    const price = base.price + change;
    const changePercent = (change / base.price) * 100;
    return {
      symbol:        s.symbol,
      name:          base.name,
      price:         parseFloat(price.toFixed(2)),
      change:        parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      prevClose:     parseFloat(base.price.toFixed(2)),
    };
  });
}

// ── CARD RENDERING ────────────────────────────────────────────────────────────
function formatPrice(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatChange(n) {
  const sign = n >= 0 ? '+' : '';
  return sign + n.toFixed(2);
}

function formatPct(n) {
  const sign = n >= 0 ? '+' : '';
  return sign + n.toFixed(2) + '%';
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildBloodDrips() {
  let html = '';
  const count = Math.floor(Math.random() * 4) + 2;
  for (let i = 0; i < count; i++) {
    const left = 5 + Math.random() * 90;
    const h    = 30 + Math.random() * 50;
    const dur  = 1.5 + Math.random() * 2;
    const del  = Math.random() * 3;
    html += `<div class="blood-drip" style="left:${left}%;--drip-h:${h}px;--drip-dur:${dur}s;--drip-delay:${del}s"></div>`;
  }
  return html;
}

function renderCard(stock, info) {
  const isDown = stock.change < 0;
  const isSevere = stock.changePercent < -2;
  const cardClass = isDown
    ? (isSevere ? 'stock-card bitten severely-bitten' : 'stock-card bitten')
    : 'stock-card positive';

  const upDown = isDown ? 'down' : 'up';
  const arrow  = isDown ? '▼' : '▲';
  const badge  = isDown
    ? '<span class="card-badge badge-bitten">🧛 BITTEN</span>'
    : '<span class="card-badge badge-positive">✦ SURVIVING</span>';

  const footerMsg = isDown
    ? randomFrom(BITE_MESSAGES)
    : randomFrom(SURVIVE_MESSAGES);

  const prevClose = stock.prevClose
    ? `<span>Prev. Close</span><span>${formatPrice(stock.prevClose)}</span>`
    : '';

  return `
    <div class="${cardClass}" data-symbol="${stock.symbol}">
      <div class="card-accent"></div>
      <div class="blood-drips">${buildBloodDrips()}</div>

      <div class="card-header">
        <div class="company-logo ${info.logoClass}">${info.logo}</div>
        <div class="card-company">
          <div class="company-name">${stock.name}</div>
          <div class="company-symbol">${stock.symbol}</div>
        </div>
        ${badge}
      </div>

      <div class="price-row">
        <div class="price-block">
          <div class="price-label">Current Price</div>
          <div class="price-value">${formatPrice(stock.price)}</div>
        </div>
        <div class="dracula-biter" title="Dracula is biting this stock!">🧛</div>
      </div>

      <div class="change-row">
        <span class="change-value ${upDown}">${arrow} ${formatChange(stock.change)}</span>
        <span class="change-pct ${upDown}">${formatPct(stock.changePercent)}</span>
      </div>

      ${stock.prevClose ? `
        <div class="card-divider"></div>
        <div class="prev-close-row">${prevClose}</div>
      ` : ''}

      <div class="fang-marks">⸸ ⸸ &nbsp; FANGS DETECTED</div>

      <div class="card-footer-msg">${footerMsg}</div>
    </div>
  `;
}

// ── MAIN RENDER ───────────────────────────────────────────────────────────────
function renderStocks(stocks) {
  const grid = document.getElementById('stocks-grid');
  const loading = document.getElementById('loading-state');
  if (loading) loading.remove();

  // Map symbol to stock config
  const infoMap = {};
  STOCKS.forEach(s => { infoMap[s.symbol] = s; });

  let html = '';
  stocks.forEach(stock => {
    const info = infoMap[stock.symbol] || { logo: stock.symbol, logoClass: 'logo-orcl' };
    html += renderCard(stock, info);
  });
  grid.innerHTML = html;

  // Check for blood moon (all stocks down)
  const allDown = stocks.every(s => s.change < 0);
  const banner = document.getElementById('blood-moon-banner');
  if (banner) banner.style.display = allDown ? 'block' : 'none';

  // Spawn more bats if multiple stocks are down
  const downCount = stocks.filter(s => s.change < 0).length;
  if (downCount >= 4) {
    spawnCrisisBats();
  } else {
    spawnBats(downCount >= 2 ? 7 : 5);
  }

  // Update status
  const dot = document.getElementById('status-dot');
  const statusText = document.getElementById('market-status-text');
  if (dot) {
    dot.className = 'status-dot';
    dot.classList.remove('loading', 'error');
  }
  if (statusText) {
    const bloodCount = stocks.filter(s => s.change < 0).length;
    statusText.textContent = bloodCount > 0
      ? `Dracula has bitten ${bloodCount} stock${bloodCount > 1 ? 's' : ''} tonight`
      : 'All stocks are safe from the Count tonight';
  }

  // Update last-updated
  const lu = document.getElementById('last-updated');
  if (lu) {
    const now = new Date();
    lu.textContent = `Updated: ${now.toLocaleTimeString()}`;
  }
}

// ── STATUS HELPERS ────────────────────────────────────────────────────────────
function setStatusLoading() {
  const dot = document.getElementById('status-dot');
  const txt = document.getElementById('market-status-text');
  if (dot) { dot.className = 'status-dot loading'; }
  if (txt) txt.textContent = 'Dracula is awakening… fetching market data…';
}

function setStatusError() {
  const dot = document.getElementById('status-dot');
  const txt = document.getElementById('market-status-text');
  if (dot) { dot.className = 'status-dot error'; }
  if (txt) txt.textContent = 'The crypt is sealed — using simulated data';
}

// ── REFRESH LOOP ──────────────────────────────────────────────────────────────
async function refresh() {
  if (!isFirstLoad) setStatusLoading();

  try {
    const stocks = await fetchStockData();
    renderStocks(stocks);
    isFirstLoad = false;
  } catch (e) {
    console.error('Failed to render:', e);
    setStatusError();
    const stocks = generateMockData();
    renderStocks(stocks);
    isFirstLoad = false;
  }
}

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  createStars();
  spawnBats(5);
  refresh();

  // Auto-refresh every 30 seconds
  setInterval(refresh, 30000);
});
