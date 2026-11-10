import React, { useEffect, useState } from 'react';
import { Flame, Calendar, CheckCircle } from 'lucide-react';
import '../styles/Stats.css';

export const StatsView = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  if (!stats) {
    return (
      <div className="stats-container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <p>Statistika yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="stats-container">
      {/* 3 Metrics Row */}
      <div className="stats-grid">
        <div className="stat-metric-card streak-hero-metric">
          <div className="metric-num streak-num-flex">
            <span>{stats.streak}</span>
            <Flame size={24} fill="#FFC93C" className="streak-stat-flame" />
          </div>
          <div className="metric-lbl">Ketma-ket kunlar (Streak)</div>
        </div>

        <div className="stat-metric-card">
          <div className="metric-num">{stats.totalWords}</div>
          <div className="metric-lbl">Lugʻatdagi soʻzlar</div>
        </div>

        <div className="stat-metric-card">
          <div className="metric-num">{stats.bookmarkedCount}</div>
          <div className="metric-lbl">Tanlanganlar</div>
        </div>
      </div>

      {/* History List */}
      <div className="history-card">
        <div className="history-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} />
          <span>Bajarilish tarixi</span>
        </div>

        {stats.history.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Hali tarix mavjud emas. Bugungi testni bajarib birinchi natijangizni qayd eting!
          </p>
        ) : (
          <div className="history-list">
            {stats.history.map((h, i) => (
              <div key={i} className="history-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle size={18} color="var(--good-green)" />
                  <span className="date-badge">{h.dateKey}</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{h.wordsCount || 10} ta soʻz</span>
                  <span className="streak-tag">Streak: {h.streak} kun 🔥</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
