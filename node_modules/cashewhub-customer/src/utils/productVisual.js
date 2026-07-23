/**
 * productVisual.js
 * Maps a product name / category to a visual config used by ProductCard and WishlistCard.
 *
 * Returns: { bg, emoji, tag, localImage }
 *   bg         — CSS gradient for the fallback tile background
 *   emoji      — emoji shown on the tile
 *   tag        — short label shown on the tile
 *   localImage — path to a local /public/assets/ image used when DB has no image_url
 *
 * Keyword priority (checked in order):
 *   1. Explicit category keywords: Premium, Standard, Economy, Roasted
 *   2. Cashew grade codes: W180, W210, W240, W320, W450
 *   3. Flavour keywords: roasted+salt, masala, pepper, broken
 *   4. Default fallback → /assets/norm.jpeg
 */

export function getProductVisual(name = '', categoryName = '') {
  // Guard — either arg may be undefined/null
  const n = (name         ?? '').toLowerCase();
  const c = (categoryName ?? '').toLowerCase();
  const combined = `${n} ${c}`;   // search both title and category together

  /* ── 1. Explicit category / tier keywords ────────────────────
     Check these first so "Premium W320" maps to pre.jpeg,
     not just to the W320 default.                               */
  if (combined.includes('premium'))
    return { bg: 'linear-gradient(135deg,#7B3F00,#C68642)', emoji: '🥇', tag: 'Premium',  localImage: '/assets/pre.jpeg'   };
  if (combined.includes('standard'))
    return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🏆', tag: 'Standard', localImage: '/assets/stan.jpeg'  };
  if (combined.includes('economy'))
    return { bg: 'linear-gradient(135deg,#B8860B,#DAA520)', emoji: '💛', tag: 'Economy',  localImage: '/assets/norm.jpeg'  };

  /* ── 2. Roasted — checks both 'roasted' and 'roast' keywords ─ */
  if (combined.includes('roasted') || combined.includes('roast'))
    return { bg: 'linear-gradient(135deg,#5C3317,#A0522D)', emoji: '🍂', tag: 'Roasted', localImage: '/assets/roast.jpeg' };

  /* ── 3. Cashew grade codes ──────────────────────────────────── */
  if (n.includes('w180')) return { bg: 'linear-gradient(135deg,#7B3F00,#C68642)', emoji: '🥇', tag: 'Premium',      localImage: '/assets/pre.jpeg'  };
  if (n.includes('w210')) return { bg: 'linear-gradient(135deg,#8B4513,#D2691E)', emoji: '⭐', tag: 'Large',         localImage: '/assets/pre.jpeg'  };
  if (n.includes('w240')) return { bg: 'linear-gradient(135deg,#A0522D,#DEB887)', emoji: '✨', tag: 'Medium-Large',  localImage: '/assets/stan.jpeg' };
  if (n.includes('w320')) return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🏆', tag: 'Best Seller',  localImage: '/assets/stan.jpeg' };
  if (n.includes('w450')) return { bg: 'linear-gradient(135deg,#B8860B,#DAA520)', emoji: '💛', tag: 'Value',         localImage: '/assets/stan.jpeg' };

  /* ── 4. Flavour variants ────────────────────────────────────── */
  if (n.includes('masala'))  return { bg: 'linear-gradient(135deg,#8B2500,#E25822)', emoji: '🌶️', tag: 'Masala', localImage: '/assets/norm.jpeg' };
  if (n.includes('pepper'))  return { bg: 'linear-gradient(135deg,#2C2C2C,#696969)', emoji: '🖤', tag: 'Pepper',  localImage: '/assets/norm.jpeg' };
  if (n.includes('broken'))  return { bg: 'linear-gradient(135deg,#6B6B3A,#B8B860)', emoji: '💎', tag: 'Broken',  localImage: '/assets/norm.jpeg' };

  /* ── 5. Default ─────────────────────────────────────────────── */
  return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🥜', tag: 'Cashew', localImage: '/assets/norm.jpeg' };
}
