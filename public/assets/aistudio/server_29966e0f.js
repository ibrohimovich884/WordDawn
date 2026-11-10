const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Bot, InlineKeyboard } = require('grammy');
const WORDS = require('./words');

// ============================================================
// 1. SOZLAMALAR
// ============================================================
const BOT_TOKEN = process.env.BOT_TOKEN; // BotFather bergan token
const OWNER_ID = Number(process.env.OWNER_ID); // sizning Telegram ID raqamingiz
const WEB_APP_URL = process.env.WEB_APP_URL; // https://sizning-sayt.onrender.com
const PORT = process.env.PORT || 3000;
const DEV = process.env.DEV === '1'; // faqat kompyuterda sinash uchun (login tekshiruvi oʻchadi)

const DATA_FILE = path.join(__dirname, 'data.json');
const WORDS_PER_DAY = 10;
const REMINDER_HOURS = [8, 9, 10, 12, 14, 17, 20]; // Toshkent vaqti bilan
const TIMEZONE = 'Asia/Tashkent';

if (!BOT_TOKEN || !OWNER_ID || !WEB_APP_URL) {
  console.error('BOT_TOKEN, OWNER_ID va WEB_APP_URL kerak.');
  process.exit(1);
}

// ============================================================
// 2. VAQT VA SAQLASH
// ============================================================
function tashkentParts(date) {
  const d = date || new Date();
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const p = {};
  f.formatToParts(d).forEach((x) => {
    p[x.type] = x.value;
  });
  return {
    dateKey: p.year + '-' + p.month + '-' + p.day,
    hour: Number(p.hour) % 24,
    minute: Number(p.minute),
  };
}

function yesterdayKey() {
  return tashkentParts(new Date(Date.now() - 24 * 60 * 60 * 1000)).dateKey;
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return { cursor: 0, lastDone: '', streak: 0, lastReminder: '' };
  }
}

function saveState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function getBatch(cursor) {
  const batch = [];
  for (let i = 0; i < WORDS_PER_DAY; i++) {
    batch.push(WORDS[(cursor + i) % WORDS.length]);
  }
  return batch;
}

// ============================================================
// 3. TELEGRAM LOGIN TEKSHIRUVI (Mini App initData)
// ============================================================
function checkInitData(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .map((e) => e[0] + '=' + e[1])
    .sort()
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const calc = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  if (calc !== hash) return null;
  const authDate = Number(params.get('auth_date'));
  if (Date.now() / 1000 - authDate > 24 * 60 * 60) return null;
  try {
    return JSON.parse(params.get('user'));
  } catch (e) {
    return null;
  }
}

function auth(req, res, next) {
  if (DEV) return next();
  const user = checkInitData(req.headers['x-init-data'] || '');
  if (!user || user.id !== OWNER_ID) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

// ============================================================
// 4. BOT
// ============================================================
const bot = new Bot(BOT_TOKEN);

function startKeyboard() {
  return new InlineKeyboard().webApp('Boshlash', WEB_APP_URL);
}

bot.command('start', async (ctx) => {
  if (ctx.from.id !== OWNER_ID) {
    return ctx.reply('Bu shaxsiy bot.');
  }
  try {
    await bot.api.setChatMenuButton({
      chat_id: OWNER_ID,
      menu_button: { type: 'web_app', text: 'Soʻzlar', web_app: { url: WEB_APP_URL } },
    });
  } catch (e) {
    console.error('menu button xato:', e.message);
  }
  await ctx.reply('Har kuni 10 ta soʻz. Boshlash uchun tugmani bosing.', {
    reply_markup: startKeyboard(),
  });
});

bot.catch((err) => {
  console.error('bot xato:', err.message);
});

// ============================================================
// 5. ESLATMA SIKLI (har daqiqada tekshiradi)
// ============================================================
setInterval(async () => {
  try {
    const t = tashkentParts();
    const state = loadState();
    if (state.lastDone === t.dateKey) return;
    if (REMINDER_HOURS.indexOf(t.hour) === -1) return;
    const slot = t.dateKey + '-' + t.hour;
    if (state.lastReminder === slot) return;
    state.lastReminder = slot;
    saveState(state);
    const text =
      t.hour === REMINDER_HOURS[0]
        ? 'Xayrli tong! Bugungi 10 ta soʻz kutyapti.'
        : 'Bugungi soʻzlar hali bajarilmadi. Streak xavf ostida.';
    await bot.api.sendMessage(OWNER_ID, text, { reply_markup: startKeyboard() });
  } catch (e) {
    console.error('eslatma xato:', e.message);
  }
}, 60 * 1000);

// ============================================================
// 6. WEB SERVER VA API
// ============================================================
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.send('ok'));

app.get('/api/today', auth, (req, res) => {
  const state = loadState();
  const today = tashkentParts().dateKey;
  const done = state.lastDone === today;
  const streak = state.lastDone === today || state.lastDone === yesterdayKey() ? state.streak : 0;
  res.json({
    done: done,
    streak: streak,
    batch: getBatch(state.cursor),
    pool: WORDS.map((w) => w.uz),
  });
});

app.post('/api/complete', auth, async (req, res) => {
  const state = loadState();
  const today = tashkentParts().dateKey;
  if (state.lastDone === today) {
    return res.json({ streak: state.streak });
  }
  state.streak = state.lastDone === yesterdayKey() ? state.streak + 1 : 1;
  state.lastDone = today;
  state.cursor = (state.cursor + WORDS_PER_DAY) % WORDS.length;
  saveState(state);
  res.json({ streak: state.streak });
  try {
    await bot.api.sendMessage(OWNER_ID, 'Bugun bajarildi. Ketma-ket ' + state.streak + ' kun.');
  } catch (e) {
    console.error('xabar xato:', e.message);
  }
});

app.listen(PORT, () => {
  console.log('Server ' + PORT + '-portda ishlayapti');
});

bot.start();
