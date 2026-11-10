import React, { useState, useEffect } from 'react';
import { Search, Plus, Volume2, Bookmark, X, Check } from 'lucide-react';
import { INITIAL_WORDS } from '../data/words.js';
import '../styles/Dictionary.css';

export const DictionaryView = ({ bookmarks, onToggleBookmark, onRefreshWords }) => {
  const [words, setWords] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal State for adding custom word
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEn, setNewEn] = useState('');
  const [newUz, setNewUz] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [newLevel, setNewLevel] = useState('A1');
  const [newExampleEn, setNewExampleEn] = useState('');
  const [newExampleUz, setNewExampleUz] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/words');
      if (res.ok) {
        const data = await res.json();
        const loaded = data.words || [];
        setWords(loaded);
        try {
          localStorage.setItem('sozlar_cached_words', JSON.stringify(loaded));
        } catch (_) {}
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Error fetching words via API, falling back to cache:', e);
    }

    // Offline fallback
    try {
      const cached = localStorage.getItem('sozlar_cached_words');
      if (cached) {
        setWords(JSON.parse(cached));
        setLoading(false);
        return;
      }
    } catch (_) {}

    setWords(
      INITIAL_WORDS.map((w) => ({
        ...w,
        isBookmarked: (bookmarks || []).includes(w.id),
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAddWord = async (e) => {
    e.preventDefault();
    if (!newEn || !newUz) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/words/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          en: newEn,
          uz: newUz,
          phonetic: newPhonetic,
          level: newLevel,
          exampleEn: newExampleEn,
          exampleUz: newExampleUz,
        }),
      });
      if (res.ok) {
        setNewEn('');
        setNewUz('');
        setNewPhonetic('');
        setNewExampleEn('');
        setNewExampleUz('');
        setIsModalOpen(false);
        await fetchWords();
        if (onRefreshWords) onRefreshWords();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter words
  const filtered = words.filter((w) => {
    const matchSearch =
      w.en.toLowerCase().includes(search.toLowerCase()) ||
      w.uz.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (activeFilter === 'bookmarks') return bookmarks.includes(w.id);
    if (activeFilter === 'custom') return Boolean(w.isCustom);
    if (['A1', 'A2', 'B1', 'B2', 'C1'].includes(activeFilter)) return w.level === activeFilter;

    return true;
  });

  return (
    <div className="dictionary-container">
      {/* Top Search & Add Button */}
      <div className="dictionary-top-row">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Inglizcha yoki Oʻzbekcha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="add-word-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Qoʻshish</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="filters-scroll">
        {[
          { id: 'all', label: 'Barchasi' },
          { id: 'bookmarks', label: `Tanlanganlar (${bookmarks.length})` },
          { id: 'custom', label: 'Mening soʻzlarim' },
          { id: 'A1', label: 'A1' },
          { id: 'A2', label: 'A2' },
          { id: 'B1', label: 'B1' },
          { id: 'B2', label: 'B2' },
          { id: 'C1', label: 'C1' },
        ].map((f) => (
          <button
            key={f.id}
            className={`filter-chip ${activeFilter === f.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Word List */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Yuklanmoqda...</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
          Soʻzlar topilmadi.
        </p>
      ) : (
        <div className="words-list-grid">
          {filtered.map((w) => {
            const isBm = bookmarks.includes(w.id);
            return (
              <div key={w.id} className="word-list-card">
                <div className="word-info-col">
                  <div className="word-header-row">
                    <span className="dict-word-en">{w.en}</span>
                    {w.phonetic && (
                      <span style={{ fontSize: 13, color: 'var(--accent-blue)', fontFamily: 'monospace' }}>
                        {w.phonetic}
                      </span>
                    )}
                    <span className="word-level-tag">{w.level || 'A1'}</span>
                  </div>
                  <div className="dict-word-uz">{w.uz}</div>
                  {w.exampleEn && (
                    <div className="dict-example-text">
                      "{w.exampleEn}"
                    </div>
                  )}
                </div>

                <div className="word-actions-row">
                  <button className="icon-action-btn" onClick={() => playAudio(w.en)} title="Ovoz chiqarish">
                    <Volume2 size={18} />
                  </button>

                  <button
                    className="icon-action-btn"
                    onClick={() => onToggleBookmark(w.id)}
                    title="Tanlanganlarga saqlash"
                    style={{ color: isBm ? 'var(--accent-gold)' : undefined }}
                  >
                    <Bookmark size={18} fill={isBm ? 'var(--accent-gold)' : 'none'} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form for Custom Words */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="modal-title">Yangi soʻz qoʻshish</div>
              <button className="icon-action-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddWord}>
              <div className="form-group">
                <label className="form-label">Inglizcha soʻz *</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: achieve"
                  value={newEn}
                  onChange={(e) => setNewEn(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Oʻzbekcha tarjimasi *</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: erishmoq"
                  value={newUz}
                  onChange={(e) => setNewUz(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Transkripsiyasi (Phonetic)</label>
                <input
                  type="text"
                  placeholder="masalan: /əˈtʃiːv/"
                  value={newPhonetic}
                  onChange={(e) => setNewPhonetic(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Daraja (Level)</label>
                <select value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Inglizcha namuna gap</label>
                <input
                  type="text"
                  placeholder="She worked hard to achieve her goals."
                  value={newExampleEn}
                  onChange={(e) => setNewExampleEn(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Oʻzbekcha tarjimasi</label>
                <input
                  type="text"
                  placeholder="U oʻz maqsadlariga erishish uchun..."
                  value={newExampleUz}
                  onChange={(e) => setNewExampleUz(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1 }}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  disabled={isSubmitting}
                >
                  <Check size={18} />
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
