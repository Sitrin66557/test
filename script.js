/* ── CONFIG ─────────────────────────────────────────── */
const STOCKS = [
  { symbol: 'ORCL',  name: 'Oracle',    fullName: 'Oracle Corporation'    },
  { symbol: 'GOOGL', name: 'Alphabet',  fullName: 'Alphabet Inc.'         },
  { symbol: 'MSFT',  name: 'Microsoft', fullName: 'Microsoft Corporation' },
  { symbol: 'META',  name: 'Meta',      fullName: 'Meta Platforms Inc.'   },
  { symbol: 'AMZN',  name: 'Amazon',    fullName: 'Amazon.com Inc.'       },
];

const BITE_MSGS = [
  'Dracula has fed tonight.',
  '"A fine vintage of red ink."',
  'I vant to suck your profits!',
  'The losses sustain me...',
  'Another soul for the crypt.',
  'Mwahahaha! Another victim!',
  'The market bleeds for me.',
  '"Delicious. Simply delicious."',
];

const SAFE_MSGS = [
  'Escaped the Count tonight.',
  'The garlic is working.',
  'Survived another night.',
  'Dracula cannot touch this one.',
  'Protected by holy profits.',
];

/* ── MOCK DATA (always works as fallback) ────────────── */
const BASE = {
  ORCL:  { price: 167.42, seed: 3 },
  GOOGL: { price: 195.87, seed: 7 },
  MSFT:  { price: 415.32, seed: 11 },
  META:  { price: 592.10, seed: 13 },
  AMZN:  { price: 228.43, seed: 17 },
};

function mockData() {
  const bucket = Math.floor(Date.now() / 30000);
  return STOCKS.map(s => {
    const b = BASE[s.symbol];
    // Deterministic pseudo-random: sin-based hash of bucket + seed
    const raw = Math.sin(bucket * b.seed * 9301 + b.seed * 49297) * 0.5 + 0.5;
    const pct = (raw - 0.5) * 0.06; // -3% to +3%
    const change = parseFloat((b.price * pct).toFixed(2));
    return {
      symbol:    s.symbol,
      name:      s.fullName,
      price:     parseFloat((b.price + change).toFixed(2)),
      change,
      changePct: parseFloat((pct * 100).toFixed(2)),
      prevClose: b.price,
      isDemo:    true,
    };
  });
}

/* ── FETCH with timeout ────────────────────────────── */
async function fetchWithTimeout(url, ms = 6000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, cache: 'no-cache' });
    clearTimeout(id);
    return r;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

/* ── LIVE FETCH ────────────────────────────────────── */
function parseYFResult(results) {
  return results.map(q => ({
    symbol:    q.symbol,
    name:      q.shortName || q.symbol,
    price:     q.regularMarketPrice,
    change:    q.regularMarketChange,
    changePct: q.regularMarketChangePercent,
    prevClose: q.regularMarketPreviousClose,
    isDemo:    false,
  }));
}

