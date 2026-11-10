import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import './index.css';

// Register PWA service worker with auto-update
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('PWA: Yangi yangilanish mavjud');
  },
  onOfflineReady() {
    console.log('PWA: Ilova toʻliq offlayn ishlashga tayyor');
  },
});

createRoot(document.getElementById('root')).render(<App />);
