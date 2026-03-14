// ═══════════════════════════════════════════════════════
// DOM RENDERING
// ═══════════════════════════════════════════════════════

import { getPharmColors, getTotalPrice, formatPrice, formatMargin, escapeHtml, getFilteredProducts, getBestPrices, isBest, canShipToState } from './filters.js';

export function render(app) {
  const el = document.getElementById('app-content');
  if (!app.loaded) return;

  if (app.loadError) {
    el.innerHTML = `
      <div class="error-banner">
        <div class="error-title">Failed to Load Data</div>
        <div class="error-desc">Could not fetch data from Supabase. Using fallback data if available.<br><br>Error: ${escapeHtml(app.loadError)}</div>
      </div>`;
    return;
  }

  if (app.tab === 'catalog') renderCatalog(el, app);
  else if (app.tab === 'availability') renderAvailability(el, app);
  else if (app.tab === 'compare') renderCompare(el, app);
  else if (app.tab === 'pharmacies') renderPharmacies(el, app);
  else if (app.tab === 'missing') renderMissing(el, app);
}

function renderCatalog(el, app) {
  const catalogs = ['All', ...new Set(app.products.map(p => p.catalog))];
  const catsForCatalog = app.products
    .filter(p => app.catalog === 'All' || p.catalog === app.catalog)
    .map(p => p.category);
  const categories = ['All', ...new Set(catsForCatalog)];
  const states = Object.keys(app.stateCoverage).sort();

  const filtered = getFilteredProducts(app.products, app);
  const bestPrices = getBestPrices(filtered, app.includeShipping);

  let html = `
    <div class="filters">
      <input class="filter-input" type="text" placeholder="Search drug name, ingredient, category, pharmacy..."
        value="${escapeHtml(app.search)}" oninput="window.APP.search=this.value;window.doRender()">
      <select class="filter-select" onchange="window.APP.state=this.value;window.doRender()">
        <option value="">All States</option>
        ${states.map(s => `<option value="${s}"${app.state === s ? ' selected' : ''}>${s}</option>`).join('')}
      </select>
      <select class="filter-select" onchange="window.APP.catalog=this.value;window.APP.category='All';window.doRender()">
        ${catalogs.map(c => `<option value="${c}"${app.catalog === c ? ' selected' : ''}>${c}</option>`).join('')}
      </select>
      <select class="filter-select" onchange="window.APP.category=this.value;window.doRender()">
        ${categories.map(c => `<option value="${c}"${app.category === c ? ' selected' : ''}>${c}</option>`).join('')}
      </select>
    </div>
    <div class="controls">
      <div class="controls-left">
        <span class="result-count">${filtered.length} results</span>
        <label class="control-label">
          <input type="checkbox" ${app.includeShipping ? 'checked' : ''} onchange="window.APP.includeShipping=this.checked;window.doRender()">
          Include shipping
        </label>
        <label class="control-label">
          <input type="checkbox" ${app.compareMode ? 'checked' : ''} onchange="window.APP.compareMode=this.checked;window.doRender()">
          Compare mode
        </label>
      </div>
      <select class="sort-select" onchange="window.APP.sortBy=this.value;window.doRender()">
        <option value="price-asc"${app.sortBy==='price-asc'?' selected':''}>Price: Low → High</option>
        <option value="price-desc"${app.sortBy==='price-desc'?' selected':''}>Price: High → Low</option>
        ${app.view === 'admin' ? `<option value="margin-desc"${app.sortBy==='margin-desc'?' selected':''}>Margin: High → Low</option>` : ''}
        <option value="name"${app.sortBy==='name'?' selected':''}>Name A-Z</option>
      </select>
    </div>`;

  if (filtered.length === 0) {
    html += `<div style="text-align:center;padding:40px;color:var(--text-dim);">No products match your filters. Try broadening your search.</div>`;
  } else {
    filtered.forEach(p => {
      const pc = getPharmColors(p.pharmacy);
      const total = getTotalPrice(p, app.includeShipping);
      const best = isBest(p, bestPrices, app.includeShipping);
      const inCompare = app.compareItems.some(c => c.id === p.id);
      const shipStatus = app.state ? canShipToState(p.pharmacy, app.state, app.stateCoverage) : null;
      const expanded = app.expandedId === p.id;

      html += `<div class="product-row${best ? ' best' : ''}${inCompare ? ' in-compare' : ''}" onclick="window.toggleExpand('${p.id}')">
        <div class="row-main">
          ${app.compareMode ? `<input type="checkbox" ${inCompare ? 'checked' : ''} onclick="event.stopPropagation();window.toggleCompare('${p.id}')" style="accent-color:var(--accent);width:16px;height:16px;flex-shrink:0">` : ''}
          ${best ? '<span class="badge-best">BEST PRICE</span>' : ''}
          <span class="pharm-pill" style="background:${pc.bg};color:${pc.text};border:1px solid ${pc.accent}33">${escapeHtml(p.pharmacy)}</span>
          <span class="product-name">${escapeHtml(p.productName)}</span>
          <span class="product-meta">${escapeHtml(p.category)}</span>
          <span class="product-meta">${escapeHtml(p.form)}${p.qtySize && p.qtySize !== '\u2014' ? ' \u00b7 ' + escapeHtml(p.qtySize) : ''}</span>
          ${app.state && shipStatus !== null ? `<span class="state-badge ${shipStatus === true ? 'yes' : shipStatus === false ? 'no' : 'unknown'}">${shipStatus === true ? '\u2713' : shipStatus === false ? '\u2717' : '?'}</span>` : ''}
          <div class="price-area">
            <div class="price-main${best ? ' best-price' : ''}">${formatPrice(total < 99999 ? total : null)}</div>
            ${app.includeShipping && p.shipping > 0 && p.suggestedPrice != null ? `<div class="price-detail">${formatPrice(p.suggestedPrice)} + $${p.shipping} ship${p.shippingEstimated ? '<span class="price-est"> ~est</span>' : ''}</div>` : ''}
          </div>
          ${app.view === 'admin' ? `
            <div class="margin-area">
              <div class="margin-val ${p.margin > 0.6 ? 'high' : p.margin > 0.5 ? 'mid' : 'low'}">${formatMargin(p.margin)}</div>
              ${p.pharmacyCost != null ? `<div class="margin-cost">cost: $${p.pharmacyCost}</div>` : ''}
            </div>` : ''}
        </div>
        ${expanded ? `
          <div class="product-details">
            <div>
              <div class="detail-label">Active Ingredient</div>
              <div class="detail-value">${escapeHtml(p.activeIngredient)}</div>
              <div class="detail-label">Strength</div>
              <div class="detail-value">${escapeHtml(p.strength)}</div>
              ${p.formulaId ? `<div class="detail-label">Formula ID</div><div class="detail-value">${escapeHtml(p.formulaId)}</div>` : ''}
            </div>
            <div>
              <div class="detail-label">State Coverage</div>
              <div class="detail-value">${escapeHtml(p.stateCoverage)}</div>
              ${p.notes ? `<div class="detail-label">Notes</div><div class="detail-value">${escapeHtml(p.notes)}</div>` : ''}
            </div>
            <div>
              ${app.view === 'admin' ? `
                <div class="detail-label">Pharmacy Cost</div>
                <div class="detail-value" style="font-family:var(--mono)">${p.pharmacyCost != null ? '$' + p.pharmacyCost : 'TBD'}</div>
                <div class="detail-label">Margin</div>
                <div class="detail-value" style="font-family:var(--mono)">${formatMargin(p.margin)}</div>` : ''}
              <div class="detail-label">Patient Price</div>
              <div class="detail-value" style="font-family:var(--mono)">${formatPrice(p.suggestedPrice)}</div>
            </div>
          </div>` : ''}
      </div>`;
    });
  }
  el.innerHTML = html;
}

