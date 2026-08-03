import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import SplashScreen from './Components/SplashScreen';
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
