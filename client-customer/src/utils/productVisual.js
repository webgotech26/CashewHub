/**
 * productVisual.js
 * Maps a product name / category to a CSS gradient + emoji placeholder.
 * Used when a product has no image_url in the database.
 *
 * Returns: { bg, emoji, tag }
 *   bg    — CSS gradient for the placeholder tile background
 *   emoji — emoji shown on the tile
 *   tag   — short label shown on the tile
 *
 * localImage has been intentionally removed — all product images are now
 * stored in the database (Cloudinary or /uploads). Static local files are
 * no longer used as fallbacks.
 */

export function getProductVisual(name = '', categoryName = '') {
  const n = (name         ?? '').toLowerCase();
  const c = (categoryName ?? '').toLowerCase();
  const combined = `${n} ${c}`;

  /* ── 1. Explicit category / tier keywords ── */
  if (combined.includes('premium'))
    return { bg: 'linear-gradient(135deg,#7B3F00,#C68642)', emoji: '🥇', tag: 'Premium'  };
  if (combined.includes('standard'))
    return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🏆', tag: 'Standard' };
  if (combined.includes('economy'))
    return { bg: 'linear-gradient(135deg,#B8860B,#DAA520)', emoji: '💛', tag: 'Economy'  };

  /* ── 2. Roasted ── */
  if (combined.includes('roasted') || combined.includes('roast'))
    return { bg: 'linear-gradient(135deg,#5C3317,#A0522D)', emoji: '🍂', tag: 'Roasted' };

  /* ── 3. Cashew grade codes ── */
  if (n.includes('w180')) return { bg: 'linear-gradient(135deg,#7B3F00,#C68642)', emoji: '🥇', tag: 'Premium'      };
  if (n.includes('w210')) return { bg: 'linear-gradient(135deg,#8B4513,#D2691E)', emoji: '⭐', tag: 'Large'         };
  if (n.includes('w240')) return { bg: 'linear-gradient(135deg,#A0522D,#DEB887)', emoji: '✨', tag: 'Medium-Large'  };
  if (n.includes('w320')) return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🏆', tag: 'Best Seller'  };
  if (n.includes('w450')) return { bg: 'linear-gradient(135deg,#B8860B,#DAA520)', emoji: '💛', tag: 'Value'         };

  /* ── 4. Flavour variants ── */
  if (n.includes('masala'))  return { bg: 'linear-gradient(135deg,#8B2500,#E25822)', emoji: '🌶️', tag: 'Masala' };
  if (n.includes('pepper'))  return { bg: 'linear-gradient(135deg,#2C2C2C,#696969)', emoji: '🖤', tag: 'Pepper'  };
  if (n.includes('broken'))  return { bg: 'linear-gradient(135deg,#6B6B3A,#B8B860)', emoji: '💎', tag: 'Broken'  };

  /* ── 5. Oils ── */
  if (n.includes('gingelly') || n.includes('sesame') || n.includes('gingel'))
    return { bg: 'linear-gradient(135deg,#7C5C2B,#C8A96E)', emoji: '🫙', tag: 'Gingelly Oil'  };
  if (n.includes('groundnut') || n.includes('groundant') || n.includes('peanut'))
    return { bg: 'linear-gradient(135deg,#A0522D,#D4A056)', emoji: '🫙', tag: 'Groundnut Oil' };
  if (n.includes('oil'))
    return { bg: 'linear-gradient(135deg,#8B6914,#C8A96E)', emoji: '🫙', tag: 'Oil'           };

  /* ── 6. Brownies / Bakery ── */
  if (n.includes('brownie') || n.includes('chocolate') || n.includes('bake') || n.includes('bakery'))
    return { bg: 'linear-gradient(135deg,#3E1A00,#7B3F00)', emoji: '🍫', tag: 'Brownie' };

  /* ── 7. Default ── */
  return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🥜', tag: 'Natural' };
}