function renderAvailability(el, app) {
  const states = Object.keys(app.stateCoverage).sort();
  const selectedState = app.availabilityState || '';

  let html = `
    <div class="avail-header">
      <div class="avail-title">State Availability Lookup</div>
      <div class="avail-desc">Select a state to see which pharmacies can ship there</div>
    </div>
    <select class="avail-state-picker" onchange="window.APP.availabilityState=this.value;window.doRender()">
      <option value="">Choose a state...</option>
      ${states.map(s => `<option value="${s}"${selectedState === s ? ' selected' : ''}>${s}</option>`).join('')}
    </select>`;

  if (!selectedState) {
    // Show quick-tap grid of popular states
    const popular = ['Florida', 'Texas', 'California', 'New York', 'Illinois', 'Georgia', 'Arizona', 'Colorado', 'New Jersey', 'Pennsylvania', 'Ohio', 'North Carolina'];
    html += `
      <div class="avail-popular-label">Popular states</div>
      <div class="avail-popular-grid">
        ${popular.filter(s => states.includes(s)).map(s => `<button class="avail-state-btn" onclick="window.APP.availabilityState='${s}';window.doRender()">${s}</button>`).join('')}
      </div>`;
  } else {
    const coverage = app.stateCoverage[selectedState] || {};
    const pharmacies = app.pharmacyDir;

    html += `<div class="avail-results-title">${escapeHtml(selectedState)}</div>`;
    html += '<div class="avail-grid">';

    pharmacies.forEach(ph => {
      const pc = getPharmColors(ph.name);
      const status = coverage[ph.name] || 'Unknown';
      const productCount = app.products.filter(p => p.pharmacy === ph.name).length;

      let statusClass, statusLabel;
      if (status === 'Yes' || status === 'Yes*') {
        statusClass = 'avail-yes';
        statusLabel = 'Ships here';
      } else if (status === 'No') {
        statusClass = 'avail-no';
        statusLabel = 'Not available';
      } else if (status === 'Coming Soon') {
        statusClass = 'avail-soon';
        statusLabel = 'Coming soon';
      } else if (status === 'Non-sterile') {
        statusClass = 'avail-partial';
        statusLabel = 'Non-sterile only';
      } else {
        statusClass = 'avail-unknown';
        statusLabel = 'Not confirmed';
      }

      html += `<div class="avail-card ${statusClass}">
        <div class="avail-card-top">
          <span class="pharm-pill" style="background:${pc.bg};color:${pc.text};border:1px solid ${pc.accent}33">${escapeHtml(ph.name)}</span>
          <span class="avail-status-badge ${statusClass}">${statusLabel}</span>
        </div>
        <div class="avail-card-name">${escapeHtml(ph.fullName)}</div>
        <div class="avail-card-detail">${productCount} products${status === 'Yes*' ? ' &middot; verify IL license' : ''}</div>
        <div class="avail-card-detail">${escapeHtml(ph.specialty)}</div>
        <div class="avail-card-ship">Shipping: ${escapeHtml(ph.shippingCost)}${ph.shippingEstimated ? ' (est.)' : ''}</div>
      </div>`;
    });

    html += '</div>';

    // Summary line
    const yesCount = pharmacies.filter(ph => {
      const s = coverage[ph.name] || '';
      return s === 'Yes' || s === 'Yes*';
    }).length;
    html += `<div class="avail-summary">${yesCount} of ${pharmacies.length} pharmacies ship to ${escapeHtml(selectedState)}</div>`;
  }

  el.innerHTML = html;
}

