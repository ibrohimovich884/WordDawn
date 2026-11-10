import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { INITIAL_WORDS } from '../src/data/words.js';

const { Pool } = pg;
const DATA_FILE = path.join(process.cwd(), 'data.json');

class DatabaseService {
  constructor() {
    this.pool = null;
    this.isNeonConnected = false;
    this.connectionError = null;
    this.initPool();
  }

  getEngineInfo() {
    return {
      isNeonConnected: this.isNeonConnected,
      connectionError: this.connectionError,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL),
    };
  }

  async setCustomConnectionString(url) {
    try {
      const testPool = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });
      await testPool.query('SELECT 1');
      await testPool.end();

      process.env.DATABASE_URL = url;
      await this.initPool();
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.message || 'Neon DB ulanishida xatolik' };
    }
  }

  async initPool() {
    const connStr = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
    if (!connStr) {
      this.isNeonConnected = false;
      this.connectionError = 'DATABASE_URL muhit oʻzgaruvchisi berilmagan (Local JSON fallback faol)';
      return;
    }

    try {
      this.pool = new Pool({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false },
      });

      // Test connection & bootstrap Neon schema
      await this.pool.query('SELECT NOW()');
      await this.bootstrapNeonSchema();
      this.isNeonConnected = true;
      this.connectionError = null;
      console.log('✅ Neon DB muvaffaqiyatli ulangan!');
    } catch (err) {
      console.error('❌ Neon DB ulanish xatosi:', err?.message);
      this.isNeonConnected = false;
      this.connectionError = err?.message || 'Neon DB ga ulanib boʻlmadi';
      this.pool = null;
    }
  }

  async bootstrapNeonSchema() {
    if (!this.pool) return;

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS user_state (
        id VARCHAR(50) PRIMARY KEY,
        cursor INTEGER DEFAULT 0,
        last_done VARCHAR(20) DEFAULT '',
        streak INTEGER DEFAULT 0,
        words_per_day INTEGER DEFAULT 10,
        last_reminder VARCHAR(50) DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vocabulary (
        id VARCHAR(50) PRIMARY KEY,
        en VARCHAR(255) NOT NULL,
        uz VARCHAR(255) NOT NULL,
        phonetic VARCHAR(255),
        level VARCHAR(10),
        category VARCHAR(100),
        example_en TEXT,
        example_uz TEXT,
        is_custom BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_bookmarks (
        word_id VARCHAR(50) PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS daily_history (
        id SERIAL PRIMARY KEY,
        date_key VARCHAR(20) UNIQUE NOT NULL,
        streak_count INTEGER NOT NULL,
        words_count INTEGER NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed initial vocabulary into Neon DB if empty
    const { rows } = await this.pool.query('SELECT COUNT(*) FROM vocabulary');
    if (parseInt(rows[0].count, 10) === 0) {
      for (const w of INITIAL_WORDS) {
        await this.pool.query(
          `INSERT INTO vocabulary (id, en, uz, phonetic, level, category, example_en, example_uz, is_custom)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [w.id, w.en, w.uz, w.phonetic || '', w.level || 'A1', w.category || 'General', w.exampleEn || '', w.exampleUz || '', w.isCustom || false]
        );
      }
    }
  }

  async loadState() {
    if (this.isNeonConnected && this.pool) {
      try {
        const { rows } = await this.pool.query('SELECT * FROM user_state WHERE id = $1', ['default_user']);
        if (rows.length > 0) {
          return {
            cursor: rows[0].cursor ?? 0,
            lastDone: rows[0].last_done ?? '',
            streak: rows[0].streak ?? 0,
            wordsPerDay: rows[0].words_per_day ?? 10,
            lastReminder: rows[0].last_reminder ?? '',
          };
        }
      } catch (e) {
        console.error('Neon DB loadState Error:', e);
      }
    }

    try {
      if (fs.existsSync(DATA_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        return {
          cursor: parsed.cursor ?? 0,
          lastDone: parsed.lastDone ?? '',
          streak: parsed.streak ?? 0,
          wordsPerDay: parsed.wordsPerDay ?? 10,
          lastReminder: parsed.lastReminder ?? '',
        };
      }
    } catch (e) {}

    return { cursor: 0, lastDone: '', streak: 0, wordsPerDay: 10, lastReminder: '' };
  }

  async saveState(state) {
    if (this.isNeonConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO user_state (id, cursor, last_done, streak, words_per_day, last_reminder, updated_at)
           VALUES ('default_user', $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET
             cursor = EXCLUDED.cursor,
             last_done = EXCLUDED.last_done,
             streak = EXCLUDED.streak,
             words_per_day = EXCLUDED.words_per_day,
             last_reminder = EXCLUDED.last_reminder,
             updated_at = CURRENT_TIMESTAMP`,
          [state.cursor, state.lastDone, state.streak, state.wordsPerDay, state.lastReminder]
        );
      } catch (e) {
        console.error('Neon DB saveState Error:', e);
      }
    }

    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
    } catch (e) {}
  }

  async getWords() {
    if (this.isNeonConnected && this.pool) {
      try {
        const { rows } = await this.pool.query('SELECT * FROM vocabulary ORDER BY created_at ASC');
        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            en: r.en,
            uz: r.uz,
            phonetic: r.phonetic,
            level: r.level,
            category: r.category,
            exampleEn: r.example_en,
            exampleUz: r.example_uz,
            isCustom: r.is_custom,
          }));
        }
      } catch (e) {
        console.error('Neon DB getWords Error:', e);
      }
    }

    try {
      const customPath = path.join(process.cwd(), 'custom_words.json');
      let customWords = [];
      if (fs.existsSync(customPath)) {
        customWords = JSON.parse(fs.readFileSync(customPath, 'utf8'));
      }
      return [...INITIAL_WORDS, ...customWords];
    } catch (e) {
      return INITIAL_WORDS;
    }
  }

  async addCustomWord(word) {
    const newId = 'w_' + Date.now();
    const newWord = { ...word, id: newId, isCustom: true };

    if (this.isNeonConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO vocabulary (id, en, uz, phonetic, level, category, example_en, example_uz, is_custom)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
          [newId, newWord.en, newWord.uz, newWord.phonetic || '', newWord.level || 'A1', newWord.category || 'Custom', newWord.exampleEn || '', newWord.exampleUz || '']
        );
        return newWord;
      } catch (e) {
        console.error('Neon DB addCustomWord error:', e);
      }
    }

    try {
      const customPath = path.join(process.cwd(), 'custom_words.json');
      let customWords = [];
      if (fs.existsSync(customPath)) {
        customWords = JSON.parse(fs.readFileSync(customPath, 'utf8'));
      }
      customWords.push(newWord);
      fs.writeFileSync(customPath, JSON.stringify(customWords, null, 2));
    } catch (e) {}

    return newWord;
  }

  async getBookmarks() {
    if (this.isNeonConnected && this.pool) {
      try {
        const { rows } = await this.pool.query('SELECT word_id FROM user_bookmarks');
        return rows.map((r) => r.word_id);
      } catch (e) {}
    }
    try {
      const bmPath = path.join(process.cwd(), 'bookmarks.json');
      if (fs.existsSync(bmPath)) {
        return JSON.parse(fs.readFileSync(bmPath, 'utf8'));
      }
    } catch (e) {}
    return [];
  }

  async toggleBookmark(wordId) {
    const bookmarks = await this.getBookmarks();
    const exists = bookmarks.includes(wordId);

    if (this.isNeonConnected && this.pool) {
      try {
        if (exists) {
          await this.pool.query('DELETE FROM user_bookmarks WHERE word_id = $1', [wordId]);
        } else {
          await this.pool.query('INSERT INTO user_bookmarks (word_id) VALUES ($1) ON CONFLICT DO NOTHING', [wordId]);
        }
        return !exists;
      } catch (e) {}
    }

    const updated = exists ? bookmarks.filter((id) => id !== wordId) : [...bookmarks, wordId];
    try {
      const bmPath = path.join(process.cwd(), 'bookmarks.json');
      fs.writeFileSync(bmPath, JSON.stringify(updated, null, 2));
    } catch (e) {}
    return !exists;
  }

  async recordDailyCompletion(dateKey, streak, wordsCount) {
    if (this.isNeonConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO daily_history (date_key, streak_count, words_count, completed_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (date_key) DO UPDATE SET streak_count = EXCLUDED.streak_count, words_count = EXCLUDED.words_count`,
          [dateKey, streak, wordsCount]
        );
      } catch (e) {}
    }

    try {
      const histPath = path.join(process.cwd(), 'daily_history.json');
      let history = [];
      if (fs.existsSync(histPath)) {
        history = JSON.parse(fs.readFileSync(histPath, 'utf8'));
      }
      const existingIdx = history.findIndex((h) => h.dateKey === dateKey);
      if (existingIdx >= 0) {
        history[existingIdx] = { dateKey, streak, wordsCount, completedAt: new Date().toISOString() };
      } else {
        history.push({ dateKey, streak, wordsCount, completedAt: new Date().toISOString() });
      }
      fs.writeFileSync(histPath, JSON.stringify(history, null, 2));
    } catch (e) {}
  }

  async getHistory() {
    if (this.isNeonConnected && this.pool) {
      try {
        const { rows } = await this.pool.query('SELECT date_key as "dateKey", streak_count as "streak", words_count as "wordsCount", completed_at as "completedAt" FROM daily_history ORDER BY date_key DESC');
        if (rows.length > 0) return rows;
      } catch (e) {}
    }

    try {
      const histPath = path.join(process.cwd(), 'daily_history.json');
      if (fs.existsSync(histPath)) {
        return JSON.parse(fs.readFileSync(histPath, 'utf8'));
      }
    } catch (e) {}
    return [];
  }
}

export const dbService = new DatabaseService();
