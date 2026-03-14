// ═══════════════════════════════════════════════════════
// APP INITIALIZATION & EVENT WIRING
// ═══════════════════════════════════════════════════════

import { fetchProducts, fetchStateCoverage, fetchPharmacyDirectory } from './data.js';
import { render } from './render.js';

// Global app state
const APP = {
  view: 'staff',
  tab: 'catalog',
  search: '',
  state: '',
  catalog: 'All',
  category: 'All',
  sortBy: 'price-asc',
  includeShipping: true,
  compareMode: false,
  compareItems: [],
  expandedId: null,
  availabilityState: '',
  availabilityCategory: '',
  products: [],
  stateCoverage: {},
  pharmacyDir: [],
  loaded: false,
  loadError: null,
};

// Expose to window for inline event handlers
window.APP = APP;
window.doRender = () => render(APP);

function renderTabs() {
  const tabs = [
    { id: 'catalog', label: 'Catalog' },
    { id: 'availability', label: 'Availability' },
    { id: 'compare', label: 'Compare', suffix: '<span id="compare-count"></span>' },
    { id: 'pharmacies', label: 'Pharmacies' },
  ];
  if (APP.view === 'admin') {
    tabs.push({ id: 'missing', label: 'Missing Info' });
  }
  document.getElementById('tab-bar').innerHTML = tabs.map(t =>
    `<button class="tab-btn${APP.tab === t.id ? ' active' : ''}" id="tab-${t.id}" onclick="setTab('${t.id}')">${t.label}${t.suffix || ''}</button>`
  ).join('');
}

window.setView = function(v) {
  APP.view = v;
  document.getElementById('btn-admin').className = 'toggle-btn' + (v === 'admin' ? ' active' : '');
  document.getElementById('btn-staff').className = 'toggle-btn' + (v === 'staff' ? ' active' : '');
  // If switching to staff and on a staff-hidden tab, go to catalog
  if (v === 'staff' && APP.tab === 'missing') APP.tab = 'catalog';
  renderTabs();
  render(APP);
};

window.setTab = function(t) {
  APP.tab = t;
  renderTabs();
  render(APP);
};

window.toggleCompare = function(productId) {
  const idx = APP.compareItems.findIndex(p => p.id === productId);
  if (idx >= 0) {
    APP.compareItems.splice(idx, 1);
  } else if (APP.compareItems.length < 6) {
    const product = APP.products.find(p => p.id === productId);
    if (product) APP.compareItems.push(product);
  }
  const el = document.getElementById('compare-count');
  el.textContent = APP.compareItems.length > 0 ? `(${APP.compareItems.length})` : '';
  render(APP);
};

window.toggleExpand = function(productId) {
  APP.expandedId = APP.expandedId === productId ? null : productId;
  render(APP);
};

// Initial tab render
renderTabs();

// Triple-tap logo to reveal admin toggle
let _tapCount = 0;
let _tapTimer = null;
document.querySelector('.logo').addEventListener('click', () => {
  _tapCount++;
  clearTimeout(_tapTimer);
  _tapTimer = setTimeout(() => { _tapCount = 0; }, 600);
  if (_tapCount >= 3) {
    _tapCount = 0;
    const toggle = document.getElementById('admin-toggle');
    toggle.style.display = toggle.style.display === 'none' ? 'flex' : 'none';
  }
});

// Load data and boot
async function init() {
  try {
    const [products, stateCoverage, pharmacyDir] = await Promise.all([
      fetchProducts(),
      fetchStateCoverage(),
      fetchPharmacyDirectory(),
    ]);

    APP.products = products;
    APP.stateCoverage = stateCoverage;
    APP.pharmacyDir = pharmacyDir;
    APP.loaded = true;
    renderTabs();

    const stateCount = Object.keys(stateCoverage).length;
    const pharmCount = pharmacyDir.length;
    document.getElementById('subtitle').textContent =
      `${products.length} products \u00b7 ${pharmCount} pharmacies \u00b7 ${stateCount} states \u00b7 Live from Supabase`;

    render(APP);
  } catch (err) {
    console.error('Data load error:', err);
    APP.loaded = true;
    APP.loadError = err.message;
    render(APP);
  }
}

init();
