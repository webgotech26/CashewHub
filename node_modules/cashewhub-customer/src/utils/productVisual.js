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
 * Image mapping:
 *   Premium  (all variants, 1kg + 1/2kg) → /assets/premium.png
 *   Standard (all variants, 1kg + 1/2kg) → /assets/standard.png
 *   Economy  (all variants, 1kg + 1/2kg) → /assets/economy.png
 *   Roasted                               → /assets/roast.jpeg
 *   Default fallback                      → /assets/economy.png
 */

export function getProductVisual(name = '', categoryName = '') {
  // Guard — either arg may be undefined/null
  const n = (name         ?? '').toLowerCase();
  const c = (categoryName ?? '').toLowerCase();
  const combined = `${n} ${c}`;   // search both title and category together

  /* ── 1. Explicit category / tier keywords ────────────────────
     Checked first so "Premium W320" maps to premium.png,
     not just to the W320 grade default.                         */
  if (combined.includes('premium'))
    return { bg: 'linear-gradient(135deg,#7B3F00,#C68642)', emoji: '🥇', tag: 'Premium',  localImage: '/assets/premium.png'  };
  if (combined.includes('standard'))
    return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🏆', tag: 'Standard', localImage: '/assets/standard.png' };
  if (combined.includes('economy'))
    return { bg: 'linear-gradient(135deg,#B8860B,#DAA520)', emoji: '💛', tag: 'Economy',  localImage: '/assets/economy.png'  };

  /* ── 2. Roasted ──────────────────────────────────────────── */
  if (combined.includes('roasted') || combined.includes('roast'))
    return { bg: 'linear-gradient(135deg,#5C3317,#A0522D)', emoji: '🍂', tag: 'Roasted', localImage: '/assets/roasted.png' };

  /* ── 3. Cashew grade codes ──────────────────────────────── */
  if (n.includes('w180')) return { bg: 'linear-gradient(135deg,#7B3F00,#C68642)', emoji: '🥇', tag: 'Premium',     localImage: '/assets/premium.png'  };
  if (n.includes('w210')) return { bg: 'linear-gradient(135deg,#8B4513,#D2691E)', emoji: '⭐', tag: 'Large',        localImage: '/assets/premium.png'  };
  if (n.includes('w240')) return { bg: 'linear-gradient(135deg,#A0522D,#DEB887)', emoji: '✨', tag: 'Medium-Large', localImage: '/assets/standard.png' };
  if (n.includes('w320')) return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🏆', tag: 'Best Seller', localImage: '/assets/standard.png' };
  if (n.includes('w450')) return { bg: 'linear-gradient(135deg,#B8860B,#DAA520)', emoji: '💛', tag: 'Value',        localImage: '/assets/economy.png'  };

  /* ── 4. Flavour variants ──────────────────────────────────── */
  if (n.includes('masala'))  return { bg: 'linear-gradient(135deg,#8B2500,#E25822)', emoji: '🌶️', tag: 'Masala', localImage: '/assets/economy.png' };
  if (n.includes('pepper'))  return { bg: 'linear-gradient(135deg,#2C2C2C,#696969)', emoji: '🖤', tag: 'Pepper',  localImage: '/assets/economy.png' };
  if (n.includes('broken'))  return { bg: 'linear-gradient(135deg,#6B6B3A,#B8B860)', emoji: '💎', tag: 'Broken',  localImage: '/assets/economy.png' };

  /* ── 5. Oils ──────────────────────────────────────────────── */
  if (n.includes('gingelly') || n.includes('sesame') || n.includes('gingel'))
    return { bg: 'linear-gradient(135deg,#7C5C2B,#C8A96E)', emoji: '🫙', tag: 'Gingelly Oil', localImage: '/assets/groundant.png' };
  if (n.includes('groundnut') || n.includes('groundant') || n.includes('peanut'))
    return { bg: 'linear-gradient(135deg,#A0522D,#D4A056)', emoji: '🫙', tag: 'Groundnut Oil', localImage: '/assets/groundant.png' };
  if (n.includes('oil'))
    return { bg: 'linear-gradient(135deg,#8B6914,#C8A96E)', emoji: '🫙', tag: 'Oil', localImage: '/assets/groundant.png' };

  /* ── 6. Brownies / Bakery ─────────────────────────────────── */
  if (n.includes('brownie') || n.includes('chocolate') || n.includes('bake') || n.includes('bakery'))
    return { bg: 'linear-gradient(135deg,#3E1A00,#7B3F00)', emoji: '🍫', tag: 'Brownie', localImage: '/assets/brownie.png' };

  /* ── 7. Default ───────────────────────────────────────────── */
  return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🥜', tag: 'Natural', localImage: '/assets/economy.png' };
}
