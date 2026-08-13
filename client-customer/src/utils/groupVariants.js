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
          weight_label:   v._weightLabel || v.unit || String(v.price),
        })),
      });
    }
  });

  return grouped;
}
