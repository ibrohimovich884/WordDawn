import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, Send, Save, RefreshCw, Smartphone, WifiOff, Wifi } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.jsx';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import '../styles/Settings.css';

export const SettingsView = ({
  engineInfo,
  wordsPerDay,
  onRefreshState,
}) => {
  const [connStr, setConnStr] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const isOnline = useOnlineStatus();

  const handleConnectNeon = async (e) => {
    e.preventDefault();
    if (!connStr.trim()) return;

    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch('/api/settings/neon-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connStr.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error || 'Ulanib boʻlmadi' });
      } else {
        setMsg({ type: 'success', text: 'Neon DB muvaffaqiyatli ulashdi va jadvallar yaratildi!' });
        onRefreshState();
      }
    } catch (err) {
      setMsg({ type: 'error', text: err?.message || 'Tarmoq xatosi' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-container">
      {/* PWA & Offline Support Card */}
      <div className="settings-card">
        <div className="settings-title">
          <Smartphone size={22} color="var(--accent-gold)" />
          <span>Progressive Web App (PWA) & Offlayn Rejim</span>
        </div>

        <div className="settings-desc">
          Ilova qurilmangizga mustaqil ilova (PWA) sifatida oʻrnatiladi va internet mavjud boʻlmaganda ham avtomatik kesh yordamida toʻliq ishlaydi.
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: '12px',
            backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.35)'}`,
            marginBottom: '12px',
          }}
        >
          {isOnline ? <Wifi size={18} color="#10B981" /> : <WifiOff size={18} color="#F59E0B" />}
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: isOnline ? '#10B981' : '#F59E0B' }}>
              {isOnline ? 'Onlayn Holat' : 'Offlayn Rejim Faol'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.85 }}>
              {isOnline
                ? 'Tarmoq ulangan. Barcha oʻzgarishlar sinxronlanadi.'
                : 'Internet yoʻq. Soʻzlar, test va lugʻat keshdan ishlatilmoqda.'}
            </div>
          </div>
        </div>

        <PWAInstallButton variant="settings" />
      </div>

      {/* Neon DB Section */}
      <div className="settings-card">
        <div className="settings-title">
          <Database size={22} color="var(--accent-gold)" />
          <span>Neon DB (PostgreSQL) Maʼlumotlar Bazasi</span>
        </div>

        <div className="settings-desc">
          Backend barcha soʻzlar, test natijalari, tanlanganlar va streak maʼlumotlarini Neon DB ga avtomatik saqlaydi.
        </div>

        {engineInfo?.isNeonConnected ? (
          <div className="neon-status-box">
            <CheckCircle2 size={20} />
            <span>Neon DB ulangan va faol ishlamoqda!</span>
          </div>
        ) : (
          <div className="neon-status-box error">
            <AlertTriangle size={20} />
            <span>
              {engineInfo?.connectionError || 'DATABASE_URL oʻrnatilmagan (Hozirda Local JSON faol)'}
            </span>
          </div>
        )}

        <form onSubmit={handleConnectNeon} className="connection-input-group">
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
            Neon Connection URI (DATABASE_URL):
          </label>
          <input
            type="password"
            placeholder="postgres://user:pass@ep-name.region.aws.neon.tech/neondb?sslmode=require"
            value={connStr}
            onChange={(e) => setConnStr(e.target.value)}
          />
          <button type="submit" className="btn-save-neon" disabled={saving}>
            {saving ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Tekshirilmoqda...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Neon DB ga ulanish</span>
              </>
            )}
          </button>
        </form>

        {msg && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              fontSize: 14,
              backgroundColor: msg.type === 'success' ? 'var(--good-green-bg)' : 'var(--bad-red-bg)',
              color: msg.type === 'success' ? 'var(--good-green)' : 'var(--bad-red)',
            }}
          >
            {msg.text}
          </div>
        )}
      </div>

      {/* Telegram Mini App & Bot Info */}
      <div className="settings-card">
        <div className="settings-title">
          <Send size={22} color="var(--accent-blue)" />
          <span>Telegram Mini App va Bot</span>
        </div>

        <div className="settings-desc">
          Ushbu ilova Telegram Mini App rejimi bilan toʻliq moslashtirilgan. BotFather tokeningizni{' '}
          <code>BOT_TOKEN</code> muhit oʻzgaruvchisiga joylashtirishingiz va Telegram boti orqali kunlik eslatmalar olishingiz mumkin.
        </div>
      </div>
    </div>
  );
};
