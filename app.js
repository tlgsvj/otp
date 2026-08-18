function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const CONFIG = {
  dataIndex: './DataOTP/otp_2026_index.json',
  defaultFrom: todayISO(),
  defaultTo: todayISO(),
  ytdFrom: `${new Date().getFullYear()}-01-01`,
  storageKey: 'vjgs_otp_static_edits_v1',
  version: '2026-08-18-date-sync-pagination-v6'
};

const DOMESTIC = new Set('DIN THD VDH VCL TBB PXU BMV VKG CAH VCS HAN SGN DAD VDO HPH VII HUI CXR DLI UIH VCA PQC LTH'.split(' '));

function defaultFilter(extra = {}) {
  return { from: CONFIG.defaultFrom, to: CONFIG.defaultTo, market: 'All', origin: 'All', dest: 'All', type: 'All', quick: '', ...extra };
}

const state = {
  activeTab: 'overview',
  index: {},
  monthCache: new Map(),
  allRows: [],
  edits: loadLocalEdits(),
  loadedRange: null,
  tablePages: {},
  filters: {
    overview: defaultFilter(),
    otpVj: defaultFilter(),
    otaVj: defaultFilter(),
    door: defaultFilter(),
    other: defaultFilter({ airline: 'All', type: undefined }),
    analysis: defaultFilter(),
    export: defaultFilter()
  },
  inputDate: CONFIG.defaultTo
};

function setStatus(text) {
  const el = document.getElementById('loadStatus');
  if (el) el.textContent = text;
}

function assetUrl(path) {
  const cleanPath = String(path || '').replace(/^\.?\//, '');
  const baseUrl = new URL('./', window.location.href);
  return new URL(cleanPath, baseUrl).href;
}

function loadLocalEdits() {
  try { return JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}'); }
  catch (e) { return {}; }
}

function saveLocalEdits() {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(state.edits));
}

function setFilterDate(id, key, value) {
  const f = state.filters[id];
  f[key] = value;
  f.quick = '';

  if (f.from && f.to && f.from > f.to) {
    if (key === 'from') f.to = f.from;
    if (key === 'to') f.from = f.to;
  }

  const fromInput = document.getElementById(`${id}_from`);
  const toInput = document.getElementById(`${id}_to`);
  if (fromInput) fromInput.value = f.from;
  if (toInput) toInput.value = f.to;
}

function csvParse(text) {
  text = String(text || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cur = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (c === '"') {
      if (quoted && n === '"') { cur += '"'; i++; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) {
      row.push(cur); cur = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && n === '\n') i++;
      row.push(cur);
      if (row.some(x => x !== '')) rows.push(row);
      row = []; cur = '';
    } else {
      cur += c;
    }
  }
  if (cur !== '' || row.length) {
    row.push(cur);
    if (row.some(x => x !== '')) rows.push(row);
  }
  return rows;
}

function rowsFromCsv(text) {
  const arr = csvParse(text);
  const header = arr.shift() || [];
  return arr.map(row => {
    const obj = {};
    header.forEach((h, i) => obj[h] = row[i] ?? '');
    return normalizeRow(obj);
  });
}

