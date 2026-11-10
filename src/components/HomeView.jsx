import React from 'react';
import { Flame, CheckCircle, Play, Sparkles, Bookmark, Database } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.jsx';
import '../styles/Home.css';

export const HomeView = ({
  streak,
  done,
  wordsPerDay,
  allWordsCount,
  bookmarkedCount,
  engineInfo,
  onStartLearning,
  onStartQuiz,
  onOpenSettings,
}) => {
  return (
    <div className="home-container">
      {/* Streak Hero Banner */}
      <div className="streak-hero-card">
        <div className="streak-big-number">
          <span>{streak}</span>
          <Flame className="flame-icon" size={60} />
        </div>
        <div className="streak-label">kun ketma-ket</div>

        <div className="status-box">
          {done ? (
            <>
              <div className="status-title">Bugungi kun bajarildi! 🎉</div>
              <div className="status-subtitle">
                Siz bugungi {wordsPerDay} ta soʻz boʻyicha testni muvaffaqiyatli topshirdingiz. Streak saqlandi.
              </div>
              <div className="completed-badge">
                <CheckCircle size={18} />
                <span>Ertaga yangi {wordsPerDay} ta soʻz keladi</span>
              </div>
            </>
          ) : (
            <>
              <div className="status-title">Bugungi {wordsPerDay} ta soʻz</div>
              <div className="status-subtitle">
                Avval kartochkalarda oʻrganasiz, soʻngra test topshirasiz. Hammasi toʻgʻri boʻlmaguncha kun tugamaydi.
              </div>
            </>
          )}
        </div>
      </div>

      {/* PWA Install Promotion Banner */}
      <PWAInstallButton variant="button-card" />

      {/* Main Action Buttons */}
      {!done ? (
        <button className="btn-primary" onClick={onStartLearning}>
          <Play size={22} fill="currentColor" />
          <span>Boshlash ({wordsPerDay} ta soʻz)</span>
        </button>
      ) : (
        <button className="btn-primary" onClick={onStartQuiz}>
          <Sparkles size={22} />
          <span>Testni takrorlash</span>
        </button>
      )}

      {/* Quick Statistics Grid */}
      <div className="quick-stats-grid">
        <div className="quick-stat-card">
          <div className="stat-header">
            <Bookmark size={16} />
            <span>Lugʻat bazasi</span>
          </div>
          <div className="stat-val">{allWordsCount}</div>
        </div>

        <div className="quick-stat-card">
          <div className="stat-header">
            <Sparkles size={16} />
            <span>Tanlanganlar</span>
          </div>
          <div className="stat-val">{bookmarkedCount}</div>
        </div>
      </div>

      {/* Database Banner */}
      <div className="tip-banner">
        <Database className="tip-icon" size={24} />
        <div className="tip-text">
          <strong>Backend DB Status:</strong>{' '}
          {engineInfo?.isNeonConnected ? (
            <span style={{ color: 'var(--good-green)' }}>Neon PostgreSQL maʼlumotlar bazasi faol va ulangan!</span>
          ) : (
            <span>
              Hozirda maʼlumotlar lokal xotirada saqlanmoqda.{' '}
              <button
                onClick={onOpenSettings}
                style={{
                  color: 'var(--accent-gold)',
                  textDecoration: 'underline',
                  fontWeight: 700,
                  display: 'inline',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                }}
              >
                Neon DB sozlash
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
