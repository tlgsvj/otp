/* VJGS OTP/OTA hotfix v2
   Fixes OTP Input date loading by patching render('input') directly.
   Add AFTER app.js:
   <script src="app.js?v=20260819-5"></script>
   <script src="otp_input_hotfix_v2.js?v=20260819-5"></script>
*/

(function () {
  const LOCAL_DELETE_FLAG = '_deleted';
  const PAGE_SIZE = 50;

  function safeText(value) {
    return String(value ?? '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  }

  function inputCols() {
    return ['date', 'flight', 'reg', 'type', 'route', 'sta', 'std', 'eta', 'etd', 'onC', 'dc', 'offC', 'aobt', 'groundTime', 'tat', 'otpETD1', 'otpETD15', 'otpSTD', 'otaSTA', 'doorEarly5', 'code1', 'min1', 'code2', 'min2', 'code3', 'min3', 'delayReason', 'originReport', 'originOTA', 'destination', 'market', 'airline'];
  }

  function visibleInputRows() {
    return (state.allRows || []).filter(row => row.date === state.inputDate && !row[LOCAL_DELETE_FLAG]);
  }

  async function loadInputDate(value) {
    if (!value) return;
    state.inputDate = value;
    state.tablePages = state.tablePages || {};
    state.tablePages.input = 1;
    await ensureData(value, value);
    render('input');
  }

  window.changeInputDate = loadInputDate;

  window.deleteOtpRow = function deleteOtpRow(rowId) {
    const row = (state.allRows || []).find(item => item._id === rowId);
    if (!row) return;

    if (row._local) {
      delete state.edits[rowId];
    } else {
      state.edits[rowId] = { ...row, [LOCAL_DELETE_FLAG]: true };
    }

    state.allRows = (state.allRows || []).filter(item => item._id !== rowId);
    saveLocalEdits();
    render('input');
  };

  const originalApplyFilters = window.applyFilters;
  if (typeof originalApplyFilters === 'function') {
    window.applyFilters = function patchedApplyFilters(id) {
      return originalApplyFilters(id).filter(row => !row[LOCAL_DELETE_FLAG]);
    };
  }

  window.gotoInputPage = function gotoInputPage(page) {
    state.tablePages = state.tablePages || {};
    state.tablePages.input = page;
    render('input');
  };

  function inputRow(row) {
    const readonly = ['groundTime', 'tat', 'otpETD1', 'otpETD15', 'otpSTD', 'otaSTA', 'doorEarly5', 'originReport', 'originOTA', 'destination', 'market', 'airline'];
    const cells = inputCols().map(field => {
      if (!readonly.includes(field)) {
        return `<td contenteditable="true" tabindex="0" data-field="${field}" onkeydown="gridKey(event,this)" onblur="saveCell(this)">${safeText(row[field] || '')}</td>`;
      }
      return `<td class="${field === 'delayReason' ? 'reason' : ''}">${safeText(row[field] || '')}</td>`;
    }).join('');

    const id = String(row._id || '').replace(/'/g, "\\'");
    return `<tr class="${row.otpSTD === 'DELAY' ? 'delay15' : row.otpETD1 === 'DELAY' ? 'delay1' : ''}" data-delay="${row.otpETD1 === 'DELAY' || row.otpSTD === 'DELAY' ? 'yes' : 'no'}" data-id="${safeText(row._id)}">${cells}<td><button class="manual-btn" style="color:#991b1b" onclick="deleteOtpRow('${id}')">Delete</button></td></tr>`;
  }

  function inputTable(data) {
    state.tablePages = state.tablePages || {};
    const totalRows = data.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
    let page = Number(state.tablePages.input || 1);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    state.tablePages.input = page;

    const start = (page - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, totalRows);
    const shown = data.slice(start, end);
    const rowInfo = totalRows ? `Showing ${start + 1}-${end} of ${totalRows}` : 'No rows';

    return `<div class="card table-card">
      <div class="table-tools">
        <input placeholder="Search flight / route on this page..." oninput="filterTable(this.value)">
        <select onchange="filterDelay(this.value)">
          <option value="all">All flights on page</option>
          <option value="delay">Delay only on page</option>
        </select>
        <span class="status-pill">${rowInfo}</span>
        <div class="pager" style="display:flex;gap:6px;align-items:center;margin-left:auto;flex-wrap:wrap">
          <button class="manual-btn" ${page <= 1 ? 'disabled' : ''} onclick="gotoInputPage(1)">First</button>
          <button class="manual-btn" ${page <= 1 ? 'disabled' : ''} onclick="gotoInputPage(${page - 1})">Prev</button>
          <span class="status-pill">Page ${page}/${totalPages}</span>
          <button class="manual-btn" ${page >= totalPages ? 'disabled' : ''} onclick="gotoInputPage(${page + 1})">Next</button>
          <button class="manual-btn" ${page >= totalPages ? 'disabled' : ''} onclick="gotoInputPage(${totalPages})">Last</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="smart-table" id="smartTable">
          <thead><tr>${inputCols().map(col => `<th>${col}</th>`).join('')}<th>ACTION</th></tr></thead>
          <tbody>${shown.map(inputRow).join('')}</tbody>
        </table>
      </div>
    </div>`;
  }

  function patchedInputTab() {
    const fields = ['date', 'flight', 'reg', 'type', 'route', 'sta', 'std', 'eta', 'etd', 'onC', 'dc', 'offC', 'aobt'];
    const data = visibleInputRows();
    const form = `<div class="input-panel"><div class="manual-row">
      ${fields.map(field => `<div class="manual-cell"><label>${field}</label><input id="manual_${field}" class="${field === 'route' ? 'routeInput' : ''}" ${field === 'date' ? `type="date" value="${state.inputDate}" onchange="changeInputDate(this.value)"` : ''}></div>`).join('')}
      <button class="manual-btn" onclick="clearManual()">Clear</button>
      <button class="manual-btn primary" onclick="addFlight()">Add Flight</button>
    </div></div>`;

    document.getElementById('input').innerHTML = form + inputTable(data);
  }

  const originalRender = window.render;
  if (typeof originalRender === 'function') {
    window.render = function patchedRender(id = state.activeTab) {
      if (id === 'input') {
        state.activeTab = 'input';
        patchedInputTab();
        return;
      }
      return originalRender(id);
    };
  }

  const originalAddFlight = window.addFlight;
  if (typeof originalAddFlight === 'function') {
    window.addFlight = function patchedAddFlight() {
      const dateInput = document.getElementById('manual_date');
      if (dateInput && dateInput.value) state.inputDate = dateInput.value;
      originalAddFlight();
      state.tablePages = state.tablePages || {};
      state.tablePages.input = 1;
      render('input');
    };
  }

  console.log('OTP Input hotfix v2 loaded');
})();
