/**
 * groupVariants.js
 *
 * Groups flat product list into products with optional variant arrays.
 *
 * Detection rule:
 *   Products whose names share the same base (the part before the first
 *   parenthesis) AND same category are treated as variants of each other.
 *
 *   e.g.  "Roasted Cashew (1/2kg)"  }
 *         "Roasted Cashew (1kg)"    } → one card with 2 variant buttons
 *
 *   Products without parentheses are returned as-is (no variants).
 *
 * Output shape:
 *   {
 *     ...canonicalProduct,        // first variant's fields used as defaults
 *     variants: [                 // undefined when only 1 row
 *       { id, name, price, stock_quantity, unit, weight_label: '1/2 kg' },
 *       { id, name, price, stock_quantity, unit, weight_label: '1 kg'   },
 *     ]
 *   }
 */
export function groupProductVariants(products) {
  if (!Array.isArray(products)) return [];

  /* Extract base name (before first '(') and the weight label inside '()' */
  const parse = (name = '') => {
    const m = name.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (!m) return { base: name.trim(), label: null };
    return { base: m[1].trim(), label: m[2].trim() };
  };

  /**
   * cleanLabel — converts raw parenthesised text into a concise weight tag.
   *
   * Examples:
   *   "1/2kg Normal"  → "500g"
   *   "1/2 kg"        → "500g"
   *   "1kg Normal"    → "1 kg"
   *   "1 kg Normal"   → "1 kg"
   *   "250g"          → "250g"
   *   "2kg"           → "2 kg"
   *   "500ml"         → "500ml"
   *   "Box of 6"      → "Box of 6"   (non-weight text kept as-is)
   */
  const cleanLabel = (raw = '') => {
    if (!raw) return raw;
    const s = raw.trim();

    // ── "1/2 kg" or "1/2kg" variants ────────────────────────
    if (/^1\/2\s*kg\b/i.test(s)) return '500g';
    if (/^0\.5\s*kg\b/i.test(s)) return '500g';
    if (/^500\s*g\b/i.test(s))   return '500g';

    // ── "<N> kg" — strip trailing words like "Normal" ────────
    const kgMatch = s.match(/^(\d+(?:\.\d+)?)\s*kg\b/i);
    if (kgMatch) return `${kgMatch[1]} kg`;

    // ── "<N> g" — keep as is ─────────────────────────────────
    const gMatch = s.match(/^(\d+)\s*g\b/i);
    if (gMatch) return `${gMatch[1]}g`;

    // ── "<N> ml / L" — keep as is ────────────────────────────
    const mlMatch = s.match(/^(\d+)\s*(ml|l)\b/i);
    if (mlMatch) return `${mlMatch[1]}${mlMatch[2].toLowerCase()}`;

    // ── "<N> pcs / pieces" ───────────────────────────────────
    const pcsMatch = s.match(/^(\d+)\s*(?:pcs?|pieces?)\b/i);
    if (pcsMatch) return `${pcsMatch[1]} pcs`;

    // ── Fallback: strip words after first known unit word ─────
    // e.g. "1kg Normal" → caught above; anything else kept short
    const trimmed = s.replace(/\s+(normal|premium|standard|economy|special|pack)\s*$/i, '').trim();
    return trimmed || s;
  };

  /* Group by "base name + category_id" */
  const map = new Map();

  products.forEach(p => {
    const { base, label } = parse(p.name);
    const key = `${base}__${p.category_id ?? ''}`;

    if (!map.has(key)) {
      map.set(key, { base, products: [] });
    }
    map.get(key).products.push({ ...p, _weightLabel: label });
  });

  const grouped = [];

  map.forEach(({ base, products: variants }) => {
    if (variants.length === 1) {
      /* Single product — no variant UI needed */
      const { _weightLabel, ...rest } = variants[0];
      grouped.push(rest);
    } else {
      /* Sort variants by price ascending so smallest weight appears first */
      variants.sort((a, b) => Number(a.price) - Number(b.price));

      /* Use first variant as the card's "representative" product */
      const { _weightLabel: _firstLabel, ...canonical } = variants[0];

      grouped.push({
        ...canonical,
        /* Override name to just the base (strip the weight from the card title) */
        name: base,
        variants: variants.map(v => ({
          id:             v.id,
          name:           v.name,
          price:          v.price,
          stock_quantity: v.stock_quantity,
          unit:           v.unit,
          image_url:      v.image_url,
          /* Clean the raw label: "1/2kg Normal" → "500g", "1kg Normal" → "1 kg" */
          weight_label:   cleanLabel(v._weightLabel) || v.unit || String(v.price),
        })),
      });
    }
  });

  return grouped;
}