function renderCompare(el, app) {
  if (app.compareItems.length === 0) {
    el.innerHTML = `<div class="compare-empty"><div class="icon">&#9878;&#65039;</div><div style="font-size:16px;font-weight:600;margin-bottom:8px">No products selected</div><div>Enable "Compare mode" in the Catalog tab and select up to 6 products.</div></div>`;
    return;
  }

  let html = '<div class="compare-grid">';
  app.compareItems.forEach(p => {
    const pc = getPharmColors(p.pharmacy);
    const total = getTotalPrice(p, app.includeShipping);

    const fields = [
      ['Active Ingredient', p.activeIngredient],
      ['Strength', p.strength],
      ['Qty/Size', p.qtySize],
      ['State Coverage', p.stateCoverage],
    ];
    if (app.view === 'admin') {
      fields.push(['Pharmacy Cost', p.pharmacyCost != null ? '$' + p.pharmacyCost : 'TBD']);
      fields.push(['Margin', formatMargin(p.margin)]);
    }
    if (p.notes) fields.push(['Notes', p.notes]);

    html += `<div class="compare-card">
      <div class="compare-header">
        <span class="pharm-pill" style="background:${pc.bg};color:${pc.text};border:1px solid ${pc.accent}33">${escapeHtml(p.pharmacy)}</span>
        <button class="compare-remove" onclick="window.toggleCompare('${p.id}')">&#10005;</button>
      </div>
      <div class="compare-name">${escapeHtml(p.productName)}</div>
      <div class="compare-meta">${escapeHtml(p.category)} \u00b7 ${escapeHtml(p.form)}</div>
      <div class="compare-price">${formatPrice(total < 99999 ? total : null)}</div>
      ${app.includeShipping && p.shipping > 0 && p.suggestedPrice != null ? `<div style="font-size:11px;color:var(--text-dim);margin-bottom:12px">${formatPrice(p.suggestedPrice)} + $${p.shipping} shipping</div>` : '<div style="margin-bottom:12px"></div>'}
      ${fields.map(([l, v]) => `<div class="compare-field"><div class="compare-field-label">${l}</div><div class="compare-field-value">${escapeHtml(v || '\u2014')}</div></div>`).join('')}
    </div>`;
  });
  html += '</div>';
  el.innerHTML = html;
}

