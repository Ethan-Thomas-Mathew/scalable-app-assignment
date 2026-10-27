// In-browser stand-in for the Express API.
// Used ONLY when the client is built with NEXT_PUBLIC_DEMO=true (the GitHub Pages demo).
// It mirrors the real routes and rules in /server, keeps its data in localStorage,
// and serves sample market data instead of calling CoinGecko.

const KEY = 'cryptox-demo-v1';

// ---- sample market data (illustrative values in INR, not live prices) ----
// [id, name, symbol, price INR, circulating supply, colour, volatility]
const COINS = [
  ['bitcoin', 'Bitcoin', 'btc', 8000000, 19.9e6, '#f7931a', 0.010],
  ['ethereum', 'Ethereum', 'eth', 280000, 120e6, '#627eea', 0.013],
  ['tether', 'Tether', 'usdt', 88, 140e9, '#26a17b', 0.0004],
  ['ripple', 'XRP', 'xrp', 190, 58e9, '#23292f', 0.016],
  ['binancecoin', 'BNB', 'bnb', 80000, 145e6, '#f3ba2f', 0.011],
  ['solana', 'Solana', 'sol', 12500, 550e6, '#9945ff', 0.018],
  ['usd-coin', 'USDC', 'usdc', 88, 60e9, '#2775ca', 0.0004],
  ['dogecoin', 'Dogecoin', 'doge', 13, 150e9, '#c2a633', 0.02],
  ['tron', 'TRON', 'trx', 25, 95e9, '#eb0029', 0.012],
  ['cardano', 'Cardano', 'ada', 45, 36e9, '#0033ad', 0.017],
  ['chainlink', 'Chainlink', 'link', 1300, 650e6, '#2a5ada', 0.017],
  ['avalanche-2', 'Avalanche', 'avax', 1600, 420e6, '#e84142', 0.019],
  ['stellar', 'Stellar', 'xlm', 22, 31e9, '#3e1bdb', 0.015],
  ['sui', 'Sui', 'sui', 280, 3.4e9, '#4da2ff', 0.022],
  ['hedera-hashgraph', 'Hedera', 'hbar', 17, 42e9, '#222222', 0.019],
  ['litecoin', 'Litecoin', 'ltc', 8500, 76e6, '#345d9d', 0.014],
  ['polkadot', 'Polkadot', 'dot', 330, 1.5e9, '#e6007a', 0.018],
  ['uniswap', 'Uniswap', 'uni', 900, 600e6, '#ff007a', 0.02],
  ['the-open-network', 'Toncoin', 'ton', 220, 2.5e9, '#0098ea', 0.017],
  ['polygon-ecosystem-token', 'POL', 'pol', 9, 10e9, '#8247e5', 0.02],
];

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function icon(symbol, colour) {
  const label = symbol.toUpperCase().slice(0, 4);
  const size = label.length > 3 ? 26 : 32;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<circle cx="50" cy="50" r="50" fill="${colour}"/>` +
    `<text x="50" y="50" text-anchor="middle" dominant-baseline="central" ` +
    `font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${size}" fill="#fff">${label}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// 168 hourly points (7 days), a seeded random walk scaled so it ends at the current price.
function sparkline(id, price, vol) {
  const r = rng(hashStr(id));
  const phase = hashStr(id) % 7;
  const pts = [];
  let v = 1;
  for (let i = 0; i < 168; i++) {
    v *= 1 + (r() - 0.5) * vol * 2 + Math.sin(i / 14 + phase) * vol * 0.12;
    pts.push(v);
  }
  const k = price / pts[pts.length - 1];
  return pts.map((p) => +(p * k).toPrecision(6));
}

const BASE = COINS.map(([id, name, symbol, price, supply, colour, vol]) => {
  const spark = sparkline(id, price, vol);
  const change = (spark[spark.length - 1] / spark[spark.length - 25] - 1) * 100;
  return { id, name, symbol, colour, price, supply, spark, change };
});

function marketCoins() {
  return BASE.map((c, i) => {
    const raw = c.price * (1 + (Math.random() - 0.5) * 0.004);
    const price = raw >= 100 ? Math.round(raw) : Math.round(raw * 100) / 100;
    const cap = price * c.supply;
    return {
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      image: icon(c.symbol, c.colour),
      current_price: price,
      market_cap: cap,
      market_cap_rank: i + 1,
      total_volume: cap * 0.035,
      price_change_percentage_24h: +c.change.toFixed(2),
      sparkline_in_7d: { price: c.spark },
    };
  });
}

// ---- tiny "database" ----
let db = null;

function hashPassword(email, password) {
  return String(hashStr(`${email.toLowerCase()}|${password}`));
}

function seed() {
  return {
    users: [{ id: 1, username: 'Demo Trader', email: 'demo@cryptox.dev', password: hashPassword('demo@cryptox.dev', 'demo1234') }],
    txs: [
      { id: 1, UserId: 1, coinName: 'Bitcoin', amount: 1, priceAtBuy: 7650000, paymentMethod: 'card', note: 'Bulk Purchase' },
      { id: 2, UserId: 1, coinName: 'Ethereum', amount: 5, priceAtBuy: 262000, paymentMethod: 'upi', note: 'Bulk Purchase' },
      { id: 3, UserId: 1, coinName: 'Solana', amount: 12, priceAtBuy: 11800, paymentMethod: 'card', note: 'Bulk Purchase' },
    ],
    cart: [],
    next: { user: 2, tx: 4, cart: 1 },
  };
}

function getDb() {
  if (db) return db;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) db = JSON.parse(raw);
  } catch (e) { /* storage unavailable: fall back to memory */ }
  if (!db) db = seed();
  return db;
}

