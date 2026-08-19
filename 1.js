/* VJGS OTP/OTA hotfix: OTP Input date loading + local add/delete on static GitHub Pages.
   Include this file AFTER app.js in index.html:
   <script src="app.js?v=20260819"></script>
   <script src="otp_input_hotfix.js?v=20260819"></script>
*/

(function () {
  const LOCAL_DELETE_FLAG = '_deleted';

  function getInputDateValue() {
    const el = document.getElementById('manual_date');
    return el && el.value ? el.value : (window.state && state.inputDate) || new Date().toISOString().slice(0, 10);
  }

  window.changeInputDate = async function changeInputDate(value) {
    if (!value) return;
    state.inputDate = value;
    state.tablePages = state.tablePages || {};
    state.tablePages.input = 1;
    await ensureData(value, value);
    render('input');
  };

  function inputVisibleRows() {
    return (state.allRows || []).filter(row => row.date === state.inputDate && !row[LOCAL_DELETE_FLAG]);
  }

  window.deleteOtpRow = function deleteOtpRow(rowId) {
    const row = (state.allRows || []).find(x => x._id === rowId);
    if (!row) return;

    // For rows from CSV: mark as deleted in localStorage so all tabs can hide it locally.
    // For newly added local rows: remove from localStorage entirely.
    if (row._local) {
      delete state.edits[rowId];
    } else {
      state.edits[rowId] = { ...row, [LOCAL_DELETE_FLAG]: true };
    }

    state.allRows = (state.allRows || []).filter(x => x._id !== rowId);
    saveLocalEdits();
    render('input');
  };

  const originalApplyFilters = window.applyFilters;
  window.applyFilters = function patchedApplyFilters(id) {
    const rows = originalApplyFilters(id);
    return rows.filter(row => !row[LOCAL_DELETE_FLAG]);
  };

  window.inputTab = function patchedInputTab() {
    const fields = ['date', 'flight', 'reg', 'type', 'route', 'sta', 'std', 'eta', 'etd', 'onC', 'dc', 'offC', 'aobt'];
    const data = inputVisibleRows();

    document.getElementById('input').innerHTML = `
      <div class="input-panel">
        <div class="manual-row">
          ${fields.map(field => `
            <div class="manual-cell">
              <label>${field}</label>
              <input id="manual_${field}" class="${field === 'route' ? 'routeInput' : ''}"
                ${field === 'date'
                  ? `type="date" value="${state.inputDate}" onchange="changeInputDate(this.value)"`
                  : ''}>
            </div>`).join('')}
          <button class="manual-btn" onclick="clearManual()">Clear</button>
          <button class="manual-btn primary" onclick="addFlight()">Add Flight</button>
        </div>
      </div>
      ${inputTable(data)}
    `;
  };

  function inputTable(data) {
    const pageSize = 50;
    state.tablePages = state.tablePages || {};
    const key = 'input';
    const totalRows = data.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    let page = Number(state.tablePages[key] || 1);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    state.tablePages[key] = page;

    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, totalRows);
    const shown = data.slice(start, end);
    const info = totalRows ? `Showing ${start + 1}-${end} of ${totalRows}` : 'No rows';

    return `
      <div class="card table-card">
        <div class="table-tools">
          <input placeholder="Search flight / route on this page..." oninput="filterTable(this.value)">
          <select onchange="filterDelay(this.value)">
            <option value="all">All flights on page</option>
            <option value="delay">Delay only on page</option>
          </select>
          <span class="status-pill">${info}</span>
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
            <thead><tr>${inputCols().map(x => `<th>${x}</th>`).join('')}<th>ACTION</th></tr></thead>
            <tbody>${shown.map(row => inputRow(row)).join('')}</tbody>
          </table>
        </div>
      </div>`;
  }

  window.gotoInputPage = function gotoInputPage(page) {
    state.tablePages = state.tablePages || {};
    state.tablePages.input = page;
    render('input');
  };

  function inputCols() {
    return ['date', 'flight', 'reg', 'type', 'route', 'sta', 'std', 'eta', 'etd', 'onC', 'dc', 'offC', 'aobt', 'groundTime', 'tat', 'otpETD1', 'otpETD15', 'otpSTD', 'otaSTA', 'doorEarly5', 'code1', 'min1', 'code2', 'min2', 'code3', 'min3', 'delayReason', 'originReport', 'originOTA', 'destination', 'market', 'airline'];
  }

  function inputRow(row) {
    const readonly = ['groundTime', 'tat', 'otpETD1', 'otpETD15', 'otpSTD', 'otaSTA', 'doorEarly5', 'originReport', 'originOTA', 'destination', 'market', 'airline'];
    return `
      <tr class="${row.otpSTD === 'DELAY' ? 'delay15' : row.otpETD1 === 'DELAY' ? 'delay1' : ''}"
          data-delay="${row.otpETD1 === 'DELAY' || row.otpSTD === 'DELAY' ? 'yes' : 'no'}"
          data-id="${escapeHtml(row._id)}">
        ${inputCols().map(field => !readonly.includes(field)
          ? `<td contenteditable="true" tabindex="0" data-field="${field}" onkeydown="gridKey(event,this)" onblur="saveCell(this)">${escapeHtml(row[field] || '')}</td>`
          : `<td class="${field === 'delayReason' ? 'reason' : ''}">${escapeHtml(row[field] || '')}</td>`).join('')}
        <td><button class="manual-btn" style="color:#991b1b" onclick="deleteOtpRow('${String(row._id).replace(/'/g, "\\'")}')">Delete</button></td>
      </tr>`;
  }

  const originalAddFlight = window.addFlight;
  window.addFlight = function patchedAddFlight() {
    // Keep existing add logic, then ensure the selected date is loaded and refreshed.
    originalAddFlight();
    const selectedDate = getInputDateValue();
    state.inputDate = selectedDate;
    state.tablePages = state.tablePages || {};
    state.tablePages.input = 1;
    render('input');
  };

  console.log('OTP Input hotfix loaded: date loading + local delete + pagination');
})();
