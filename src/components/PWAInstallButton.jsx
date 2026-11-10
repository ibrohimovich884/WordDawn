import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';

export const PWAInstallButton = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '14px', fontWeight: '600' }}>
          <Check size={18} />
          <span>Soʻzlar ilovasi qurilmangizga oʻrnatilgan</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstalledNotice(true);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General prompt or info if neither beforeinstallprompt nor iOS detected
      setShowIOSModal(true);
    }
  };

  if (variant === 'button-card') {
    return (
      <>
        <div
          className="pwa-card-wrapper"
          style={{
            background: 'linear-gradient(135deg, rgba(20, 76, 102, 0.4), rgba(15, 43, 59, 0.6))',
            border: '1px solid rgba(45, 212, 191, 0.25)',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            marginTop: '8px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px', flex: '1 1 180px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(45, 212, 191, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2DD4BF',
                flexShrink: 0,
              }}
            >
              <Smartphone size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '13.5px' }}>Soʻzlar ilovasini oʻrnatish</div>
              <div style={{ fontSize: '11.5px', opacity: 0.75 }}>100% offlayn rejimda ishlaydi</div>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              flexShrink: 0,
              marginLeft: 'auto',
            }}
          >
            <Download size={14} />
            <span>Oʻrnatish</span>
          </button>
        </div>

        {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
      </>
    );
  }

  // Navbar variant
  return (
    <>
      <button
        onClick={handleInstallClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'linear-gradient(135deg, #0284c7, #0369a1)',
          color: '#ffffff',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
          transition: 'all 0.2s ease',
        }}
        title="Ilovani oʻrnatish (PWA)"
      >
        <Download size={14} />
        <span className="pwa-btn-text">Oʻrnatish</span>
      </button>

      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
    </>
  );
};

const IOSInstallModal = ({ onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#17394D',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#ffffff',
          borderRadius: '20px',
          maxWidth: '380px',
          width: '100%',
          padding: '24px',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#ffffff',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#0F2A3A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <img src="/pwa-192x192.png" alt="Soʻzlar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Soʻzlar PWA</h3>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>Bosh ekranga oʻrnatish</span>
          </div>
        </div>

        <p style={{ fontSize: '13px', lineHeight: '1.5', opacity: 0.9, marginBottom: '16px' }}>
          Ilovani telefoningizga oʻrnatib, internetsiz ham toʻliq mustaqil soʻz yodlash va test topshirish imkoniga ega boʻling:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(2, 132, 199, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                flexShrink: 0,
              }}
            >
              <Share2 size={16} />
            </div>
            <span>
              1. Brauzer menyusidagi <strong>Ulashish (Share)</strong> tugmasini bosing.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                flexShrink: 0,
              }}
            >
              <PlusSquare size={16} />
            </div>
            <span>
              2. Menyudan <strong>"Bosh ekranga qoʻshish" (Add to Home Screen)</strong> bandini tanlang.
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '20px',
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            color: '#fff',
            padding: '10px',
            borderRadius: '12px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Tushunarli
        </button>
      </div>
    </div>
  );
};
