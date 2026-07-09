import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const S = {
    success: { accent: '#4ADE80', icon: '✓' },
    error:   { accent: '#F87171', icon: '✕' },
    info:    { accent: '#60A5FA', icon: 'ℹ' },
    warning: { accent: '#FBBF24', icon: '⚠' },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const s = S[t.type] || S.success;
          return (
            <div key={t.id} onClick={() => remove(t.id)} style={{
              background: '#1A1A1A', borderLeft: `4px solid ${s.accent}`,
              borderRadius: 12, padding: '13px 16px',
              display: 'flex', alignItems: 'center', gap: 11,
              minWidth: 260, maxWidth: 360,
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              cursor: 'pointer', pointerEvents: 'all',
              animation: 'toastIn 0.3s ease',
            }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: s.accent + '22', color: s.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, flexShrink: 0,
              }}>{s.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1 }}>{t.message}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16 }}>×</span>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}`}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
