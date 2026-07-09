import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('show'); // show → fadeout → done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fadeout'), 1200);
    const t2 = setTimeout(() => { setPhase('done'); onDone(); }, 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  if (phase === 'done') return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#1a0a00',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'fadeout' ? 0 : 1,
      transition: 'opacity 0.7s ease',
      pointerEvents: phase === 'fadeout' ? 'none' : 'all',
    }}>
      {/* Logo */}
      <div style={{
        animation: 'splashLogoIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
        opacity: 0,
      }}>
        <img
          src="/assets/cashewlogo.png"
          alt="H²B³ Cashew"
          style={{
            width: 160, height: 160,
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 4px rgba(201,151,43,0.4)',
          }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      </div>

      {/* Brand name */}
      <div style={{
        marginTop: 24,
        animation: 'splashTextIn 0.6s ease 0.3s forwards',
        opacity: 0,
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 32, fontWeight: 800, color: '#fff',
          letterSpacing: '-0.5px',
        }}> H²B³ Cashew </div>
        <div style={{
          fontSize: 12, fontWeight: 600, color: '#C9972B',
          textTransform: 'uppercase', letterSpacing: 3, marginTop: 6,
        }}>
          Fresh Picked. Finest Quality.
        </div>
      </div>

      {/* Loading dots */}
      <div style={{
        display: 'flex', gap: 8, marginTop: 40,
        animation: 'splashTextIn 0.6s ease 0.6s forwards',
        opacity: 0,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#C9972B',
            animation: `dotPulse 1.2s ease ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes splashLogoIn {
          from { opacity: 0; transform: scale(0.6) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes splashTextIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%           { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
