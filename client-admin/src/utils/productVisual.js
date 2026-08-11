/**
 * productVisual.js  (admin app)
 *
 * Maps product name/category to a local asset path.
 * Files in client-admin/public/assets/:
 *   premium.png   ✓  standard.png  ✓  economy.png  ✓
 *   roast.jpeg    ✓  brownie.png   ✓  ginge.png    ✓
 *   groundant.png ✓  norm.png      ✓  pre.png      ✓
 */

export function getProductVisual(name = '', categoryName = '') {
  const n        = (name         ?? '').toLowerCase();
  const c        = (categoryName ?? '').toLowerCase();
  const combined = `${n} ${c}`;

  /* ── Brownies ────────────────────────────────────────────────── */
  if (combined.includes('brownie') || combined.includes('chocolate'))
    return { bg: 'linear-gradient(135deg,#3B1F0E,#6B3A2A)', emoji: '🍫', tag: 'Brownie', localImage: '/assets/brownie.png' };

  /* ── Oils ────────────────────────────────────────────────────── */
  if (combined.includes('gingelly') || combined.includes('sesame') || combined.includes('ginge'))
    return { bg: 'linear-gradient(135deg,#7B6B1A,#C9B84A)', emoji: '🫙', tag: 'Gingelly Oil', localImage: '/assets/ginge.png' };

  if (combined.includes('groundnut') || combined.includes('peanut'))
    return { bg: 'linear-gradient(135deg,#5C4A1A,#B8962A)', emoji: '🫙', tag: 'Groundnut Oil', localImage: '/assets/groundant.png' };

  if (combined.includes('oil') || combined.includes('wood pressed') || combined.includes('cold pressed'))
    return { bg: 'linear-gradient(135deg,#7B6B1A,#C9B84A)', emoji: '🫙', tag: 'Oil', localImage: '/assets/ginge.png' };

  /* ── Explicit tier keywords ─────────────────────────────────── */
  if (combined.includes('premium'))
    return { bg: 'linear-gradient(135deg,#7B3F00,#C68642)', emoji: '🥇', tag: 'Premium',  localImage: '/assets/premium.png'  };

  if (combined.includes('standard'))
    return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🏆', tag: 'Standard', localImage: '/assets/standard.png' };

  if (combined.includes('economy'))
    return { bg: 'linear-gradient(135deg,#B8860B,#DAA520)', emoji: '💛', tag: 'Economy',  localImage: '/assets/economy.png'  };

  /* ── Roasted — catches "Roasted Cashew (1/2kg)", "Roasted Cashew (1kg)", etc. ── */
  if (combined.includes('roasted') || combined.includes('roast'))
    return { bg: 'linear-gradient(135deg,#5C3317,#A0522D)', emoji: '🍂', tag: 'Roasted', localImage: '/assets/roasted.png' };

  /* ── Cashew grade codes ──────────────────────────────────────── */
  if (n.includes('w180')) return { bg: 'linear-gradient(135deg,#7B3F00,#C68642)', emoji: '🥇', tag: 'Premium',      localImage: '/assets/premium.png'  };
  if (n.includes('w210')) return { bg: 'linear-gradient(135deg,#8B4513,#D2691E)', emoji: '⭐', tag: 'Large',         localImage: '/assets/premium.png'  };
  if (n.includes('w240')) return { bg: 'linear-gradient(135deg,#A0522D,#DEB887)', emoji: '✨', tag: 'Medium-Large',  localImage: '/assets/standard.png' };
  if (n.includes('w320')) return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🏆', tag: 'Best Seller',  localImage: '/assets/standard.png' };
  if (n.includes('w450')) return { bg: 'linear-gradient(135deg,#B8860B,#DAA520)', emoji: '💛', tag: 'Value',         localImage: '/assets/economy.png'  };

  /* ── Flavour variants ────────────────────────────────────────── */
  if (n.includes('masala'))  return { bg: 'linear-gradient(135deg,#8B2500,#E25822)', emoji: '🌶️', tag: 'Masala', localImage: '/assets/roasted.png' };
  if (n.includes('pepper'))  return { bg: 'linear-gradient(135deg,#2C2C2C,#696969)', emoji: '🖤', tag: 'Pepper',  localImage: '/assets/roasted.png' };
  if (n.includes('broken'))  return { bg: 'linear-gradient(135deg,#6B6B3A,#B8B860)', emoji: '💎', tag: 'Broken',  localImage: '/assets/economy.png' };

  /* ── Default ─────────────────────────────────────────────────── */
  return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🥜', tag: 'Natural', localImage: '/assets/economy.png' };
}
