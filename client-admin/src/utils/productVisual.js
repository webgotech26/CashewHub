/**
 * productVisual.js  (admin app)
 *
 * Maps product name/category to a local asset path.
 * File extensions MUST match what's actually in client-admin/public/assets/:
 *   pre.png       ✓
 *   stan.png      ✓
 *   norm.png      ✓
 *   roast.jpeg    ✓
 */

export function getProductVisual(name = '', categoryName = '') {
  const n        = (name         ?? '').toLowerCase();
  const c        = (categoryName ?? '').toLowerCase();
  const combined = `${n} ${c}`;

  // Debug — remove once images are confirmed working
  if (typeof window !== 'undefined') {
    console.log('[getProductVisual] name:', name, '| category:', categoryName, '| combined:', combined);
  }

  /* ── Explicit tier keywords ─────────────────────────────────── */
  if (combined.includes('premium'))
    return { bg: 'linear-gradient(135deg,#7B3F00,#C68642)', emoji: '🥇', tag: 'Premium',  localImage: '/assets/pre.png'    };

  if (combined.includes('standard'))
    return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🏆', tag: 'Standard', localImage: '/assets/stan.png'   };

  if (combined.includes('economy'))
    return { bg: 'linear-gradient(135deg,#B8860B,#DAA520)', emoji: '💛', tag: 'Economy',  localImage: '/assets/norm.png'   };

  /* ── Roasted — checks both 'roasted' and 'roast' ────────────── */
  if (combined.includes('roasted') || combined.includes('roast'))
    return { bg: 'linear-gradient(135deg,#5C3317,#A0522D)', emoji: '🍂', tag: 'Roasted',  localImage: '/assets/roast.jpeg' };

  /* ── Cashew grade codes ──────────────────────────────────────── */
  if (n.includes('w180')) return { bg: 'linear-gradient(135deg,#7B3F00,#C68642)', emoji: '🥇', tag: 'Premium',      localImage: '/assets/pre.png'  };
  if (n.includes('w210')) return { bg: 'linear-gradient(135deg,#8B4513,#D2691E)', emoji: '⭐', tag: 'Large',         localImage: '/assets/pre.png'  };
  if (n.includes('w240')) return { bg: 'linear-gradient(135deg,#A0522D,#DEB887)', emoji: '✨', tag: 'Medium-Large',  localImage: '/assets/stan.png' };
  if (n.includes('w320')) return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🏆', tag: 'Best Seller',  localImage: '/assets/stan.png' };
  if (n.includes('w450')) return { bg: 'linear-gradient(135deg,#B8860B,#DAA520)', emoji: '💛', tag: 'Value',         localImage: '/assets/stan.png' };

  /* ── Flavour variants ────────────────────────────────────────── */
  if (n.includes('masala'))  return { bg: 'linear-gradient(135deg,#8B2500,#E25822)', emoji: '🌶️', tag: 'Masala', localImage: '/assets/norm.png' };
  if (n.includes('pepper'))  return { bg: 'linear-gradient(135deg,#2C2C2C,#696969)', emoji: '🖤', tag: 'Pepper',  localImage: '/assets/norm.png' };
  if (n.includes('broken'))  return { bg: 'linear-gradient(135deg,#6B6B3A,#B8B860)', emoji: '💎', tag: 'Broken',  localImage: '/assets/norm.png' };

  /* ── Default ─────────────────────────────────────────────────── */
  return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🥜', tag: 'Cashew', localImage: '/assets/norm.png' };
}
