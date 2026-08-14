import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import SplashScreen from './Components/SplashScreen';
import { pingBackend } from './services/api';
import './index.css';
import './styles/global-responsive.css';

/**
 * Use HashRouter when running inside Capacitor (file:// protocol) so
 * routes work without a server.  Use BrowserRouter everywhere else
 * (web browser, Vercel, Render) so the native back button works correctly.
 */
const isCapacitor = typeof window !== 'undefined' &&
  (window.location.protocol === 'file:' || window.Capacitor !== undefined);

const Router = isCapacitor ? HashRouter : BrowserRouter;

/* ── Wake up Render backend immediately on first page load ────
   Render free tier spins down after 15 min of inactivity.
   Firing a /api/health ping the moment the JS bundle loads
   gives the server ~10–15 s to wake up before the user
   navigates to the shop and triggers real API calls.
   ─────────────────────────────────────────────────────────── */
pingBackend();

/* ── PWA: Register service worker ─────────────────────────────
   Only runs in production on HTTPS (browser ignores it otherwise).
   The sw.js file in /public handles offline caching.
   ─────────────────────────────────────────────────────────── */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('[PWA] Service worker registered:', reg.scope);
      })
      .catch(err => {
        console.warn('[PWA] Service worker registration failed:', err);
      });
  });
}

function Root() {
  const [splashDone, setSplashDone] = useState(false);
  const handleDone = useCallback(() => setSplashDone(true), []);
  return (
    <>
      {!splashDone && <SplashScreen onDone={handleDone} />}
      <App />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Root />
    </Router>
  </React.StrictMode>
);