function save() {
  try { window.localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* ignore */ }
}

// ---- request plumbing ----
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fail(status, data) {
  const err = new Error(typeof data === 'string' ? data : 'Request failed');
  err.isAxiosError = true;
  err.response = { status, data, headers: {} };
  return err;
}

function headerValue(headers, name) {
  if (!headers) return undefined;
  if (typeof headers.get === 'function') return headers.get(name);
  return headers[name];
}

function authUser(config) {
  const token = headerValue(config.headers, 'auth-token');
  if (!token) throw fail(401, 'Access Denied');
  const id = Number(String(token).split('.')[1]);
  const user = getDb().users.find((u) => u.id === id);
  if (!user) throw fail(400, 'Invalid Token');
  return user;
}

function parseBody(config) {
  if (!config.data) return {};
  if (typeof config.data === 'string') {
    try { return JSON.parse(config.data); } catch (e) { return {}; }
  }
  return config.data;
}

function route(method, path, body, config) {
  const d = getDb();

  // --- auth ---
  if (method === 'post' && path === '/user/register') {
    const { username, email, password } = body;
    if (!username || !email || !password) throw fail(400, 'Missing fields');
    if (d.users.some((u) => u.email === email)) throw fail(400, 'Email already exists');
    const user = { id: d.next.user++, username, email, password: hashPassword(email, password) };
    d.users.push(user);
    save();
    return { user: user.id };
  }
  if (method === 'post' && path === '/user/login') {
    const user = d.users.find((u) => u.email === body.email);
    if (!user || user.password !== hashPassword(body.email || '', body.password || '')) {
      throw fail(400, 'Email or Password incorrect');
    }
    return { token: `demo.${user.id}` };
  }

  // --- market data (CoinGecko proxy in the real server) ---
  if (method === 'get' && path === '/proxy/coins') return marketCoins();

  // everything below needs a signed-in user
  const user = authUser(config);

  // --- profile ---
  if (path === '/user') {
    if (method === 'get') return { username: user.username, email: user.email };
    if (method === 'put') {
      if (body.username) user.username = body.username;
      if (body.email) user.email = body.email;
      if (body.password) user.password = hashPassword(user.email, body.password);
      save();
      return { message: 'Profile Updated' };
    }
    if (method === 'delete') {
      d.txs = d.txs.filter((t) => t.UserId !== user.id);
      d.users = d.users.filter((u) => u.id !== user.id);
      save();
      return { message: 'Account deleted' };
    }
  }

  // --- cart ---
  if (path === '/cart') {
    const mine = d.cart.filter((c) => c.UserId === user.id);
    if (method === 'get') return mine;
    if (method === 'post') {
      const { id, name, image, price, amount } = body;
      const qty = amount || 1;
      const item = mine.find((c) => c.coinId === id);
      if (item) item.amount += qty;
      else d.cart.push({ id: d.next.cart++, coinId: id, name, image, price, amount: qty, UserId: user.id });
      save();
      return { message: 'Added' };
    }
    if (method === 'put') {
      const item = mine.find((c) => c.coinId === body.coinId);
      if (!item) throw fail(404, { error: 'Item not found' });
      if (body.action === 'increase') item.amount += 1;
      else if (body.action === 'decrease') {
        if (item.amount > 1) item.amount -= 1;
        else d.cart = d.cart.filter((c) => c !== item);
      }
      save();
      return { message: 'Updated' };
    }
    if (method === 'delete') {
      d.cart = d.cart.filter((c) => c.UserId !== user.id);
      save();
      return { message: 'Cart Cleared' };
    }
  }

  // --- transactions / portfolio ---
  if (path === '/crypto' && method === 'get') return d.txs.filter((t) => t.UserId === user.id);

  if (path === '/crypto/buy' && method === 'post') {
    (body.items || []).forEach((item) => {
      d.txs.push({
        id: d.next.tx++, UserId: user.id, coinName: item.name, amount: item.amount,
        priceAtBuy: item.price, paymentMethod: body.paymentMethod, note: 'Bulk Purchase',
      });
    });
    d.cart = d.cart.filter((c) => c.UserId !== user.id);
    save();
    return { message: 'Order Successful' };
  }

  if (path === '/crypto/sell' && method === 'post') {
    let left = parseFloat(body.amountToSell);
    d.txs.filter((t) => t.UserId === user.id && t.coinName === body.coinName).forEach((tx) => {
      if (left <= 0) return;
      if (tx.amount <= left) { left -= tx.amount; d.txs = d.txs.filter((t) => t !== tx); }
      else { tx.amount -= left; left = 0; }
    });
    save();
    return { message: 'Sold successfully' };
  }

  const one = path.match(/^\/crypto\/(\d+)$/);
  if (one) {
    const tx = d.txs.find((t) => t.id === Number(one[1]) && t.UserId === user.id);
    if (method === 'put') {
      if (tx) tx.note = body.note;
      save();
      return { message: 'Note Updated' };
    }
    if (method === 'delete') {
      if (!tx) throw fail(404, { message: 'Transaction not found' });
      d.txs = d.txs.filter((t) => t !== tx);
      save();
      return { message: 'Coin Sold' };
    }
  }

  throw fail(404, { error: `No demo route for ${method.toUpperCase()} ${path}` });
}

export default async function demoAdapter(config) {
  await sleep(120);
  const method = (config.method || 'get').toLowerCase();
  const path = String(config.url || '')
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^\/api/, '')
    .split('?')[0];
  const data = route(method, path, parseBody(config), config);
  return { data, status: 200, statusText: 'OK', headers: {}, config, request: {} };
}
