import React from 'react';
import { Flame, BookOpen, BrainCircuit, Library, BarChart3, Settings, Moon, Sun, Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { PWAInstallButton } from './PWAInstallButton.jsx';
import '../styles/Navbar.css';

export const Navbar = ({
  activeTab,
  setActiveTab,
  streak,
  engineInfo,
  theme,
  toggleTheme,
  batchCount = 10,
}) => {
  const isOnline = useOnlineStatus();

  return (
    <>
      <header className="navbar-header">
        <div className="navbar-container">
          <div className="navbar-brand" onClick={() => setActiveTab('home')} role="button" tabIndex={0}>
            <div className="navbar-logo-icon">S</div>
            <span className="navbar-brand-name">Soʻzlar</span>
          </div>

          <div className="navbar-right">
            <PWAInstallButton variant="navbar" />

            {/* Offline/Online Network Indicator */}
            <div
              className={`network-pill ${isOnline ? 'online' : 'offline'}`}
              title={isOnline ? 'Internet aloqasi faol' : 'Offlayn kesh rejimida'}
            >
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span className="pill-text-desktop">{isOnline ? 'Onlayn' : 'Offlayn'}</span>
            </div>

            {/* Database Engine Status */}
            <div
              className={`db-badge ${engineInfo?.isNeonConnected ? 'neon' : 'local'}`}
              title={engineInfo?.isNeonConnected ? 'Neon DB Ulangan' : 'Lokal DB faol'}
              onClick={() => setActiveTab('settings')}
              role="button"
              tabIndex={0}
            >
              <div className="db-dot"></div>
              <span className="pill-text-desktop">{engineInfo?.isNeonConnected ? 'Neon' : 'Lokal'}</span>
            </div>

            {/* Streak Counter Pill */}
            <div
              className="streak-pill"
              onClick={() => setActiveTab('stats')}
              role="button"
              tabIndex={0}
              title="Ketma-ket kunlar (Statistika)"
            >
              <Flame size={16} fill="#FFC93C" />
              <span>{streak}</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title="Mavzuni almashtirish (Tun/Kun)"
              aria-label="Mavzuni almashtirish"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Settings Quick Access Button in Header */}
            <button
              className={`settings-header-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
              title="Sozlamalar"
              aria-label="Sozlamalar"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Desktop-only secondary tab strip (hidden on mobile, where bottom bar is used) */}
        <nav className="navbar-tabs desktop-only-tabs">
          <button
            className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <BookOpen size={18} />
            <span>Bosh sahifa</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'learn' ? 'active' : ''}`}
            onClick={() => setActiveTab('learn')}
          >
            <BrainCircuit size={18} />
            <span>Oʻrganish</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <Flame size={18} />
            <span>Test</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'dictionary' ? 'active' : ''}`}
            onClick={() => setActiveTab('dictionary')}
          >
            <Library size={18} />
            <span>Lugʻat</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <BarChart3 size={18} />
            <span>Statistika</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            <span>Sozlamalar</span>
          </button>
        </nav>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Optimized for 375px thumb reach) */}
      <nav className="mobile-bottom-nav" aria-label="Mobil asosiy navigatsiya">
        <div className="mobile-bottom-nav-inner">
          <button
            className={`mobile-tab-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
            aria-label="Bosh sahifa"
          >
            <div className="mobile-tab-icon-wrap">
              <BookOpen size={21} />
            </div>
            <span className="mobile-tab-label">Bosh</span>
          </button>

          <button
            className={`mobile-tab-item ${activeTab === 'learn' ? 'active' : ''}`}
            onClick={() => setActiveTab('learn')}
            aria-label="Oʻrganish"
          >
            <div className="mobile-tab-icon-wrap">
              <BrainCircuit size={21} />
              {batchCount > 0 && <span className="tab-micro-badge">{batchCount}</span>}
            </div>
            <span className="mobile-tab-label">Oʻrganish</span>
          </button>

          <button
            className={`mobile-tab-item ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
            aria-label="Test"
          >
            <div className="mobile-tab-icon-wrap quiz-accent-tab">
              <Flame size={21} fill={activeTab === 'quiz' ? '#FFC93C' : 'none'} />
            </div>
            <span className="mobile-tab-label">Test</span>
          </button>

          <button
            className={`mobile-tab-item ${activeTab === 'dictionary' ? 'active' : ''}`}
            onClick={() => setActiveTab('dictionary')}
            aria-label="Lugʻat"
          >
            <div className="mobile-tab-icon-wrap">
              <Library size={21} />
            </div>
            <span className="mobile-tab-label">Lugʻat</span>
          </button>

          <button
            className={`mobile-tab-item ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
            aria-label="Statistika"
          >
            <div className="mobile-tab-icon-wrap">
              <BarChart3 size={21} />
            </div>
            <span className="mobile-tab-label">Statistika</span>
          </button>
        </div>
      </nav>
    </>
  );
};
