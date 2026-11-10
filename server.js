delete globalThis.__dirname;
delete global.__dirname;

import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { dbService } from './server/db.js';

const app = express();
const PORT = process.env.PORT || 3000;
const TIMEZONE = 'Asia/Tashkent';

app.use(express.json());

// Date calculation helpers in Tashkent time
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

// ============================================================
// API ROUTES
// ============================================================

// Health & DB status check
app.get('/api/health', async (_req, res) => {
  const engineInfo = dbService.getEngineInfo();
  res.json({ status: 'ok', engine: engineInfo, serverTime: new Date().toISOString() });
});

// GET /api/today - Return today's batch, pool, streak, status
app.get('/api/today', async (_req, res) => {
  try {
    const state = await dbService.loadState();
    const allWords = await dbService.getWords();
    const bookmarks = await dbService.getBookmarks();
    const today = tashkentParts().dateKey;
    const done = state.lastDone === today;
    const streak = state.lastDone === today || state.lastDone === yesterdayKey() ? state.streak : 0;
    const perDay = state.wordsPerDay || 10;

    // Slice word batch starting from cursor
    const batch = [];
    const poolSize = allWords.length > 0 ? allWords.length : 1;
    for (let i = 0; i < perDay; i++) {
      const idx = (state.cursor + i) % poolSize;
      if (allWords[idx]) {
        batch.push(allWords[idx]);
      }
    }

    const engineInfo = dbService.getEngineInfo();

    res.json({
      done,
      streak,
      cursor: state.cursor,
      wordsPerDay: perDay,
      batch,
      pool: allWords.map((w) => w.uz),
      allWordsCount: allWords.length,
      bookmarks,
      engineInfo,
    });
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Server error' });
  }
});

// POST /api/complete - Complete today's daily 10 words, calculate streak
app.post('/api/complete', async (_req, res) => {
  try {
    const state = await dbService.loadState();
    const today = tashkentParts().dateKey;
    const perDay = state.wordsPerDay || 10;
    const allWords = await dbService.getWords();

    if (state.lastDone === today) {
      return res.json({ streak: state.streak, message: 'Bugungi soʻzlar allaqachon bajarilgan.' });
    }

    state.streak = state.lastDone === yesterdayKey() ? state.streak + 1 : 1;
    state.lastDone = today;
    state.cursor = (state.cursor + perDay) % (allWords.length || 1);

    await dbService.saveState(state);
    await dbService.recordDailyCompletion(today, state.streak, perDay);

    res.json({ streak: state.streak, done: true, lastDone: today });
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Error completing daily words' });
  }
});

// GET /api/words - List vocabulary with search, filters
app.get('/api/words', async (req, res) => {
  try {
    const words = await dbService.getWords();
    const bookmarks = await dbService.getBookmarks();

    const search = ((req.query.search) || '').toLowerCase().trim();
    const level = (req.query.level) || '';
    const bookmarkedOnly = req.query.bookmarked === 'true';

    let filtered = words.map((w) => ({
      ...w,
      isBookmarked: bookmarks.includes(w.id),
    }));

    if (search) {
      filtered = filtered.filter((w) => w.en.toLowerCase().includes(search) || w.uz.toLowerCase().includes(search));
    }
    if (level) {
      filtered = filtered.filter((w) => w.level === level);
    }
    if (bookmarkedOnly) {
      filtered = filtered.filter((w) => w.isBookmarked);
    }

    res.json({ words: filtered, total: filtered.length, totalPool: words.length });
  } catch (err) {
    res.status(500).json({ error: err?.message });
  }
});

// POST /api/words/custom - Add new custom word pair
app.post('/api/words/custom', async (req, res) => {
  try {
    const { en, uz, phonetic, level, category, exampleEn, exampleUz } = req.body;
    if (!en || !uz) {
      return res.status(400).json({ error: 'Inglizcha va Oʻzbekcha soʻz kiritilishi shart' });
    }

    const created = await dbService.addCustomWord({
      en: en.trim().toLowerCase(),
      uz: uz.trim().toLowerCase(),
      phonetic: phonetic ? phonetic.trim() : undefined,
      level: level || 'A1',
      category: category || 'Custom',
      exampleEn: exampleEn ? exampleEn.trim() : undefined,
      exampleUz: exampleUz ? exampleUz.trim() : undefined,
    });

    res.json({ success: true, word: created });
  } catch (err) {
    res.status(500).json({ error: err?.message });
  }
});

// POST /api/bookmark - Toggle bookmark
app.post('/api/bookmark', async (req, res) => {
  try {
    const { wordId } = req.body;
    if (!wordId) return res.status(400).json({ error: 'wordId required' });
    const isBookmarked = await dbService.toggleBookmark(wordId);
    res.json({ success: true, isBookmarked });
  } catch (err) {
    res.status(500).json({ error: err?.message });
  }
});

// GET /api/stats - History & streaks
app.get('/api/stats', async (_req, res) => {
  try {
    const history = await dbService.getHistory();
    const state = await dbService.loadState();
    const allWords = await dbService.getWords();
    const bookmarks = await dbService.getBookmarks();

    res.json({
      streak: state.streak,
      lastDone: state.lastDone,
      today: tashkentParts().dateKey,
      totalWords: allWords.length,
      bookmarkedCount: bookmarks.length,
      history,
    });
  } catch (err) {
    res.status(500).json({ error: err?.message });
  }
});

// POST /api/settings/neon-config - Set or test Neon DB URL
app.post('/api/settings/neon-config', async (req, res) => {
  try {
    const { connectionString } = req.body;
    if (!connectionString) {
      return res.status(400).json({ error: 'Connection string kiritilmadi' });
    }
    const result = await dbService.setCustomConnectionString(connectionString);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, engineInfo: dbService.getEngineInfo() });
  } catch (err) {
    res.status(500).json({ error: err?.message });
  }
});

// POST /api/ai/word-details - AI generated example sentence & mnemonic via Gemini API
app.post('/api/ai/word-details', async (req, res) => {
  try {
    const { wordEn, wordUz } = req.body;
    if (!wordEn || !wordUz) return res.status(400).json({ error: 'Soʻzlar yetishmayapti' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        exampleEn: `I use the word "${wordEn}" in my daily English speech.`,
        exampleUz: `Men har kunlik ingliz tili muloqotimda "${wordUz}" soʻzini ishlataman.`,
        mnemonic: `"${wordEn}" - (${wordUz}). Masalan: "${wordEn}" iborasini eslab qolish uchun uni amalda tez-tez takrorlang.`,
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `So'z: "${wordEn}" (O'zbekcha ma'nosi: "${wordUz}"). 
Format JSON exact:
{
  "exampleEn": "Tabiiy inglizcha namuna gap",
  "exampleUz": "Ushbu gapning o'zbekcha tarjimasi",
  "mnemonic": "So'zni eslab qolish uchun o'zbek tilida 1-2 jumlali qiziqarli eslatma/maslahat"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err) {
    res.json({
      exampleEn: `I practice "${req.body.wordEn}" every day.`,
      exampleUz: `Men har kuni "${req.body.wordUz}" soʻzini mashq qilaman.`,
      mnemonic: `Yangi soʻzlarni gaplar ichida ishlatish ularni oson va mustahkam eslab qolishga yordam beradi.`,
    });
  }
});

// ============================================================
// SERVER SETUP & VITE INTEGRATION
// ============================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) return next();

      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 Express Server ${PORT}-portda ishlamoqda (http://localhost:${PORT})`);
  });
}

startServer();
