const CONFIG = {
  dataIndex: './DataOTP/otp_2026_index.json',
  defaultFrom: '2026-08-14',
  defaultTo: '2026-08-14',
  storageKey: 'vjgs_otp_static_edits_v1'
};
const DOMESTIC = new Set('DIN THD VDH VCL TBB PXU BMV VKG CAH VCS HAN SGN DAD VDO HPH VII HUI CXR DLI UIH VCA PQC LTH'.split(' '));
const state = {
  activeTab: 'overview',
  index: {},
  monthCache: new Map(),
  allRows: [],
  edits: loadLocalEdits(),
  loadedRange: null,
  filters: {
    overview:{from:CONFIG.defaultFrom,to:CONFIG.defaultTo,market:'All',origin:'All',dest:'All',type:'All',quick:''},
    otpVj:{from:CONFIG.defaultFrom,to:CONFIG.defaultTo,market:'All',origin:'All',dest:'All',type:'All',quick:''},
    otaVj:{from:CONFIG.defaultFrom,to:CONFIG.defaultTo,market:'All',origin:'All',dest:'All',type:'All',quick:''},
    door:{from:CONFIG.defaultFrom,to:CONFIG.defaultTo,market:'All',origin:'All',dest:'All',type:'All',quick:''},
    other:{from:CONFIG.defaultFrom,to:CONFIG.defaultTo,market:'All',origin:'All',dest:'All',airline:'All',quick:''},
    analysis:{from:CONFIG.defaultFrom,to:CONFIG.defaultTo,market:'All',origin:'All',dest:'All',type:'All',quick:''},
    export:{from:CONFIG.defaultFrom,to:CONFIG.defaultTo,market:'All',origin:'All',dest:'All',type:'All',quick:''}
  },
  inputDate: CONFIG.defaultTo
};
function assetUrl(path) {
  const cleanPath = String(path || '').replace(/^\.?\//, '');
  const baseUrl = new URL('./', window.location.href);
  return new URL(cleanPath, baseUrl).href;
}
function setStatus(t){document.getElementById('loadStatus').textContent=t;}
function loadLocalEdits(){try{return JSON.parse(localStorage.getItem(CONFIG.storageKey)||'{}')}catch(e){return {}}}
function saveLocalEdits(){localStorage.setItem(CONFIG.storageKey,JSON.stringify(state.edits));}
function csvParse(text){
  text=text.replace(/^\uFEFF/,'');
  const rows=[];let row=[],cur='',q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],n=text[i+1];
    if(c==='"') { if(q&&n==='"'){cur+='"';i++;} else q=!q; }
    else if(c===','&&!q){row.push(cur);cur='';}
    else if((c==='\n'||c==='\r')&&!q){ if(c==='\r'&&n==='\n')i++; row.push(cur); if(row.some(x=>x!==''))rows.push(row); row=[]; cur='';}
    else cur+=c;
  }
  if(cur!==''||row.length){row.push(cur); if(row.some(x=>x!==''))rows.push(row);}
  return rows;
}
function rowsFromCsv(text){
  const arr=csvParse(text); const header=arr.shift()||[];
  return arr.map(r=>{const o={}; header.forEach((h,i)=>o[h]=r[i]??''); return normalizeRow(o);});
}
function monthsBetween(from,to){
  const a=new Date(from+'T00:00:00'),b=new Date(to+'T00:00:00'),out=[];
  let y=a.getFullYear(),m=a.getMonth();
  while(y<b.getFullYear() || (y===b.getFullYear()&&m<=b.getMonth())){out.push(`${y}-${String(m+1).padStart(2,'0')}`);m++;if(m>11){m=0;y++;}}
  return out;
}
async function ensureData(from, to) {
  if (!Object.keys(state.index).length) {
    const indexUrl = assetUrl(CONFIG.dataIndex);
    console.log('Loading index:', indexUrl);

    const indexResponse = await fetch(indexUrl, { cache: 'no-cache' });

    if (!indexResponse.ok) {
      throw new Error(`Index load failed ${indexResponse.status}: ${indexUrl}`);
    }

    state.index = await indexResponse.json();
  }

  const months = monthsBetween(from, to);
  setStatus(`Loading ${months.join(', ')}`);

  for (const month of months) {
    if (!state.monthCache.has(month)) {
      const info = state.index[month];

      if (!info || !info.file) {
        console.warn('No data file for month:', month);
        state.monthCache.set(month, []);
        continue;
      }

      const csvUrl = assetUrl(info.file);
      console.log('Loading CSV:', csvUrl);

      const csvResponse = await fetch(csvUrl, { cache: 'no-cache' });

      if (!csvResponse.ok) {
        throw new Error(`CSV load failed ${csvResponse.status}: ${csvUrl}`);
      }

      const csvText = await csvResponse.text();
      state.monthCache.set(month, rowsFromCsv(csvText));
    }
  }

  const baseRows = months.flatMap(month => state.monthCache.get(month) || []);

  const rowsWithEdits = baseRows.map(row =>
    state.edits[row._id] ? normalizeRow({ ...row, ...state.edits[row._id] }) : row
  );

  const localRows = Object.values(state.edits)
    .filter(row => row._local && row.date >= from && row.date <= to)
    .map(normalizeRow);

  state.allRows = [...rowsWithEdits, ...localRows]
    .filter(row => row.date >= from && row.date <= to);

  state.loadedRange = { from, to };
  setStatus(`${state.allRows.length} rows loaded`);
}
function aps(route){return String(route||'').toUpperCase().replace(/--/g,'-').replace(/\s+/g,'').split('-').filter(Boolean)}
function originReport(route){const p=aps(route);return p.length>=3?p[1]:(p[0]||'')}
function originOTA(route){const p=aps(route);return p.length>=3?(p[0]||''):''}
function destination(route){const p=aps(route);return p[p.length-1]||''}
function airlineFromFlight(f){let s=String(f||'').toUpperCase().replace('____/','').trim();for(const part of s.split('/')){let m=part.match(/^([A-Z]{2,3})\d+/); if(m)return m[1]; if(/^\d+/.test(part))return 'VJ';}return ''}
function normFlight(f){let s=String(f||'').toUpperCase().replace('____/','').trim();if(!s)return '';return s.split('/').map(x=>x.startsWith('VJ')||/^[A-Z]{2,3}\d+/.test(x)?x:(/^\d+/.test(x)?'VJ'+x:x)).join('/')}
function min(t){const m=String(t||'').match(/^(\d{1,2}):(\d{2})$/);return m?+m[1]*60+ +m[2]:null}
function diff(a,b){let x=min(a),y=min(b); if(x==null||y==null)return null; let d=x-y; if(d<-720)d+=1440; return d}
function hh(n){if(n==null)return''; if(n<0)n+=1440; return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function normalizeTime(v){v=String(v||'').trim(); const x=v.replace(/[^0-9:]/g,''); if(/^\d{4}$/.test(x))return x.slice(0,2)+':'+x.slice(2); if(/^\d{3}$/.test(x))return '0'+x.slice(0,1)+':'+x.slice(1); return x.slice(0,5)}
function normalizeRow(r){
  const route=String(r.route||'').toUpperCase().replace(/--/g,'-');
  r.date=String(r.date||'').slice(0,10); r.flight=normFlight(r.flight); r.route=route;
  r.originReport=r.originReport||originReport(route); r.origin=r.origin||r.originReport; r.originOTA=r.originOTA||originOTA(route); r.destination=r.destination||destination(route);
  r.market=r.market||((DOMESTIC.has(r.originReport)&&DOMESTIC.has(r.destination))?'Domestic':'International');
  r.airline=r.airline||airlineFromFlight(r.flight);
  r.groundTime=r.groundTime||hh(diff(r.etd,r.eta)); r.tat=r.tat||hh(diff(r.offC,r.onC));
  r._dEtd=diff(r.offC,r.etd); r._dStd=diff(r.aobt||r.offC,r.std); r._dSta=diff(r.onC,r.sta); r._dDoor=diff(r.dc,r.etd);
  r.otpETD1=r.otpETD1 || (r._dEtd==null?'':r._dEtd>0?'DELAY':'ONTIME');
  r.otpETD15=r.otpETD15 || (r._dEtd==null?'':r._dEtd>15?'DELAY':'ONTIME');
  r.otpSTD=r.otpSTD || (r._dStd==null?'':r._dStd>15?'DELAY':'ONTIME');
  r.otaSTA=r.otaSTA || (r._dSta==null?'':r._dSta>0?'DELAY':'ONTIME');
  r.doorEarly5=r.doorEarly5 || (r._dDoor==null?'':r._dDoor<=-5?'ONTIME':'DELAY');
  r._id = r.id || [r.date,r.flight,r.reg,r.route,r.std].join('|');
  return r;
}
function baseRows(id){let b=state.allRows; if(id==='other')return b.filter(r=>!r.flight.startsWith('VJ')); if(['otpVj','otaVj','door'].includes(id))b=b.filter(r=>r.flight.startsWith('VJ')); if(id==='otaVj')b=b.filter(r=>aps(r.route).length>=3); return b;}
function getOrigin(id,r){return id==='otaVj'?r.originOTA:r.originReport}
function applyFilters(id){const f=state.filters[id]||state.filters.overview; return baseRows(id).filter(r=>r.date>=f.from&&r.date<=f.to).filter(r=>f.market==='All'||r.market===f.market).filter(r=>f.origin==='All'||getOrigin(id,r)===f.origin).filter(r=>f.dest==='All'||r.destination===f.dest).filter(r=>!f.type||f.type==='All'||r.type===f.type).filter(r=>!f.airline||f.airline==='All'||r.airline===f.airline);}
function uniq(arr){return ['All',...Array.from(new Set(arr.filter(Boolean))).sort()]}
function pct(x){return (x||0).toLocaleString('vi-VN',{minimumFractionDigits:1,maximumFractionDigits:1})+'%'}
function ok(v){return v==='ONTIME'}
function dateLabel(f){return f.from===f.to?f.from:`${f.from} → ${f.to}`}
function metrics(d){let ota=d.filter(r=>r.otaSTA),door=d.filter(r=>r.doorEarly5);return {total:d.length,etd1:d.filter(r=>ok(r.otpETD1)).length,etd15:d.filter(r=>ok(r.otpETD15)).length,std:d.filter(r=>ok(r.otpSTD)).length,otaOk:ota.filter(r=>ok(r.otaSTA)).length,otaTotal:ota.length,doorOk:door.filter(r=>ok(r.doorEarly5)).length,doorTotal:door.length,critical:d.filter(r=>r.otpSTD==='DELAY').length};}
function head(title,id){const f=state.filters[id], b=baseRows(id); const origins=uniq(b.map(r=>getOrigin(id,r))); const dests=uniq(b.map(r=>r.destination)); const types=uniq(b.map(r=>r.type)); const airlines=uniq(b.map(r=>r.airline)); const last=id==='other'?select('Carrier','airline',airlines,f.airline,id):select('A/C Type','type',types,f.type,id); return `<div class="page-head"><div class="head-title"><h2>${title}</h2><span class="status-pill">CSV source: DataOTP</span><div class="quick-actions"><button class="${f.quick==='today'?'active':''}" onclick="quick('${id}','today')">TODAY REPORT</button><button class="${f.quick==='ytd'?'active':''}" onclick="quick('${id}','ytd')">YTD REPORT</button></div></div><div class="filter-row">${input('From','from',f.from,id)}${input('To','to',f.to,id)}${select('Market','market',['All','Domestic','International'],f.market,id)}${select('Origin','origin',origins,f.origin,id)}${select('Destination','dest',dests,f.dest,id)}${last}<button class="apply" onclick="applyAndRender('${id}')">OK</button></div></div>`;}
function input(label,key,val,id){return `<div class="field"><label>${label}</label><input type="date" value="${val}" onchange="state.filters.${id}.${key}=this.value;state.filters.${id}.quick='' "></div>`}
function select(label,key,arr,val,id){return `<div class="field"><label>${label}</label><select onchange="state.filters.${id}.${key}=this.value;state.filters.${id}.quick=''">${arr.map(x=>`<option ${x===val?'selected':''}>${x}</option>`).join('')}</select></div>`}
async function applyAndRender(id){const f=state.filters[id]; await ensureData(f.from,f.to); render(id);}
async function quick(id,type){const f=state.filters[id]; if(type==='today'){f.from=CONFIG.defaultTo; f.to=CONFIG.defaultTo; f.quick='today';} else {f.from='2026-01-01'; f.to=CONFIG.defaultTo; f.quick='ytd';} await applyAndRender(id);}
function kpis(type,m,period){let rows= type==='ota' ? [['Total',m.total],['OTA STA',pct(m.otaTotal?m.otaOk/m.otaTotal*100:0)],['OTA Delay',m.otaTotal-m.otaOk],['OTP STD',pct(m.total?m.std/m.total*100:0)],['Critical',m.critical],['Quality',`${m.otaTotal}/${m.total}`]] : type==='door' ? [['Total',m.total],['Door Early 5',pct(m.doorTotal?m.doorOk/m.doorTotal*100:0)],['Late Door',m.doorTotal-m.doorOk],['OTP ETD15',pct(m.total?m.etd15/m.total*100:0)],['OTP STD',pct(m.total?m.std/m.total*100:0)],['Quality',`${m.doorTotal}/${m.total}`]] : [['Total',m.total],['OTP ETD1',pct(m.total?m.etd1/m.total*100:0)],['OTP ETD15',pct(m.total?m.etd15/m.total*100:0)],['OTP STD',pct(m.total?m.std/m.total*100:0)],['OTA',pct(m.otaTotal?m.otaOk/m.otaTotal*100:0)],['Critical',m.critical]]; return `<div class="kpi-grid">${rows.map(x=>`<div class="kpi"><div class="label">${x[0]}</div><div class="value">${x[1]}</div><div class="sub">${period}</div></div>`).join('')}</div>`;}
function chart(title,d,field,id){const ontime=d.filter(r=>ok(r[field])).length,total=d.length,delay=Math.max(0,total-ontime),p=total?ontime/total*100:0,groups={},byMarket=state.filters[id].market==='All';d.forEach(r=>{const k=byMarket?r.market:(r.destination||'N/A');groups[k]=groups[k]||[0,0];groups[k][0]++;if(ok(r[field]))groups[k][1]++});const bars=Object.entries(groups).map(([k,v])=>[k,v[0]?v[1]/v[0]*100:0]).sort((a,b)=>b[1]-a[1]);return `<div class="card"><h3>${title}</h3><div class="donut-wrap"><div><div class="donut" style="--deg:${Math.round(p*3.6)}deg"><strong>${pct(p)}</strong></div><div class="legend"><span><i class="sw" style="background:var(--blue)"></i>Ontime ${ontime}</span><span><i class="sw" style="background:#ffd166"></i>Delay ${delay}</span></div></div><div>${bars.map(b=>{const c=b[1]>=85?'var(--green)':b[1]>=65?'#f59e0b':'#ef4444'; return `<div class="bar"><div>${b[0]}</div><div class="track"><div class="fill" style="width:${b[1]}%;background:${c}"></div></div><div class="pill" style="background:${c}">${pct(b[1])}</div></div>`}).join('')}</div></div></div>`;}
function delayReasons(d){let total=d.filter(r=>String(r.code1||r.code2||r.code3||'').trim()).length,map={};d.forEach(r=>[['code1','min1'],['code2','min2'],['code3','min3']].forEach(p=>{let c=String(r[p[0]]||'').trim(); if(!c)return; map[c]=map[c]||{code:c,count:0,min:0}; map[c].count++; map[c].min+=toMinutes(r[p[1]]);}));let arr=Object.values(map).sort((a,b)=>b.count-a.count);return `<div class="card"><h3>Delay Reasons Overview</h3><div class="reason-wrap"><table class="reason-table"><thead><tr><th>CODE</th><th>SỐ CHUYẾN</th><th>SỐ PHÚT</th><th>TỈ LỆ %</th></tr></thead><tbody>${arr.map(x=>`<tr><td>${x.code}</td><td>${x.count}</td><td>${x.min}</td><td>${total?pct(x.count/total*100):'0,0%'}</td></tr>`).join('')||'<tr><td colspan="4">No delay code data</td></tr>'}</tbody></table></div></div>`;}
function toMinutes(v){const a=String(v||'').match(/^(\d{1,2}):(\d{2})$/);return a?+a[1]*60+ +a[2]:(parseFloat(v)||0)}
function report(id,type,title){const d=applyFilters(id),m=metrics(d),period=dateLabel(state.filters[id]); document.getElementById(id).innerHTML=head(title,id)+kpis(type,m,period)+`<div class="main-grid">${chart(type==='ota'?'OTA STA Performance':type==='door'?'Door Closed Early 5':'OTP ETD15 Performance',d,type==='ota'?'otaSTA':type==='door'?'doorEarly5':'otpETD15',id)}${chart(type==='other'?'Other Carrier ETD1':'OTP STD Performance',d,type==='other'?'otpETD1':'otpSTD',id)}</div><div style="margin-top:16px">${delayReasons(d)}</div>`;}
function cols(){return ['date','flight','reg','type','route','sta','std','eta','etd','onC','dc','offC','aobt','groundTime','tat','otpETD1','otpETD15','otpSTD','otaSTA','doorEarly5','code1','min1','code2','min2','code3','min3','delayReason','originReport','originOTA','destination','market','airline'];}
function table(d,editable=false){return `<div class="card table-card"><div class="table-tools"><input placeholder="Search flight / route..." oninput="filterTable(this.value)"><select onchange="filterDelay(this.value)"><option value="all">All flights</option><option value="delay">Delay only</option></select><span class="status-pill">${d.length} flights</span></div><div class="table-wrap"><table class="smart-table" id="smartTable"><thead><tr>${cols().map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${d.map(r=>row(r,editable)).join('')}</tbody></table></div></div>`}
function row(r,editable){return `<tr class="${r.otpSTD==='DELAY'?'delay15':r.otpETD1==='DELAY'?'delay1':''}" data-delay="${r.otpETD1==='DELAY'||r.otpSTD==='DELAY'?'yes':'no'}" data-id="${escapeHtml(r._id)}">${cols().map(f=>editable && !['groundTime','tat','otpETD1','otpETD15','otpSTD','otaSTA','doorEarly5','originReport','originOTA','destination','market','airline'].includes(f)?`<td contenteditable="true" tabindex="0" data-field="${f}" onkeydown="gridKey(event,this)" onblur="saveCell(this)">${escapeHtml(r[f]||'')}</td>`:`<td class="${f==='delayReason'?'reason':''}">${escapeHtml(r[f]||'')}</td>`).join('')}</tr>`}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function filterTable(q){q=q.toLowerCase();document.querySelectorAll('#smartTable tbody tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none')}
function filterDelay(v){document.querySelectorAll('#smartTable tbody tr').forEach(tr=>tr.style.display=(v==='all'||tr.dataset.delay==='yes')?'':'none')}
function normalizeCell(f,v){v=String(v||'').trim(); if(['sta','std','eta','etd','onC','dc','offC','aobt','min1','min2','min3'].includes(f))return normalizeTime(v); if(f==='flight')return normFlight(v); if(f==='route')return v.toUpperCase().replace(/--/g,'-').replace(/[^A-Z-]/g,''); return f==='delayReason'?v:v.toUpperCase();}
function saveCell(td){const id=td.parentElement.dataset.id, f=td.dataset.field; let r=state.allRows.find(x=>x._id===id); if(!r)return; r[f]=normalizeCell(f,td.textContent); normalizeRow(r); state.edits[r._id]={...r}; saveLocalEdits(); td.textContent=r[f]||'';}
function gridKey(e,td){if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','Enter'].includes(e.key))return; e.preventDefault(); saveCell(td); const tr=td.parentElement,tb=tr.parentElement,rs=[...tb.children],eds=[...tr.querySelectorAll('td[contenteditable=true]')]; let ci=eds.indexOf(td),ri=rs.indexOf(tr); if(e.key==='ArrowRight'||(e.key==='Tab'&&!e.shiftKey))ci++; if(e.key==='ArrowLeft'||(e.key==='Tab'&&e.shiftKey))ci--; if(e.key==='ArrowDown'||e.key==='Enter')ri++; if(e.key==='ArrowUp')ri--; ri=Math.max(0,Math.min(rs.length-1,ri)); const neds=[...rs[ri].querySelectorAll('td[contenteditable=true]')]; ci=Math.max(0,Math.min(neds.length-1,ci)); if(neds[ci]){neds[ci].focus(); selectText(neds[ci]);}}
function selectText(el){const r=document.createRange();r.selectNodeContents(el);const s=window.getSelection();s.removeAllRanges();s.addRange(r);}
function inputTab(){const d=state.allRows.filter(r=>r.date===state.inputDate); const fields=['date','flight','reg','type','route','sta','std','eta','etd','onC','dc','offC','aobt']; document.getElementById('input').innerHTML=`<div class="input-panel"><div class="manual-row">${fields.map(f=>`<div class="manual-cell"><label>${f}</label><input id="manual_${f}" class="${f==='route'?'routeInput':''}" ${f==='date'?'type="date" value="'+state.inputDate+'" onchange="state.inputDate=this.value;render(\'input\')"':''}></div>`).join('')}<button class="manual-btn" onclick="clearManual()">Clear</button><button class="manual-btn primary" onclick="addFlight()">Add Flight</button></div></div>${table(d,true)}`;}
function addFlight(){const fields=['date','flight','reg','type','route','sta','std','eta','etd','onC','dc','offC','aobt']; const r={_local:true}; fields.forEach(f=>r[f]=normalizeCell(f,document.getElementById('manual_'+f).value)); if(!r.date)r.date=state.inputDate; normalizeRow(r); r._id='local|'+Date.now(); state.edits[r._id]={...r}; saveLocalEdits(); state.allRows.push(r); state.inputDate=r.date; render('input');}
function clearManual(){document.querySelectorAll('.manual-row input').forEach((e,i)=>{if(i===0)e.value=state.inputDate;else e.value=''})}
function exportCsv(rows,name){const header=cols(); const csv=[header.join(',')].concat(rows.map(r=>header.map(h=>`"${String(r[h]||'').replace(/"/g,'""')}"`).join(','))).join('\r\n'); const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500);}
function exportTab(){const d=applyFilters('export'); document.getElementById('export').innerHTML=head('Export','export')+`<div class="placeholder"><div class="card"><h3>Export CSV</h3><p class="notice">Web tĩnh không ghi ngược trực tiếp lên GitHub. Dữ liệu nhập/sửa được lưu localStorage trên máy đang dùng. Bấm export để tải CSV rồi upload lại vào DataOTP nếu cần.</p><div class="export-actions"><button class="manual-btn primary" onclick="exportCsv(applyFilters('export'),'otp_selected_range.csv')">Export selected range CSV</button><button class="manual-btn" onclick="localStorage.removeItem(CONFIG.storageKey);location.reload()">Clear local edits</button></div></div><div class="card"><h3>Loaded data</h3><p><b>${d.length}</b> rows in selected range.</p><p>Loaded range: ${state.loadedRange?state.loadedRange.from+' → '+state.loadedRange.to:'not loaded'}</p></div></div>`;}
function analysisTab(){const d=applyFilters('analysis'),m=metrics(d); document.getElementById('analysis').innerHTML=head('Delay Analysis','analysis')+kpis('otp',m,dateLabel(state.filters.analysis))+delayReasons(d)+table(d,false);}
function render(id=state.activeTab){state.activeTab=id; if(id==='overview')report('overview','otp','Overview'); if(id==='otpVj')report('otpVj','otp','OTP VietJet'); if(id==='otaVj')report('otaVj','ota','OTA VietJet'); if(id==='door')report('door','door','Door Closed'); if(id==='other')report('other','other','Other Carrier'); if(id==='input')inputTab(); if(id==='analysis')analysisTab(); if(id==='export')exportTab();}
async function init(){
  document.getElementById('collapseBtn').onclick=()=>document.body.classList.toggle('collapsed');
  document.querySelectorAll('.navitem').forEach(n=>n.onclick=()=>{document.querySelectorAll('.navitem').forEach(x=>x.classList.remove('active'));n.classList.add('active');document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.getElementById(n.dataset.tab).classList.add('active');render(n.dataset.tab)});
  setInterval(()=>document.getElementById('clock').textContent=new Date().toLocaleString('vi-VN'),1000);
  await ensureData(CONFIG.defaultFrom,CONFIG.defaultTo); render('overview');
}
init().catch(e => {
  console.error(e);
  setStatus('Error loading CSV');

  document.getElementById('overview').innerHTML = `
    <div class="notice">
      <b>Không tải được DataOTP.</b><br>
      Lỗi kỹ thuật: ${e.message}<br><br>
      Hãy kiểm tra trực tiếp các đường dẫn sau:<br>
      <code>./DataOTP/otp_2026_index.json</code><br>
      <code>./DataOTP/2026/otp_2026_08.csv</code>
    </div>
  `;
});
