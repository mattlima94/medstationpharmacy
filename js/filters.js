// ═══════════════════════════════════════════════════════
// FILTERING, SORTING & HELPERS
// ═══════════════════════════════════════════════════════

import { PHARM_COLORS, PHARM_TO_MATRIX } from './config.js';

export function canShipToState(pharmacy, state, stateCoverage) {
  if (!state) return true;
  const key = PHARM_TO_MATRIX[pharmacy];
  if (!key) return null;
  const sd = stateCoverage[state];
  if (!sd) return null;
  const val = sd[key];
  return val === 'Yes' || val === 'Yes*';
}

export function getPharmColors(pharmacy) {
  return PHARM_COLORS[pharmacy] || { bg: '#1a1a2e', text: '#94a3b8', accent: '#64748b' };
}

export function getTotalPrice(product, includeShipping) {
  if (product.suggestedPrice == null) return 99999;
  return product.suggestedPrice + (includeShipping ? (product.shipping || 0) : 0);
}

export function formatPrice(p) {
  return p != null && p < 99999 ? '$' + Math.round(p) : 'TBD';
}

export function formatMargin(m) {
  return m != null ? (m * 100).toFixed(1) + '%' : '\u2014';
}

export function escapeHtml(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export function getFilteredProducts(products, app) {
  const q = app.search.toLowerCase();
  let results = products.filter(p => {
    const matchSearch = !q ||
      p.productName.toLowerCase().includes(q) ||
      p.activeIngredient.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.pharmacy.toLowerCase().includes(q);
    const matchCatalog = app.catalog === 'All' || p.catalog === app.catalog;
    const matchCategory = app.category === 'All' || p.category === app.category;
    const matchState = !app.state || canShipToState(p.pharmacy, app.state, app.stateCoverage) !== false;
    return matchSearch && matchCatalog && matchCategory && matchState;
  });

  results.sort((a, b) => {
    const pa = getTotalPrice(a, app.includeShipping);
    const pb = getTotalPrice(b, app.includeShipping);
    if (app.sortBy === 'price-asc') return pa - pb;
    if (app.sortBy === 'price-desc') return pb - pa;
    if (app.sortBy === 'margin-desc') return (b.margin || 0) - (a.margin || 0);
    if (app.sortBy === 'name') return a.productName.localeCompare(b.productName);
    return 0;
  });
  return results;
}

export function getBestPrices(filtered, includeShipping) {
  const groups = {};
  filtered.forEach(p => {
    const key = `${p.activeIngredient}|${p.strength}`;
    const tp = getTotalPrice(p, includeShipping);
    if (!groups[key] || tp < groups[key].price) groups[key] = { price: tp, count: 0 };
    groups[key].count++;
  });
  return groups;
}

export function isBest(product, bestPrices, includeShipping) {
  const key = `${product.activeIngredient}|${product.strength}`;
  const bp = bestPrices[key];
  return bp && bp.count > 1 && getTotalPrice(product, includeShipping) === bp.price;
}
