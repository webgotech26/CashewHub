/**
 * usePWAInstall.js
 *
 * Captures the browser's `beforeinstallprompt` event so we can
 * trigger the native A2HS (Add to Home Screen) dialog ourselves,
 * rather than relying on the auto-banner which Chrome often suppresses.
 *
 * Usage:
 *   const { canInstall, promptInstall, isInstalled } = usePWAInstall();
 *
 * Returns:
 *   canInstall     {boolean}  — true when the deferred prompt is ready
 *   promptInstall  {function} — call to show the native install dialog
 *   isInstalled    {boolean}  — true when running in standalone mode already
 */
import { useState, useEffect, useCallback } from 'react';

export default function usePWAInstall() {
  /* The browser's deferred BeforeInstallPromptEvent */
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall,     setCanInstall]     = useState(false);

  /* Detect if already running as installed PWA (standalone mode) */
  const isInstalled =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
     window.navigator.standalone === true);   // iOS Safari standalone

  useEffect(() => {
    /* Already installed — no button needed */
    if (isInstalled) return;

    const handler = (e) => {
      /* Prevent Chrome from showing the mini-infobar */
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    /* Clean up when the app is actually installed */
    const installedHandler = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, [isInstalled]);

  /**
   * promptInstall — shows the native browser install dialog.
   * Returns 'accepted' | 'dismissed' | null.
   */
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return null;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    /* The prompt can only be used once — clear it */
    setDeferredPrompt(null);
    setCanInstall(false);

    return outcome; // 'accepted' or 'dismissed'
  }, [deferredPrompt]);

  return { canInstall, promptInstall, isInstalled };
}