async function fetchLive() {
  // 1. Try our local server proxy first (no CORS, real data)
  try {
    const r = await fetchWithTimeout('/api/quotes', 6000);
    if (r.ok) {
      const json = await r.json();
      const results = json?.quoteResponse?.result;
      if (results?.length) return parseYFResult(results);
    }
  } catch (_) { /* server not running, fall through */ }

  // 2. Fall back to public CORS proxies
  const SYM   = STOCKS.map(s => s.symbol).join(',');
  const YAHOO = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${SYM}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,shortName`;
  const YAHOO2 = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${SYM}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,shortName`;
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(YAHOO)}`,
    `https://corsproxy.io/?${encodeURIComponent(YAHOO2)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(YAHOO)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(YAHOO2)}`,
    `https://thingproxy.freeboard.io/fetch/${YAHOO}`,
  ];

  for (const url of proxies) {
    try {
      const r = await fetchWithTimeout(url, 8000);
      if (!r.ok) continue;
      const json = JSON.parse(await r.text());
      const results = json?.quoteResponse?.result;
      if (results?.length) return parseYFResult(results);
    } catch (_) { /* try next */ }
  }

  // 3. Try v8 chart API per-symbol as last resort
  try {
    const charts = await Promise.all(STOCKS.map(async s => {
      const url = `https://corsproxy.io/?${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${s.symbol}?range=1d&interval=1d`)}`;
      const r = await fetchWithTimeout(url, 8000);
      if (!r.ok) return null;
      const j = JSON.parse(await r.text());
      const meta = j?.chart?.result?.[0]?.meta;
      if (!meta) return null;
      const price = meta.regularMarketPrice;
      const prev  = meta.previousClose ?? meta.chartPreviousClose;
      const change = parseFloat((price - prev).toFixed(2));
      const changePct = parseFloat(((change / prev) * 100).toFixed(2));
      return { symbol: s.symbol, name: s.fullName, price, change, changePct, prevClose: prev, isDemo: false };
    }));
    const valid = charts.filter(Boolean);
    if (valid.length === STOCKS.length) return valid;
  } catch (_) { /* fall through */ }

  return null; // everything failed — caller uses mock data
}

/* ── RENDER ────────────────────────────────────────── */
function fmt(n, prefix = '') {
  return prefix + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function dripsHtml() {
  return Array.from({ length: 4 }, () => {
    const l  = 6 + Math.random() * 88;
    const h  = 28 + Math.random() * 44;
    const d  = 1.4 + Math.random() * 2.2;
    const dl = Math.random() * 3;
    return `<div class="drip" style="left:${l.toFixed(1)}%;--h:${h.toFixed(0)}px;--d:${d.toFixed(1)}s;--dl:${dl.toFixed(1)}s"></div>`;
  }).join('');
}

function cardHtml(s) {
  const down   = s.change < 0;
  const severe = s.changePct < -2;
  const cls    = ['card', down ? (severe ? 'down severe' : 'down') : 'up'].join(' ');
  const dir    = down ? 'down' : 'up';
  const arrow  = down ? '▼' : '▲';
  const sign   = s.change >= 0 ? '+' : '−';
  const badge  = down
    ? `<span class="badge down-badge">🧛 BITTEN</span>`
    : `<span class="badge up-badge">✦ SAFE</span>`;
  const msg    = down ? pick(BITE_MSGS) : pick(SAFE_MSGS);

  return `
<div class="${cls}">
  <div class="card-bar"></div>
  <div class="drips">${dripsHtml()}</div>

  <div class="card-top">
    <div class="logo logo-${s.symbol}">${s.symbol}</div>
    <div class="company">
      <div class="co-name">${s.name}</div>
      <div class="co-ticker">${s.symbol}</div>
    </div>
    ${badge}
  </div>

  <div class="price-row">
    <div>
      <div class="price-label">Price</div>
      <div class="price">$${fmt(s.price)}</div>
    </div>
    <div class="bite-icon" title="Dracula is biting this stock!">🧛</div>
  </div>

  <div class="change-row">
    <span class="chg-val ${dir}">${arrow} ${sign}$${fmt(s.change)}</span>
    <span class="chg-pct ${dir}">${s.change >= 0 ? '+' : ''}${s.changePct.toFixed(2)}%</span>
  </div>

  ${s.prevClose != null ? `
  <div class="prev-row">
    <span>Prev. Close</span>
    <span>$${fmt(s.prevClose)}</span>
  </div>` : ''}

  <div class="card-msg">${msg}</div>
</div>`;
}

function renderCards(stocks) {
  const grid    = document.getElementById('grid');
  const loading = document.getElementById('loading');
  if (loading) loading.remove();

  grid.innerHTML = stocks.map(cardHtml).join('');

  // Blood moon
  const allDown = stocks.every(s => s.change < 0);
  document.getElementById('blood-moon').style.display = allDown ? 'block' : 'none';

  // Bats
  const downCount = stocks.filter(s => s.change < 0).length;
  spawnBats(downCount >= 4 ? 12 : downCount >= 2 ? 7 : 4);

  // Status
  const bitten = stocks.filter(s => s.change < 0).length;
  document.getElementById('status-msg').textContent = bitten > 0
    ? `Dracula has bitten ${bitten} stock${bitten > 1 ? 's' : ''} tonight`
    : 'All stocks survived the night — Dracula is displeased';

  const dot = document.getElementById('dot');
  dot.className = 'dot'; // green

  const badge = document.getElementById('data-badge');
  const isDemo = stocks[0]?.isDemo;
  badge.className = 'data-badge ' + (isDemo ? 'demo' : 'live');
  badge.textContent = isDemo ? 'DEMO DATA' : 'LIVE';

  document.getElementById('updated').textContent =
    'Updated: ' + new Date().toLocaleTimeString();
}

/* ── STARS ──────────────────────────────────────────── */
function makeStars() {
  const el = document.getElementById('bg-stars');
  for (let i = 0; i < 130; i++) {
    const s = document.createElement('div');
    const sz = Math.random() * 2.2 + 0.4;
    Object.assign(s.style, {
      position:     'absolute',
      width:        sz + 'px',
      height:       sz + 'px',
      borderRadius: '50%',
      background:   'white',
      left:         Math.random() * 100 + '%',
      top:          Math.random() * 85 + '%',
      opacity:      (Math.random() * 0.55 + 0.15).toFixed(2),
      animation:    `twinkle ${(Math.random() * 3 + 2).toFixed(1)}s ${(Math.random() * 5).toFixed(1)}s ease-in-out infinite`,
    });
    el.appendChild(s);
  }
  const style = document.createElement('style');
  style.textContent = '@keyframes twinkle{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}';
  document.head.appendChild(style);
}

/* ── BATS ───────────────────────────────────────────── */
function spawnBats(count) {
  const wrap = document.getElementById('flying-bats');
  wrap.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const b = document.createElement('div');
    b.className = 'bat';
    b.textContent = '🦇';
    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight * 0.65;
    Object.assign(b.style, {
      left:    startX + 'px',
      top:     startY + 'px',
      '--tx':  ((Math.random() - 0.5) * window.innerWidth * 0.7).toFixed(0) + 'px',
      '--ty':  ((Math.random() - 0.5) * window.innerHeight * 0.35).toFixed(0) + 'px',
      '--dur': (Math.random() * 10 + 8).toFixed(1) + 's',
      '--delay': (Math.random() * 6).toFixed(1) + 's',
      fontSize: (Math.random() * 0.6 + 0.9).toFixed(1) + 'rem',
    });
    wrap.appendChild(b);
  }
}

/* ── REFRESH ────────────────────────────────────────── */
let firstLoad = true;

async function refresh() {
  if (!firstLoad) {
    const dot = document.getElementById('dot');
    dot.className = 'dot yellow';
    document.getElementById('status-msg').textContent = 'Consulting the spirits of Wall Street…';
  }

  let stocks = await fetchLive();
  if (!stocks) stocks = mockData();

  renderCards(stocks);
  firstLoad = false;
}

/* ── INIT ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  makeStars();
  spawnBats(4);
  refresh();
  setInterval(refresh, 30000);
});
