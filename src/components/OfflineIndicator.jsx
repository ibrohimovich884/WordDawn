import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';

export const OfflineIndicator = ({ onRetry }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '76px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'linear-gradient(135deg, #b45309, #d97706)',
        color: '#ffffff',
        padding: '10px 18px',
        borderRadius: '30px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(217, 119, 6, 0.3)',
        fontSize: '13px',
        fontWeight: '600',
        maxWidth: '92vw',
        animation: 'fadeInSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          flexShrink: 0,
        }}
      >
        <WifiOff size={15} color="#fff" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
        <span>Offlayn rejim faol</span>
        <span style={{ fontSize: '11px', opacity: 0.9, fontWeight: 400 }}>
          Keshdagi soʻzlar va mashqlar ishlamoqda
        </span>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginLeft: '6px',
            background: 'rgba(255, 255, 255, 0.25)',
            border: 'none',
            color: '#fff',
            borderRadius: '16px',
            padding: '4px 10px',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: '600',
            transition: 'background 0.2s',
          }}
          title="Qayta ulanishni tekshirish"
        >
          <RefreshCw size={12} />
          <span>Tekshirish</span>
        </button>
      )}
    </div>
  );
};
