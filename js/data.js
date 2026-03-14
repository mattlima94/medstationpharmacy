// ═══════════════════════════════════════════════════════
// DATA FETCHING — Supabase with JSON fallback
// ═══════════════════════════════════════════════════════

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

let supabase = null;

function getClient() {
  if (!supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

export async function fetchProducts() {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('products')
      .select('*, pharmacies(name, shipping_cost, shipping_estimated)')
      .eq('is_active', true)
      .order('catalog')
      .order('category')
      .order('product_name');

    if (error) throw error;

    return data.map(p => ({
      id: p.id,
      catalog: p.catalog,
      category: p.category || '',
      productName: p.product_name,
      activeIngredient: p.active_ingredient || '',
      strength: p.strength || '',
      form: p.form || '',
      qtySize: p.qty_size || '',
      pharmacy: p.pharmacies?.name || '',
      pharmacyCost: p.pharmacy_cost,
      suggestedPrice: p.suggested_price,
      margin: p.pharmacy_cost != null && p.suggested_price != null && p.suggested_price > 0
        ? (p.suggested_price - p.pharmacy_cost) / p.suggested_price
        : null,
      formulaId: p.formula_id || '',
      stateCoverage: p.state_coverage || '',
      notes: p.notes || '',
      shipping: p.pharmacies?.shipping_cost || 0,
      shippingEstimated: p.pharmacies?.shipping_estimated || false,
    }));
  } catch (err) {
    console.warn('Supabase fetch failed, using fallback:', err.message);
    return fetchFallback();
  }
}

export async function fetchStateCoverage() {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('state_coverage')
      .select('state, status, pharmacies(name)')
      .order('state');

    if (error) throw error;

    const coverage = {};
    data.forEach(row => {
      const state = row.state;
      const pharm = row.pharmacies?.name;
      if (!state || !pharm) return;
      if (!coverage[state]) coverage[state] = {};
      coverage[state][pharm] = row.status;
    });
    return coverage;
  } catch (err) {
    console.warn('State coverage fetch failed, using fallback:', err.message);
    const fallback = await fetchFallbackJSON();
    return fallback?.stateCoverage || {};
  }
}

export async function fetchPharmacyDirectory() {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('pharmacies')
      .select('*')
      .order('name');

    if (error) throw error;

    return data.map(ph => ({
      name: ph.name,
      fullName: ph.full_name || ph.name,
      address: ph.address || '',
      statesLicensed: ph.states_licensed || '',
      specialty: ph.specialty || '',
      contact: ph.contact || '',
      shippingCost: '$' + (ph.shipping_cost || 0),
      shippingEstimated: ph.shipping_estimated || false,
      notes: '',
    }));
  } catch (err) {
    console.warn('Pharmacy directory fetch failed, using fallback:', err.message);
    const fallback = await fetchFallbackJSON();
    return fallback?.pharmacyDir || [];
  }
}

async function fetchFallback() {
  const fallback = await fetchFallbackJSON();
  return fallback?.products || [];
}

let _fallbackCache = null;
async function fetchFallbackJSON() {
  if (_fallbackCache) return _fallbackCache;
  try {
    const res = await fetch('./data/fallback.json');
    _fallbackCache = await res.json();
    return _fallbackCache;
  } catch {
    return null;
  }
}
