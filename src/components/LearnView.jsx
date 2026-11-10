import React, { useState } from 'react';
import { Volume2, Bookmark, ArrowRight, ArrowLeft, Sparkles, Brain } from 'lucide-react';
import '../styles/Learn.css';

export const LearnView = ({
  batch,
  bookmarks,
  onToggleBookmark,
  onFinishLearning,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHint, setAiHint] = useState(null);

  if (!batch || batch.length === 0) {
    return (
      <div className="learn-container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <h2>Bugun uchun soʻzlar mavjud emas.</h2>
      </div>
    );
  }

  const currentWord = batch[currentIndex];
  const isBookmarked = bookmarks.includes(currentWord.id);
  const isLast = currentIndex === batch.length - 1;

  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = () => {
    setAiHint(null);
    if (isLast) {
      onFinishLearning();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setShowTranslation(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setAiHint(null);
      setCurrentIndex((prev) => prev - 1);
      setShowTranslation(true);
    }
  };

  const generateAiHint = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/word-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordEn: currentWord.en, wordUz: currentWord.uz }),
      });
      const data = await res.json();
      setAiHint(data);
    } catch (e) {
      setAiHint({ mnemonic: 'Soʻzni 3 marta baland ovozda qaytaring.' });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="learn-container">
      {/* Top Header & Progress Bar */}
      <div>
        <div className="learn-top-bar">
          <span className="progress-indicator">
            Soʻz: {currentIndex + 1} / {batch.length}
          </span>
          <span className="progress-indicator">
            {Math.round(((currentIndex + 1) / batch.length) * 100)}%
          </span>
        </div>
        <div className="learn-progress-track">
          <div
            className="learn-progress-fill"
            style={{ width: `${((currentIndex + 1) / batch.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Main Flashcard */}
      <div className="flashcard-wrapper">
        <div className="flashcard">
          <span className="word-level-tag">{currentWord.level || 'A1'}</span>

          <button
            className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
            onClick={() => onToggleBookmark(currentWord.id)}
            title="Tanlanganlarga saqlash"
          >
            <Bookmark size={20} fill={isBookmarked ? 'var(--accent-gold)' : 'none'} />
          </button>

          <div className="word-en">{currentWord.en}</div>
          {currentWord.phonetic && <div className="phonetic-text">{currentWord.phonetic}</div>}

          <button className="audio-btn" onClick={() => playAudio(currentWord.en)}>
            <Volume2 size={16} />
            <span>Taqdim etish</span>
          </button>

          {showTranslation && (
            <div className="word-uz-reveal">
              {currentWord.uz}
            </div>
          )}

          {/* Example Sentence Section */}
          <div className="example-box">
            <div className="example-en">
              "{aiHint?.exampleEn || currentWord.exampleEn || `${currentWord.en} is an important vocabulary word.`}"
            </div>
            <div className="example-uz">
              "{aiHint?.exampleUz || currentWord.exampleUz || `${currentWord.uz} — bu muhim inglizcha soʻz.`}"
            </div>
          </div>

          {/* AI Gemini Mnemonic Button */}
          {aiHint?.mnemonic ? (
            <div className="example-box" style={{ marginTop: 8, borderColor: 'var(--accent-gold)' }}>
              <div style={{ color: 'var(--accent-gold)', fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center' }}>
                <Brain size={16} />
                <span>AI Eslatmasi:</span>
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{aiHint.mnemonic}</div>
            </div>
          ) : (
            <button className="ai-hint-btn" onClick={generateAiHint} disabled={aiLoading}>
              <Sparkles size={14} />
              <span>{aiLoading ? 'AI maslahati tayyorlanmoqda...' : 'AI Eslatma yaratish'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="nav-actions">
        <button className="btn-secondary" onClick={handlePrev} disabled={currentIndex === 0}>
          <ArrowLeft size={18} />
          <span>Orqaga</span>
        </button>

        <button className="btn-primary" onClick={handleNext} style={{ flex: 2 }}>
          <span>{isLast ? 'Testni boshlash' : 'Keyingisi'}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
