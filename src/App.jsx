import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { HomeView } from './components/HomeView.jsx';
import { LearnView } from './components/LearnView.jsx';
import { QuizView } from './components/QuizView.jsx';
import { DictionaryView } from './components/DictionaryView.jsx';
import { StatsView } from './components/StatsView.jsx';
import { SettingsView } from './components/SettingsView.jsx';
import { OfflineIndicator } from './components/OfflineIndicator.jsx';
import { INITIAL_WORDS } from './data/words.js';
import './styles/index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [theme, setTheme] = useState('dark');

  // Backend state
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [wordsPerDay, setWordsPerDay] = useState(10);
  const [batch, setBatch] = useState([]);
  const [pool, setPool] = useState([]);
  const [allWordsCount, setAllWordsCount] = useState(0);
  const [bookmarks, setBookmarks] = useState([]);
  const [engineInfo, setEngineInfo] = useState({
    isNeonConnected: false,
    connectionError: null,
    hasDatabaseUrl: false,
  });

  // Initialize Telegram WebApp setup if present
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor(theme === 'dark' ? '#17394D' : '#FFFFFF');
      tg.setBackgroundColor(theme === 'dark' ? '#0F2A3A' : '#F4F7F6');
    }
  }, [theme]);

  // Load state from Express API with full offline fallback
  const loadTodayState = async () => {
    try {
      const res = await fetch('/api/today');
      if (res.ok) {
        const data = await res.json();
        setStreak(data.streak || 0);
        setDone(data.done || false);
        setWordsPerDay(data.wordsPerDay || 10);
        setBatch(data.batch || []);
        setPool(data.pool || []);
        setAllWordsCount(data.allWordsCount || 0);
        setBookmarks(data.bookmarks || []);
        if (data.engineInfo) {
          setEngineInfo(data.engineInfo);
        }
        try {
          localStorage.setItem('sozlar_cached_state', JSON.stringify(data));
        } catch (_) {}
        return;
      }
    } catch (err) {
      console.warn('Network issue, activating offline mode:', err);
    }

    // Offline cache fallback
    try {
      const cached = localStorage.getItem('sozlar_cached_state');
      if (cached) {
        const data = JSON.parse(cached);
        setStreak(data.streak || 0);
        setDone(data.done || false);
        setWordsPerDay(data.wordsPerDay || 10);
        setBatch(data.batch || INITIAL_WORDS.slice(0, 10));
        setPool(data.pool || INITIAL_WORDS.map((w) => w.uz));
        setAllWordsCount(data.allWordsCount || INITIAL_WORDS.length);
        setBookmarks(data.bookmarks || []);
        return;
      }
    } catch (_) {}

    // First-run offline fallback
    setWordsPerDay(10);
    setBatch(INITIAL_WORDS.slice(0, 10));
    setPool(INITIAL_WORDS.map((w) => w.uz));
    setAllWordsCount(INITIAL_WORDS.length);
  };

  useEffect(() => {
    loadTodayState();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleToggleBookmark = async (wordId) => {
    // Optimistic offline update
    setBookmarks((prev) => {
      const next = prev.includes(wordId) ? prev.filter((id) => id !== wordId) : [...prev, wordId];
      try {
        localStorage.setItem('sozlar_bookmarks', JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    try {
      const res = await fetch('/api/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId }),
      });
      const data = await res.json();
      if (data.success) {
        setBookmarks((prev) =>
          data.isBookmarked ? [...new Set([...prev, wordId])] : prev.filter((id) => id !== wordId)
        );
      }
    } catch (err) {
      console.warn('Bookmark offline sync pending:', err);
    }
  };

  const handleCompleteQuiz = async () => {
    let updatedStreak = streak + 1;
    try {
      const res = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        updatedStreak = data.streak || streak + 1;
      }
    } catch (err) {
      console.warn('Completed quiz stored in offline mode:', err);
    }
    setStreak(updatedStreak);
    setDone(true);

    try {
      const cached = JSON.parse(localStorage.getItem('sozlar_cached_state') || '{}');
      cached.done = true;
      cached.streak = updatedStreak;
      localStorage.setItem('sozlar_cached_state', JSON.stringify(cached));
    } catch (_) {}

    return updatedStreak;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streak={streak}
        engineInfo={engineInfo}
        theme={theme}
        toggleTheme={toggleTheme}
        batchCount={batch?.length || wordsPerDay}
      />

      <main className="app-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'home' && (
          <HomeView
            streak={streak}
            done={done}
            wordsPerDay={wordsPerDay}
            allWordsCount={allWordsCount}
            bookmarkedCount={bookmarks.length}
            engineInfo={engineInfo}
            onStartLearning={() => setActiveTab('learn')}
            onStartQuiz={() => setActiveTab('quiz')}
            onOpenSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'learn' && (
          <LearnView
            batch={batch}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onFinishLearning={() => setActiveTab('quiz')}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            batch={batch}
            pool={pool}
            onCompleteQuiz={handleCompleteQuiz}
          />
        )}

        {activeTab === 'dictionary' && (
          <DictionaryView
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onRefreshWords={loadTodayState}
          />
        )}

        {activeTab === 'stats' && <StatsView />}

        {activeTab === 'settings' && (
          <SettingsView
            engineInfo={engineInfo}
            wordsPerDay={wordsPerDay}
            onRefreshState={loadTodayState}
          />
        )}
      </main>

      <OfflineIndicator onRetry={loadTodayState} />
    </div>
  );
}