function monthsBetween(from, to) {
  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  const out = [];
  let y = start.getFullYear();
  let m = start.getMonth();
  while (y < end.getFullYear() || (y === end.getFullYear() && m <= end.getMonth())) {
    out.push(`${y}-${String(m + 1).padStart(2, '0')}`);
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return out;
}

async function ensureData(from, to) {
  if (!Object.keys(state.index).length) {
    const indexUrl = assetUrl(CONFIG.dataIndex);
    const indexResponse = await fetch(indexUrl, { cache: 'no-cache' });
    if (!indexResponse.ok) throw new Error(`Index load failed ${indexResponse.status}: ${indexUrl}`);
    state.index = await indexResponse.json();
  }

  const months = monthsBetween(from, to);
  setStatus(`Loading ${months.join(', ')}`);

  for (const month of months) {
    if (!state.monthCache.has(month)) {
      const info = state.index[month];
      if (!info || !info.file) {
        state.monthCache.set(month, []);
        continue;
      }
      const csvUrl = assetUrl(info.file);
      const csvResponse = await fetch(csvUrl, { cache: 'no-cache' });
      if (!csvResponse.ok) throw new Error(`CSV load failed ${csvResponse.status}: ${csvUrl}`);
      const csvText = await csvResponse.text();
      state.monthCache.set(month, rowsFromCsv(csvText));
    }
  }

  const baseRows = months.flatMap(month => state.monthCache.get(month) || []);
  const rowsWithEdits = baseRows.map(row => state.edits[row._id] ? normalizeRow({ ...row, ...state.edits[row._id] }) : row);
  const localRows = Object.values(state.edits).filter(row => row._local && row.date >= from && row.date <= to).map(normalizeRow);
  state.allRows = [...rowsWithEdits, ...localRows].filter(row => row.date >= from && row.date <= to);
  state.loadedRange = { from, to };
  setStatus(`${state.allRows.length} rows loaded`);
}

function aps(route) {
  return String(route || '').toUpperCase().replace(/--/g, '-').replace(/\s+/g, '').split('-').filter(Boolean);
}

function originReport(route) {
  const p = aps(route);
  return p.length >= 3 ? p[1] : (p[0] || '');
}

function originOTA(route) {
  const p = aps(route);
  return p.length >= 3 ? (p[0] || '') : '';
}

function destination(route) {
  const p = aps(route);
  return p[p.length - 1] || '';
}

function airlineFromFlight(flight) {
  const raw = String(flight || '').toUpperCase().trim();
  const cleaned = raw.replace('____/', '').replace(/^[_\s\-–—]+\/?/, '');
  const match = cleaned.match(/([A-Z]{2,3})\d+/);
  if (match) return match[1];
  if (/^\d+/.test(cleaned) || /\/\d+/.test(cleaned)) return 'VJ';
  return '';
}

function normFlight(flight) {
  let s = String(flight || '').toUpperCase().trim();
  s = s.replace('____/', '').replace(/^[_\s\-–—]+\/?/, '').replace(/\s+/g, '');
  if (!s) return '';
  return s.split('/').filter(Boolean).map(part => {
    part = part.replace(/^[_\s\-–—]+/, '');
    if (/^[A-Z]{2,3}\d+/.test(part)) return part;
    if (/^\d+/.test(part)) return 'VJ' + part;
    const embedded = part.match(/([A-Z]{2,3}\d+)/);
    return embedded ? embedded[1] : part;
  }).join('/');
}

function isVietJet(row) {
  const airline = String(row.airline || '').trim().toUpperCase();
  const flight = String(row.flight || '').trim().toUpperCase().replace('____/', '').replace(/^[_\s\-–—]+\/?/, '');
  return airline === 'VJ' || /^VJ\d+/.test(flight) || /\/VJ\d+/.test(flight) || flight.includes('VJ');
}

function min(timeText) {
  const match = String(timeText || '').match(/^(\d{1,2}):(\d{2})$/);
  return match ? +match[1] * 60 + +match[2] : null;
}

function diff(actual, scheduled) {
  let a = min(actual);
  let s = min(scheduled);
  if (a == null || s == null) return null;
  let d = a - s;
  if (d < -720) d += 1440;
  return d;
}

function hh(minutes) {
  if (minutes == null) return '';
  if (minutes < 0) minutes += 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function normalizeTime(value) {
  value = String(value || '').trim();
  const x = value.replace(/[^0-9:]/g, '');
  if (/^\d{4}$/.test(x)) return x.slice(0, 2) + ':' + x.slice(2);
  if (/^\d{3}$/.test(x)) return '0' + x.slice(0, 1) + ':' + x.slice(1);
  return x.slice(0, 5);
}

function normalizeRow(row) {
  const route = String(row.route || '').toUpperCase().replace(/--/g, '-');
  row.date = String(row.date || '').slice(0, 10);
  row.flight = normFlight(row.flight);
  row.route = route;
  row.originReport = row.originReport || originReport(route);
  row.originOTA = row.originOTA || originOTA(route);
  row.destination = row.destination || destination(route);
  row.market = row.market || ((DOMESTIC.has(row.originReport) && DOMESTIC.has(row.destination)) ? 'Domestic' : 'International');
  row.airline = String(row.airline || airlineFromFlight(row.flight)).trim().toUpperCase();
  row.groundTime = row.groundTime || hh(diff(row.etd, row.eta));
  row.tat = row.tat || hh(diff(row.offC, row.onC));
  row._dEtd = diff(row.offC, row.etd);
  row._dStd = diff(row.aobt || row.offC, row.std);
  row._dSta = diff(row.onC, row.sta);
  row._dDoor = diff(row.dc, row.etd);
  row.otpETD1 = row.otpETD1 || (row._dEtd == null ? '' : row._dEtd > 0 ? 'DELAY' : 'ONTIME');
  row.otpETD15 = row.otpETD15 || (row._dEtd == null ? '' : row._dEtd > 15 ? 'DELAY' : 'ONTIME');
  row.otpSTD = row.otpSTD || (row._dStd == null ? '' : row._dStd > 15 ? 'DELAY' : 'ONTIME');
  row.otaSTA = row.otaSTA || (row._dSta == null ? '' : row._dSta > 0 ? 'DELAY' : 'ONTIME');
  row.doorEarly5 = row.doorEarly5 || (row._dDoor == null ? '' : row._dDoor <= -5 ? 'ONTIME' : 'DELAY');
  row._id = row.id || [row.date, row.flight, row.reg, row.route, row.std].join('|');
  return row;
}

function baseRows(id) {
  let b = state.allRows;
  if (id === 'other') return b.filter(row => !isVietJet(row));
  if (['otpVj', 'otaVj', 'door'].includes(id)) b = b.filter(row => isVietJet(row));
  if (id === 'otaVj') b = b.filter(row => aps(row.route).length >= 3);
  return b;
}

function getOrigin(id, row) {
  return id === 'otaVj' ? row.originOTA : row.originReport;
}

function applyFilters(id) {
  const f = state.filters[id] || state.filters.overview;
  if (id === 'other' && String(f.airline || '').trim().toUpperCase() === 'VJ') f.airline = 'All';
  return baseRows(id)
    .filter(row => row.date >= f.from && row.date <= f.to)
    .filter(row => f.market === 'All' || row.market === f.market)
    .filter(row => f.origin === 'All' || getOrigin(id, row) === f.origin)
    .filter(row => f.dest === 'All' || row.destination === f.dest)
    .filter(row => !f.type || f.type === 'All' || row.type === f.type)
    .filter(row => {
      if (!f.airline || f.airline === 'All') return true;
      return String(row.airline || '').trim().toUpperCase() === String(f.airline || '').trim().toUpperCase();
    });
}

function uniq(arr) {
  return ['All', ...Array.from(new Set(arr.filter(Boolean))).sort()];
}

function pct(value) {
  return (value || 0).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
}

function ok(value) { return value === 'ONTIME'; }
function dateLabel(f) { return f.from === f.to ? f.from : `${f.from} → ${f.to}`; }

function metrics(data) {
  const ota = data.filter(row => row.otaSTA);
  const door = data.filter(row => row.doorEarly5);
  return {
    total: data.length,
    etd1: data.filter(row => ok(row.otpETD1)).length,
    etd15: data.filter(row => ok(row.otpETD15)).length,
    std: data.filter(row => ok(row.otpSTD)).length,
    otaOk: ota.filter(row => ok(row.otaSTA)).length,
    otaTotal: ota.length,
    doorOk: door.filter(row => ok(row.doorEarly5)).length,
    doorTotal: door.length,
    critical: data.filter(row => row.otpSTD === 'DELAY').length
  };
}

function head(title, id) {
  const f = state.filters[id];
  const b = baseRows(id);
  const origins = uniq(b.map(row => getOrigin(id, row)));
  const dests = uniq(b.map(row => row.destination));
  const types = uniq(b.map(row => row.type));
  let airlines = uniq(b.map(row => String(row.airline || '').trim().toUpperCase()));
  if (id === 'other') {
    airlines = uniq(b.map(row => String(row.airline || '').trim().toUpperCase()).filter(a => a && a !== 'VJ'));
    if (String(state.filters.other.airline || '').trim().toUpperCase() === 'VJ') state.filters.other.airline = 'All';
  }
  const lastFilter = id === 'other' ? select('Carrier', 'airline', airlines, f.airline, id) : select('A/C Type', 'type', types, f.type, id);
  return `<div class="page-head"><div class="head-title"><h2>${title}</h2><span class="status-pill">CSV source: DataOTP</span><div class="quick-actions"><button class="${f.quick === 'today' ? 'active' : ''}" onclick="quick('${id}','today')">TODAY REPORT</button><button class="${f.quick === 'ytd' ? 'active' : ''}" onclick="quick('${id}','ytd')">YTD REPORT</button></div></div><div class="filter-row">${input('From', 'from', f.from, id)}${input('To', 'to', f.to, id)}${select('Market', 'market', ['All', 'Domestic', 'International'], f.market, id)}${select('Origin', 'origin', origins, f.origin, id)}${select('Destination', 'dest', dests, f.dest, id)}${lastFilter}<button class="apply" onclick="applyAndRender('${id}')">OK</button></div></div>`;
}

function input(label, key, value, id) {
  const domId = `${id}_${key}`;
  return `<div class="field"><label>${label}</label><input id="${domId}" type="date" value="${value}" onchange="setFilterDate('${id}','${key}',this.value)"></div>`;
}

function select(label, key, arr, value, id) {
  return `<div class="field"><label>${label}</label><select onchange="state.filters.${id}.${key}=this.value;state.filters.${id}.quick=''">${arr.map(x => `<option ${x === value ? 'selected' : ''}>${x}</option>`).join('')}</select></div>`;
}

async function applyAndRender(id) {
  const f = state.filters[id];
  state.tablePages = {};
  await ensureData(f.from, f.to);
  render(id);
}

async function quick(id, type) {
  const f = state.filters[id];
  state.tablePages = {};
  if (type === 'today') {
    const t = todayISO();
    f.from = t;
    f.to = t;
    f.quick = 'today';
  } else {
    const t = todayISO();
    f.from = `${new Date().getFullYear()}-01-01`;
    f.to = t;
    f.quick = 'ytd';
  }
  await applyAndRender(id);
}

function kpis(type, m, period) {
  let rows;
  if (type === 'ota') rows = [['Total', m.total], ['OTA STA', pct(m.otaTotal ? m.otaOk / m.otaTotal * 100 : 0)], ['OTA Delay', m.otaTotal - m.otaOk], ['OTP STD', pct(m.total ? m.std / m.total * 100 : 0)], ['Critical', m.critical], ['Quality', `${m.otaTotal}/${m.total}`]];
  else if (type === 'door') rows = [['Total', m.total], ['Door Early 5', pct(m.doorTotal ? m.doorOk / m.doorTotal * 100 : 0)], ['Late Door', m.doorTotal - m.doorOk], ['OTP ETD15', pct(m.total ? m.etd15 / m.total * 100 : 0)], ['OTP STD', pct(m.total ? m.std / m.total * 100 : 0)], ['Quality', `${m.doorTotal}/${m.total}`]];
  else rows = [['Total', m.total], ['OTP ETD1', pct(m.total ? m.etd1 / m.total * 100 : 0)], ['OTP ETD15', pct(m.total ? m.etd15 / m.total * 100 : 0)], ['OTP STD', pct(m.total ? m.std / m.total * 100 : 0)], ['OTA', pct(m.otaTotal ? m.otaOk / m.otaTotal * 100 : 0)], ['Critical', m.critical]];
  return `<div class="kpi-grid">${rows.map(x => `<div class="kpi"><div class="label">${x[0]}</div><div class="value">${x[1]}</div><div class="sub">${period}</div></div>`).join('')}</div>`;
}

function chart(title, data, field, id) {
  const ontime = data.filter(row => ok(row[field])).length;
  const total = data.length;
  const delay = Math.max(0, total - ontime);
  const p = total ? ontime / total * 100 : 0;
  const groups = {};
  const byMarket = state.filters[id].market === 'All';
  data.forEach(row => {
    const k = byMarket ? row.market : (row.destination || 'N/A');
    groups[k] = groups[k] || [0, 0];
    groups[k][0]++;
    if (ok(row[field])) groups[k][1]++;
  });
  const bars = Object.entries(groups).map(([k, v]) => [k, v[0] ? v[1] / v[0] * 100 : 0]).sort((a, b) => b[1] - a[1]);
  return `<div class="card"><h3>${title}</h3><div class="donut-wrap"><div><div class="donut" style="--deg:${Math.round(p * 3.6)}deg"><strong>${pct(p)}</strong></div><div class="legend"><span><i class="sw" style="background:var(--blue)"></i>Ontime ${ontime}</span><span><i class="sw" style="background:#ffd166"></i>Delay ${delay}</span></div></div><div>${bars.map(b => { const c = b[1] >= 85 ? 'var(--green)' : b[1] >= 65 ? '#f59e0b' : '#ef4444'; return `<div class="bar"><div>${b[0]}</div><div class="track"><div class="fill" style="width:${b[1]}%;background:${c}"></div></div><div class="pill" style="background:${c}">${pct(b[1])}</div></div>`; }).join('')}</div></div></div>`;
}

function delayReasons(data) {
  const totalDelayFlights = data.filter(row => String(row.code1 || row.code2 || row.code3 || '').trim()).length;
  const map = {};
  data.forEach(row => {
    [['code1', 'min1'], ['code2', 'min2'], ['code3', 'min3']].forEach(pair => {
      const code = String(row[pair[0]] || '').trim();
      if (!code) return;
      map[code] = map[code] || { code, count: 0, min: 0 };
      map[code].count++;
      map[code].min += toMinutes(row[pair[1]]);
    });
  });
  const arr = Object.values(map).sort((a, b) => b.count - a.count);
  return `<div class="card"><h3>Delay Reasons Overview</h3><div class="reason-wrap"><table class="reason-table"><thead><tr><th>CODE</th><th>SỐ CHUYẾN</th><th>SỐ PHÚT</th><th>TỈ LỆ %</th></tr></thead><tbody>${arr.map(x => `<tr><td>${x.code}</td><td>${x.count}</td><td>${x.min}</td><td>${totalDelayFlights ? pct(x.count / totalDelayFlights * 100) : '0,0%'}</td></tr>`).join('') || '<tr><td colspan="4">No delay code data</td></tr>'}</tbody></table></div></div>`;
}

function toMinutes(value) {
  const a = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
  return a ? +a[1] * 60 + +a[2] : (parseFloat(value) || 0);
}

function report(id, type, title) {
  const data = applyFilters(id);
  const m = metrics(data);
  const period = dateLabel(state.filters[id]);
  const leftField = type === 'ota' ? 'otaSTA' : type === 'door' ? 'doorEarly5' : 'otpETD15';
  const rightField = type === 'other' ? 'otpETD1' : 'otpSTD';
  const leftTitle = type === 'ota' ? 'OTA STA Performance' : type === 'door' ? 'Door Closed Early 5' : 'OTP ETD15 Performance';
  const rightTitle = type === 'other' ? 'Other Carrier ETD1' : 'OTP STD Performance';
  document.getElementById(id).innerHTML = head(title, id) + kpis(type, m, period) + `<div class="main-grid">${chart(leftTitle, data, leftField, id)}${chart(rightTitle, data, rightField, id)}</div><div style="margin-top:16px">${delayReasons(data)}</div>`;
}

function cols() {
  return ['date', 'flight', 'reg', 'type', 'route', 'sta', 'std', 'eta', 'etd', 'onC', 'dc', 'offC', 'aobt', 'groundTime', 'tat', 'otpETD1', 'otpETD15', 'otpSTD', 'otaSTA', 'doorEarly5', 'code1', 'min1', 'code2', 'min2', 'code3', 'min3', 'delayReason', 'originReport', 'originOTA', 'destination', 'market', 'airline'];
}

function table(data, editable = false, pageSize = 50, tableKey = state.activeTab || 'table') {
  const totalRows = data.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  let page = Number(state.tablePages[tableKey] || 1);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (page > totalPages) page = totalPages;
  state.tablePages[tableKey] = page;
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, totalRows);
  const shown = data.slice(start, end);
  const safeKey = String(tableKey).replace(/'/g, "\\'");
  const pageInfo = totalRows ? `Showing ${start + 1}-${end} of ${totalRows}` : 'No rows';
  const pager = `<div class="pager" style="display:flex;gap:6px;align-items:center;margin-left:auto;flex-wrap:wrap"><button class="manual-btn" ${page <= 1 ? 'disabled' : ''} onclick="gotoTablePage('${safeKey}', 1)">First</button><button class="manual-btn" ${page <= 1 ? 'disabled' : ''} onclick="gotoTablePage('${safeKey}', ${page - 1})">Prev</button><span class="status-pill">Page ${page}/${totalPages}</span><button class="manual-btn" ${page >= totalPages ? 'disabled' : ''} onclick="gotoTablePage('${safeKey}', ${page + 1})">Next</button><button class="manual-btn" ${page >= totalPages ? 'disabled' : ''} onclick="gotoTablePage('${safeKey}', ${totalPages})">Last</button></div>`;
  return `<div class="card table-card"><div class="table-tools"><input placeholder="Search flight / route on this page..." oninput="filterTable(this.value)"><select onchange="filterDelay(this.value)"><option value="all">All flights on page</option><option value="delay">Delay only on page</option></select><span class="status-pill">${pageInfo}</span>${pager}</div><div class="table-wrap"><table class="smart-table" id="smartTable"><thead><tr>${cols().map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${shown.map(row => tableRow(row, editable)).join('')}</tbody></table></div></div>`;
}

function gotoTablePage(tableKey, page) {
  state.tablePages[tableKey] = page;
  render(state.activeTab);
  setTimeout(() => {
    const tableEl = document.getElementById('smartTable');
    if (tableEl) tableEl.scrollIntoView({ block: 'nearest' });
  }, 0);
}

function tableRow(row, editable) {
  const readonly = ['groundTime', 'tat', 'otpETD1', 'otpETD15', 'otpSTD', 'otaSTA', 'doorEarly5', 'originReport', 'originOTA', 'destination', 'market', 'airline'];
  return `<tr class="${row.otpSTD === 'DELAY' ? 'delay15' : row.otpETD1 === 'DELAY' ? 'delay1' : ''}" data-delay="${row.otpETD1 === 'DELAY' || row.otpSTD === 'DELAY' ? 'yes' : 'no'}" data-id="${escapeHtml(row._id)}">${cols().map(field => editable && !readonly.includes(field) ? `<td contenteditable="true" tabindex="0" data-field="${field}" onkeydown="gridKey(event,this)" onblur="saveCell(this)">${escapeHtml(row[field] || '')}</td>` : `<td class="${field === 'delayReason' ? 'reason' : ''}">${escapeHtml(row[field] || '')}</td>`).join('')}</tr>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function filterTable(q) {
  q = String(q || '').toLowerCase();
  document.querySelectorAll('#smartTable tbody tr').forEach(tr => tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none');
}

function filterDelay(value) {
  document.querySelectorAll('#smartTable tbody tr').forEach(tr => tr.style.display = (value === 'all' || tr.dataset.delay === 'yes') ? '' : 'none');
}

function normalizeCell(field, value) {
  value = String(value || '').trim();
  if (['sta', 'std', 'eta', 'etd', 'onC', 'dc', 'offC', 'aobt', 'min1', 'min2', 'min3'].includes(field)) return normalizeTime(value);
  if (field === 'flight') return normFlight(value);
  if (field === 'route') return value.toUpperCase().replace(/--/g, '-').replace(/[^A-Z-]/g, '');
  return field === 'delayReason' ? value : value.toUpperCase();
}

function saveCell(td) {
  const id = td.parentElement.dataset.id;
  const field = td.dataset.field;
  const row = state.allRows.find(x => x._id === id);
  if (!row) return;
  row[field] = normalizeCell(field, td.textContent);
  normalizeRow(row);
  state.edits[row._id] = { ...row };
  saveLocalEdits();
  td.textContent = row[field] || '';
}

function gridKey(e, td) {
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) return;
  e.preventDefault();
  saveCell(td);
  const tr = td.parentElement;
  const tbody = tr.parentElement;
  const rows = [...tbody.children];
  const cells = [...tr.querySelectorAll('td[contenteditable=true]')];
  let ci = cells.indexOf(td);
  let ri = rows.indexOf(tr);
  if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) ci++;
  if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) ci--;
  if (e.key === 'ArrowDown' || e.key === 'Enter') ri++;
  if (e.key === 'ArrowUp') ri--;
  ri = Math.max(0, Math.min(rows.length - 1, ri));
  const nextCells = [...rows[ri].querySelectorAll('td[contenteditable=true]')];
  ci = Math.max(0, Math.min(nextCells.length - 1, ci));
  if (nextCells[ci]) {
    nextCells[ci].focus();
    selectText(nextCells[ci]);
  }
}

function selectText(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function inputTab() {
  const data = state.allRows.filter(row => row.date === state.inputDate);
  const fields = ['date', 'flight', 'reg', 'type', 'route', 'sta', 'std', 'eta', 'etd', 'onC', 'dc', 'offC', 'aobt'];
  document.getElementById('input').innerHTML = `<div class="input-panel"><div class="manual-row">${fields.map(field => `<div class="manual-cell"><label>${field}</label><input id="manual_${field}" class="${field === 'route' ? 'routeInput' : ''}" ${field === 'date' ? 'type="date" value="' + state.inputDate + '" onchange="state.inputDate=this.value;render(\'input\')"' : ''}></div>`).join('')}<button class="manual-btn" onclick="clearManual()">Clear</button><button class="manual-btn primary" onclick="addFlight()">Add Flight</button></div></div>${table(data, true, 50, 'input')}`;
}

function addFlight() {
  const fields = ['date', 'flight', 'reg', 'type', 'route', 'sta', 'std', 'eta', 'etd', 'onC', 'dc', 'offC', 'aobt'];
  const row = { _local: true };
  fields.forEach(field => row[field] = normalizeCell(field, document.getElementById('manual_' + field).value));
  if (!row.date) row.date = state.inputDate;
  normalizeRow(row);
  row._id = 'local|' + Date.now();
  state.edits[row._id] = { ...row };
  saveLocalEdits();
  state.allRows.push(row);
  state.inputDate = row.date;
  render('input');
}

function clearManual() {
  document.querySelectorAll('.manual-row input').forEach((inputEl, i) => {
    if (i === 0) inputEl.value = state.inputDate;
    else inputEl.value = '';
  });
}

function exportCsv(rows, name) {
  const header = cols();
  const csv = [header.join(',')].concat(rows.map(row => header.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

function exportTab() {
  const data = applyFilters('export');
  document.getElementById('export').innerHTML = head('Export', 'export') + `<div class="placeholder"><div class="card"><h3>Export CSV</h3><p class="notice">Web tĩnh không ghi ngược trực tiếp lên GitHub. Dữ liệu nhập/sửa được lưu localStorage trên máy đang dùng. Bấm export để tải CSV rồi upload lại vào DataOTP nếu cần.</p><div class="export-actions"><button class="manual-btn primary" onclick="exportCsv(applyFilters('export'),'otp_selected_range.csv')">Export selected range CSV</button><button class="manual-btn" onclick="localStorage.removeItem(CONFIG.storageKey);location.reload()">Clear local edits</button></div></div><div class="card"><h3>Loaded data</h3><p><b>${data.length}</b> rows in selected range.</p><p>Loaded range: ${state.loadedRange ? state.loadedRange.from + ' → ' + state.loadedRange.to : 'not loaded'}</p></div></div>`;
}

function analysisTab() {
  const data = applyFilters('analysis');
  const m = metrics(data);
  const delayRows = data.filter(row => row.otpETD1 === 'DELAY' || row.otpETD15 === 'DELAY' || row.otpSTD === 'DELAY' || row.otaSTA === 'DELAY' || row.doorEarly5 === 'DELAY' || String(row.code1 || row.code2 || row.code3 || '').trim());
  const performanceNotice = `<div class="notice" style="margin:16px 0"><b>Performance mode:</b> Delay Analysis đang phân tích ${data.length} dòng. Bảng chi tiết bên dưới chia trang 50 dòng/page để tránh treo trình duyệt. Các KPI và Delay Reasons Overview phía trên vẫn tính trên toàn bộ dữ liệu đã lọc.</div>`;
  document.getElementById('analysis').innerHTML = head('Delay Analysis', 'analysis') + kpis('otp', m, dateLabel(state.filters.analysis)) + delayReasons(data) + performanceNotice + table(delayRows, false, 50, 'analysisDelay');
}

function render(id = state.activeTab) {
  state.activeTab = id;
  if (id === 'overview') report('overview', 'otp', 'Overview');
  if (id === 'otpVj') report('otpVj', 'otp', 'OTP VietJet');
  if (id === 'otaVj') report('otaVj', 'ota', 'OTA VietJet');
  if (id === 'door') report('door', 'door', 'Door Closed');
  if (id === 'other') report('other', 'other', 'Other Carrier');
  if (id === 'input') inputTab();
  if (id === 'analysis') analysisTab();
  if (id === 'export') exportTab();
}

async function init() {
  console.log('VJGS OTP Static Web Build', CONFIG.version);
  const collapse = document.getElementById('collapseBtn');
  if (collapse) collapse.onclick = () => document.body.classList.toggle('collapsed');
  document.querySelectorAll('.navitem').forEach(nav => {
    nav.onclick = () => {
      document.querySelectorAll('.navitem').forEach(item => item.classList.remove('active'));
      nav.classList.add('active');
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      document.getElementById(nav.dataset.tab).classList.add('active');
      render(nav.dataset.tab);
    };
  });
  setInterval(() => {
    const clock = document.getElementById('clock');
    if (clock) clock.textContent = new Date().toLocaleString('vi-VN');
  }, 1000);
  await ensureData(CONFIG.defaultFrom, CONFIG.defaultTo);
  render('overview');
}

init().catch(error => {
  console.error(error);
  setStatus('Error loading CSV');
  document.getElementById('overview').innerHTML = `<div class="notice"><b>Không tải được DataOTP.</b><br>Lỗi kỹ thuật: ${escapeHtml(error.message)}<br><br>Kiểm tra trực tiếp:<br><code>./DataOTP/otp_2026_index.json</code><br><code>./DataOTP/2026/otp_2026_08.csv</code></div>`;
});