function renderPharmacies(el, app) {
  const dirs = app.pharmacyDir;
  let html = '<div class="pharm-grid">';
  dirs.forEach(ph => {
    const pc = getPharmColors(ph.name);
    const count = app.products.filter(p => p.pharmacy === ph.name).length;

    const fields = [
      ['States Licensed', ph.statesLicensed],
      ['Specialty', ph.specialty],
      ['Shipping', ph.shippingCost + (ph.shippingEstimated ? ' (estimated)' : '')],
    ];
    if (ph.contact && ph.contact !== '\u2014') fields.push(['Contact', ph.contact]);
    if (ph.notes) fields.push(['Notes', ph.notes]);

    html += `<div class="pharm-card" style="border-left-color:${pc.accent}">
      <div class="pharm-card-header">
        <div>
          <div class="pharm-card-name" style="color:${pc.text}">${escapeHtml(ph.fullName)}</div>
          <div class="pharm-card-addr">${escapeHtml(ph.address)}</div>
        </div>
        <span class="pharm-count" style="background:${pc.bg};color:${pc.text};border:1px solid ${pc.accent}33">${count} products</span>
      </div>
      ${fields.map(([l, v]) => `<div class="pharm-field"><div class="pharm-field-label">${l}</div><div class="pharm-field-value">${escapeHtml(v || '\u2014')}</div></div>`).join('')}
    </div>`;
  });
  html += '</div>';
  el.innerHTML = html;
}

function renderMissing(el) {
  const missingInfo = [
    { pharmacy: 'Absolute Pharmacy', items: ['Standard shipping cost per order', 'Expedited shipping options and pricing', 'Minimum order for free shipping (if any)', 'Current processing time (order to ship)'] },
    { pharmacy: 'Epiq Scripts', items: ['Standard shipping cost per order', 'Expedited shipping options and pricing', 'Minimum order for free shipping (if any)', 'Current processing time (order to ship)'] },
    { pharmacy: 'Rush Pharmacy', items: ['Standard shipping cost per order', 'Expedited shipping options and pricing', 'Minimum order for free shipping (if any)', 'Current processing time (order to ship)'] },
    { pharmacy: 'Brooksville Pharmacy', items: ['Confirmed state licensing list', 'Exact shipping by product category ($13-33 range)', 'Pharmacy cost: Tesamorelin, SS-31, Nandrolone, Oxandrolone, Oxymetholone', 'LegitScript certification status'] },
    { pharmacy: 'Olympia Pharmacy', items: ['Full state licensing list', 'Pharmacy cost: NAD+ 200mg/mL 10mL', 'Complete product catalog availability', 'LegitScript certification status'] },
    { pharmacy: 'Texas Star / Thesis', items: ['Full multi-state licensing list (beyond TX+OK)', 'Pharmacy cost: Sema/NAD+ and Tirz/NAD+/L-Carnitine products', 'Shipping cost for non-DFW metro areas', 'Updated product catalog under Thesis rebrand'] },
    { pharmacy: 'Hallandale Pharmacy', items: ['Illinois license reinstatement status', 'LegitScript certification timeline', 'Updated Flex-Dose tirzepatide pricing'] },
  ];

  let html = `
    <div class="missing-banner">
      <div class="missing-title">Action Required: Pharmacy Data Collection</div>
      <div class="missing-desc">The following information is needed from each pharmacy partner. Pharmacy staff should email each partner using contact info in the Pharmacy Directory tab.</div>
    </div>`;

  missingInfo.forEach(mi => {
    html += `<div class="missing-card">
      <h3>${escapeHtml(mi.pharmacy)}</h3>
      ${mi.items.map(item => `<div class="missing-item"><div class="missing-checkbox">&#9744;</div><span>${escapeHtml(item)}</span></div>`).join('')}
    </div>`;
  });
  el.innerHTML = html;
}
