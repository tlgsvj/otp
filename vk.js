// Trợ lý Vạn Kiếp Tu Tiên — mức 1 (chỉ tính toán, không tự bấm).
// Chạy bên trong trang game: tự tải code hiện tại của game và dùng lại các hàm tính toán của chính game.
// 2.10.0 (11/2025): bám lại code game sau bản cập nhật đổi tên hàm + đổi cách gọi hàm khởi động.
const TOOL_VER = '2.10.0';

(() => {
  if (window.__vkTroLy) { window.__vkTroLy.show(); return; }
  const S = window.__vkTroLy = { core: null, best: null, abort: false };

  // ───────────────────────── 1. Nạp lõi game ─────────────────────────
  // Tìm hàm theo "dấu vân tay" trong code (tên hàm bị rút gọn và đổi sau mỗi bản cập nhật).
  const ANCHORS = {
    eJ:  [/\.doDung\)!=null&&/, 'mô phỏng trận'],
    Vr:  [/\{ten:[\w$]+\.ten,drugResistTran:\{\},drugRetention:/, 'chỉ số nhân vật khi đánh'],
    Ga:  [/muc\?\?"thuong",\w=\w\.canh_gioi/, 'dựng quái'],
    Rt:  [/\(([\w$]+),([\w$]+),([\w$]+)\)\{const [\w$]+=\3\.dac_tinh\?\?\{\},[\w$]+=[\w$]+\(\3\)/, 'tính kinh mạch'],
    Tp:  ['.khuon.split(', 'khuôn kinh mạch'],
    al:  [/\(\w\.hinh\?\?\[\],\w\.xoay\)/, 'ô của mảnh'],
    Jh:  ['Món này đã có trên kinh mạch', 'kiểm tra chỗ đặt'],
    kR:  ['pillOptions:', 'tỉ lệ đột phá'],
    Hon: [/\.tran_phai\)\{if\(\w\.tang!=="dai_tong_mon"/, 'Tàng Kinh Các'],
    wr:  ['["chưa có sư môn"]', 'điều kiện thăng cấp'],
    Kn:  [/\.flags\.mon_phai;if\(typeof \w=="string"\)/, 'sư môn'],
    ke:  [/\.thoNguyen;return \w\+Math\.round\(\w\*\(\w\.lifespanBonusPct/, 'thọ nguyên'],
    Rsn: ['"inner_disciple":"core_disciple";', 'đối thủ khảo hạch'],
    ko:  [/return \w\.run\.tamMa;/, 'quái từ nhân vật'],
    Qn:  [/\[0\]\.ten:`\$\{/, 'tên cảnh giới'],
    mf:  [/\.world\.distance\(\w\.run\.viTri,\w\)\*\w\.yearsPerUnit/, 'thời gian đi đường'],
    Nin: [/\.qua_cua\|\|\w\.treo_thuong\|\|\w\.bien_co\|\|/, 'tiện ích ở một nơi'],
    H1:  [/\|ke\|\$\{\w\}\|\$\{\w\}`,\{sizeFactor:/, 'hàng trong tiệm'],
  };
  const REGEX_NAMES = {
    rn: [/function ([\w$]+)\(([\w$]+)\)\{return [\w$]+\[Math\.max\(0,Math\.min\([\w$]+,\2\)\)\]\}/, 'bảng cảnh giới'],
    fn: [/class ([\w$]+)\{constructor\(([\w$]+)\)\{this\.state=\2\}static fromSeed/, 'bộ số ngẫu nhiên'],
    No: [/(?:const |,)([\w$]+)=\["Tạp dịch","Ngoại môn"/, 'tên cấp bậc tông môn'],
    E1: [/function ([\w$]+)\(([\w$]+),([\w$]+),([\w$]+),([\w$]+)=0\)\{return [\w$]+\(\2,\3,\4,[\w$]+\(\2,\3,"buy",\5\)\)\}/, 'giá mua'],
    gP: [/if\(!([\w$]+)\([\w$]+,[\w$]+\)\)throw new Error\("Nơi đó còn phủ mây/, 'vùng đã khám phá'],
  };

  // Hàm cho tính năng phụ: thiếu thì chỉ tính năng đó tắt, phần còn lại vẫn chạy.
  const ANCHORS_OPT = {
    to:  [/tuViNam:[\w$]+\([\w$]+,!![\w$]+\.song_tu\)/, 'thông tin bế quan'],
    qw:  [/\.untilExhausted&&!/, 'tu vi còn thiếu'],
    Nb:  [/return [\w$]+\([\w$]+\.run\.nhanVat,[\w$]+,[\w$]+,[\w$]+\.tuViNam\/\(/, 'tu vi theo số năm'],
    Di:  [/\*[\w$]+\.cultivationSpeed\}const /, 'tốc độ tu luyện'],
    jan: ['{ten:"Trường thi",diem:0}', 'thi nghề'],
    bb:  ['"đã tới bậc cao nhất"];const', 'điều kiện thi nghề'],
    Lu:  ['Tay nghề còn kém quá xa', 'luyện chế'],
    Pw:  [/\{ten:`Chỉ số \(/, 'điểm luyện chế'],
    Rrn: [/\.treoThuong&&\w\.nam-\w\.treoThuong\.nam</, 'bảng treo thưởng'],
    KI:  [/\.namBongLoc\)\),\[\w,\w\]=/, 'bổng lộc'],
    KS:  ['"đã được tiến cử"', 'tiến cử'],
    Uen: ['"ngang_suc":"an_toan"', 'ước lượng trận của game'],
    bcLich: ['|khai_mo|', 'lịch mở bí cảnh'],
    bcLoai: ['|bi_canh_loai|', 'loại bí cảnh'],
    bcVars: [/\.tien_ich&&[\w$]+\.from==="ten"/, 'sinh quái/đồ của sự kiện'],
    bcVao: ['Cấm chế bài xích tu vi', 'điều kiện vào bí cảnh'],
  };
  const REGEX_OPT = {
    kC: [/function ([\w$]+)\(([\w$]+),([\w$]+),([\w$]+)(?:,[\w$]+)?\)\{const [\w$]+=[\w$]+\(\2\)(?:(?!function ).){0,300}?return\{mau:/, 'dựng kinh mạch'],
    IP: [/function ([\w$]+)\(([\w$]+),([\w$]+),([\w$]+),([\w$]+)=0\)\{return [\w$]+\(\2,\3,\4,\5,[\w$]+\(\2,\3,"sell",\5\)\)\}/, 'giá bán'],
  };

  function findFn(src, anchor) {
    let idx = -1, count = 0;
    if (typeof anchor === 'string') {
      idx = src.indexOf(anchor);
      if (idx >= 0) count = src.indexOf(anchor, idx + 1) >= 0 ? 2 : 1;
    } else {
      const re = new RegExp(anchor.source, 'g'); let m;
      while ((m = re.exec(src))) { if (count === 0) idx = m.index; count++; if (count > 1) break; }
    }
    if (count !== 1) return null;
    const j = src.lastIndexOf('function ', idx);
    if (j < 0 || idx - j > 1500) return null;
    const m = /^function ([\w$]+)\(/.exec(src.slice(j, j + 80));
    return m ? m[1] : null;
  }

  async function loadCore(progress) {
    const g = window.game;
    if (!g || !g.env || !g.env.content) throw new Error('Chưa thấy game. Hãy mở trang game, đợi tải xong rồi bấm lại dấu trang.');
    const tag = document.querySelector('script[type=module][src*="/assets/index-"]');
    if (!tag) throw new Error('Không tìm thấy file code chính của game.');
    const url = tag.src, base = url.slice(0, url.lastIndexOf('/') + 1);
    progress('Đang tải code game…');
    let src = await (await fetch(url)).text();
    const names = {}, missing = [];
    for (const [k, [a, label]] of Object.entries(ANCHORS)) { const n = findFn(src, a); if (n) names[k] = n; else if (k !== 'Nin') missing.push(label); }
    // Tiện ích ở một nơi: bản game mới bỏ hàm trả id; dùng hàm kiểm tra điều kiện của game (gA) mà danh sách tiện ích đang gọi.
    if (!names.Nin) {
      const m = /function ([\w$]+)\(([\w$]+),([\w$]+)\)\{[^{}]{0,120}const [\w$]+=new Set;for\(const ([\w$]+) of \2\.content\.encounters\.values\(\)\)\{if\(!\4\.tien_ich\|\|!\4\.dia_diem\|\|\4\.an\|\|\4\.mat_bi\|\|!\(\4\.weight\?\?1\)\|\|\4\.qua_cua\|\|(?:\4\.nhan_mach\|\|)?\4\.treo_thuong\|\|\4\.bien_co\|\|!([\w$]+)\(\2,\4,\3\)/.exec(src);
      if (m) names.NinOk = m[5]; else missing.push('tiện ích ở một nơi');
    }
    for (const [k, [re, label]] of Object.entries(REGEX_NAMES)) { const m = re.exec(src); if (m) names[k] = m[1]; else missing.push(label); }
    // Bản mới của game: hàm tính kinh mạch tách thành hàm trong (t,n,e) + hàm bọc có cache (t,n)
    if (names.Rt && new RegExp('function ' + names.Rt.replace(/\$/g, '\\$') + '\\([\\w$]+,[\\w$]+,[\\w$]+\\)').test(src)) {
      const m = new RegExp('function ([\\w$]+)\\(([\\w$]+),([\\w$]+)\\)\\{(?:(?!function ).){0,900}?=' + names.Rt.replace(/\$/g, '\\$') + '\\(\\2,\\3,[\\w$]+\\)', 's').exec(src);
      if (m) names.Rt = m[1]; else missing.push('tính kinh mạch (bọc)');
    }
    // Bản mới của game: kiểm tra món (t,n,e,i) tách khỏi hàm kiểm tra chỗ đặt (t,n,e,i=-1)
    if (names.Jh && !new RegExp('function ' + names.Jh.replace(/\$/g, '\\$') + '\\([\\w$]+,[\\w$]+,[\\w$]+,[\\w$]+=-1\\)').test(src)) {
      const m = new RegExp('function ([\\w$]+)\\([\\w$]+,[\\w$]+,[\\w$]+,[\\w$]+=-1\\)\\{(?:(?!function ).){0,400}?' + names.Jh.replace(/\$/g, '\\$') + '\\(', 's').exec(src);
      if (m) names.Jh = m[1]; else missing.push('kiểm tra chỗ đặt (bọc)');
    }
    if (names.Tp) {
      const m = new RegExp(`function ([\\w$]+)\\(([\\w$]+),([\\w$]+)\\)\\{return ${names.Tp.replace(/\$/g, '\\$')}\\(([\\w$]+)\\(\\2,\\3\\)\\)\\}`).exec(src);
      if (m) names.xo = m[1]; else missing.push('lưới kinh mạch');
    }
    const optMissing = [];
    for (const [k, [a, label]] of Object.entries(ANCHORS_OPT)) { const n = findFn(src, a); if (n) names[k] = n; else optMissing.push(label); }
    for (const [k, [re, label]] of Object.entries(REGEX_OPT)) { const m = re.exec(src); if (m) names[k] = m[1]; else optMissing.push(label); }
    { const m = /,([\w$]+)=\(([\w$]+),([\w$]+),([\w$]+)\)=>\2\.world\.info\(\4\)\.capNen-[\w$]+\(\3\.nhanVat\),([\w$]+)=([\w$]+)=>[\w$]+\.find\(([\w$]+)=>\6<=\7\.max\)/.exec(src); if (m) { names.ua = m[1]; names.is = m[5]; } else optMissing.push('độ nguy hiểm'); }
    let PO = 30; { const m = /,PO=([\w$]+)[,;]/.exec(src); if (m) { const v = new RegExp('[,; ]' + m[1].replace(/\$/g, '\\$') + '=(\\d+(?:\\.\\d+)?)').exec(src); if (v) PO = +v[1]; } }
    if (missing.length) throw new Error('Game vừa cập nhật nên tool chưa nhận ra: ' + missing.join(', ') + '. Hãy chụp màn hình này gửi Claude để sửa tool.');
    // Đường dẫn tương đối → tuyệt đối (vì bản sao chạy từ blob:)
    src = src.replace(/from"\.\//g, 'from"' + base).replace(/import\("\.\//g, 'import("' + base);
    // Bản sao chạy từ blob: nên import.meta.url phải trỏ về file gốc của game
    src = src.replace(/import\.meta\.url/g, JSON.stringify(url));
    // Không cho bản sao khởi động lại giao diện game
    let ok1 = false, ok2 = false;
    src = src.replace(/((?:[\w$]+\(\);)*)const ([\w$]+)=[\w$]+\.createRoot\(document\.getElementById\("hud"\)\)/, (_, __, v) => { ok1 = true; return `const ${v}={render(){}}`; });
    src = src.replace(/(__tuTienReady:!0\}\)\})([\w$]+)\(\)\.catch\(/, (_, a) => { ok2 = true; return a + 'Promise.resolve().catch('; });
    if (!ok2) {
      // Bản game 11/2025: giữa hàm khởi động và lời gọi nó có thêm hàm phụ chen vào,
      // nên tìm hàm kết thúc bằng __tuTienReady rồi thay đúng lời gọi <tên>() của nó.
      const iReady = src.indexOf('__tuTienReady:!0})}');
      if (iReady >= 0) {
        const fi = src.lastIndexOf('function ', iReady);
        const fm = fi >= 0 ? /^function ([\w$]+)\(/.exec(src.slice(fi, fi + 80)) : null;
        if (fm) {
          const call = fm[1] + '().catch(';
          const ci = src.indexOf(call, iReady);
          if (ci >= 0) { src = src.slice(0, ci) + 'Promise.resolve().catch(' + src.slice(ci + call.length); ok2 = true; }
        }
      }
    }
    if (!ok1 || !ok2) throw new Error('Game vừa đổi cách khởi động nên tool chưa chạy được. Hãy chụp màn hình này gửi Claude để sửa tool.');
    src = src.replace(/window\.addEventListener\("contextmenu",/, 'void("contextmenu",');
    if (names.Uen) {
      const fi = src.indexOf('function ' + names.Uen + '(');
      if (fi >= 0) {
        const seg = src.slice(fi, fi + 2000);
        const seg2 = seg.replace(/if\(([\w$]+)\(\{ta:([\w$]+),dich:([\w$]+)\}\)===0\)return\{level:"unknown",enemy:[\w$]+\.ten\};(const [\w$]+=[\w$]+\([\w$]+,[\w$]+\);return\{)/, (_, g, a, b, rest) => `const __vkAn=${g}({ta:${a},dich:${b}})===0;${rest}an:__vkAn,`);
        if (seg2 !== seg) src = src.slice(0, fi) + seg2 + src.slice(fi + 2000);
      }
    }
    src += `\n;export const __VKT={${Object.entries(names).map(([k, v]) => k + ':' + v).join(',')}};`;
    progress('Đang dựng bộ tính toán…');
    const blobUrl = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    const mod = await import(blobUrl);
    URL.revokeObjectURL(blobUrl);
    const K = mod.__VKT;
    K.bundle = url.split('/').pop();
    K.optMissing = optMissing; K.PO = PO;
    if (!K.Nin && K.NinOk) {
      const ok = K.NinOk;
      K.Nin = (c, slot) => { const out = []; for (const e of c.content.encounters.values()) { if (!e.tien_ich || !e.dia_diem || e.an || e.mat_bi || !(e.weight ?? 1) || e.qua_cua || e.nhan_mach || e.treo_thuong || e.bien_co) continue; try { if (ok(c, e, slot)) out.push(e.id); } catch {} } return out; };
    }
    return K;
  }

  // ───────────────────────── 2. Tiện ích ─────────────────────────
  const G = () => window.game;
  const C = () => G().env.content;
  const clone = (x) => structuredClone(x);
  const sleep0 = () => new Promise((r) => setTimeout(r, 0));
  const pct = (x, d = 0) => (x * 100).toFixed(d).replace('.', ',') + '%';
  const num = (x, d = 1) => (Math.round(x * 10 ** d) / 10 ** d).toString().replace('.', ',');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const HE = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ', bang: 'Băng', loi: 'Lôi', phong: 'Phong', vo_sac: 'Vô sắc' };
  const heTen = (h) => HE[h] ?? h;
  const STAGE = ['Sơ', 'Trung', 'Hậu', 'ĐVM'];

  function ctx() {
    const K = S.core, st = G().state;
    const run = clone(st.run), meta = clone(st.meta), F = K.fn, o = new Map();
    run.rngKeys ??= {};
    return {
      ...G().env, run, meta, rng: new F(run.rng), enc: run.active, noticeLines: [],
      rngFor(r) {
        let u = o.get(r);
        if (!u) { const l = Object.hasOwn(run.rngKeys, r) ? run.rngKeys[r] : undefined; u = l === undefined ? F.fromSeed(`${run.seed}|rng|${r}`) : new F(l); o.set(r, u); }
        return u;
      },
    };
  }
  const nvNow = () => clone(G().state.run.nhanVat);
  const realmName = (i) => { try { return S.core.rn(i).ten; } catch { return 'Cảnh giới ' + i; } };
  const realmLabel = (cg, tc) => { try { return S.core.Qn(cg, tc); } catch { return realmName(cg); } };

  // ───────────────────────── 3. Mô phỏng trận ─────────────────────────
  const BENCH_IDS = ['enemy.de_tu_truc_co', 'enemy.doc_hanh_kiem_khach', 'enemy.ma_tu_hut_mau', 'enemy.cuong_thi', 'enemy.am_tuong', 'enemy.lao_hoe_tinh', 'enemy.hoa_tinh', 'enemy.thuy_linh', 'enemy.mao_cuong'];
  function benchEnemies(cg, tcP = 0) {
    const K = S.core, c = C();
    const tcs = [Math.max(0, tcP - 1), tcP, Math.min(3, tcP + 1)];
    let ids = BENCH_IDS.filter((id) => c.enemies.has(id));
    if (ids.length < 6) { const all = [...c.enemies.keys()].sort(); const step = Math.max(1, Math.floor(all.length / 9)); ids = all.filter((_, i) => i % step === 0).slice(0, 9); }
    return ids.map((id, i) => ({ id, E: K.Ga({ ...c.enemies.get(id), canh_gioi: cg, tieu_canh_gioi: tcs[i % 3] }, c, { muc: 'thuong' }) }));
  }
  function fight(P, E) {
    try { return S.core.eJ(clone(P), clone(E), {}); } catch { return { thang: false, nHiep: 30, khiHuyetThapNhat: 0, stTa: 0 }; }
  }
  function enemyAt(def, cg, tc, muc) {
    return S.core.Ga({ ...def, canh_gioi: cg, tieu_canh_gioi: tc }, C(), muc ? { muc } : {});
  }

  // ───────────────────────── 4. Tối ưu kinh mạch ─────────────────────────
  // ── Lối tu đang theo (chọn ở tab Lối build) → điều hướng việc xếp kinh mạch
  const PATH_KEY = 'vk-tro-ly:loi-tu';
  S.path = (() => { try { return JSON.parse(localStorage.getItem(PATH_KEY)) || null; } catch { return null; } })();
  const savePath = () => { try { localStorage.setItem(PATH_KEY, JSON.stringify(S.path)); } catch {} };
  const PATH_W = { 0: 0, 1: 1, 2: 3, 3: 3 };
  const PATH_MUC = [['0', 'Không theo lối (chỉ xét sức mạnh)'], ['1', 'Ưu tiên đồ của lối'], ['2', 'Ưu tiên mạnh'], ['3', 'Chỉ dùng đồ của lối']];
  const TA_TAGS = ['ma', 'nghich', 'thi', 'quy', 'doc', 'hop_hoan'];
  const TA_BUILDS = ['ma', 'doc', 'hop_hoan', 'thi', 'quy'];
  const NL_BUILD = { ngu_thu: 'thu', khoi_loi: 'khoi_loi', doc: 'trung', thi: 'thi', quy: 'hon' };
  const isTa = (it) => (it.tag || []).some((t) => TA_TAGS.includes(t)) || (it.ngu_linh && ['thi', 'hon'].includes(it.ngu_linh.loai));
  const curBuild = () => (S.path && S.path.k && S.path.w > 0 && typeof BUILDS !== 'undefined') ? BUILDS.find((b) => b.k === S.path.k) : null;
  // Phân tích một cách xếp theo lối tu: số món của lối, điều kiện bắt buộc, chính/tà
  function pathInfo(b, R, nv) {
    const th = R.manh.filter((m) => m && m.thong);
    const match = th.filter((m) => buildMatch(b, m.item));
    const openCells = nv.kinhMach.trangThai.filter((x) => x === 'thong').length || 1;
    const taCells = th.filter((m) => isTa(m.item)).reduce((a, m) => a + ((m.o && m.o.length) || 1), 0);
    const taRatio = taCells / openCells;
    const req = [];
    if (b.k === 'the') { const ok = th.some((m) => m.item.loai === 'cong_phap' && !m.item.chieu && (m.item.tag || []).includes('the')); req.push({ ok, txt: 'tâm pháp luyện thể đang thông (bắt buộc để chiêu thể tu đánh bằng khí huyết)' }); }
    if (TA_BUILDS.includes(b.k)) req.push({ ok: taRatio >= 1 / 3, txt: `mảnh tà ≥ 1/3 ô đang thông để lưới ngả tà (hiện ${Math.round(taRatio * 100)}%)` });
    else if (!b.elem && taCells > 0) req.push({ ok: taRatio < 1 / 3, txt: `giữ lưới chính đạo: mảnh tà dưới 1/3 ô (hiện ${Math.round(taRatio * 100)}%)` });
    if (NL_BUILD[b.k]) { const slots = th.filter((m) => m.item.ngu_linh && m.item.ngu_linh.loai === NL_BUILD[b.k]).reduce((a, m) => a + (m.item.ngu_linh.o || 0), 0); req.push({ ok: slots > 0, txt: `công pháp mở ô ${({ thu: 'thú', khoi_loi: 'khôi lỗi', trung: 'cổ trùng', thi: 'thi khôi', hon: 'quỷ hồn' })[NL_BUILD[b.k]]} đang thông (hiện ${slots} ô)` }); }
    if (b.k === 'kiem') req.push({ ok: match.some((m) => m.item.chieu), txt: 'có kiếm ra chiêu đang thông' });
    return { match: match.length, thong: th.length, taRatio, taCells, req };
  }
  function pathScore(R, nv) {
    const b = curBuild(); if (!b) return 0;
    const W = PATH_W[S.path.w] || 0; if (!W) return 0;
    const pi = pathInfo(b, R, nv);
    let sc = 40 * pi.match;
    for (const r of pi.req) sc += r.ok ? 120 : -120;
    if (!TA_BUILDS.includes(b.k) && !b.elem) sc -= 8 * R.manh.filter((m) => m && m.thong && isTa(m.item)).length;
    return W * sc;
  }
  function pathReportHtml(R, nv) {
    const b = curBuild(); if (!b || !R) return '';
    const pi = pathInfo(b, R, nv);
    const miss = pi.req.some((r) => !r.ok);
    return `<div style="margin:6px 0;font-size:14px">Theo lối <b>${esc(b.ten)}</b>: ${pi.match}/${pi.thong} món đang thông thuộc lối.${pi.req.map((r) => `<br>${r.ok ? '<span class="vk-ok">✓</span>' : '<span class="vk-bad">✗</span>'} ${esc(r.txt)}`).join('')}${miss ? '<br><span class="vk-mu" style="font-size:12px">Điều kiện ✗ là do trong túi chưa có món phù hợp: xem tab Lối build (đồ nên lắp) và Đồ nên săn để gom.</span>' : ''}</div>`;
  }
  function pathCardHtml() {
    const b = S.path && S.path.k ? BUILDS.find((x) => x.k === S.path.k) : null;
    return `<div class="vk-card"><h3>Lối tu khi xếp</h3>${b ? `<div style="font-size:14px">Đang theo: <b>${esc(b.ten)}</b> <span class="vk-mu" style="font-size:12px">(đổi ở tab Lối build)</span></div>
      <select class="vk-sel" id="vk-pw" style="margin-top:6px">${PATH_MUC.map(([v, t]) => `<option value="${v}" ${String(S.path.w) === v ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <div class="vk-mu" style="font-size:12px;margin-top:4px">Áp cho: Xếp kinh mạch, Xếp 2 bộ, Ô nên mở, Đồ nên săn. "Chỉ dùng đồ của lối" bỏ hẳn chiêu ngoài lối, vẫn giữ tâm pháp khác để đủ linh lực.</div>`
      : '<div class="vk-mu" style="font-size:14px">Chưa chọn lối tu. Vào tab <b>Lối build</b>, chọn lối rồi bấm <b>Theo lối này khi xếp</b> để tool xếp đồ hướng vào lối đó.</div>'}</div>`;
  }
  function bindPathCard(rerender) {
    const sel = body.querySelector('#vk-pw'); if (!sel) return;
    sel.onchange = () => { S.path.w = +sel.value; savePath(); S.best = null; S.san = ''; rerender && rerender(); };
  }
  function makeEval(nv0, enemies, mode) {
    const K = S.core, c = C(), cache = new Map();
    return (manh) => {
      const key = manh.map((p) => p.key).sort().join('|');
      if (cache.has(key)) return cache.get(key);
      const nv = clone(nv0); nv.kinhMach.manh = manh.map((p) => ({ ...p.m }));
      const R = K.Rt(nv, c), P = K.Vr(nv, c);
      let fightScore = 0, wins = 0;
      for (const { E } of enemies) {
        const r = fight(P, E);
        const hpLeft = r.khiHuyetThapNhat / P.khiHuyetToiDa;
        const dealt = Math.min(1, (r.stTa || 0) * Math.max(1, r.nHiep) / E.khiHuyetToiDa);
        if (r.thang) { wins++; fightScore += mode === 'danh' ? 100 + 15 * hpLeft + 60 / Math.max(1, r.nHiep) : 100 + 50 * hpLeft + 25 / Math.max(1, r.nHiep); }
        else fightScore += 50 * dealt;
      }
      const thong = R.manh.filter((m) => m && m.thong).length;
      const toc = R.biDong.toc_do || 0, dp = R.biDong.dot_pha || 0;
      const ng = R.diemNghich || 0;
      // Linh lực: hồi mỗi lượt phải đủ ra chiêu; món không thông chỉ chiếm chỗ.
      const ll = P.linhLucMoiLuot || 0;
      const atk = (P.chieu || []).filter((x) => x.dang && x.phi > 0).map((x) => x.phi);
      const minCost = atk.length ? Math.min(...atk) : 0;
      const dead = R.manh.filter((m) => m && !m.thong).length;
      const llScore = (mode === 'tu' ? 1 : mode === 'danh' ? 5 : 4) * ll - (minCost && ll < minCost ? 30 : 0) - 8 * dead;
      let s;
      // Điểm nghịch: mỗi điểm −3% tỉ lệ đột phá (tối đa −15%), thêm phản phệ trong trận (trận mẫu đã tính).
      if (mode === 'tu') s = 0.3 * fightScore + 400 * toc + 300 * dp + thong - 40 * ng + llScore;
      else if (mode === 'danh') s = fightScore + 0.2 * thong - 3 * ng + llScore;
      else s = fightScore + 30 * toc + 20 * dp + 0.2 * thong - 10 * ng + llScore;
      s += pathScore(R, nv);
      const out = { s, wins, P, R };
      cache.set(key, out);
      return out;
    };
  }

  function buildCandidates(nv0) {
    const K = S.core, c = C();
    const pb = curBuild(), strict = pb && S.path.w === 3;
    const pool = Object.keys(nv0.tuiDo).filter((id) => { const it = c.items.get(id); if (!(it && (it.loai === 'cong_phap' || it.loai === 'phap_khi') && it.hinh && (it.canh_gioi ?? 0) <= nv0.canhGioi)) return false;
      if (!strict) return true;
      if (buildMatch(pb, it)) return true;
      if (!TA_BUILDS.includes(pb.k) && isTa(it)) return false;
      return it.loai === 'cong_phap' && !it.chieu; });
    const g = K.xo(c, nv0), cand = {};
    for (const id of pool) {
      const it = c.items.get(id), seen = new Set(); cand[id] = [];
      for (let xoay = 0; xoay < 4; xoay++) for (let y = 0; y < g.cao; y++) for (let x = 0; x < g.rong; x++) {
        const m = { item: id, x, y, xoay };
        let err; try { err = K.Jh(nv0, c, m); } catch (e) { err = 'x'; }
        if (err) continue;
        const cells = K.al(g, m, it); if (!cells) continue;
        const key = id + ':' + [...cells].sort((a, b) => a - b).join(',');
        if (seen.has(key)) continue; seen.add(key);
        cand[id].push({ m, cells, key });
      }
    }
    return { cand, g };
  }

  // Xếp tham lam nhanh (giống nút tự đặt của game): lần lượt đặt món + vị trí làm tăng điểm nhiều nhất.
  async function greedy(nv0, mode) {
    const K = S.core, c = C(), { cand } = buildCandidates(nv0);
    const quick = (manh) => {
      const nv = clone(nv0); nv.kinhMach.manh = manh.map((p) => ({ ...p.m }));
      const R = K.Rt(nv, c);
      const uy = (R.chieu || []).reduce((a, x) => a + (x.uyLuc || x.uy || 0) / 10, 0);
      const toc = R.biDong.toc_do || 0, dp = R.biDong.dot_pha || 0;
      const w = mode === 'tu' ? [0.5, 60, 40, 0.3] : mode === 'danh' ? [1.5, 3, 2, 1.2] : [1, 12, 8, 1];
      const thongAll = R.manh.every((m) => !m || m.thong);
      return w[0] * R.linhLuc + w[1] * toc + w[2] * dp + w[3] * uy - 6 * (R.diemNghich || 0) - (thongAll ? 0 : 1000) + 0.2 * pathScore(R, nv);
    };
    let cur = [], curS = quick(cur);
    for (let round = 0; round < 40; round++) {
      let best = null;
      const used = new Set(cur.flatMap((p) => p.cells));
      for (const id of Object.keys(cand)) {
        if (cur.some((p) => p.m.item === id)) continue;
        for (const cnd of cand[id]) {
          if (cnd.cells.some((x) => used.has(x))) continue;
          const v = quick([...cur, cnd]);
          if (!best || v > best.v) best = { v, cnd };
        }
      }
      if (!best || best.v <= curS + 1e-9) break;
      cur.push(best.cnd); curS = best.v;
      if (round % 3 === 0) await sleep0();
    }
    return cur.map((p) => ({ ...p.m }));
  }

  async function anneal({ nv0, mode, iters, init, onProg, label }) {
    const enemies = benchEnemies(nv0.canhGioi, nv0.tieuCanhGioi || 0);
    const ev = makeEval(nv0, enemies, mode);
    const { cand } = buildCandidates(nv0);
    const ids = Object.keys(cand).filter((k) => cand[k].length);
    let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const overlaps = (manh, c, skip = -1) => { const used = new Set(); manh.forEach((p, i) => { if (i !== skip) p.cells.forEach((x) => used.add(x)); }); return c.cells.some((x) => used.has(x)); };
    let cur = [];
    if (init) for (const m of init) { const c = (cand[m.item] || []).find((c) => c.m.x === m.x && c.m.y === m.y && c.m.xoay === m.xoay); if (c && !overlaps(cur, c)) cur.push(c); }
    let curS = ev(cur).s, best = cur, bestS = curS;
    const T0 = init && init.length ? 10 : 40;
    for (let it = 0; it < iters; it++) {
      if (S.abort) break;
      if (it % 20 === 0) { onProg && onProg(it / iters, label); await sleep0(); }
      const T = Math.max(0.4, T0 * (1 - it / iters));
      const next = cur.slice(); const r = rnd();
      const free = () => ids.filter((id) => !next.some((p) => p.m.item === id));
      if (r < 0.4 || next.length === 0) { const f = free(); if (!f.length) continue; const id = f[Math.floor(rnd() * f.length)]; const c = cand[id][Math.floor(rnd() * cand[id].length)]; if (overlaps(next, c)) continue; next.push(c); }
      else if (r < 0.6) next.splice(Math.floor(rnd() * next.length), 1);
      else if (r < 0.9) { const i = Math.floor(rnd() * next.length); const id = next[i].m.item; const c = cand[id][Math.floor(rnd() * cand[id].length)]; if (overlaps(next, c, i)) continue; next[i] = c; }
      else { const i = Math.floor(rnd() * next.length); const f = free(); if (!f.length) continue; const id = f[Math.floor(rnd() * f.length)]; const c = cand[id][Math.floor(rnd() * cand[id].length)]; if (overlaps(next, c, i)) continue; next[i] = c; }
      const e = ev(next);
      if (e.s >= curS || rnd() < Math.exp((e.s - curS) / T)) { cur = next; curS = e.s; if (e.s > bestS) { best = next; bestS = e.s; } }
    }
    const e = ev(best);
    return { manh: best.map((p) => ({ ...p.m })), score: e.s, wins: e.wins, n: enemies.length, P: e.P, R: e.R };
  }

  // Bỏ khỏi cách xếp mọi món không thông (không có tác dụng gì), rồi chấm lại.
  function stripDead(nv, res, mode) {
    let manh = res.manh.slice();
    for (let k = 0; k < 5; k++) {
      const nv2 = clone(nv); nv2.kinhMach.manh = manh;
      const R = S.core.Rt(nv2, C());
      const keep = manh.filter((m, i) => R.manh[i] && R.manh[i].thong);
      if (keep.length === manh.length) break;
      manh = keep;
    }
    if (manh.length === res.manh.length) return res;
    const nv3 = clone(nv); nv3.kinhMach.manh = manh;
    return { ...evalCurrent(nv3, mode), manh };
  }
  function evalCurrent(nv, mode) {
    const enemies = benchEnemies(nv.canhGioi, nv.tieuCanhGioi || 0);
    const ev = makeEval({ ...clone(nv), kinhMach: { ...clone(nv.kinhMach), manh: [] } }, enemies, mode);
    const manh = nv.kinhMach.manh.map((m) => ({ m, key: m.item + ':' + m.x + ',' + m.y + ',' + m.xoay }));
    const e = ev(manh);
    return { manh: clone(nv.kinhMach.manh), score: e.s, wins: e.wins, n: enemies.length, P: e.P, R: e.R };
  }

  // ───────────────────────── 5. Vẽ kinh mạch ─────────────────────────
  const BASE = { thuy: ['#3f6fb5', '#5a8fd6', '#2c5592', '#6f9fd0'], bang: ['#5fb8c9', '#86cfdc', '#3e9db0'], vo_sac: ['#7d7a76', '#9a958e', '#5f5c58'], hoa: ['#c0392b', '#d9622b', '#a8321f'], tho: ['#8a6a2e', '#a07a3a', '#6e5524'], kim: ['#c9a227', '#8f7a2a', '#e0b84a', '#a8892c', '#d4a017'], moc: ['#3f8f4a', '#5aa865', '#2f6f38'], loi: ['#7a4fb5', '#9a6fd0'], phong: ['#3fa08f', '#5cbfae'] };
  const TINT = { thuy: '#cfdcef', bang: '#d3ecf0', vo_sac: '#dcd6cc', hoa: '#efc2b4', kim: '#f1e3b0', tho: '#e3d2b0', moc: '#cfe6c8', loi: '#ddd0ef', phong: '#cdebe5' };

  function drawGrid(nv, manh, mark) {
    const K = S.core, c = C();
    const nv2 = clone(nv); nv2.kinhMach.manh = manh;
    const g = K.xo(c, nv2), km = nv2.kinhMach;
    const hy = new Set(km.huyetThem || []); g.huyet.forEach((v, i) => v && hy.add(i));
    const own = {}, cols = [], used = {}, pieces = [];
    const R = K.Rt(nv2, c);
    manh.forEach((m, n) => {
      const it = c.items.get(m.item); const he = (it.he || ['vo_sac'])[0];
      const pal = BASE[he] || ['#888']; cols.push(pal[(used[he] = (used[he] || 0) + 1) % pal.length]);
      const cells = K.al(g, m, it) || []; cells.forEach((x) => (own[x] = n));
      const rm = R.manh[n];
      pieces.push({ it, cells, thong: rm ? rm.thong : false, heSo: rm ? rm.heSo : 0, onHuyet: cells.some((x) => hy.has(x)) });
    });
    // chỉ vẽ vùng có ô mở
    let x0 = 99, y0 = 99, x1 = -1, y1 = -1;
    for (let i = 0; i < g.rong * g.cao; i++) if (km.trangThai[i] !== 'an' || own[i] !== undefined) { const x = i % g.rong, y = Math.floor(i / g.rong); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1); x1 = Math.min(g.rong - 1, x1 + 1); y1 = Math.min(g.cao - 1, y1 + 1);
    const Sz = 84, M = 10, W = (x1 - x0 + 1) * Sz + 2 * M, H = (y1 - y0 + 1) * Sz + 2 * M;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const d = cv.getContext('2d');
    d.fillStyle = '#f3ece0'; d.fillRect(0, 0, W, H);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * g.rong + x, px = M + (x - x0) * Sz, py = M + (y - y0) * Sz, st = km.trangThai[i];
      let fill = st === 'an' ? '#f3ece0' : (TINT[km.mau[i]] || '#ddd');
      if (own[i] !== undefined) fill = cols[own[i]];
      d.fillStyle = fill; d.fillRect(px + 2, py + 2, Sz - 4, Sz - 4);
      d.strokeStyle = '#bdb2a3'; d.lineWidth = 2; d.strokeRect(px + 2, py + 2, Sz - 4, Sz - 4);
      if (st === 'tac') { d.fillStyle = '#7a1f1a'; d.font = 'bold 38px sans-serif'; d.textAlign = 'center'; d.textBaseline = 'middle'; d.fillText('×', px + Sz / 2, py + Sz / 2); }
      if (i === g.danDien && own[i] === undefined) { d.fillStyle = '#fbf7ef'; d.fillRect(px + 5, py + 5, Sz - 10, Sz - 10); d.strokeStyle = '#7a1f1a'; d.lineWidth = 4; d.strokeRect(px + 5, py + 5, Sz - 10, Sz - 10); d.fillStyle = '#7a1f1a'; d.font = 'bold 40px serif'; d.textAlign = 'center'; d.textBaseline = 'middle'; d.fillText('丹', px + Sz / 2, py + Sz / 2 + 2); }
      if (hy.has(i)) { d.beginPath(); d.arc(px + Sz - 16, py + 16, 9, 0, 7); d.fillStyle = '#d9b228'; d.fill(); d.strokeStyle = '#7a5c00'; d.lineWidth = 1.5; d.stroke(); }
      if (mark && mark.has(i)) { d.strokeStyle = '#1a7f37'; d.lineWidth = 7; d.strokeRect(px + 8, py + 8, Sz - 16, Sz - 16); d.fillStyle = '#1a7f37'; d.font = 'bold 18px sans-serif'; d.textAlign = 'left'; d.textBaseline = 'alphabetic'; d.fillText('MỞ', px + 12, py + Sz - 12); }
    }
    pieces.forEach((p, n) => {
      const cs = new Set(p.cells); d.strokeStyle = '#1e1512'; d.lineWidth = 7;
      for (const cI of cs) {
        const x = cI % g.rong, y = Math.floor(cI / g.rong), px = M + (x - x0) * Sz, py = M + (y - y0) * Sz;
        const L = (a, b, e, f) => { d.beginPath(); d.moveTo(a, b); d.lineTo(e, f); d.stroke(); };
        if (!cs.has(cI - g.rong)) L(px, py, px + Sz, py);
        if (!cs.has(cI + g.rong)) L(px, py + Sz, px + Sz, py + Sz);
        if (!cs.has(cI - 1) || x === 0) L(px, py, px, py + Sz);
        if (!cs.has(cI + 1) || x === g.rong - 1) L(px + Sz, py, px + Sz, py + Sz);
      }
      const c0 = Math.min(...p.cells); const x = c0 % g.rong, y = Math.floor(c0 / g.rong);
      const px = M + (x - x0) * Sz + Sz / 2, py = M + (y - y0) * Sz + Sz / 2;
      d.font = 'bold 36px sans-serif'; d.textAlign = 'center'; d.textBaseline = 'middle';
      d.lineWidth = 6; d.strokeStyle = '#1e1512'; d.strokeText(String(n + 1), px, py); d.fillStyle = '#fff'; d.fillText(String(n + 1), px, py);
    });
    const legend = pieces.map((p, n) => `<div class="vk-lg"><span class="vk-sw" style="background:${cols[n]}">${n + 1}</span><b>${esc(p.it.ten)}</b> <span class="vk-mu">· ${esc((p.it.he || ['vo_sac']).map(heTen).join('/'))}${p.onHuyet ? ' · trên huyệt' : ''}${p.thong ? '' : ' · <span class="vk-bad">không thông</span>'}</span></div>`).join('');
    return `<img class="vk-img" src="${cv.toDataURL('image/png')}" alt="kinh mạch"><div class="vk-note">Chấm vàng = huyệt · 丹 = đan điền · × = ô tắc. Giữ tay lên ảnh để lưu.</div>${legend}`;
  }

  // ───────────────────────── 6. Giao diện ─────────────────────────
  const css = `
  #vk-root{position:fixed;inset:0;z-index:2147483000;background:#f3ece0;color:#1e1512;font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;display:flex;flex-direction:column}
  #vk-root *{box-sizing:border-box}
  #vk-hd{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#7a1f1a;color:#fff}
  #vk-hd b{font-size:17px;flex:1}
  #vk-hd button{background:#fff2;border:1px solid #fff6;color:#fff;border-radius:8px;padding:6px 10px;font-size:14px}
  #vk-tabs{display:flex;overflow-x:auto;background:#eadfc6;border-bottom:1px solid #cdbf9f}
  #vk-tabs button{flex:0 0 auto;border:0;background:none;padding:10px 12px;font-size:14px;color:#5a4a3a;border-bottom:3px solid transparent}
  #vk-tabs button.on{color:#7a1f1a;border-bottom-color:#7a1f1a;font-weight:700}
  #vk-body{flex:1;overflow-y:auto;padding:12px 14px 40px}
  .vk-card{background:#fbf7ef;border:1px solid #ddd0b4;border-radius:10px;padding:10px 12px;margin:0 0 12px}
  .vk-card h3{margin:0 0 6px;font-size:16px;color:#7a1f1a}
  .vk-row{display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px dashed #e4d8bd}
  .vk-row:last-child{border-bottom:0}
  .vk-mu{color:#6b5a4a}
  .vk-ok{color:#1a7f37;font-weight:600}.vk-bad{color:#b3261e;font-weight:600}
  .vk-btn{display:inline-block;background:#7a1f1a;color:#fff;border:0;border-radius:8px;padding:9px 14px;font-size:15px;margin:4px 6px 4px 0}
  .vk-btn.sec{background:#fff;color:#7a1f1a;border:1px solid #7a1f1a}
  .vk-btn:disabled{opacity:.5}
  .vk-img{width:100%;max-width:480px;display:block;margin:6px auto;border-radius:6px}
  .vk-note{font-size:12px;color:#6b5a4a;text-align:center;margin-bottom:6px}
  .vk-lg{display:flex;align-items:center;gap:8px;padding:3px 0;font-size:14px}
  .vk-sw{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:6px;color:#fff;font-weight:700;font-size:13px;flex:0 0 26px}
  table.vk-t{width:100%;border-collapse:collapse;font-size:13.5px}
  table.vk-t th,table.vk-t td{padding:5px 4px;border-bottom:1px solid #e4d8bd;text-align:left;vertical-align:top}
  table.vk-t th{color:#7a1f1a;font-weight:600}
  .vk-bar{height:8px;background:#e4d8bd;border-radius:4px;overflow:hidden;margin:8px 0}
  .vk-bar i{display:block;height:100%;background:#7a1f1a;width:0}
  .vk-sel{font-size:15px;padding:6px;border-radius:6px;border:1px solid #cdbf9f;background:#fff;max-width:100%}
  .vk-err{background:#fde8e6;border:1px solid #e8b3ad;color:#7a1f1a;border-radius:10px;padding:10px 12px}
  #vk-fab{position:fixed;right:12px;bottom:190px;z-index:2147483001;width:52px;height:52px;border-radius:50%;background:#7a1f1a;color:#fff;font:700 22px serif;border:2px solid #f3ece0;box-shadow:0 2px 8px #0005;display:none}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  const root = document.createElement('div'); root.id = 'vk-root';
  root.innerHTML = `<div id="vk-hd"><b>Trợ lý Vạn Kiếp</b><button id="vk-rf">Làm mới</button><button id="vk-x">Đóng</button></div>
  <div id="vk-tabs"></div><div id="vk-body"></div>`;
  document.body.appendChild(root);
  const fab = document.createElement('button'); fab.id = 'vk-fab'; fab.textContent = '助'; document.body.appendChild(fab);
  const body = root.querySelector('#vk-body'), tabsEl = root.querySelector('#vk-tabs');
  S.show = () => { root.style.display = 'flex'; fab.style.display = 'none'; render(); };
  S.hide = () => { S.abort = true; root.style.display = 'none'; fab.style.display = 'block'; };
  root.querySelector('#vk-x').onclick = S.hide; fab.onclick = S.show;
  root.querySelector('#vk-rf').onclick = () => { S.best = null; S.cho = null; render(); };

  const TABS = [['tq', 'Tổng quan'], ['bld', 'Lối build'], ['km', 'Kinh mạch'], ['dp', 'Đột phá & thọ'], ['tt', 'Treo thưởng'], ['tr', 'Trận'], ['tien', 'Kiếm linh thạch'], ['cho', 'Chợ quanh đây'], ['san', 'Đồ nên săn'], ['tkc', 'Tàng Kinh Các'], ['ld', 'Luyện đan'], ['bd', 'Bản đồ'], ['dl', 'Đồ trong game']];
  S.tab = 'tq';
  tabsEl.innerHTML = TABS.map(([k, t]) => `<button data-k="${k}">${t}</button>`).join('');
  tabsEl.onclick = (e) => { const k = e.target.dataset && e.target.dataset.k; if (k) { S.abort = true; S.tab = k; render(); } };

  const errBox = (e) => `<div class="vk-err"><b>Có lỗi:</b> ${esc(e && e.message || e)}<br><span class="vk-mu" style="font-size:12px">Tool ${TOOL_VER}${S.core ? ' · game ' + esc(S.core.bundle) : ''}. Nếu lỗi lặp lại, chụp màn hình gửi Claude.</span></div>`;

  async function render() {
    tabsEl.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.k === S.tab));
    try {
      if (!S.core) { body.innerHTML = `<div class="vk-card">⏳ <span id="vk-pg">Đang chuẩn bị…</span></div>`; S.core = await loadCore((m) => { const el = body.querySelector('#vk-pg'); if (el) el.textContent = m; }); }
      if (!G().state.run) { body.innerHTML = `<div class="vk-card">Chưa có kiếp nào đang chơi. Vào game (tạo hoặc nạp kiếp) rồi bấm <b>Làm mới</b>.</div>`; return; }
      S.abort = false;
      ({ tq: () => { tabTongQuan(); tongQuanExtra(); }, km: tabKinhMach, dp: tabDotPha2, tr: tabTran, tkc: tabTKC, cho: tabCho, ld: tabLuyenDan, tien: tabTien, bd: tabBanDo, tt: tabTreoThuong, san: tabSan, dl: tabDoGame, bld: tabBuild })[S.tab]();
    } catch (e) { console.error(e); body.innerHTML = errBox(e); }
  }

  const progressHtml = (id) => `<div id="${id}" style="display:none"><div class="vk-bar"><i></i></div><div class="vk-mu" style="font-size:13px"></div><button class="vk-btn sec vk-stop">Dừng</button></div>`;
  function bindProgress(box) {
    box.style.display = 'block';
    box.querySelector('.vk-stop').onclick = () => { S.abort = true; };
    return (f, label) => { box.querySelector('i').style.width = Math.round(f * 100) + '%'; box.querySelector('.vk-mu').textContent = (label || '') + ' ' + Math.round(f * 100) + '%'; };
  }

  // ── Tab Tổng quan
  function tabTongQuan() {
    const K = S.core, c = ctx(), run = c.run, nv = run.nhanVat;
    const tho = K.ke(nv);
    const lc = nv.linhCan ? `${({ thien: 'Thiên', bien_di: 'Biến dị', song: 'Song', tap: 'Tạp', vo: 'Vô' })[nv.linhCan.pham] || nv.linhCan.pham} linh căn (${(nv.linhCan.he || []).map(heTen).join(', ')})` : '—';
    let sect = '<div class="vk-mu">Chưa vào tông môn.</div>';
    const tm = K.Kn(c);
    if (tm) {
      let ten = tm.slot; try { ten = c.world.info(tm.slot).diaDanh.ten; } catch {}
      const reasons = K.wr(c);
      const next = K.No[tm.capBac + 1];
      sect = `<div class="vk-row"><span>Tông môn</span><b>${esc(ten)}</b></div>
      <div class="vk-row"><span>Cấp bậc</span><b>${esc(K.No[tm.capBac])}</b></div>
      <div class="vk-row"><span>Công tích</span><b>${Math.floor(tm.congTich)}</b></div>
      ${next ? `<div class="vk-row"><span>Lên ${esc(next)}</span>${reasons.length ? `<span class="vk-bad">${esc(reasons.join('; '))}</span>` : '<span class="vk-ok">Đủ điều kiện xin khảo hạch — xem tab Trận</span>'}</div>` : ''}`;
    }
    const nghe = Object.entries(nv.nghe || {}).map(([k, v]) => `${({ luyen_dan: 'Luyện đan', che_phu: 'Chế phù', luyen_bao: 'Luyện bảo', tran_phap: 'Trận pháp' })[k] || k}: bậc ${v.bac}, ${Math.floor(v.kinhNghiem)} kinh nghiệm`).join('<br>') || '—';
    // cơ duyên sắp hết hạn
    const seen = new Map();
    for (const l of run.log || []) if (l.expiresAt && l.key) seen.set(l.key, l);
    const dip = [...seen.values()].filter((l) => l.expiresAt - run.nam >= 0.05).sort((a, b) => a.expiresAt - b.expiresAt)
      .map((l) => `<div class="vk-row"><span>${esc(String(l.text).replace(/còn [\d.,]+ năm\.?/, '').replace(/[-]/g, ''))}</span><b>${num(l.expiresAt - run.nam)} năm</b></div>`).join('') || '<div class="vk-mu">Không có.</div>';
    body.innerHTML = `
    <div class="vk-card"><h3>${esc(nv.ten)}</h3>
      <div class="vk-row"><span>Cảnh giới</span><b>${esc(realmLabel(nv.canhGioi, nv.tieuCanhGioi))}</b></div>
      <div class="vk-row"><span>Tuổi / thọ</span><b>${Math.floor(nv.tuoi)} / ${tho} <span class="vk-mu">(còn ${Math.floor(tho - nv.tuoi)} năm)</span></b></div>
      <div class="vk-row"><span>Linh căn</span><b>${esc(lc)}</b></div>
      <div class="vk-row"><span>Thương thế</span><b>${nv.thuongThe ? `<span class="vk-bad">${nv.thuongThe} bậc</span>` : 'Lành lặn'}</b></div>
      <div class="vk-row"><span>Lịch luyện</span><b>${num(nv.lichLuyen || 0)}${(nv.lichLuyen || 0) < 2 ? ' <span class="vk-bad">sắp cạn — đi đánh/đi xa để hồi</span>' : ''}</b></div>
      <div class="vk-row"><span>Linh thạch · Cống hiến</span><b>${Math.floor(nv.linhThach || 0)} · ${Math.floor(nv.congHien || 0)}</b></div>
      <div class="vk-row"><span>Nghề</span><b style="text-align:right">${nghe}</b></div>
      <div class="vk-row"><span>Lượt khai thông kinh mạch</span><b>${(nv.kinhMach.cho && nv.kinhMach.cho.mo) || 0}</b></div>
    </div>
    <div class="vk-card"><h3>Sư môn</h3>${sect}</div>
    <div class="vk-card"><h3>Cơ duyên sắp hết hạn</h3>${dip}</div>
    <div class="vk-card"><h3>Độ mạnh chung</h3><div id="vk-dm" class="vk-mu">Bấm để đánh thử với mọi loại quái cùng cảnh giới.</div><button class="vk-btn" id="vk-dmb">Đánh thử</button></div>
    <div class="vk-mu" style="font-size:12px;text-align:center">Tool ${TOOL_VER} · game ${esc(K.bundle)}</div>`;
    body.querySelector('#vk-dmb').onclick = async (ev) => {
      ev.target.disabled = true; const out = body.querySelector('#vk-dm'); out.textContent = 'Đang đánh thử…'; await sleep0();
      const P = K.Vr(nvNow(), C()); const res = [];
      for (const tc of [0, 1, 2, 3]) {
        let w = 0, n = 0;
        for (const def of C().enemies.values()) { let E; try { E = enemyAt(def, nv.canhGioi, tc); } catch { continue; } n++; if (fight(P, E).thang) w++; }
        res.push(`<div class="vk-row"><span>Quái ${esc(realmName(nv.canhGioi))} ${STAGE[tc]}</span><b>thắng ${w}/${n} (${pct(w / Math.max(1, n))})</b></div>`); out.innerHTML = res.join(''); await sleep0();
      }
      let w = 0, n = 0;
      for (const def of C().enemies.values()) { let E; try { E = enemyAt(def, nv.canhGioi + 1, 0); } catch { continue; } n++; if (fight(P, E).thang) w++; }
      res.push(`<div class="vk-row"><span>Quái ${esc(realmName(nv.canhGioi + 1))} Sơ</span><b>thắng ${w}/${n} (${pct(w / Math.max(1, n))})</b></div>`);
      out.innerHTML = res.join('') + '<div class="vk-mu" style="font-size:12px">Tính với kinh mạch đang xếp trong game.</div>';
    };
  }

  // ── Tab Kinh mạch
  function statRows(a, b) {
    const ch = (r) => r.P.chieu.filter((x) => x.dang !== undefined).map((x) => `${esc(x.ten)} (${Math.round(x.uy)})`).join(', ');
    const rows = [
      ['Thắng trận mẫu', `${a.wins}/${a.n}`, `${b.wins}/${b.n}`],
      ['Khí huyết', Math.round(a.P.khiHuyetToiDa), Math.round(b.P.khiHuyetToiDa)],
      ['Linh lực hồi / lượt', num(a.P.linhLucMoiLuot), num(b.P.linhLucMoiLuot)],
      ['Linh lực tối đa', num(a.P.linhLucToiDa ?? a.P.linhLucMoiLuot * 3), num(b.P.linhLucToiDa ?? b.P.linhLucMoiLuot * 3)],
      ['Chiêu tốn nhiều nhất', num(Math.max(0, ...a.P.chieu.map((x) => x.phi || 0))), num(Math.max(0, ...b.P.chieu.map((x) => x.phi || 0)))],
      ['Tu luyện', '+' + pct(a.R.biDong.toc_do || 0), '+' + pct(b.R.biDong.toc_do || 0)],
      ['Đột phá', '+' + pct(a.R.biDong.dot_pha || 0, 1), '+' + pct(b.R.biDong.dot_pha || 0, 1)],
      ['Điểm nghịch', a.R.diemNghich || 0, b.R.diemNghich || 0],
    ];
    return `<table class="vk-t"><tr><th></th><th>Đang xếp</th><th>Bản mới</th></tr>${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td><b>${r[2]}</b></td></tr>`).join('')}
    <tr><td>Chiêu</td><td>${ch(a)}</td><td>${ch(b)}</td></tr></table>`;
  }

  async function optimizeMode(nv, mode, iters, prog, f0, f1, label) {
    const nv0 = clone(nv); nv0.kinhMach.manh = [];
    const P = (a, b) => (f) => prog(f0 + (f1 - f0) * (a + (b - a) * f), label);
    P(0, 0)(0); const g0 = await greedy(nv0, mode);
    const a = await anneal({ nv0, mode, iters: Math.round(iters * 0.6), init: g0, onProg: P(0.05, 0.55) });
    const b = await anneal({ nv0, mode, iters: Math.round(iters * 0.5), init: a.manh, onProg: P(0.55, 1) });
    return stripDead(nv, [a, b].sort((x, y) => y.score - x.score)[0], mode);
  }
  function tabKinhMach() {
    const nv = nvNow();
    const tac = nv.kinhMach.trangThai.map((s, i) => (s === 'tac' ? i : -1)).filter((i) => i >= 0);
    const mo = (nv.kinhMach.cho && nv.kinhMach.cho.mo) || 0;
    body.innerHTML = pathCardHtml() + `
    <div class="vk-card"><h3>Xếp kinh mạch tối ưu</h3>
      <div class="vk-mu" style="font-size:13px">Tool thử hàng nghìn cách xếp các món trong túi, đánh thử ${'9'} trận mẫu cùng cảnh giới cho mỗi cách và giữ cách tốt nhất.</div>
      <div style="margin:8px 0"><select class="vk-sel" id="vk-mode"><option value="bal">Cân bằng (đánh + tu luyện)</option><option value="danh">Ưu tiên đánh nhau</option><option value="tu">Ưu tiên tu luyện / đột phá</option></select>
      <select class="vk-sel" id="vk-it"><option value="1500">Nhanh</option><option value="3000" selected>Vừa</option><option value="6000">Kỹ (lâu)</option></select></div>
      <button class="vk-btn" id="vk-go">Bắt đầu xếp</button>
      ${progressHtml('vk-pr')}<div id="vk-out"></div></div>
    <div class="vk-card"><h3>Hai bộ kinh mạch: bế quan và đánh</h3>
      <div class="vk-mu" style="font-size:13px">Game cho lưu tới 3 bộ kinh mạch và đổi bộ miễn phí (mở bộ 2 tốn 1.000 linh thạch, bộ 3 tốn 15.000). Bạn đang có <b>${(nv.kinhMach.loadouts || []).length || 1}</b> bộ. Nên lưu 1 bộ <b>Tu luyện</b> (dùng khi bế quan, đột phá) và 1 bộ <b>Đánh</b> (dùng khi đi đánh, làm nhiệm vụ, khảo hạch). Tool xếp sẵn cả hai.</div>
      <button class="vk-btn" id="vk-2b">Xếp 2 bộ</button>${progressHtml('vk-pr2b')}<div id="vk-2o"></div></div>
    <div class="vk-card"><h3>Ô kinh mạch nên mở</h3>
      <div class="vk-mu" style="font-size:13px">Có ${tac.length} ô tắc · còn ${mo} lượt khai thông. Tool thử mở từng ô rồi xếp lại để xem ô nào lợi nhất.</div>
      <button class="vk-btn" id="vk-op" ${tac.length ? '' : 'disabled'}>Tìm ô nên mở</button>
      ${progressHtml('vk-pr2')}<div id="vk-out2"></div></div>
    <div class="vk-card"><h3>Đang xếp trong game</h3><div id="vk-cur"></div></div>
    <div class="vk-card"><h3>Nguyên lý kinh mạch (đọc từ code game)</h3><ul style="margin:0;padding-left:18px;font-size:14px">
      <li><b>Thông:</b> tâm pháp/đấu pháp thông khi chạm đan điền hoặc chạm một công pháp đã thông (nối thành chuỗi). Pháp khí thông khi chạm đan điền hoặc chạm công pháp đã thông. Món không thông = không có tác dụng.</li>
      <li><b>Màu ô:</b> hệ số = 0,85 + 0,45 × độ hợp trung bình các ô (đúng hệ = 1; cùng gốc như Băng–Thủy hoặc có Vô sắc = 0,5; khác hệ = 0). Đặt đúng màu tối đa ×1,3.</li>
      <li><b>Huyệt:</b> phủ 1 huyệt ×2, mỗi huyệt thêm +0,25. Nên đặt món mạnh nhất (chiêu chính, pháp khí thủ) lên huyệt.</li>
      <li><b>Sinh khắc:</b> mỗi món kề bên (đã thông) mà hệ của nó sinh ra hệ món này +15%, mỗi món khắc −15% (thấp nhất ×0,4).</li>
      <li><b>Kinh lộ (pháp khí):</b> chuỗi công pháp từ đan điền tới pháp khí, mỗi công pháp cùng họ hệ +10% (tối đa 5).</li>
      <li><b>Nội tại:</b> món nhiều hệ mà các hệ sinh nhau ×1,1.</li>
      <li><b>Điểm nghịch</b> (+1 mỗi cặp món kề nhau khắc nhau, +1 mỗi món đặt quá nửa trên ô khắc nó, +1 mỗi món tự có hệ khắc nhau): mỗi điểm −3% tỉ lệ đột phá (tối đa −15%) và gây phản phệ trong trận. Tool trừ điểm nghịch khi xếp.</li>
      <li><b>Tâm pháp:</b> tốc độ tu luyện/đột phá/kháng tâm ma không nhân hệ số, chỉ cần thông; linh lực và chỉ số thì nhân hệ số. Món Vô sắc cho linh lực ×0,85.</li>
    </ul></div>`;
    try { body.querySelector('#vk-cur').innerHTML = drawGrid(nv, nv.kinhMach.manh); } catch (e) { body.querySelector('#vk-cur').innerHTML = errBox(e); }
    bindPathCard(tabKinhMach);
    const pathKey = S.path ? S.path.k + ':' + S.path.w : '';
    if (S.best && S.best.nvKey === JSON.stringify([nv.tuiDo, nv.kinhMach.trangThai, nv.canhGioi, nv.tieuCanhGioi, pathKey])) showBest(nv);
    body.querySelector('#vk-go').onclick = async (ev) => {
      ev.target.disabled = true; S.abort = false;
      const mode = body.querySelector('#vk-mode').value, iters = +body.querySelector('#vk-it').value;
      const prog = bindProgress(body.querySelector('#vk-pr'));
      try {
        const nv0 = clone(nv); nv0.kinhMach.manh = [];
        const cur = evalCurrent(nv, mode);
        prog(0.02, 'Xếp nhanh…');
        const g0 = await greedy(nv0, mode);
        const a = await anneal({ nv0, mode, iters: Math.round(iters * 0.6), init: g0, onProg: (f) => prog(0.05 + f * 0.35, 'Tìm từ bản xếp nhanh…') });
        const a2 = await anneal({ nv0, mode, iters: Math.round(iters * 0.6), init: null, onProg: (f) => prog(0.4 + f * 0.3, 'Tìm từ đầu…') });
        const top = [a, a2, cur].sort((x, y) => y.score - x.score)[0];
        const b = await anneal({ nv0, mode, iters: Math.round(iters / 2), init: top.manh, onProg: (f) => prog(0.7 + f * 0.3, 'Đang tinh chỉnh…') });
        let best = [a, a2, b].sort((x, y) => y.score - x.score)[0];
        best = stripDead(nv, best, mode);
        if (cur.score >= best.score && !(cur.R.manh || []).some((m) => m && !m.thong)) best = { ...cur, same: true };
        S.best = { nvKey: JSON.stringify([nv.tuiDo, nv.kinhMach.trangThai, nv.canhGioi, nv.tieuCanhGioi, pathKey]), cur, best, mode };
        body.querySelector('#vk-pr').style.display = 'none';
        showBest(nv);
      } catch (e) { console.error(e); body.querySelector('#vk-out').innerHTML = errBox(e); }
      ev.target.disabled = false;
    };
    body.querySelector('#vk-2b').onclick = async (ev) => {
      ev.target.disabled = true; S.abort = false;
      const prog = bindProgress(body.querySelector('#vk-pr2b'));
      try {
        const res = {};
        for (const [k, mode, f0, f1] of [['tu', 'tu', 0, 0.5], ['danh', 'danh', 0.5, 1]]) res[k] = await optimizeMode(nv, mode, 2400, prog, f0, f1, mode === 'tu' ? 'Bộ tu luyện…' : 'Bộ đánh…');
        body.querySelector('#vk-pr2b').style.display = 'none';
        const box = (title, r, note, k) => `<div style="margin-top:12px"><b>${title}</b> <span class="vk-mu" style="font-size:13px">${note}</span>${applyBtn('vk-ap' + k, 'Tự xếp vào ' + title.split(' · ')[0])}
          ${pathReportHtml(r.R, nv)}<div style="font-size:14px;margin:4px 0">Thắng ${r.wins}/${r.n} trận mẫu · tu luyện +${pct(r.R.biDong.toc_do || 0)} · đột phá +${pct(r.R.biDong.dot_pha || 0, 1)} · linh lực hồi ${num(r.P ? r.P.linhLucMoiLuot || 0 : 0)}/lượt · điểm nghịch ${r.R.diemNghich || 0}</div>${drawGrid(nv, r.manh)}</div>`;
        body.querySelector('#vk-2o').innerHTML = box('Bộ 1 · Tu luyện', res.tu, 'dùng khi bế quan, đột phá', 0) + box('Bộ 2 · Đánh', res.danh, 'dùng khi ra ngoài đánh', 1)
          + `<div class="vk-mu" style="font-size:12px;margin-top:6px">Cách lưu trong game: ở màn kinh mạch bấm ô Bộ 1, xếp theo ảnh thứ nhất; bấm Bộ 2 (mở nếu chưa có), xếp theo ảnh thứ hai. Trước khi bế quan đổi sang Bộ 1, trước khi đi đánh đổi sang Bộ 2. Nút "Tự xếp" tự đổi sang bộ đó rồi xếp hộ.</div>`;
        bindApply('vk-ap0', () => res.tu.manh, 0); bindApply('vk-ap1', () => res.danh.manh, 1);
      } catch (e) { console.error(e); body.querySelector('#vk-2o').innerHTML = errBox(e); }
      ev.target.disabled = false;
    };
    body.querySelector('#vk-op').onclick = async (ev) => {
      ev.target.disabled = true; S.abort = false;
      const prog = bindProgress(body.querySelector('#vk-pr2'));
      const mode = body.querySelector('#vk-mode').value;
      try {
        const nv0 = clone(nv); nv0.kinhMach.manh = [];
        const base = await anneal({ nv0, mode, iters: 800, init: nv.kinhMach.manh, onProg: (f) => prog(f / (tac.length + 1), 'Mốc hiện tại…') });
        const res = [];
        for (let k = 0; k < tac.length && !S.abort; k++) {
          const i = tac[k]; const nvO = clone(nv0); nvO.kinhMach.trangThai[i] = 'thong';
          const r = await anneal({ nv0: nvO, mode, iters: 600, init: base.manh, onProg: (f) => prog((k + 1 + f) / (tac.length + 1), `Thử ô ${k + 1}/${tac.length}…`) });
          res.push({ i, r, gain: r.score - base.score });
        }
        res.sort((x, y) => y.gain - x.gain);
        body.querySelector('#vk-pr2').style.display = 'none';
        const top = res[0];
        const g = S.core.xo(C(), nv);
        const pos = (i) => `cột ${i % g.rong + 1}, hàng ${Math.floor(i / g.rong) + 1}`;
        let html = `<table class="vk-t"><tr><th>Ô (tính từ góc trên trái)</th><th>Hệ</th><th>Thắng</th><th>Lợi</th></tr>` +
          res.map((x) => `<tr><td>${pos(x.i)}</td><td>${heTen(nv.kinhMach.mau[x.i])}</td><td>${x.r.wins}/${x.r.n}</td><td>${x.gain > 1 ? '<span class="vk-ok">+' + Math.round(x.gain) + '</span>' : '<span class="vk-mu">≈0</span>'}</td></tr>`).join('') + '</table>';
        if (top && top.gain > 1) {
          const nvO = clone(nv); nvO.kinhMach.trangThai[top.i] = 'thong';
          html = `<div class="vk-ok" style="margin:6px 0">Nên mở ô có khung xanh "MỞ" (${pos(top.i)}). Xếp như ảnh sau khi mở:</div>` + drawGrid(nvO, top.r.manh, new Set([top.i])) + html;
        } else html = `<div class="vk-mu" style="margin:6px 0">Với đồ hiện có, mở ô nào cũng chưa lợi thêm. Giữ lượt khai thông lại.</div>` + html;
        body.querySelector('#vk-out2').innerHTML = html;
      } catch (e) { console.error(e); body.querySelector('#vk-out2').innerHTML = errBox(e); }
      ev.target.disabled = false;
    };
  }
  // Tự xếp vào game bằng chính các thao tác của game (tháo / dời / đặt mảnh), có kiểm tra từng bước.
  function applyLayout(target, loadout) {
    const g = G();
    if (!g.state.run || g.state.run.ketThuc) return { ok: false, msg: 'Chưa có kiếp đang chơi.' };
    const km = () => g.state.run.nhanVat.kinhMach;
    const step = (fn) => { const before = JSON.stringify(km().manh); try { fn(); } catch (e) { return String(e && e.message || e); } if (g.state.error) return g.state.error; return JSON.stringify(km().manh) === before ? 'game không nhận thao tác' : null; };
    if (loadout !== undefined) {
      const nLo = (km().loadouts || []).length || 1;
      if (loadout >= nLo) return { ok: false, msg: `Chưa mở Bộ ${loadout + 1}. Mở thêm bộ trong màn Kinh mạch của game trước (bộ 2 tốn 1.000 linh thạch).` };
      if ((km().activeLoadout || 0) !== loadout && typeof g.switchLoadout === 'function') { try { g.switchLoadout(loadout); } catch (e) { return { ok: false, msg: 'Không đổi được bộ: ' + (e.message || e) }; } if (g.state.error) { const er = g.state.error; g.store.setState({ error: undefined }); return { ok: false, msg: 'Game không cho đổi bộ: ' + er + (/Túi/.test(er) ? '. Đổi bộ cần chỗ trống trong túi để cất đồ bộ cũ: bán hoặc vứt bớt đồ rồi bấm lại.' : '') }; } }
    }
    const same = (a, b) => a.item === b.item && a.x === b.x && a.y === b.y && a.xoay === b.xoay;
    const want = target.map((m) => ({ item: m.item, x: m.x, y: m.y, xoay: m.xoay }));
    const wantItems = new Set(want.map((m) => m.item));
    const errs = [];
    const K = S.core, Cc = C();
    const grid = K.xo(Cc, g.state.run.nhanVat);
    const cellsOf = (m) => K.al(grid, m, Cc.items.get(m.item)) || [];
    const wantCells = new Set(want.flatMap(cellsOf));
    const stuck = [];
    // dời một món không cần tới chỗ không vướng cách xếp mới (khi túi đầy, không tháo được)
    const parkAway = (i) => {
      const m = km().manh[i];
      for (let xoay = 0; xoay < 4; xoay++) for (let y = 0; y < grid.cao; y++) for (let x = 0; x < grid.rong; x++) {
        const c = cellsOf({ item: m.item, x, y, xoay }); if (!c.length || c.some((q) => wantCells.has(q))) continue;
        if (!step(() => g.doiManh(i, { x, y, xoay }))) return true;
      }
      return false;
    };
    // 1. Tháo món không có trong cách xếp mới
    for (let i = km().manh.length - 1; i >= 0; i--) {
      const m = km().manh[i]; if (wantItems.has(m.item)) continue;
      const e = step(() => g.goManh(i));
      if (e) { const ten = Cc.items.get(m.item)?.ten || m.item; if (cellsOf(m).some((q) => wantCells.has(q)) ? parkAway(i) : true) stuck.push(ten); else errs.push(`Tháo ${ten}: ${e}`); }
    }
    // 2. Dời / đặt, lặp vài vòng vì có món phải chờ món khác dời đi
    for (let pass = 0; pass < 6; pass++) {
      let progress = false, pending = 0;
      for (const w of want) {
        const cur = km().manh; const idx = cur.findIndex((m) => m.item === w.item);
        if (idx >= 0 && same(cur[idx], w)) continue;
        pending++;
        const e = idx >= 0 ? step(() => g.doiManh(idx, { x: w.x, y: w.y, xoay: w.xoay })) : step(() => g.datManh(w));
        if (!e) progress = true; else if (pass === 5) errs.push(`${C().items.get(w.item)?.ten || w.item}: ${e}`);
      }
      if (!pending) break;
      if (!progress) {
        // kẹt: tháo các món còn sai chỗ rồi đặt lại ở vòng sau
        for (let i = km().manh.length - 1; i >= 0; i--) { const m = km().manh[i]; const w = want.find((x) => x.item === m.item); if (w && !same(m, w)) step(() => g.goManh(i)); }
      }
    }
    g.store && g.store.setState && g.state.error && g.store.setState({ error: undefined });
    const final = km().manh; const okAll = want.every((w) => final.some((m) => same(m, w)));
    const extra = stuck.length ? ` Túi đầy nên chưa tháo được ${stuck.join(', ')} (đã dời ra chỗ không vướng); vứt hoặc bán bớt 1 món trong túi rồi tháo nó, hoặc bấm lại.` : '';
    return { ok: okAll, msg: okAll ? `Đã xếp xong ${want.length} món vào kinh mạch${loadout !== undefined ? ' (Bộ ' + (loadout + 1) + ')' : ''}.${extra}` : 'Xếp chưa trọn: ' + (errs.slice(0, 4).join('; ') || 'có món không đặt được') + '.' + extra + ' Phần còn lại xếp tay theo ảnh.' };
  }
  const applyBtn = (id, label) => `<button class="vk-btn" id="${id}" style="margin:6px 0">${label}</button><div id="${id}-o" style="font-size:14px"></div>`;
  function bindApply(id, getManh, loadout) {
    const b = body.querySelector('#' + id); if (!b) return;
    b.onclick = () => {
      b.disabled = true;
      const r = applyLayout(getManh(), loadout);
      body.querySelector('#' + id + '-o').innerHTML = `<span class="${r.ok ? 'vk-ok' : 'vk-bad'}">${esc(r.msg)}</span>${r.ok ? '<br><span class="vk-mu" style="font-size:12px">Bấm Đóng để xem trong game. Nếu thấy không hợp, game có nút tháo hết mảnh để làm lại.</span>' : ''}`;
      b.disabled = false;
    };
  }
  function showBest(nv) {
    const { cur, best } = S.best; const out = body.querySelector('#vk-out');
    if (!out) return;
    out.innerHTML = (best.same ? '<div class="vk-ok" style="margin:6px 0">Cách đang xếp đã tốt nhất tool tìm được.</div>' : '<div class="vk-ok" style="margin:6px 0">Xếp lại trong game theo ảnh dưới, hoặc bấm nút để tool tự xếp:</div>' + applyBtn('vk-ap', 'Tự xếp vào game') + drawGrid(nv, best.manh)) + pathReportHtml(best.R, nv) + (curBuild() && best.wins < cur.wins ? `<div class="vk-mu" style="font-size:13px;margin:4px 0">Bám lối làm thắng ít hơn cách đang xếp (${best.wins} so với ${cur.wins}/${best.n}). Đồ của lối hiện còn yếu; nếu cần đánh ngay, chọn mức "Ưu tiên đồ của lối" hoặc "Không theo lối".</div>` : '') + statRows(cur, best) +
      ((best.R && best.R.diemNghich) ? `<div class="vk-mu" style="font-size:12px;margin-top:6px">Cách này còn ${best.R.diemNghich} điểm nghịch (−${Math.min(15, 3 * best.R.diemNghich)}% tỉ lệ đột phá). Lúc chuẩn bị đột phá, chọn chế độ "Ưu tiên tu luyện / đột phá" để tool ưu tiên xóa điểm nghịch.</div>` : '') +
      '<div class="vk-mu" style="font-size:12px;margin-top:6px">Trận mẫu: 9 loại quái cùng cảnh giới với bạn, ở tiểu cảnh giới quanh mức của bạn (thấp hơn 1, bằng, cao hơn 1).</div>' + pieceTable(best.R) + sellAdvice(nv, best);
    bindApply('vk-ap', () => best.manh);
  }
  // Đồ công pháp/pháp khí không có mặt trong cách xếp tốt nhất → đề xuất bán
  function sellAdvice(nv, best) {
    const used = new Set(best.manh.map((m) => m.item));
    const c = ctx(), Cc = C(), K = S.core;
    const rows = Object.entries(nv.tuiDo).filter(([id, n]) => n > 0 && !used.has(id)).map(([id, n]) => ({ it: Cc.items.get(id), n, id })).filter((x) => x.it && (x.it.loai === 'cong_phap' || x.it.loai === 'phap_khi'));
    if (!rows.length) return '';
    const price = (id, it) => { try { return K.IP ? K.IP(c, id, undefined, 0) : Math.round((it.gia || 0) * 0.6); } catch { return Math.round((it.gia || 0) * 0.6); } };
    const topPham = Math.max(0, ...best.manh.map((m) => Cc.items.get(m.item)?.pham_cap || 0));
    const pb = curBuild();
    rows.forEach((x) => { x.p = price(x.id, x.it); x.why = pb && buildMatch(pb, x.it) && (x.it.canh_gioi ?? 0) <= nv.canhGioi + 1 ? `đồ của lối ${pb.ten} — giữ lại` : !x.it.hinh ? 'không đặt lên kinh mạch được' : (x.it.canh_gioi ?? 0) > nv.canhGioi ? 'chưa đủ cảnh giới — giữ lại' : (x.it.pham_cap || 0) >= topPham ? 'phẩm cao nhưng chưa có chỗ — cân nhắc giữ để dùng khi mở thêm ô' : 'yếu hơn đồ đang xếp — nên bán'; });
    rows.sort((a, b) => b.p * b.n - a.p * a.n);
    const sellable = rows.filter((x) => x.why.endsWith('nên bán') || x.why.startsWith('không đặt'));
    const total = sellable.reduce((a, x) => a + x.p * x.n, 0);
    return `<div style="margin-top:10px"><b>Đồ nên bán</b> <span class="vk-mu" style="font-size:13px">(không dùng trong cách xếp tốt nhất; bán phần "nên bán" được khoảng ${Math.round(total)} linh thạch ở chỗ đang đứng)</span><table class="vk-t">${rows.map((x) => `<tr><td>${esc(x.it.ten)}${x.n > 1 ? ' ×' + x.n : ''}<br><span class="vk-mu" style="font-size:12px">phẩm ${x.it.pham_cap} · ${x.why}</span></td><td>${Math.round(x.p * x.n)}</td></tr>`).join('')}</table><div class="vk-mu" style="font-size:12px">Trước khi bán: nếu sắp lên cảnh giới mới hoặc sắp mở thêm ô kinh mạch, xếp lại một lần nữa để chắc món đó vẫn thừa.</div></div>`;
  }
  function pieceTable(R) {
    if (!R || !R.manh) return '';
    const f = (x) => (Math.abs(x - 1) < 0.005 ? '' : '×' + num(x, 2));
    const rows = R.manh.map((m, i) => !m ? '' : `<tr><td>${i + 1}. ${esc(m.item.ten)}${m.thong ? '' : ' <span class="vk-bad">không thông</span>'}</td><td><b>${num(m.heSo, 2)}</b></td><td style="font-size:12px">${[['màu', m.mau], ['huyệt', m.huyet], ['sinh khắc', m.sinhKhac], ['nội tại', m.noiTai], ['kinh lộ', m.kinhLo]].filter(([, v]) => v && Math.abs(v - 1) >= 0.005).map(([k, v]) => `${k} ${f(v)}`).join(' · ') || '—'}</td></tr>`).join('');
    return `<details style="margin-top:8px"><summary>Hệ số từng món (vì sao xếp vậy)</summary><table class="vk-t"><tr><th>Món</th><th>Hệ số</th><th>Đến từ</th></tr>${rows}</table><div class="vk-mu" style="font-size:12px">Hệ số nhân vào linh lực, uy lực chiêu, khí huyết/hộ thể/chỉ số của món. Tốc độ tu luyện, đột phá, kháng tâm ma của tâm pháp không nhân hệ số — chỉ cần thông.</div></details>`;
  }

  // ── Tab Đột phá
  function tabDotPha() {
    const K = S.core, c = ctx(), nv = c.run.nhanVat;
    const h0 = K.kR(c, { dan: [], thieuDot: 0 });
    const pills = [...new Set(h0.danDung || [])];
    const tdOpts = [0, ...(h0.thieuDot || []).map((x, i) => (x.duoc ? i + 1 : null)).filter(Boolean)];
    const combos = [];
    const sets = [[]]; pills.forEach((p) => sets.push([p])); for (let i = 0; i < pills.length; i++) for (let j = i + 1; j < pills.length; j++) sets.push([pills[i], pills[j]]);
    for (const dan of sets) for (const td of tdOpts) { try { const h = K.kR(ctx(), { dan, thieuDot: td }); combos.push({ dan, td, tiLe: h.tiLe, h }); } catch {} }
    combos.sort((a, b) => b.tiLe - a.tiLe || a.dan.length - b.dan.length || a.td - b.td);
    const itemTen = (id) => (C().items.get(id) || {}).ten || id;
    const rows = combos.slice(0, 10).map((x) => `<tr><td>${x.dan.length ? x.dan.map(itemTen).map(esc).join(' + ') : '—'}</td><td>${x.td ? x.td + ' nấc (−' + h0.thieuDot[x.td - 1].nam + ' năm)' : '—'}</td><td><b>${pct(x.tiLe, 1)}</b></td></tr>`).join('');
    const best = combos[0] || { h: h0, tiLe: h0.tiLe };
    const nguon = (best.h.nguon || []).map((n) => `<div class="vk-row"><span>${esc(n.ten)}</span><b class="${n.gt < 0 ? 'vk-bad' : ''}">${n.gt >= 0 ? '+' : ''}${pct(n.gt, 1)}</b></div>`).join('');
    const cho = h0.cho ? `${esc(h0.cho.ten)} · linh khí ${esc(h0.cho.linhKhi && h0.cho.linhKhi.ten)}` : '—';
    const chan = h0.chan ? `<div class="vk-err" style="margin-bottom:8px">Chưa đột phá được: ${esc(typeof h0.chan === 'string' ? h0.chan : Array.isArray(h0.chan) ? h0.chan.join('; ') : (h0.chan.ten || h0.chan.lyDo || JSON.stringify(h0.chan)))}</div>` : '';
    body.innerHTML = `${chan}
    <div class="vk-card"><h3>Lên ${esc(realmName(h0.len))}</h3>
      <div class="vk-row"><span>Đang ở</span><b>${esc(realmLabel(nv.canhGioi, nv.tieuCanhGioi))}</b></div>
      <div class="vk-row"><span>Nơi đang đứng</span><b>${cho}</b></div>
      <div class="vk-row"><span>Tỉ lệ nếu không dùng gì</span><b>${pct(h0.tiLe, 1)}</b></div>
      ${h0.som ? '<div class="vk-bad" style="font-size:13px">Chưa Đại viên mãn: đột phá sớm bị trừ tỉ lệ.</div>' : ''}
    </div>
    <div class="vk-card"><h3>Các phương án (đan trong túi + đốt thọ)</h3>
      ${pills.length ? '' : '<div class="vk-mu" style="font-size:13px">Trong túi chưa có đan đột phá dùng được.</div>'}
      <table class="vk-t"><tr><th>Đan</th><th>Đốt thọ</th><th>Tỉ lệ</th></tr>${rows}</table>
      <div class="vk-mu" style="font-size:12px;margin-top:6px">Chưa tính hộ pháp (+5% nếu có). Đột phá ở động phủ hoặc sư môn của mình sẽ cao hơn ở thành thị.</div></div>
    <div class="vk-card"><h3>Chi tiết phương án tốt nhất</h3>${nguon}</div>`;
  }

  // ── Tab Trận
  function tabTran() {
    const K = S.core, c = ctx(), run = c.run, nv = run.nhanVat, Cc = C();
    const P = K.Vr(nv, Cc);
    const res4 = (def, cg, muc) => [0, 1, 2, 3].map((tc) => { let E; try { E = enemyAt(def, cg, tc, muc); } catch { return '<td>—</td>'; } const r = fight(P, E); return `<td>${r.thang ? `<span class="vk-ok">Thắng</span><br><span class="vk-mu">còn ${Math.round(r.khiHuyetThapNhat / P.khiHuyetToiDa * 100)}%</span>` : '<span class="vk-bad">Thua</span>'}</td>`; }).join('');
    const head = `<tr><th>Đối thủ</th>${STAGE.map((s) => `<th>${s}</th>`).join('')}</tr>`;
    // Khảo hạch
    let kh = '<div class="vk-mu">Chưa vào tông môn.</div>';
    const tm = K.Kn(c);
    if (tm) {
      const next = tm.capBac + 1, reasons = K.wr(c);
      if (!K.No[next]) kh = '<div class="vk-mu">Đã ở bậc cao nhất.</div>';
      else {
        kh = `<div class="vk-row"><span>Lên ${esc(K.No[next])}</span>${reasons.length ? `<span class="vk-bad">${esc(reasons.join('; '))}</span>` : '<span class="vk-ok">Đủ điều kiện xin khảo hạch</span>'}</div>`;
        if (next === 2 || next === 3) {
          let id; try { id = K.Rsn(c, tm.slot, next); } catch {}
          const npc = id && c.run.npc[id];
          if (!npc) kh += '<div class="vk-mu">Không có đối thủ — khảo hạch qua luôn.</div>';
          else if (nv.canhGioi > npc.canhGioi) kh += `<div class="vk-ok">Đối thủ ${esc(npc.ten)} (${esc(realmLabel(npc.canhGioi, npc.tieuCanhGioi))}) yếu hơn bạn một cảnh giới: sẽ nhận thua, không phải đánh.</div>`;
          else {
            let line = '';
            try { const def = K.ko(c, id); const E = K.Ga(def, Cc, next === 3 ? { muc: 'tinh_anh' } : {}); const r = fight(P, E); line = r.thang ? `<span class="vk-ok">Mô phỏng: THẮNG, còn ${Math.round(r.khiHuyetThapNhat / P.khiHuyetToiDa * 100)}% máu</span>` : `<span class="vk-bad">Mô phỏng: THUA</span> <span class="vk-mu">(đối thủ ${Math.round(E.khiHuyetToiDa)} máu, bạn ${Math.round(P.khiHuyetToiDa)})</span>`; } catch (e) { line = '<span class="vk-mu">Không mô phỏng được.</span>'; }
            kh += `<div class="vk-row"><span>Đối thủ: <b>${esc(npc.ten)}</b> · ${esc(realmLabel(npc.canhGioi, npc.tieuCanhGioi))}</span></div><div>${line}</div><div class="vk-mu" style="font-size:12px">Thua phải chờ 2 năm mới thi lại.</div>`;
          }
        }
      }
    }
    // Nhiệm vụ đang treo
    const names = []; for (let i = 0; i < 8; i++) { const n = realmName(i); if (names.includes(n)) break; names.push(n); }
    const boards = [];
    for (const [slot, v] of Object.entries(run.noiChon || {})) if (v && v.treoThuong && v.treoThuong.viec && v.treoThuong.viec.length) boards.push([slot, v.treoThuong]);
    const nhan = (run.viecNhan || []).map((v) => [null, v]);
    const viecRows = [];
    const clean = (x) => String(x ?? '').replace(/[\ue000-\uf8ff]/g, '');
    const addViec = (v, tag) => {
      const lvl = names.findIndex((n) => clean(v.ten).endsWith('· ' + n));
      const cg = lvl >= 0 ? lvl : nv.canhGioi;
      const foes = Object.values(v.vars || {}).filter((x) => typeof x === 'string' && Cc.enemies.has(x));
      if (!foes.length) return;
      for (const id of foes) viecRows.push(`<tr><td><b>${esc(Cc.enemies.get(id).ten)}</b><br><span class="vk-mu" style="font-size:12px">${tag}${esc(clean(v.ten))}${v.congHien ? ' · ' + v.congHien + ' cống hiến' : ''}</span></td>${res4(Cc.enemies.get(id), cg)}</tr>`);
    };
    for (const [, v] of nhan) addViec(v, 'Đã nhận: ');
    for (const [slot, tt] of boards) for (const v of tt.viec) addViec(v, '');
    const enemyOpts = [...Cc.enemies.values()].sort((a, b) => String(a.ten).localeCompare(String(b.ten), 'vi')).map((e) => `<option value="${esc(e.id)}">${esc(e.ten)}</option>`).join('');
    body.innerHTML = `
    <div class="vk-card"><h3>Khảo hạch thăng cấp tông môn</h3>${kh}</div>
    <div class="vk-card"><h3>Nhiệm vụ</h3><div class="vk-mu">Nhiệm vụ sư môn và việc treo thưởng ở thành trấn giờ nằm ở tab <b>Treo thưởng</b>, có thử sức từng việc bằng chính cách game đánh giá.</div></div>
    <div class="vk-card"><h3>Thử đánh quái bất kỳ</h3>
      <input class="vk-sel" id="vk-eq" style="width:100%;margin-bottom:6px" placeholder="Gõ tên quái, ví dụ: lang, giao long, ma tu…" autocomplete="off">
      <select class="vk-sel" id="vk-en" style="width:100%" size="6">${enemyOpts}</select>
      <div style="margin-top:6px"><select class="vk-sel" id="vk-cg"><option value="-1" selected>Cảnh giới gốc của quái</option>${names.map((n, i) => `<option value="${i}">${esc(n)}</option>`).join('')}</select>
      <select class="vk-sel" id="vk-muc"><option value="thuong">Thường</option><option value="tinh_anh">Tinh anh</option><option value="boss">Đầu lĩnh</option></select>
      <button class="vk-btn" id="vk-fg">Đánh thử</button></div><div id="vk-fo"></div></div>`;
    const allEn = [...Cc.enemies.values()].sort((a, b) => String(a.ten).localeCompare(String(b.ten), 'vi'));
    const sel = body.querySelector('#vk-en');
    body.querySelector('#vk-eq').oninput = (ev) => {
      const q = fold(ev.target.value).trim();
      const list = q ? allEn.filter((e) => fold(e.ten).includes(q) || fold(e.id).includes(q)) : allEn;
      sel.innerHTML = list.slice(0, 200).map((e) => `<option value="${esc(e.id)}">${esc(e.ten)} · ${esc(realmName(e.canh_gioi ?? 0))}${e.muc && e.muc !== 'thuong' ? ' · ' + esc(e.muc) : ''}</option>`).join('') || '<option value="">Không thấy quái nào</option>';
      if (list.length) sel.selectedIndex = 0;
    };
    body.querySelector('#vk-eq').dispatchEvent(new Event('input'));
    body.querySelector('#vk-fg').onclick = () => {
      const id = sel.value; if (!id) return;
      const def = Cc.enemies.get(id); let cg = +body.querySelector('#vk-cg').value; if (cg < 0) cg = def.canh_gioi ?? nv.canhGioi;
      const muc = body.querySelector('#vk-muc').value;
      body.querySelector('#vk-fo').innerHTML = `<table class="vk-t">${head}<tr><td>${esc(def.ten)}<br><span class="vk-mu" style="font-size:12px">${esc(realmName(cg))}</span></td>${res4(def, cg, muc)}</tr></table><div class="vk-mu" style="font-size:12px">Tính với kinh mạch đang xếp trong game. "còn X%" = máu còn lại thấp nhất trong trận.</div>`;
    };
  }

  // ── Tab Tàng Kinh Các
  function itemDesc(it) {
    const b = it.bi_dong || {}, out = [];
    if (it.linh_luc) out.push(`linh lực ${num(it.linh_luc, 2)}`);
    const sg = (v, d = 0) => (v >= 0 ? '+' : '') + pct(v, d);
    if (b.toc_do) out.push(`tu luyện ${sg(b.toc_do)}`);
    if (b.dot_pha) out.push(`đột phá ${sg(b.dot_pha)}`);
    if (b.khi_huyet) out.push(`khí huyết ${sg(b.khi_huyet)}`);
    if (b.ho_the) out.push(`hộ thể ${sg(b.ho_the, 1)}`);
    if (b.khang_tam_ma) out.push(`kháng tâm ma ${b.khang_tam_ma > 0 ? '+' : ''}${pct(b.khang_tam_ma)}`);
    for (const [k, v] of Object.entries(b.chi_so || {})) out.push(`${({ than_thuc: 'thần thức', ngo_tinh: 'ngộ tính', than_phap: 'thân pháp', can_cot: 'căn cốt', dao_tam: 'đạo tâm', khi_van: 'khí vận' })[k] || k} +${v}`);
    if (it.chieu) out.push(`chiêu <b>${esc(it.chieu.ten)}</b> (${({ cong: 'đánh', thu: 'thủ', hoi_phuc: 'hồi máu', khong_che: 'khống chế' })[it.chieu.dang] || it.chieu.dang}, uy ${num(it.chieu.uy, 2)}${it.chieu.scope ? ', đánh lan' : ''})`);
    return out.join(' · ');
  }
  function tabTKC() {
    const K = S.core, c = ctx(), nv = c.run.nhanVat, Cc = C();
    let list = [];
    try { list = [...K.Hon(c, 'cong_phap'), ...K.Hon(c, 'phap_khi')]; } catch (e) { body.innerHTML = errBox(e); return; }
    if (!list.length) { body.innerHTML = '<div class="vk-card">Chưa vào tông môn hoặc Tàng Kinh Các chưa có gì.</div>'; return; }
    const tm = K.Kn(c), cap = tm ? tm.capBac : 0, ch = nv.congHien || 0;
    list.forEach((e) => { e.it = Cc.items.get(e.id); e.own = (nv.tuiDo[e.id] || 0) > 0; e.can = e.capBac <= cap && e.gia <= ch; });
    list.sort((a, b) => (b.can - a.can) || a.gia - b.gia);
    const row = (e) => `<tr><td><b>${esc(e.it.ten)}</b>${e.own ? ' <span class="vk-mu">(đã có)</span>' : ''}<br><span class="vk-mu" style="font-size:12px">${esc((e.it.he || []).map(heTen).join('/'))} · phẩm ${e.it.pham_cap} · ${itemDesc(e.it)}</span></td><td>${e.gia}${e.capBac > cap ? `<br><span class="vk-bad" style="font-size:12px">cần ${esc(K.No[e.capBac])}</span>` : e.gia > ch ? '<br><span class="vk-mu" style="font-size:12px">thiếu</span>' : '<br><span class="vk-ok" style="font-size:12px">mua được</span>'}</td><td class="vk-gain" data-id="${esc(e.id)}"></td></tr>`;
    body.innerHTML = `
    <div class="vk-card"><h3>Nên mua gì?</h3>
      <div class="vk-mu" style="font-size:13px">Bạn có <b>${Math.floor(ch)}</b> cống hiến, cấp <b>${esc(K.No[cap])}</b>. Tool thử thêm từng món vào túi, xếp lại kinh mạch và đánh trận mẫu để đo món nào lợi nhất.</div>
      <label style="display:block;margin:6px 0;font-size:14px"><input type="checkbox" id="vk-all"> Đo cả món chưa đủ cống hiến (cùng cấp bậc)</label>
      <button class="vk-btn" id="vk-ms">Đo giá trị</button>${progressHtml('vk-pr3')}<div id="vk-rank"></div></div>
    <div class="vk-card"><h3>Tàng Kinh Các</h3><table class="vk-t"><tr><th>Món</th><th>Giá</th><th>Lợi</th></tr>${list.map(row).join('')}</table></div>`;
    body.querySelector('#vk-ms').onclick = async (ev) => {
      ev.target.disabled = true; S.abort = false;
      const all = body.querySelector('#vk-all').checked;
      const targets = list.filter((e) => !e.own && e.capBac <= cap && (all || e.gia <= ch) && e.it.hinh && (e.it.canh_gioi ?? 0) <= nv.canhGioi).slice(0, 25);
      const prog = bindProgress(body.querySelector('#vk-pr3'));
      try {
        const nv0 = clone(nvNow()); nv0.kinhMach.manh = [];
        const mode = 'bal';
        const base = await anneal({ nv0, mode, iters: 1200, init: nvNow().kinhMach.manh, onProg: (f) => prog(f / (targets.length + 1), 'Mốc hiện tại…') });
        const res = [];
        for (let k = 0; k < targets.length && !S.abort; k++) {
          const e = targets[k]; const nvX = clone(nv0); nvX.tuiDo[e.id] = 1;
          const r = await anneal({ nv0: nvX, mode, iters: 800, init: base.manh, onProg: (f) => prog((k + 1 + f) / (targets.length + 1), `Đo ${e.it.ten}…`) });
          const gain = r.score - base.score; res.push({ e, gain, r });
          const td = body.querySelector(`.vk-gain[data-id="${CSS.escape(e.id)}"]`); if (td) td.innerHTML = gain > 1 ? `<span class="vk-ok">+${Math.round(gain)}</span><br><span class="vk-mu" style="font-size:12px">${r.wins}/${r.n} thắng</span>` : '<span class="vk-mu">≈0</span>';
        }
        res.sort((a, b) => b.gain / Math.max(10, b.e.gia) - a.gain / Math.max(10, a.e.gia));
        body.querySelector('#vk-pr3').style.display = 'none';
        body.querySelector('#vk-rank').innerHTML = `<div class="vk-mu" style="font-size:13px;margin:6px 0">Mốc hiện tại: thắng ${base.wins}/${base.n}. Xếp theo <b>lợi trên mỗi cống hiến</b>:</div><table class="vk-t"><tr><th>Món</th><th>Giá</th><th>Lợi</th><th>Thắng</th></tr>` +
          res.filter((x) => x.gain > 1).map((x) => `<tr><td>${esc(x.e.it.ten)}</td><td>${x.e.gia}</td><td class="vk-ok">+${Math.round(x.gain)}</td><td>${x.r.wins}/${x.r.n}</td></tr>`).join('') + '</table>' +
          (res.some((x) => x.gain > 1) ? '' : '<div class="vk-mu">Không món nào giúp rõ rệt so với đồ đang có.</div>') +
          '<div class="vk-mu" style="font-size:12px">"Lợi" = điểm tổng hợp (đánh trận mẫu + tu luyện). Mua xong vào tab Kinh mạch để xếp lại.</div>';
      } catch (e) { console.error(e); body.querySelector('#vk-rank').innerHTML = errBox(e); }
      ev.target.disabled = false;
    };
  }


  // ── Tab Chợ quanh đây: quét hàng các tiệm ở những nơi đi tới được, đo món nào lợi nhất với linh thạch hiện có
  const LOAI_TEN = { cong_phap: 'Công pháp', phap_khi: 'Pháp khí', dan_duoc: 'Đan dược', dung_cu: 'Dụng cụ', linh_duoc: 'Linh dược', yeu_tai: 'Yêu tài', nguyen_lieu: 'Nguyên liệu', phu_luc: 'Phù', phuong_tien: 'Đi lại' };
  async function scanShops(maxY, prog) {
    const K = S.core, c = ctx(), run = c.run, W = c.world, Cc = C(), cur = run.viTri;
    const land = W.tho(cur), out = [];
    const slots = W.slots.filter((s) => { try { return W.tho(s.id) === land; } catch { return false; } });
    const near = [];
    for (const s of slots) { let y; try { y = K.mf(c, s.id); } catch { continue; } if (!(y <= maxY)) continue; try { if (!K.gP(c, s.id)) continue; } catch {} near.push([s.id, y]); }
    near.sort((a, b) => a[1] - b[1]);
    for (let k = 0; k < near.length; k++) {
      if (S.abort) break;
      const [slot, y] = near[k];
      if (k % 4 === 0) { prog(k / near.length, 'Đang xem các tiệm…'); await sleep0(); }
      let encs = []; try { encs = K.Nin(c, slot); } catch { continue; }
      for (const id of encs) {
        const def = Cc.encounters.get(id);
        if (!def || def.kind !== 'cua_hang' || !def.ke_hang || !def.ke_hang.length || def.giao_dien === 'dau_gia') continue;
        // Tiệm đổi hàng đầu mỗi năm (theo lịch game): tính hàng đúng năm bạn tới nơi.
        const arrive = run.nam + y;
        const runA = { ...run, nam: arrive, active: { id, slot } };
        const cc = { ...c, run: runA, noi: slot, enc: runA.active };
        try {
          for (const e of K.H1(cc, id, slot) || []) {
            const it = Cc.items.get(e.itemId); if (!it) continue;
            const pf = e.priceFactor ?? 1;
            const gia = pf === 1 ? undefined : Math.max(1, Math.round((it.gia || 0) * pf));
            let price; try { price = K.E1(cc, e.itemId, gia, 0); } catch { price = gia ?? it.gia; }
            let noi = slot; try { noi = W.info(slot).ten || slot; } catch {}
            out.push({ slot, noi, years: y, arrive, doi: Math.floor(arrive) > Math.floor(run.nam), shop: String(def.ten || 'Tiệm').replace(/\{[^}]*\}/g, '').trim() || 'Tiệm', it, price });
          }
        } catch (err) { console.warn('shop', id, slot, err); }
      }
    }
    return { rows: out, nPlaces: near.length };
  }
  function tabCho() {
    const nv = nvNow();
    body.innerHTML = `
    <div class="vk-card"><h3>Đồ đáng mua bằng linh thạch</h3>
      <div class="vk-mu" style="font-size:13px">Bạn có <b>${Math.floor(nv.linhThach || 0)}</b> linh thạch. Tool xem hàng đang bày ở các tiệm trong bán kính đi đường bạn chọn (cùng đại lục, vùng đã khám phá), rồi thử từng món mua nổi vào kinh mạch để đo món nào lợi nhất.</div>
      <div style="margin:8px 0"><select class="vk-sel" id="vk-ry"><option value="0.5">Trong 6 tháng đường</option><option value="1" selected>Trong 1 năm đường</option><option value="2">Trong 2 năm đường</option><option value="4">Trong 4 năm đường</option></select></div>
      <label style="display:block;margin:4px 0 8px;font-size:14px"><input type="checkbox" id="vk-do" checked> Đo giá trị đồ đánh/tu luyện (lâu hơn)</label>
      <button class="vk-btn" id="vk-sc">Quét chợ</button>${progressHtml('vk-pr4')}</div>
    <div id="vk-cho"></div>`;
    if (S.cho) renderCho();
    body.querySelector('#vk-sc').onclick = async (ev) => {
      ev.target.disabled = true; S.abort = false;
      const prog = bindProgress(body.querySelector('#vk-pr4'));
      try {
        const maxY = +body.querySelector('#vk-ry').value, doMeasure = body.querySelector('#vk-do').checked;
        const { rows, nPlaces } = await scanShops(maxY, (f, l) => prog(f * (doMeasure ? 0.25 : 1), l));
        const money = nv.linhThach || 0;
        // món rẻ nhất của mỗi loại
        const cheapest = new Map();
        for (const r of rows) { const o = cheapest.get(r.it.id); if (!o || r.price < o.price || (r.price === o.price && r.years < o.years)) cheapest.set(r.it.id, r); }
        const usable = [...cheapest.values()].filter((r) => (r.it.loai === 'cong_phap' || r.it.loai === 'phap_khi') && r.it.hinh && (r.it.canh_gioi ?? 0) <= nv.canhGioi && !(nv.tuiDo[r.it.id] > 0) && r.price <= money)
          .sort((a, b) => (b.it.pham_cap || 0) - (a.it.pham_cap || 0) || a.price - b.price).slice(0, 12);
        const measured = [];
        let base = null;
        if (doMeasure && usable.length) {
          const nv0 = clone(nv); nv0.kinhMach.manh = [];
          base = await anneal({ nv0, mode: 'bal', iters: 1000, init: nv.kinhMach.manh, onProg: (f) => prog(0.25 + 0.75 * f / (usable.length + 1), 'Mốc hiện tại…') });
          for (let k = 0; k < usable.length && !S.abort; k++) {
            const r = usable[k]; const nvX = clone(nv0); nvX.tuiDo[r.it.id] = 1;
            const res = await anneal({ nv0: nvX, mode: 'bal', iters: 600, init: base.manh, onProg: (f) => prog(0.25 + 0.75 * (k + 1 + f) / (usable.length + 1), `Đo ${r.it.ten}…`) });
            measured.push({ r, gain: res.score - base.score, wins: res.wins, n: res.n });
          }
          measured.sort((a, b) => b.gain - a.gain);
        }
        S.cho = { rows, nPlaces, cheapest, usable, measured, base, money, maxY, canhGioi: nv.canhGioi };
        body.querySelector('#vk-pr4').style.display = 'none';
        renderCho();
      } catch (e) { console.error(e); body.querySelector('#vk-cho').innerHTML = errBox(e); }
      ev.target.disabled = false;
    };
  }
  function renderCho() {
    const { rows, nPlaces, cheapest, usable, measured, base, money, canhGioi } = S.cho;
    const where = (r) => `${esc(r.noi)} <span class="vk-mu">· ${r.years < 0.05 ? 'ngay đây' : num(r.years) + ' năm'}${r.doi ? ' · hàng năm mới' : ''}</span>`;
    const all = [...cheapest.values()];
    // Đan đột phá cho cửa kế tiếp
    const pills = all.filter((r) => r.it.dot_pha && (r.it.dot_pha.canh_gioi === undefined || r.it.dot_pha.canh_gioi === canhGioi + 1)).sort((a, b) => a.price - b.price);
    const lo = all.filter((r) => r.it.loai === 'dung_cu').sort((a, b) => (b.it.pham_cap || 0) - (a.it.pham_cap || 0));
    let html = `<div class="vk-card"><h3>Kết quả</h3><div class="vk-mu" style="font-size:13px">Đã xem ${nPlaces} nơi, ${rows.length} món. Tiệm đổi hàng vào <b>đầu mỗi năm</b> theo lịch game; tool đã tính tốc độ đi của bạn và cho ra <b>hàng sẽ bày lúc bạn tới nơi</b> (nơi nào tới sau giao thừa thì là hàng năm mới). Giá tính theo từng nơi. Đi vòng qua nơi khác trước hoặc ngồi bế quan thì ngày tới thay đổi — quét lại trước khi đi.</div></div>`;
    if (measured.length) {
      const good = measured.filter((m) => m.gain > 1);
      if (good.length >= 2) html += `<div class="vk-card"><h3>Bộ mua tốt nhất với ${Math.floor(money)} linh thạch</h3><div class="vk-mu" style="font-size:13px">Thử kết hợp 2–3 món trong số đáng mua nhất, xem bộ nào mạnh nhất mà vẫn đủ tiền.</div><button class="vk-btn" id="vk-cb">Tìm bộ</button>${progressHtml('vk-pr7')}<div id="vk-cbo">${S.cho.combo || ''}</div></div>`;
      html += `<div class="vk-card"><h3>Đồ đánh / tu luyện đáng mua</h3>${good.length ? `<table class="vk-t"><tr><th>Món</th><th>Ở đâu</th><th>Giá</th><th>Lợi</th></tr>` +
        good.map((m) => `<tr><td><b>${esc(m.r.it.ten)}</b><br><span class="vk-mu" style="font-size:12px">${esc((m.r.it.he || []).map(heTen).join('/'))} · phẩm ${m.r.it.pham_cap} · ${itemDesc(m.r.it)}</span></td><td>${where(m.r)}</td><td>${Math.round(m.r.price)}</td><td class="vk-ok">+${Math.round(m.gain)}<br><span class="vk-mu" style="font-size:12px">${m.wins}/${m.n} thắng</span></td></tr>`).join('') + '</table>' : '<div class="vk-mu">Không món nào mua nổi giúp rõ rệt so với đồ đang có.</div>'}
        <div class="vk-mu" style="font-size:12px;margin-top:6px">Mốc hiện tại: thắng ${base.wins}/${base.n} trận mẫu. "Lợi" cùng thang điểm với tab Tàng Kinh Các.</div></div>`;
    } else if (usable.length) {
      html += `<div class="vk-card"><h3>Đồ đánh / tu luyện mua nổi</h3><table class="vk-t"><tr><th>Món</th><th>Ở đâu</th><th>Giá</th></tr>${usable.map((r) => `<tr><td><b>${esc(r.it.ten)}</b><br><span class="vk-mu" style="font-size:12px">phẩm ${r.it.pham_cap} · ${itemDesc(r.it)}</span></td><td>${where(r)}</td><td>${Math.round(r.price)}</td></tr>`).join('')}</table></div>`;
    } else html += `<div class="vk-card"><h3>Đồ đánh / tu luyện</h3><div class="vk-mu">Không có món mới nào mua nổi với ${Math.floor(money)} linh thạch.</div></div>`;
    html += `<div class="vk-card"><h3>Đan cho lần đột phá tới</h3>${pills.length ? `<table class="vk-t"><tr><th>Đan</th><th>Ở đâu</th><th>Giá</th></tr>${pills.map((r) => `<tr><td><b>${esc(r.it.ten)}</b><br><span class="vk-mu" style="font-size:12px">+${pct(r.it.dot_pha.ti_le || 0)} tỉ lệ</span></td><td>${where(r)}</td><td class="${r.price <= money ? 'vk-ok' : 'vk-bad'}">${Math.round(r.price)}</td></tr>`).join('')}</table>` : '<div class="vk-mu">Các tiệm quanh đây không bày đan đột phá cho cửa kế tiếp. Thử bán kính xa hơn hoặc đợi đấu giá.</div>'}</div>`;
    if (lo.length) html += `<div class="vk-card"><h3>Dụng cụ nghề</h3><table class="vk-t"><tr><th>Món</th><th>Ở đâu</th><th>Giá</th></tr>${lo.map((r) => `<tr><td><b>${esc(r.it.ten)}</b><br><span class="vk-mu" style="font-size:12px">phẩm ${r.it.pham_cap}</span></td><td>${where(r)}</td><td class="${r.price <= money ? 'vk-ok' : 'vk-bad'}">${Math.round(r.price)}</td></tr>`).join('')}</table></div>`;
    const byPlace = new Map(); for (const r of rows) { if (!byPlace.has(r.noi)) byPlace.set(r.noi, []); byPlace.get(r.noi).push(r); }
    html += `<div class="vk-card"><h3>Toàn bộ hàng theo nơi</h3>` + [...byPlace.entries()].map(([noi, rs]) => `<details><summary><b>${esc(noi)}</b> <span class="vk-mu">· ${rs[0].years < 0.05 ? 'ngay đây' : num(rs[0].years) + ' năm'} · ${rs.length} món</span></summary><table class="vk-t">${rs.sort((a, b) => a.price - b.price).map((r) => `<tr><td>${esc(r.it.ten)} <span class="vk-mu" style="font-size:12px">· ${LOAI_TEN[r.it.loai] || r.it.loai} · phẩm ${r.it.pham_cap ?? '?'}</span></td><td class="${r.price <= money ? '' : 'vk-mu'}">${Math.round(r.price)}</td></tr>`).join('')}</table></details>`).join('') + '</div>';
    body.querySelector('#vk-cho').innerHTML = html;
    const cb = body.querySelector('#vk-cb');
    if (cb) cb.onclick = async () => {
      cb.disabled = true; S.abort = false;
      const prog = bindProgress(body.querySelector('#vk-pr7'));
      try {
        const r = await comboSearch(prog);
        body.querySelector('#vk-pr7').style.display = 'none';
        let h = '';
        if (!r || !r.res.length) h = '<div class="vk-mu">Không có bộ 2–3 món nào vừa tiền. Mua món lẻ tốt nhất ở bảng dưới.</div>';
        else {
          const bestSingle = r.singles.filter((m) => m.r.price <= money).sort((a, b) => b.gain - a.gain)[0];
          const top = r.res.slice(0, 5);
          h = '<table class="vk-t"><tr><th>Bộ</th><th>Tổng giá</th><th>Lợi</th></tr>' + top.map((x) => `<tr><td>${x.s.map((m) => `<b>${esc(m.r.it.ten)}</b> <span class="vk-mu" style="font-size:12px">(${esc(m.r.noi)})</span>`).join('<br>')}</td><td>${Math.round(x.cost)}</td><td class="vk-ok">+${Math.round(x.gain)}<br><span class="vk-mu" style="font-size:12px">${x.wins}/${x.n} thắng</span></td></tr>`).join('') + '</table>';
          if (bestSingle && bestSingle.gain >= top[0].gain) h += `<div class="vk-mu" style="font-size:13px">Mua lẻ ${esc(bestSingle.r.it.ten)} đã gần bằng bộ tốt nhất — có thể giữ tiền lại.</div>`;
        }
        S.cho.combo = h; body.querySelector('#vk-cbo').innerHTML = h;
      } catch (e) { body.querySelector('#vk-cbo').innerHTML = errBox(e); }
      cb.disabled = false;
    };
  }

  // ═════════════════════════ BẢN 2.0: các tính năng mới ═════════════════════════
  const has = (...ks) => ks.every((k) => typeof S.core[k] === 'function');
  const needMsg = (what) => `<div class="vk-mu">Phần "${what}" chưa dùng được với bản game này. Bấm "Tự kiểm tra" ở tab Tổng quan rồi chụp màn hình gửi Claude.</div>`;
  const placeName = (c, slot) => { try { return c.world.info(slot).ten || slot; } catch { return slot; } };
  const danger = (c, slot) => { try { return S.core.is(S.core.ua(c, c.run, slot)); } catch { return null; } };
  const dangerTag = (d) => !d ? '' : `<span class="${d.id === 'hiem' || d.id === 'tu_dia' ? 'vk-bad' : d.id === 'ngang_suc' ? '' : 'vk-ok'}">${esc(d.ten)}</span>`;
  const yrs = (y) => (y < 0.05 ? 'ngay đây' : num(y) + ' năm');
  const cleanTxt = (x) => String(x ?? '').replace(/[-]/g, '').replace(/\{[^}]*\}/g, '…').replace(/\s+/g, ' ').trim();
  const HOA = { on: 'Lửa nhỏ', thuong: 'Lửa vừa', lieu: 'Lửa lớn' };
  const NGHE = { luyen_dan: 'Luyện đan', che_phu: 'Chế phù', luyen_bao: 'Luyện bảo' };
  const GRADE = [['hong_nang', 'Nổ lò'], ['hong', 'Hỏng'], ['ha', 'Hạ'], ['trung', 'Trung'], ['thuong', 'Thượng'], ['cuc', 'Cực']];
  function withPlace(c, slot) { const c2 = { ...c, run: { ...c.run, viTri: slot, active: undefined }, enc: undefined }; return c2; }
  function nearSlots(c, maxY) {
    const W = c.world, cur = c.run.viTri; let land; try { land = W.tho(cur); } catch {}
    const out = [];
    for (const s of W.slots) {
      if (s.an) continue;
      try { if (land !== undefined && W.tho(s.id) !== land) continue; } catch { continue; }
      let y; try { y = S.core.mf(c, s.id); } catch { continue; }
      if (!(y <= maxY)) continue;
      try { if (S.core.gP && !S.core.gP(c, s.id)) continue; } catch {}
      out.push({ slot: s.id, y });
    }
    return out.sort((a, b) => a.y - b.y);
  }
  // Mô phỏng nhanh 1 quái ở cảnh giới của nó, trả về chuỗi kết quả
  function simFoe(P, def, tcs) {
    tcs = tcs || (String(def.id || '').startsWith('npc.') && def.tieu_canh_gioi !== undefined ? [def.tieu_canh_gioi] : [0, 2]);
    const res = tcs.map((tc) => { try { const E = S.core.Ga({ ...def, tieu_canh_gioi: tc }, C(), def.muc ? { muc: def.muc } : {}); return fight(P, E).thang; } catch { return null; } });
    if (res.every((r) => r === true)) return { ok: 2, txt: '<span class="vk-ok">Thắng chắc</span>' };
    if (res.some((r) => r === true)) return { ok: 1, txt: '<span>Có thể thắng</span>' };
    if (res.every((r) => r === null)) return { ok: -1, txt: '<span class="vk-mu">?</span>' };
    return { ok: 0, txt: '<span class="vk-bad">Thua</span>' };
  }
  function foesOf(c, vars) {
    const out = [];
    for (const v of Object.values(vars || {})) {
      if (typeof v !== 'string') continue;
      let def; try { def = S.core.ko(c, v); } catch {}
      if (!def && C().enemies.has(v)) def = C().enemies.get(v);
      if (def && def.ten) out.push(def);
    }
    return out;
  }
  function rewardHint(def) {
    const s = JSON.stringify(def.choices || def.scenes || {}), out = [];
    const lt = [...s.matchAll(/"linh_thach":\s*(\d+)/g)].map((m) => +m[1]);
    if (lt.length) out.push(`linh thạch tới ${Math.max(...lt)}`);
    const ids = [...new Set([...s.matchAll(/"(?:add_item|roi_quy)":\s*(?:\{"id":\s*)?"(item\.[a-z0-9_]+)"/g)].map((m) => m[1]))];
    const names = ids.map((id) => C().items.get(id)).filter(Boolean).sort((a, b) => (b.pham_cap || 0) - (a.pham_cap || 0)).slice(0, 3).map((it) => it.ten);
    if (names.length) out.push(names.join(', '));
    if (/"tu_vi"/.test(s)) out.push('tu vi');
    if (/"cong_hien"/.test(s)) out.push('cống hiến');
    return out.join(' · ') || '—';
  }

  // ── Đột phá & thọ nguyên: kế hoạch
  function planData() {
    const K = S.core, c = ctx(), nv = c.run.nhanVat, Cc = C();
    const tho = K.ke(nv), left = tho - nv.tuoi;
    const p = { tho, left, need: 0, nextNeed: 0, here: null, hereYears: Infinity, places: [], stagn: false };
    try { p.need = K.qw(c, { untilExhausted: true }); p.nextNeed = K.qw(c, { nextMinorRealm: true }); } catch {}
    try { p.here = K.to(c); } catch {}
    if (p.here && !p.here.chan && p.here.tuViNam > 0) {
      p.hereYears = p.need / p.here.tuViNam;
      try { const got = K.Nb(c, p.here, { dan: [], danSo: {} }, p.hereYears); p.stagn = got < p.need * 0.97; } catch {}
    }
    try { const d = K.Di(nv, Cc); p.speed = d; p.capped = d / (1 + (nv.tucTue || 0)) > 1.45; } catch {}
    return { c, nv, p };
  }
  async function scanRetreat(c, maxY, prog) {
    const K = S.core, out = [];
    const list = nearSlots(c, maxY);
    for (let i = 0; i < list.length; i++) {
      if (S.abort) break;
      if (i % 15 === 0) { prog && prog(i / list.length, 'Đang so chỗ bế quan…'); await sleep0(); }
      const { slot, y } = list[i];
      let info; try { info = K.to(withPlace(c, slot)); } catch { continue; }
      if (!info || info.chan || !(info.tuViNam > 0)) continue;
      out.push({ slot, y, info, d: danger(c, slot) });
    }
    const dr = (d) => ({ an_toan: 0, ngang_suc: 1, hiem: 2, tu_dia: 3 })[d && d.id] ?? 1;
    return out.sort((a, b) => b.info.tuViNam - a.info.tuViNam || dr(a.d) - dr(b.d) || a.y - b.y);
  }
  function pillCandidates(nextRealm) {
    return [...C().items.values()].filter((it) => it.dot_pha && (it.dot_pha.canh_gioi === undefined || it.dot_pha.canh_gioi === nextRealm));
  }
  function bestRateWith(nv, extraPills, td, asDvm) {
    const c = ctx();
    if (asDvm && c.run.nhanVat.tieuCanhGioi < 3) { c.run.nhanVat.tieuCanhGioi = 3; c.run.nhanVat.peakStage = 3; }
    for (const id of extraPills) c.run.nhanVat.tuiDo[id] = Math.max(1, c.run.nhanVat.tuiDo[id] || 0);
    try { return S.core.kR(c, { dan: extraPills, thieuDot: td }).tiLe; } catch { return null; }
  }
  function whereToGet(id) {
    const out = [];
    const nv = nvNow();
    if ((nv.tuiDo[id] || 0) > 0) out.push('<span class="vk-ok">trong túi</span>');
    try { const c = ctx(); const e = [...S.core.Hon(c, 'cong_phap'), ...S.core.Hon(c, 'phap_khi')].find((x) => x.id === id); if (e) out.push(`Tàng Kinh Các (${e.gia} cống hiến)`); } catch {}
    if (S.cho) { const r = S.cho.cheapest.get(id); if (r) out.push(`${esc(r.noi)} · ${yrs(r.years)} · ${Math.round(r.price)} lt`); }
    return out.join('; ');
  }

  function tabDotPha2() {
    if (!has('to', 'qw', 'Nb')) { tabDotPha(); body.insertAdjacentHTML('afterbegin', `<div class="vk-card"><h3>Kế hoạch thọ nguyên</h3>${needMsg('kế hoạch thọ nguyên')}</div>`); return; }
    const { c, nv, p } = planData();
    const nextRealm = nv.canhGioi + 1;
    const atTop = p.need <= 0;
    let verdict = '';
    if (atTop) verdict = '<div class="vk-ok">Đã đủ tu vi Đại viên mãn — có thể chuẩn bị đột phá.</div>';
    else if (!p.here || p.here.chan) verdict = `<div class="vk-mu">Chỗ đang đứng không bế quan được${p.here && p.here.chan ? ': ' + esc(p.here.chan) : ''}. Xem danh sách chỗ bế quan bên dưới.</div>`;
    else {
      const ok = p.hereYears < p.left - 5;
      verdict = `<div class="${ok ? 'vk-ok' : 'vk-bad'}" style="font-size:16px">${ok ? 'Kịp' : 'KHÔNG KỊP'}: cần khoảng <b>${Math.ceil(p.hereYears)} năm</b> bế quan ở đây, còn <b>${Math.floor(p.left)} năm</b> thọ.</div>`;
    }
    body.innerHTML = `
    <div class="vk-card"><h3>Kế hoạch tới Đại viên mãn</h3>
      <div class="vk-row"><span>Cảnh giới</span><b>${esc(realmLabel(nv.canhGioi, nv.tieuCanhGioi))}</b></div>
      <div class="vk-row"><span>Thọ còn</span><b>${Math.floor(p.left)} năm <span class="vk-mu">(${Math.floor(nv.tuoi)}/${p.tho})</span></b></div>
      <div class="vk-row"><span>Tu vi còn thiếu tới Đại viên mãn</span><b>${Math.ceil(p.need)}</b></div>
      ${p.nextNeed > 0 && p.nextNeed < p.need ? `<div class="vk-row"><span>…tới tiểu cảnh giới kế</span><b>${Math.ceil(p.nextNeed)}</b></div>` : ''}
      <div class="vk-row"><span>Bế quan ở chỗ này</span><b>${p.here && !p.here.chan ? `${num(p.here.tuViNam, 2)} tu vi/năm · ${esc(p.here.ten)} · linh khí ${esc(p.here.linhKhi && p.here.linhKhi.ten)}` : '—'}</b></div>
      ${verdict}
      ${p.stagn ? '<div class="vk-bad" style="font-size:13px">Lịch luyện không đủ cho cả quãng bế quan: giữa chừng sẽ ngưng trệ. Xen kẽ đi đánh, đi xa để hồi.</div>' : ''}
      ${p.capped ? '<div class="vk-mu" style="font-size:13px">Tốc độ tu luyện từ linh căn + công pháp đã vượt trần 1,5: thêm công pháp tăng tốc giờ chỉ còn 25% tác dụng. Đòn bẩy lớn hơn là chỗ bế quan, đan tu luyện, đạo lữ.</div>' : ''}
    </div>
    <div class="vk-card"><h3>Chỗ bế quan tốt nhất gần đây</h3>
      <select class="vk-sel" id="vk-bqy"><option value="1">Trong 1 năm đường</option><option value="3" selected>Trong 3 năm đường</option><option value="8">Trong 8 năm đường</option></select>
      <button class="vk-btn" id="vk-bq">So sánh</button>${progressHtml('vk-pr5')}<div id="vk-bqo"></div></div>
    <div class="vk-card"><h3>Đan giúp tu vi và thọ</h3><div id="vk-pill"></div></div>
    <div class="vk-card"><h3>Muốn đạt tỉ lệ đột phá cao nhất</h3><div id="vk-tgt"></div></div>
    <div id="vk-dpold"></div>`;
    // Đan tu luyện / thọ / phá bình cảnh
    const Cc = C();
    const tuPills = [...Cc.items.values()].filter((it) => it.tu_luyen && (it.tu_luyen.canh_gioi === undefined || it.tu_luyen.canh_gioi === nv.canhGioi));
    const thoPills = [...Cc.items.values()].filter((it) => JSON.stringify(it.dung || '').includes('"tho_nguyen"') && (it.canh_gioi ?? 0) <= nv.canhGioi);
    const bcPills = [...Cc.items.values()].filter((it) => JSON.stringify(it.dung || '').includes('pha_binh_canh') && it.canh_gioi === nv.canhGioi);
    const tuv = p.here && p.here.tuViNam || 0;
    const rowP = (it, eff) => `<tr><td><b>${esc(it.ten)}</b><br><span class="vk-mu" style="font-size:12px">${eff}</span></td><td style="font-size:13px">${whereToGet(it.id) || '<span class="vk-mu">chưa thấy — quét tab Chợ</span>'}</td></tr>`;
    let ph = '<table class="vk-t"><tr><th>Đan</th><th>Có ở đâu</th></tr>';
    for (const it of tuPills) ph += rowP(it, `+${pct(it.tu_luyen.toc_do)} tu luyện trong ${it.tu_luyen.nam} năm${tuv ? ` ≈ +${Math.round(it.tu_luyen.toc_do * tuv * it.tu_luyen.nam)} tu vi` : ''}`);
    for (const it of thoPills) { const m = /"tho_nguyen":\s*(\d+)/.exec(JSON.stringify(it.dung)); ph += rowP(it, `+${m ? m[1] : '?'} năm thọ`); }
    for (const it of bcPills) ph += rowP(it, 'phá bình cảnh của tầng hiện tại (đỡ phần tu vi tích thêm)');
    ph += '</table><div class="vk-mu" style="font-size:12px">Dùng nhiều lần cùng một loại đan sẽ bị dược kháng, hiệu quả giảm dần.</div>';
    body.querySelector('#vk-pill').innerHTML = (tuPills.length + thoPills.length + bcPills.length) ? ph : '<div class="vk-mu">Không có đan phù hợp cảnh giới này.</div>';
    // Mục tiêu tỉ lệ
    try {
      const dvm = nv.tieuCanhGioi < 3;
      const base0 = bestRateWith(nv, [], 0, dvm);
      const h0 = { ...S.core.kR(c, { dan: [], thieuDot: 0 }), tiLe: base0 ?? 0 };
      const cands = pillCandidates(nextRealm).map((it) => ({ it, gain: (bestRateWith(nv, [it.id], 0, dvm) ?? h0.tiLe) - h0.tiLe })).filter((x) => x.gain > 0.0001).sort((a, b) => b.gain - a.gain);
      const top2 = cands.slice(0, 2).map((x) => x.it.id);
      const tdMax = (h0.thieuDot || []).reduce((m, x, i) => (x.duoc ? i + 1 : m), 0);
      const best = bestRateWith(nv, top2, tdMax, dvm);
      let html = (dvm ? '<div class="vk-mu" style="font-size:13px;margin-bottom:4px">Tính như khi bạn đã tới Đại viên mãn (đột phá sớm bị trừ rất nặng).</div>' : '') + `<div class="vk-row"><span>Không dùng gì</span><b>${pct(h0.tiLe, 1)}</b></div>`;
      cands.slice(0, 4).forEach((x) => { html += `<div class="vk-row"><span>+ ${esc(x.it.ten)} <span class="vk-mu" style="font-size:12px">${whereToGet(x.it.id) || 'chưa thấy chỗ bán'}</span></span><b>+${pct(x.gain, 1)}</b></div>`; });
      if (tdMax) html += `<div class="vk-row"><span>+ đốt ${tdMax} nấc thọ (−${h0.thieuDot[tdMax - 1].nam} năm)</span><b>+${pct((bestRateWith(nv, [], tdMax, dvm) ?? h0.tiLe) - h0.tiLe, 1)}</b></div>`;
      html += `<div class="vk-row"><span><b>Gom đủ 2 đan tốt nhất + đốt thọ</b></span><b class="vk-ok">${best !== null ? pct(best, 1) : '?'}</b></div>`;
      html += '<div class="vk-mu" style="font-size:12px">Cộng thêm: hộ pháp +5%; đột phá ở động phủ của mình hoặc sư môn cao hơn ở thành thị; linh khí dồi dào +5%. Từ Kết Đan, mọi khoản cộng bị giảm vì bình cảnh.</div>';
      body.querySelector('#vk-tgt').innerHTML = html;
    } catch (e) { body.querySelector('#vk-tgt').innerHTML = errBox(e); }
    // bảng phương án cũ
    const keep = body.innerHTML;
    tabDotPha(); const old = body.innerHTML; body.innerHTML = keep; body.querySelector('#vk-dpold').innerHTML = old;
    body.querySelector('#vk-bq').onclick = async (ev) => {
      ev.target.disabled = true; S.abort = false;
      const prog = bindProgress(body.querySelector('#vk-pr5'));
      try {
        const list = await scanRetreat(c, +body.querySelector('#vk-bqy').value, prog);
        body.querySelector('#vk-pr5').style.display = 'none';
        const top = list.slice(0, 8);
        body.querySelector('#vk-bqo').innerHTML = top.length ? `<table class="vk-t"><tr><th>Nơi</th><th>Tu vi/năm</th><th>Tới ĐVM</th></tr>` + top.map((r) => {
          const yy = p.need > 0 ? p.need / r.info.tuViNam : 0;
          const ok = r.y + yy < p.left - 5;
          return `<tr><td><b>${esc(placeName(c, r.slot))}</b><br><span class="vk-mu" style="font-size:12px">${esc(r.info.ten)} · linh khí ${esc(r.info.linhKhi && r.info.linhKhi.ten)}${r.info.doYen ? ' · ' + esc(r.info.doYen) : ''} · ${yrs(r.y)} · ${dangerTag(r.d)}${r.info.rentPerYear ? ` · ${Math.round(r.info.rentPerYear)} lt/năm` : ''}${r.info.meritPerYear ? ` · ${Math.round(r.info.meritPerYear)} cống hiến/năm` : ''}</span></td><td>${num(r.info.tuViNam, 2)}</td><td class="${ok ? 'vk-ok' : 'vk-bad'}">${p.need > 0 ? Math.ceil(yy) + ' năm' : '—'}</td></tr>`;
        }).join('') + '</table><div class="vk-mu" style="font-size:12px">Mỗi lần ngồi bị giới hạn số năm theo loại chỗ; ngồi xong cứ ngồi tiếp. Động phủ của mình không giới hạn.</div>' : '<div class="vk-mu">Không tìm thấy chỗ bế quan nào trong bán kính này.</div>';
      } catch (e) { body.querySelector('#vk-bqo').innerHTML = errBox(e); }
      ev.target.disabled = false;
    };
  }

  // ── Luyện đan & thi nghề
  function gradeBar(pb) {
    return GRADE.filter(([k]) => pb[k] > 0.004).map(([k, t]) => `<span class="${k === 'thuong' || k === 'cuc' ? 'vk-ok' : k.startsWith('hong') ? 'vk-bad' : 'vk-mu'}">${t} ${pct(pb[k])}</span>`).join(' · ');
  }
  function recipeRows(c, nv) {
    const K = S.core, Cc = C(), out = [];
    for (const dpId of nv.donPhuong || []) {
      const dp = Cc.donPhuong.get(dpId); if (!dp) continue;
      let best = null;
      for (const hoa of ['on', 'thuong', 'lieu']) {
        let L; try { L = K.Lu(c, { dp: dpId, hoa, phu: [], soMe: 1 }, { ten: '', diem: 0 }); } catch { continue; }
        if (!L) continue;
        if (L.phuDung && L.phuDung.some((x) => x.length)) { try { const L2 = K.Lu(c, { dp: dpId, hoa, phu: L.phuDung.map((x) => x[0] || ''), soMe: 1 }, { ten: '', diem: 0 }); if (L2) L = L2; } catch {} }
        const good = (L.phanBo.thuong || 0) + (L.phanBo.cuc || 0);
        const so = dp.so || [1, 2, 3, 4];
        const qty = (L.phanBo.ha || 0) * so[0] + (L.phanBo.trung || 0) * (so[1] ?? so[0]) + (L.phanBo.thuong || 0) * (so[2] ?? so[1]) + (L.phanBo.cuc || 0) * (so[3] ?? so[2]);
        const r = { dpId, dp, hoa, L, good, qty };
        if (!best || (r.qty > best.qty + 1e-9) || (Math.abs(r.qty - best.qty) < 1e-9 && good > best.good)) best = r;
      }
      if (!best) continue;
      const ra = best.L.ra;
      let sell = 0; try { sell = K.IP ? K.IP(c, ra.id, undefined, 0) : Math.round((ra.gia || 0) * 0.6); } catch { sell = Math.round((ra.gia || 0) * 0.6); }
      const cost = (dp.chu || []).reduce((s, x) => s + (Cc.items.get(x.id)?.gia || 0) * x.so, 0) + (dp.linh_thach || 0);
      const nam = best.L.nam || 0.05;
      out.push({ ...best, ra, sell, cost, nam, profit: best.qty * sell - cost, perYear: (best.qty * sell - cost) / nam });
    }
    return out;
  }
  function tabLuyenDan() {
    const K = S.core, c = ctx(), nv = c.run.nhanVat, Cc = C();
    let html = '';
    // Thi nghề
    if (!has('jan', 'bb')) html += `<div class="vk-card"><h3>Thi nghề</h3>${needMsg('thi nghề')}</div>`;
    else {
      const ngheList = Object.keys(nv.nghe || {}).length ? Object.keys(nv.nghe) : ['luyen_dan'];
      for (const ng of ngheList) {
        const bac = (nv.nghe && nv.nghe[ng] && nv.nghe[ng].bac) || 0;
        let rows = '', best = null;
        for (const hoa of ['on', 'thuong', 'lieu']) {
          let j; try { j = K.jan(c, ng, hoa); } catch { continue; }
          if (!best || j.qua > best.j.qua) best = { hoa, j };
          rows += `<tr><td>${HOA[hoa]}</td><td><b>${pct(j.qua)}</b></td><td style="font-size:12px">${gradeBar(j.phanBo)}</td></tr>`;
        }
        let reasons = []; try { reasons = K.bb(c, ng); } catch {}
        let parts = '';
        if (has('Pw') && best) { try { parts = K.Pw(c, ng, best.j.pham, best.hoa, { ten: 'Trường thi', diem: 0 }, best.j.pham).filter((x) => x.ten !== 'Luyện vượt bậc' && x.gt).map((x) => `<div class="vk-row"><span>${esc(x.ten)}</span><b class="${x.gt < 0 ? 'vk-bad' : ''}">${x.gt > 0 ? '+' : ''}${Math.round(x.gt)}</b></div>`).join(''); } catch {} }
        html += `<div class="vk-card"><h3>Thi ${esc(NGHE[ng] || ng)} lên bậc ${bac + 1}</h3>
          ${reasons.length ? `<div class="vk-bad" style="margin-bottom:6px">Chưa thi được: ${esc(reasons.join('; '))}</div>` : '<div class="vk-ok" style="margin-bottom:6px">Đủ điều kiện dự thi.</div>'}
          <table class="vk-t"><tr><th>Cách lửa</th><th>Đỗ</th><th>Phân bố</th></tr>${rows}</table>
          ${best ? `<div style="margin-top:6px">Nên chọn <b>${HOA[best.hoa]}</b>: đỗ ${pct(best.j.qua)}. Cần ra hạng Thượng trở lên mới đỗ. Rớt thì chỉ bị khóa 3 năm <b>ở nơi vừa thi</b> — sang nơi khác có trường thi là thi lại được ngay.</div>` : ''}
          ${parts ? `<details style="margin-top:6px"><summary>Điểm của bạn (cao hơn thì đỗ dễ hơn)</summary>${parts}<div class="vk-mu" style="font-size:12px">Tăng điểm: chỉ số chính của nghề (công pháp, đồ cộng thần thức/ngộ tính), lên cảnh giới.</div></details>` : ''}</div>`;
      }
    }
    // Tự luyện
    if (!has('Lu')) html += `<div class="vk-card"><h3>Đan phương đã thuộc</h3>${needMsg('luyện chế')}</div>`;
    else {
      const rr = recipeRows(c, nv).sort((a, b) => (a.L.chan ? 1 : 0) - (b.L.chan ? 1 : 0) || b.perYear - a.perYear);
      html += `<div class="vk-card"><h3>Đan phương đã thuộc</h3>${rr.length ? '<table class="vk-t"><tr><th>Đan</th><th>Lửa nên dùng</th><th>Lãi ước tính</th></tr>' + rr.map((r) => {
        const miss = (r.dp.chu || []).filter((x) => (nv.tuiDo[x.id] || 0) < x.so).map((x) => `${Cc.items.get(x.id)?.ten || x.id} ×${x.so}`);
        return `<tr><td><b>${esc(r.ra.ten)}</b> <span class="vk-mu" style="font-size:12px">phẩm ${r.L.pham}</span><br><span style="font-size:12px">${gradeBar(r.L.phanBo)}</span>${r.L.chan ? `<br><span class="vk-bad" style="font-size:12px">${esc(r.L.chan)}</span>` : ''}${miss.length ? `<br><span class="vk-mu" style="font-size:12px">thiếu: ${esc(miss.join(', '))}</span>` : ''}</td><td>${HOA[r.hoa]}<br><span class="vk-mu" style="font-size:12px">~${num(r.qty, 1)} viên/mẻ · ${num(r.nam, 2)} năm/mẻ</span></td><td class="${r.profit > 0 ? 'vk-ok' : 'vk-bad'}">${Math.round(r.profit)} lt/mẻ<br><span class="vk-mu" style="font-size:12px">bán ~${r.sell}/viên</span></td></tr>`;
      }).join('') + '</table><div class="vk-mu" style="font-size:12px">Lãi = số viên trung bình × giá bán ở đây − giá gốc nguyên liệu − linh thạch mỗi mẻ. Giá thật ở tiệm có thể chênh.</div>' : '<div class="vk-mu">Chưa thuộc đan phương nào.</div>'}</div>`;
    }
    body.innerHTML = html;
  }

  // ── Kiếm linh thạch
  async function scanBounties(c, maxY, prog) {
    const K = S.core, out = [], P = K.Vr(c.run.nhanVat, C());
    const list = nearSlots(c, maxY);
    for (let i = 0; i < list.length; i++) {
      if (S.abort) break;
      if (i % 10 === 0) { prog && prog(i / list.length, 'Đang xem bảng treo thưởng…'); await sleep0(); }
      const { slot, y } = list[i];
      let viec; try { viec = K.Rrn(c, slot, 'thanh_tran'); } catch { continue; }
      for (const v of viec || []) {
        if (!v.thuong) continue;
        const foes = foesOf(c, v.vars);
        let worst = { ok: 2, txt: '<span class="vk-mu">không rõ</span>' };
        for (const f of foes) { const r = simFoe(P, f); if (r.ok < worst.ok || worst.txt.includes('không rõ')) worst = r; }
        let y2 = 0; try { y2 = K.mf(withPlace(c, slot), v.slot); } catch {}
        out.push({ board: slot, y, v, foes, res: worst, y2, d: danger(c, v.slot) });
      }
    }
    return out;
  }
  function junkItems(c, nv) {
    const K = S.core, Cc = C(), out = [];
    const onGrid = new Set(nv.kinhMach.manh.map((m) => m.item));
    const equip = new Set(Object.values(nv.trangBi || {}));
    const recipeMats = new Set(); for (const dpId of nv.donPhuong || []) { const dp = Cc.donPhuong.get(dpId); (dp?.chu || []).forEach((x) => recipeMats.add(x.id)); (dp?.phu || []).forEach(() => {}); }
    for (const [id, n] of Object.entries(nv.tuiDo)) {
      if (!(n > 0) || onGrid.has(id) || equip.has(id)) continue;
      const it = Cc.items.get(id); if (!it || !it.gia) continue;
      if (['don_phuong', 'lenh_bai', 'phuong_tien', 'tru_vat'].includes(it.loai)) continue;
      const keepPill = it.dot_pha || it.tu_luyen || JSON.stringify(it.dung || '').includes('tho_nguyen');
      let price; try { price = K.IP ? K.IP(c, id, undefined, 0) : Math.round(it.gia * 0.6); } catch { price = Math.round(it.gia * 0.6); }
      out.push({ it, n, price, total: price * n, keep: keepPill ? 'đan quý — cân nhắc giữ' : recipeMats.has(id) ? 'nguyên liệu đan phương của bạn' : (it.loai === 'cong_phap' || it.loai === 'phap_khi') ? 'đồ không dùng trên kinh mạch' : '' });
    }
    return out.sort((a, b) => b.total - a.total);
  }
  function tabTien() {
    const K = S.core, c = ctx(), nv = c.run.nhanVat;
    const junk = junkItems(c, nv);
    const sum = junk.filter((x) => !x.keep.startsWith('đan quý') && !x.keep.startsWith('nguyên liệu')).reduce((s, x) => s + x.total, 0);
    let bong = '';
    if (has('KI')) { try { const k = K.KI(c); if (k.linhThach || k.congHien) bong = `<div class="vk-ok">Bổng lộc đang chờ ở sư môn: ${k.linhThach} linh thạch, ${Math.round(k.congHien)} cống hiến (${k.nam} năm).</div>`; } catch {} }
    body.innerHTML = `
    <div class="vk-card"><h3>Cách kiếm linh thạch</h3>
      <div class="vk-mu" style="font-size:13px">Bạn có <b>${Math.floor(nv.linhThach || 0)}</b> linh thạch. Theo thứ tự nên làm:</div>
      <ol style="margin:6px 0 0;padding-left:20px;font-size:14px">
        <li><b>Bán đồ thừa</b> trong túi (bảng dưới) — có tiền ngay. Bán ở nơi xa vùng sản sinh ra món đó thì được giá cao hơn.</li>
        <li><b>Nhận treo thưởng</b> ở các thành trấn quanh đây — chỉ nhận việc tool báo <span class="vk-ok">Thắng chắc</span>. Đây thường là nguồn lớn nhất.</li>
        <li><b>Luyện đan để bán</b> khi đã có lò và đan phương có lãi (tab Luyện đan).</li>
        <li><b>Lĩnh bổng lộc</b> đều đặn nếu ở tông môn; cấp càng cao càng nhiều.</li>
        <li>Đánh yêu thú lấy yêu tài, trồng linh dược ở linh điền động phủ rồi đem bán.</li>
      </ol>${bong}</div>
    <div class="vk-card"><h3>Treo thưởng</h3><div class="vk-mu">Xem tab <b>Treo thưởng</b>: liệt kê việc ở các bảng quanh đây, thưởng bao nhiêu và đánh có thắng không.</div></div>
    <div class="vk-card"><h3>Đồ trong túi bán được</h3>
      ${junk.length ? `<div class="vk-mu" style="font-size:13px">Bán hết phần không cần giữ được khoảng <b>${Math.round(sum)}</b> linh thạch (giá ở chỗ đang đứng).</div><table class="vk-t"><tr><th>Món</th><th>SL</th><th>Tổng</th></tr>${junk.slice(0, 40).map((x) => `<tr><td>${esc(x.it.ten)}${x.keep ? `<br><span class="vk-mu" style="font-size:12px">${x.keep}</span>` : ''}</td><td>${x.n}</td><td>${Math.round(x.total)}</td></tr>`).join('')}</table>` : '<div class="vk-mu">Túi không có gì đáng bán.</div>'}</div>`;
    if (body.querySelector('#vk-tt')) body.querySelector('#vk-tt').onclick = async (ev) => {
      ev.target.disabled = true; S.abort = false;
      const prog = bindProgress(body.querySelector('#vk-pr6'));
      try {
        const list = await scanBounties(c, +body.querySelector('#vk-tty').value, prog);
        body.querySelector('#vk-pr6').style.display = 'none';
        list.sort((a, b) => (b.res.ok >= 1) - (a.res.ok >= 1) || b.v.thuong / (1 + b.y + b.y2) - a.v.thuong / (1 + a.y + a.y2));
        body.querySelector('#vk-tto').innerHTML = list.length ? `<table class="vk-t"><tr><th>Việc</th><th>Thưởng</th><th>Sức</th></tr>` + list.slice(0, 25).map((r) => `<tr><td><b>${esc(cleanTxt(r.v.ten))}</b><br><span class="vk-mu" style="font-size:12px">Nhận ở ${esc(placeName(c, r.board))} (${yrs(r.y)}) → làm ở ${esc(placeName(c, r.v.slot))} (${yrs(r.y2)}, ${dangerTag(r.d)}) · hạn ${r.v.han} năm${r.foes.length ? ' · gặp ' + esc(r.foes.map((f) => f.ten).join(', ')) : ''}</span></td><td><b>${r.v.thuong}</b>${r.v.congHien ? `<br><span class="vk-mu" style="font-size:12px">+${r.v.congHien} cống hiến</span>` : ''}</td><td>${r.res.txt}</td></tr>`).join('') + '</table><div class="vk-mu" style="font-size:12px">Bảng treo thưởng đổi mỗi năm. "Thắng chắc" = thắng quái cả ở Sơ và Hậu kỳ cảnh giới của nó.</div>' : '<div class="vk-mu">Không thấy việc có thưởng linh thạch trong bán kính này.</div>';
      } catch (e) { body.querySelector('#vk-tto').innerHTML = errBox(e); }
      ev.target.disabled = false;
    };
  }

  // ── Bản đồ: cơ duyên + đường đi an toàn
  function routeSafe(c, target) {
    const W = c.world, start = c.run.viTri, PO = S.core.PO || 30;
    let land; try { land = W.tho(start); } catch {}
    const nodes = W.slots.filter((s) => !s.an && (() => { try { return W.tho(s.id) === land; } catch { return false; } })());
    const idx = new Map(nodes.map((s, i) => [s.id, i]));
    if (!idx.has(target) || !idx.has(start)) return null;
    const pen = nodes.map((s) => { const d = danger(c, s.id); return d && d.id === 'tu_dia' ? 40 : d && d.id === 'hiem' ? 12 : 0; });
    const N = nodes.length, dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N);
    const si = idx.get(start), ti = idx.get(target); dist[si] = 0;
    const lim = PO * 0.97;
    for (;;) {
      let u = -1, b = Infinity; for (let i = 0; i < N; i++) if (!done[i] && dist[i] < b) { b = dist[i]; u = i; }
      if (u < 0 || u === ti) break; done[u] = 1;
      const a = nodes[u];
      for (let v = 0; v < N; v++) {
        if (done[v]) continue;
        const d = Math.hypot(a.x - nodes[v].x, a.y - nodes[v].y); if (d > lim) continue;
        const w = d + 2 + (v === ti ? 0 : pen[v]);
        if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
      }
    }
    if (!isFinite(dist[ti])) return null;
    const path = []; for (let v = ti; v >= 0; v = prev[v]) path.push(nodes[v]); path.reverse();
    let len = 0; for (let i = 1; i < path.length; i++) len += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    return { path, len };
  }
  function tabBanDo() {
    const K = S.core, c = ctx(), run = c.run, Cc = C(), P = K.Vr(run.nhanVat, Cc);
    const items = [];
    for (const [slot, n] of Object.entries(run.nodes || {})) {
      if (!n || !n.encounter) continue;
      if (n.hetHanNam !== undefined && n.hetHanNam <= run.nam) continue;
      const def = Cc.encounters.get(n.encounter); if (!def) continue;
      let y = Infinity; try { y = K.mf(c, slot); } catch {}
      const th = encThreat(n.encounter, slot, n.vars, run.nam + (isFinite(y) ? y : 0));
      let foes = [], worst = null;
      if (th === null) { foes = foesOf(c, n.vars); for (const f of foes) { const r = simFoe(P, f); if (!worst || r.ok < worst.ok) worst = r; } }
      items.push({ slot, def, n, y, foes, th, res: worst, d: danger(c, slot), left: n.hetHanNam !== undefined ? n.hetHanNam - run.nam : undefined });
    }
    items.sort((a, b) => a.y - b.y);
    const opts = items.map((x, i) => `<option value="${esc(x.slot)}">${esc(cleanTxt(x.def.ten || x.n.encounter))} · ${esc(placeName(c, x.slot))}</option>`).join('');
    const tm = K.Kn(c);
    const extra = tm ? `<option value="${esc(tm.slot)}">Sư môn · ${esc(placeName(c, tm.slot))}</option>` : '';
    const choTowns = S.cho ? [...new Set(S.cho.rows.map((r) => r.slot))].slice(0, 30).map((sl) => `<option value="${esc(sl)}">Chợ · ${esc(placeName(c, sl))}</option>`).join('') : '';
    body.innerHTML = `
    <div class="vk-card"><h3>Cơ duyên và sự kiện trên bản đồ</h3>${items.length ? `<table class="vk-t"><tr><th>Sự kiện</th><th>Đi</th><th>Sức</th></tr>${items.map((x) => `<tr><td><b>${esc(cleanTxt(x.def.ten || x.n.encounter))}</b><br><span class="vk-mu" style="font-size:12px">${esc(placeName(c, x.slot))} · ${dangerTag(x.d)}${x.left !== undefined ? ` · còn <span class="${x.left < x.y ? 'vk-bad' : ''}">${num(x.left)} năm</span>` : ''}${x.foes.length ? ' · gặp ' + esc(x.foes.map((f) => f.ten).join(', ')) : ''}<br>Có thể được: ${esc(rewardHint(x.def))}</span></td><td>${yrs(x.y)}</td><td>${x.th !== null && x.th !== undefined ? threatHtml(x.th) : x.res ? x.res.txt : '<span class="vk-mu">không rõ</span>'}</td></tr>`).join('')}</table>` : '<div class="vk-mu">Chưa có sự kiện nào hiện trên bản đồ.</div>'}</div>
    <div class="vk-card"><h3>Đường đi an toàn</h3>
      <div class="vk-mu" style="font-size:13px">Đi một chặng dài dễ gặp biến cố giữa đường. Chặng ngắn hơn ${K.PO || 30} đơn vị bản đồ thì không bị chặn giữa đường. Tool tìm chuỗi chặng ngắn, né nơi nguy hiểm.</div>
      <select class="vk-sel" id="vk-dst" style="width:100%;margin:6px 0">${opts}${extra}${choTowns}</select>
      <button class="vk-btn" id="vk-rt" ${items.length || tm || choTowns ? '' : 'disabled'}>Tìm đường</button><div id="vk-rto"></div></div>`;
    body.querySelector('#vk-rt').onclick = () => {
      const dst = body.querySelector('#vk-dst').value; const out = body.querySelector('#vk-rto');
      let direct = 0; try { direct = K.mf(c, dst); } catch {}
      const r = routeSafe(c, dst);
      if (!r) { out.innerHTML = '<div class="vk-mu">Không tìm được đường bộ (có thể khác đại lục, cần đi thuyền).</div>'; return; }
      const dTot = Math.hypot(c.world.slot(run.viTri).x - c.world.slot(dst).x, c.world.slot(run.viTri).y - c.world.slot(dst).y) || 1;
      const yPer = direct / dTot;
      out.innerHTML = `<div style="margin:6px 0">Đi thẳng: ${yrs(direct)}${dTot >= (K.PO || 30) ? ' · <span class="vk-bad">có thể bị chặn giữa đường</span>' : ''}. Đi theo chặng: ${r.path.length - 1} chặng, khoảng ${yrs(r.len * yPer)}.</div><ol style="margin:0;padding-left:20px;font-size:14px">${r.path.slice(1).map((s) => `<li>${esc(placeName(c, s.id))} ${dangerTag(danger(c, s.id))}</li>`).join('')}</ol>`;
    };
  }

  // ── Cảnh báo (Tổng quan) + thăng cấp xa hơn + tự kiểm tra
  function warnings() {
    const K = S.core, c = ctx(), run = c.run, nv = run.nhanVat, w = [];
    try { const left = K.ke(nv) - nv.tuoi; if (left < 30) w.push(['bad', `Thọ chỉ còn ${Math.floor(left)} năm.`]); } catch {}
    if (has('to', 'qw')) { try { const { p } = planData(); if (p.need > 0 && p.hereYears !== Infinity && p.hereYears > p.left - 5) w.push(['bad', `Bế quan ở chỗ này cần ~${Math.ceil(p.hereYears)} năm mới tới Đại viên mãn, nhưng thọ chỉ còn ${Math.floor(p.left)} năm. Xem tab Đột phá.`]); } catch {} }
    if ((nv.lichLuyen || 0) < 2) w.push(['bad', 'Lịch luyện sắp cạn: bế quan sẽ ngưng trệ. Đi đánh, đi xa để hồi.']);
    if (nv.thuongThe) w.push(['bad', `Đang bị thương ${nv.thuongThe} bậc: tu luyện và đột phá đều giảm.`]);
    const tm = run.tongMon; if (tm && tm.promotionRetryYear && tm.promotionRetryYear > run.nam) w.push(['', `Khảo hạch tông môn bị khóa thêm ${num(tm.promotionRetryYear - run.nam)} năm.`]);
    if (has('bb')) for (const ng of Object.keys(nv.nghe || {})) { try { const r = K.bb(c, ng).find((x) => x.includes('rớt')); if (r) w.push(['', `${NGHE[ng] || ng}: ${r}.`]); } catch {} }
    const seen = new Map(); for (const l of run.log || []) if (l.expiresAt && l.key) seen.set(l.key, l);
    for (const l of seen.values()) { const d = l.expiresAt - run.nam; if (d > 0.05 && d < 0.6) w.push(['', `Sắp hết hạn (${num(d)} năm): ${cleanTxt(String(l.text).replace(/còn [\d.,]+ năm\.?/, ''))}`]); }
    return w;
  }
  function masterInfo(c) {
    const ms = Object.values(c.run.npc || {}).filter((n) => n.song && n.danhPhan === 'su_phu');
    return ms.map((m) => `${esc(m.ten)} (thiện cảm ${Math.round(m.haoCam ?? 0)})`).join(', ');
  }
  async function selfTest(out) {
    const K = S.core, rows = [];
    const t = async (name, fnc) => { try { const r = await fnc(); rows.push([name, true, r || '']); } catch (e) { rows.push([name, false, e && e.message || String(e)]); } out.innerHTML = rows.map(([n, ok, m]) => `<div class="vk-row"><span>${esc(n)}</span><b class="${ok ? 'vk-ok' : 'vk-bad'}">${ok ? 'OK' : 'LỖI'}</b></div>${ok ? '' : `<div class="vk-mu" style="font-size:12px">${esc(m)}</div>`}`).join(''); await sleep0(); };
    await t('Đọc nhân vật', () => { const nv = nvNow(); if (!nv.kinhMach) throw new Error('thiếu kinh mạch'); });
    await t('Kinh mạch + đánh thử', () => { const r = evalCurrent(nvNow(), 'bal'); if (!r.P) throw new Error('không dựng được nhân vật'); const nv0 = nvNow(); nv0.kinhMach.manh = []; const { cand } = buildCandidates(nv0); const n = Object.values(cand).reduce((a, x) => a + x.length, 0); if (Object.keys(cand).length && !n) throw new Error('không tìm được chỗ đặt nào cho đồ trong túi'); return n + ' chỗ đặt'; });
    await t('Đột phá', () => { K.kR(ctx(), { dan: [], thieuDot: 0 }); });
    await t('Kế hoạch thọ', () => { if (!has('to', 'qw', 'Nb')) throw new Error('thiếu hàm'); planData(); });
    await t('Thi nghề', () => { if (!has('jan')) throw new Error('thiếu hàm'); K.jan(ctx(), 'luyen_dan', 'thuong'); });
    await t('Luyện đan', () => { if (!has('Lu')) throw new Error('thiếu hàm'); recipeRows(ctx(), nvNow()); });
    await t('Tàng Kinh Các', () => { K.Hon(ctx(), 'cong_phap'); });
    await t('Chợ (1 nơi)', async () => { const c = ctx(); const near = nearSlots(c, 3); for (const { slot } of near) { const encs = K.Nin(c, slot); for (const id of encs) { const d = C().encounters.get(id); if (d && d.kind === 'cua_hang' && d.ke_hang && d.ke_hang.length) { K.H1({ ...c, noi: slot }, id, slot); return 'ok'; } } } return 'không có tiệm gần'; });
    await t('Treo thưởng', () => { if (!has('Rrn')) throw new Error('thiếu hàm'); const c = ctx(); K.Rrn(c, c.run.viTri, 'thanh_tran'); });
    await t('Giá bán', () => { if (!has('IP')) throw new Error('thiếu hàm'); });
    await t('Ước lượng trận của game', () => { if (!has('Uen')) throw new Error('thiếu hàm'); const c = ctx(); const r = S.core.Uen(c, [...C().enemies.keys()][0], {}); if (!r) throw new Error('không trả kết quả'); return r.level; });
    await t('Độ nguy hiểm', () => { if (!has('ua', 'is')) throw new Error('thiếu hàm'); const c = ctx(); K.is(K.ua(c, c.run, c.run.viTri)); });
    if ((K.optMissing || []).length) rows.push(['Hàm chưa nhận ra', false, K.optMissing.join(', ')]);
    out.innerHTML += `<div class="vk-mu" style="font-size:12px;margin-top:6px">Tool ${TOOL_VER} · game ${esc(K.bundle)}</div>`;
  }
  function tongQuanExtra() {
    const c = ctx();
    const w = warnings();
    const warnHtml = w.length ? w.map(([k, t]) => `<div class="${k === 'bad' ? 'vk-bad' : ''}" style="padding:3px 0">• ${esc(t)}</div>`).join('') : '<div class="vk-ok">Không có gì đáng lo.</div>';
    body.insertAdjacentHTML('afterbegin', `<div class="vk-card"><h3>Cảnh báo</h3>${warnHtml}</div>`);
    const tm = S.core.Kn(c);
    if (tm) {
      const sect = [...body.querySelectorAll('.vk-card')].find((el) => el.querySelector('h3') && el.querySelector('h3').textContent === 'Sư môn');
      if (sect) {
        let extra = '';
        const mi = masterInfo(c); extra += `<div class="vk-row"><span>Sư phụ</span><b>${mi || 'chưa có'}</b></div>`;
        if (has('KS') && tm.capBac === 2) { try { const r = S.core.KS(c); extra += `<div class="vk-row"><span>Xin tiến cử lên Chân truyền</span>${r ? `<span class="vk-bad">${esc(r)}</span>` : '<span class="vk-ok">Được — gặp sư phụ xin tiến cử</span>'}</div>`; } catch {} }
        sect.insertAdjacentHTML('beforeend', extra);
      }
    }
    body.insertAdjacentHTML('beforeend', `<div class="vk-card"><h3>Tự kiểm tra</h3><div class="vk-mu" style="font-size:13px">Chạy thử mọi chức năng với bản game hiện tại. Nếu có dòng LỖI, chụp màn hình gửi Claude.</div><button class="vk-btn" id="vk-st">Tự kiểm tra</button><div id="vk-sto"></div></div>`);
    body.querySelector('#vk-st').onclick = async (ev) => { ev.target.disabled = true; await selfTest(body.querySelector('#vk-sto')); ev.target.disabled = false; };
  }

  // ── Chợ: tìm bộ mua tốt nhất theo ngân sách
  async function comboSearch(prog) {
    const { measured, money } = S.cho;
    const cand = measured.filter((m) => m.gain > 1).slice(0, 5);
    if (cand.length < 2) return null;
    const nv = nvNow(); const nv0 = clone(nv); nv0.kinhMach.manh = [];
    const base = S.cho.base;
    const sets = [];
    for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) { sets.push([cand[i], cand[j]]); for (let k = j + 1; k < cand.length; k++) sets.push([cand[i], cand[j], cand[k]]); }
    const ok = sets.filter((s) => s.reduce((a, m) => a + m.r.price, 0) <= money);
    const res = [];
    for (let i = 0; i < ok.length && !S.abort; i++) {
      const s = ok[i]; const nvX = clone(nv0); s.forEach((m) => { nvX.tuiDo[m.r.it.id] = 1; });
      const r = await anneal({ nv0: nvX, mode: 'bal', iters: 450, init: base.manh, onProg: (f) => prog((i + f) / ok.length, `Thử bộ ${i + 1}/${ok.length}…`) });
      res.push({ s, gain: r.score - base.score, wins: r.wins, n: r.n, cost: s.reduce((a, m) => a + m.r.price, 0) });
    }
    res.sort((a, b) => b.gain - a.gain);
    return { res, singles: cand };
  }

  // ═════════════════════════ BẢN 2.1: ước lượng trận bằng chính hàm của game ═════════════════════════
  const LV = { an_toan: ['Thắng chắc', 'vk-ok', 3], ngang_suc: ['Thắng, bị thương', '', 2], hiem: ['Thua', 'vk-bad', 1], tu_dia: ['Thua nặng (tử địa)', 'vk-bad', 0], unknown: ['Không đoán được', 'vk-mu', 1.5] };
  const lvTag = (r) => { const l = LV[r.level] || LV.unknown; return `<span class="${l[1]}">${l[0]}</span>${r.an ? '<br><span class="vk-mu" style="font-size:11px">(game ghi "không đoán được", tool đánh thử)</span>' : ''}`; };
  const lvRank = (r) => (LV[r.level] || LV.unknown)[2];
  // Mô phỏng mọi trận có thể gặp trong một sự kiện, đúng như game ước lượng (quái, cấp, tiểu cảnh giới, đồng bọn).
  function encThreat(encId, slot, vars, nam) {
    const def = C().encounters.get(encId); if (!def) return null;
    if (!has('Uen')) return null;
    const effs = [];
    const walk = (choices) => (choices || []).forEach((ch) => (ch.effects || []).forEach((ef) => { if (ef && ef.combat !== undefined) effs.push({ ch, ef }); }));
    walk(def.choices); for (const sc of Object.values(def.scenes || {})) walk(sc && sc.choices);
    const out = [], seen = new Set();
    for (const { ch, ef } of effs) {
      const c = ctx(); if (nam !== undefined) c.run.nam = nam;
      c.enc = { id: encId, slot, vars: { ...(vars || {}) }, nodeFlags: {} }; c.noi = slot;
      let r; try { r = S.core.Uen(c, ef.combat, ef); } catch { continue; }
      if (!r) continue;
      const k = (r.enemy || '') + '|' + (r.realm || '');
      if (seen.has(k)) continue; seen.add(k);
      out.push({ ...r, choice: cleanTxt(ch.text) });
    }
    return out;
  }
  const threatHtml = (th) => {
    if (th === null) return '<span class="vk-mu">?</span>';
    if (!th.length) return '<span class="vk-mu">không phải đánh</span>';
    const worst = th.reduce((a, b) => (lvRank(b) < lvRank(a) ? b : a));
    return `${lvTag(worst)}<br><span class="vk-mu" style="font-size:12px">${th.map((x) => `${esc(x.enemy || '?')}${x.realm ? ' · ' + esc(x.realm) : ''}`).join('<br>')}</span>`;
  };
  const threatRank = (th) => (th === null ? 1.5 : !th.length ? 3 : Math.min(...th.map(lvRank)));

  // ── Tab Treo thưởng
  async function scanBoards(maxY, withSect, prog) {
    const K = S.core, c0 = ctx(), run = c0.run, out = [];
    const list = nearSlots(c0, maxY);
    const tm = withSect ? K.Kn(c0) : null;
    // Chỉ những nơi thật sự có "Bảng treo thưởng" (thôn, trấn, thành, kinh đô) — hỏi thẳng game danh sách tiện ích ở nơi đó.
    const g = G(), bEnc = C().encounters.get('ev.bang_treo_thuong'), bTen = bEnc && bEnc.ten || 'Bảng treo thưởng';
    // Điều kiện 1 (bắt buộc): loại địa danh trong dữ liệu game là thôn / trấn / thành / kinh đô (không dựa vào biểu tượng).
    // Điều kiện 2: game xác nhận nơi đó có tiện ích "Bảng treo thưởng" (nếu bản game có hàm này).
    const LOAI_BANG = ['thon', 'tran', 'thanh', 'kinh_do'];
    const hasBoard = (slot) => {
      let dd; try { dd = c0.world.info(slot).diaDanh; } catch { return false; }
      if (!dd || !LOAI_BANG.includes(dd.loai)) return false;
      if (typeof g.facilitiesAt !== 'function') return true;
      try { return (g.facilitiesAt(slot) || []).some((f) => (typeof f === 'string' ? f : (f && (f.ten || f.id)) || '') === bTen || (f && f.id === 'ev.bang_treo_thuong')); } catch { return true; }
    };
    const jobs = list.filter((x) => hasBoard(x.slot)).map((x) => ({ ...x, bang: 'thanh_tran' }));
    if (tm) { let y = 0; try { y = K.mf(c0, tm.slot); } catch {} jobs.unshift({ slot: tm.slot, y, bang: 'tong_mon' }); }
    for (let i = 0; i < jobs.length; i++) {
      if (S.abort) break;
      if (i % 8 === 0) { prog && prog(i / jobs.length, 'Đang xem bảng treo thưởng…'); await sleep0(); }
      const { slot, y, bang } = jobs[i];
      const arrive = run.nam + y;
      const cached = run.noiChon && run.noiChon[slot] && run.noiChon[slot].treoThuong;
      const cA = ctx(); cA.run.nam = arrive;
      let viec; try { viec = K.Rrn(cA, slot, bang); } catch { continue; }
      // Bảng giữ nguyên 1 năm kể từ lần đầu có người xem. Tới gần lúc bảng đổi thì danh sách có thể khác.
      const boardNam = cA.run.noiChon && cA.run.noiChon[slot] && cA.run.noiChon[slot].treoThuong ? cA.run.noiChon[slot].treoThuong.nam : arrive;
      const doiLuc = boardNam + 1, sat = cached && Math.abs(cached.nam + 1 - arrive) < 0.15;
      for (const v of viec || []) {
        let y2 = 0; try { y2 = K.mf(withPlace(cA, slot), v.slot); } catch {}
        out.push({ board: slot, bang, y, v, y2, arrive, doiLuc, sat, d: danger(c0, v.slot), th: null });
      }
    }
    // ước lượng trận (chậm hơn) sau khi đã có danh sách
    for (let i = 0; i < out.length; i++) {
      if (S.abort) break;
      if (i % 4 === 0) { prog && prog(0.5 + 0.5 * i / out.length, 'Đang thử sức từng việc…'); await sleep0(); }
      const r = out[i];
      r.th = encThreat(r.v.enc, r.v.slot, r.v.vars, r.arrive + r.y2);
    }
    return out;
  }
  // Đưa bản đồ của game tới một nơi (dùng camera của bản đồ đang hiển thị)
  function locateSlot(slot) {
    try {
      const m = window.map, w = G().env.world.slot(slot);
      if (!m || !m.cam || !w) throw new Error('no map');
      S.hide && S.hide();
      m.cam.centerOn(w.x, w.y, Math.max(m.cam.scale, (m.cam.fitScale || m.cam.minScale || 1) * 5));
      m.dirty = true;
      // vòng đánh dấu nhấp nháy vài giây trên đúng chỗ đó
      setTimeout(() => {
        try {
          const cv = m.app && (m.app.canvas || m.app.view); const r = cv.getBoundingClientRect();
          const [sx, sy] = m.cam.worldToScreen(w.x, w.y);
          let mk = document.getElementById('vk-mark'); if (mk) mk.remove();
          mk = document.createElement('div'); mk.id = 'vk-mark';
          mk.innerHTML = `<div style="width:44px;height:44px;border:4px solid #c0392b;border-radius:50%;box-shadow:0 0 0 4px rgba(255,255,255,.7);animation:vkpulse 1s infinite"></div><div style="margin-top:4px;background:#7a1f1a;color:#fff;font:600 13px system-ui;padding:3px 8px;border-radius:6px;white-space:nowrap">${esc(G().env.world.info(slot).ten || '')}</div>`;
          mk.style.cssText = `position:fixed;left:${r.left + sx - 22}px;top:${r.top + sy - 22}px;z-index:2147483000;pointer-events:none;display:flex;flex-direction:column;align-items:flex-start`;
          if (!document.getElementById('vk-mark-css')) { const st = document.createElement('style'); st.id = 'vk-mark-css'; st.textContent = '@keyframes vkpulse{0%{transform:scale(.8);opacity:1}100%{transform:scale(1.5);opacity:.3}}'; document.head.appendChild(st); }
          document.body.appendChild(mk);
          const off = () => { mk.remove(); window.removeEventListener('pointerdown', off, true); };
          setTimeout(off, 5000); window.addEventListener('pointerdown', off, true);
        } catch {}
      }, 80);
    } catch { alert('Không điều khiển được bản đồ của game ở bản này.'); }
  }
  function goSlot(slot) {
    try { const m = window.map; if (!m || !m.goTo) throw 0; S.hide && S.hide(); m.goTo(slot); }
    catch { alert('Không ra lệnh đi được ở bản game này; dùng 📍 rồi bấm trên bản đồ.'); }
  }
  function tabTreoThuong() {
    const c = ctx(), run = c.run;
    const taken = (run.viecNhan || []).map((v) => {
      let y = 0; try { y = S.core.mf(c, v.slot); } catch {}
      return { v, y, th: encThreat(v.enc, v.slot, v.vars, run.nam + y), left: v.hetHanNam !== undefined ? v.hetHanNam - run.nam : undefined };
    });
    body.innerHTML = `
    <div class="vk-card"><h3>Việc đang nhận</h3>${taken.length ? `<table class="vk-t"><tr><th>Việc</th><th>Đi</th><th>Sức</th></tr>${taken.map((x) => `<tr><td><b>${esc(cleanTxt(x.v.ten))}</b><br><span class="vk-mu" style="font-size:12px">${esc(placeName(c, x.v.slot))}${x.left !== undefined ? ` · còn <span class="${x.left < x.y ? 'vk-bad' : ''}">${num(x.left)} năm</span>` : ''}${x.v.thuong ? ` · ${x.v.thuong} linh thạch` : ''}${x.v.congHien ? ` · ${x.v.congHien} cống hiến` : ''}</span><br><button class="vk-btn vk-pin0" data-slot="${esc(x.v.slot)}" style="padding:4px 8px;font-size:13px;margin-top:4px;background:#fff;color:#7a1f1a;border:1px solid #7a1f1a">📍 Nơi làm</button></td><td>${yrs(x.y)}</td><td>${threatHtml(x.th)}</td></tr>`).join('')}</table>` : '<div class="vk-mu">Chưa nhận việc nào.</div>'}</div>
    <div class="vk-card"><h3>Bảng treo thưởng quanh đây</h3>
      <div class="vk-mu" style="font-size:13px">Bảng ở thành, trấn, thôn và bảng nhiệm vụ sư môn. Mỗi bảng đổi việc sau 1 năm kể từ lần có người xem; tool tính đúng danh sách bạn sẽ thấy khi tới nơi (theo tốc độ đi của bạn), rồi dùng chính hàm của game để thử sức với từng trận trong việc đó.</div>
      <div style="margin:8px 0"><select class="vk-sel" id="vk-tby"><option value="0.6">Trong 6 tháng đường</option><option value="1.2" selected>Trong 1 năm đường</option><option value="2.5">Trong 2,5 năm đường</option></select>
      <label style="font-size:14px;margin-left:6px"><input type="checkbox" id="vk-tbs" checked> Gồm bảng sư môn</label></div>
      <label style="display:block;font-size:14px;margin-bottom:6px"><input type="checkbox" id="vk-tbw"> Hiện cả việc chưa chắc thắng (mặc định chỉ hiện việc <b>Thắng chắc</b> và tới kịp)</label>
      <button class="vk-btn" id="vk-tb" ${has('Rrn') ? '' : 'disabled'}>Xem bảng</button>${progressHtml('vk-pr8')}<div id="vk-tbo">${has('Rrn') ? '' : needMsg('bảng treo thưởng')}</div></div>
    <div class="vk-mu" style="font-size:12px">"Thắng chắc" = thắng mà không bị thương; "Thắng, bị thương" = thắng nhưng dính thương thế; "Thua nặng" = địch hơn hẳn. Đây là cùng cách game tự đánh giá trước khi vào trận, tính với kinh mạch đang xếp.</div>`;
    const sure = (r) => r.th !== null && (r.th.length === 0 || r.th.every((x) => x.level === 'an_toan'));
    const kip = (r) => !r.sat && r.y2 <= r.v.han * 0.9;
    const pin = (slot, label) => `<button class="vk-btn vk-pin" data-slot="${esc(slot)}" style="padding:4px 8px;font-size:13px;margin:4px 4px 0 0;background:#fff;color:#7a1f1a;border:1px solid #7a1f1a">📍 ${label}</button>`;
    const render = () => {
      const all = S.boards || []; const showAll = body.querySelector('#vk-tbw').checked;
      const val = (r) => ((r.v.thuong || 0) + 3 * (r.v.congHien || 0)) / (0.3 + r.y + r.y2);
      const rows = all.filter((r) => showAll || (sure(r) && kip(r))).sort((a, b) => (b.bang === 'tong_mon') - (a.bang === 'tong_mon') || sure(b) - sure(a) || val(b) - val(a));
      const hidden = all.length - rows.length;
      body.querySelector('#vk-tbo').innerHTML = rows.length ? `<table class="vk-t"><tr><th>Việc</th><th>Thưởng</th><th>Sức</th></tr>${rows.slice(0, 60).map((r) => `<tr><td>${r.bang === 'tong_mon' ? '<span class="vk-ok" style="font-size:12px">SƯ MÔN</span> ' : ''}<b>${esc(cleanTxt(r.v.ten))}</b><br><span class="vk-mu" style="font-size:12px">Nhận ở <b>${esc(placeName(c, r.board))}</b>${(() => { try { const l = c.world.info(r.board).diaDanh.loai; return ' <span style="font-size:11px">[' + ({ thon: 'thôn', tran: 'trấn', thanh: 'thành', kinh_do: 'kinh đô', tong_mon: 'tông môn' }[l] || l) + ']</span>'; } catch { return ''; } })()} (đi ${yrs(r.y)}, tới năm ${num(r.arrive)}; bảng giữ tới năm ${num(r.doiLuc)}) → làm ở ${esc(placeName(c, r.v.slot))} (+${yrs(r.y2)}, ${dangerTag(r.d)}) · hạn ${r.v.han} năm sau khi nhận${r.y2 > r.v.han ? ' <span class="vk-bad">không kịp hạn</span>' : r.y2 > r.v.han * 0.9 ? ' <span class="vk-bad">sát hạn</span>' : ''}${r.sat ? ' <span class="vk-bad">tới đúng lúc bảng đổi, có thể không còn</span>' : ''}</span><br>${pin(r.board, 'Nơi nhận')}${r.v.slot !== r.board ? pin(r.v.slot, 'Nơi làm') : ''}<button class="vk-btn vk-go" data-slot="${esc(r.board)}" style="padding:4px 8px;font-size:13px;margin:4px 0 0">Đi tới nơi nhận</button></td><td>${r.v.thuong ? `<b>${r.v.thuong}</b> lt` : ''}${r.v.congHien ? `<br>${r.v.congHien} cống hiến` : ''}${r.v.danhVong ? '<br><span class="vk-mu" style="font-size:12px">+danh vọng</span>' : ''}</td><td>${threatHtml(r.th)}</td></tr>`).join('')}</table><div class="vk-mu" style="font-size:12px">${hidden && !showAll ? `Đã ẩn ${hidden} việc không chắc thắng, không kịp hạn hoặc tới đúng lúc bảng đổi. ` : ''}Chỉ quét bảng ở thôn, trấn, thành, kinh đô và Điện nhiệm vụ tông của bạn. Nhận tối đa 3 việc cùng lúc. Bỏ việc giữa chừng bị trừ danh vọng / cống hiến. 📍 = đóng Trợ lý và đưa bản đồ tới nơi đó. (Tool ${TOOL_VER})</div>` : `<div class="vk-mu">Không có việc nào vừa thắng chắc vừa tới kịp${hidden ? ` (đã ẩn ${hidden} việc)` : ''}. Thử nới bán kính, hoặc tích "Hiện cả việc chưa chắc thắng".</div>`;
      body.querySelectorAll('#vk-tbo .vk-pin').forEach((b) => (b.onclick = () => locateSlot(b.dataset.slot)));
      body.querySelectorAll('#vk-tbo .vk-go').forEach((b) => (b.onclick = () => goSlot(b.dataset.slot)));
    };
    body.querySelectorAll('.vk-pin0').forEach((b) => (b.onclick = () => locateSlot(b.dataset.slot)));
    if (S.boards) render();
    body.querySelector('#vk-tbw').onchange = () => S.boards && render();
    body.querySelector('#vk-tb').onclick = async (ev) => {
      ev.target.disabled = true; S.abort = false;
      const prog = bindProgress(body.querySelector('#vk-pr8'));
      try { S.boards = await scanBoards(+body.querySelector('#vk-tby').value, body.querySelector('#vk-tbs').checked, prog); body.querySelector('#vk-pr8').style.display = 'none'; render(); }
      catch (e) { body.querySelector('#vk-tbo').innerHTML = errBox(e); }
      ev.target.disabled = false;
    };
  }
  // tìm quái theo tên, không phân biệt dấu
  const fold = (x) => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();


  // ═════════════════════════ BẢN 2.3: Đồ nên săn + Đồ trong game ═════════════════════════
  const NOT_SHOP = { chi_luyen: 'chỉ luyện chế', chi_khai_bao: 'chỉ có trong bí cảnh / rương', di_bao: 'dị bảo', nghich_thien: 'nghịch thiên', tong_mon: 'đổi ở tông môn', khong_nguon: 'không rõ nguồn', noi_bo: 'nội bộ tông' };
  function sourceNote(it) {
    const out = [];
    for (const t of it.tag || []) if (NOT_SHOP[t]) out.push(NOT_SHOP[t]);
    if (it.theo_kiep) out.push('giữ qua kiếp sau');
    if (it.tran_phai) out.push('chỉ phái riêng');
    if (it.xuat_xu) out.push('đặc sản vùng');
    if (it.dia_hinh && it.dia_hinh.length) out.push('mọc/có ở: ' + it.dia_hinh.map((d) => ({ son_mach: 'núi', rung_ram: 'rừng', ho_nuoc: 'đầm hồ', hoang_mac: 'hoang mạc', hoang_nguyen: 'đồng hoang' })[d] || d).join(', '));
    return out;
  }
  const shopable = (it) => it.gia > 0 && !it.theo_kiep && it.loai !== 'lenh_bai' && !(it.tag || []).some((t) => NOT_SHOP[t]);

  // ── Tab Đồ nên săn: cả game, hợp linh căn & kinh mạch, đo lợi thật
  function fitElem(it, nv) {
    const km = nv.kinhMach, open = km.mau.filter((m, i) => km.trangThai[i] !== 'an');
    const share = (h) => open.filter((m) => m === h).length / Math.max(1, open.length);
    const lc = new Set((nv.linhCan && nv.linhCan.he) || []);
    const hs = it.he && it.he.length ? it.he : ['vo_sac'];
    let s = 0;
    for (const h of hs) { s += share(h) * 2 + (lc.has(h) ? 1 : 0) + (h === 'vo_sac' ? 0.4 : 0); }
    return s / hs.length;
  }
  function quickGain(nv, baseManh, id) {
    const K = S.core, Cc = C();
    const nv0 = clone(nv); nv0.kinhMach.manh = baseManh.map((m) => ({ ...m })); nv0.tuiDo[id] = 1;
    const sc = (manh) => { const n2 = clone(nv0); n2.kinhMach.manh = manh; const R = K.Rt(n2, Cc); const uy = (R.chieu || []).reduce((a, x) => a + (x.uyLuc || 0) / 10, 0); return R.linhLuc + 6 * (R.biDong.toc_do || 0) + 4 * (R.biDong.dot_pha || 0) + uy - 3 * (R.diemNghich || 0) - 50 * R.manh.filter((m) => m && !m.thong).length; };
    const base = sc(nv0.kinhMach.manh);
    const it = Cc.items.get(id), g = K.xo(Cc, nv0), seen = new Set();
    let best = -Infinity, bestManh = null;
    for (let xoay = 0; xoay < 4; xoay++) for (let y = 0; y < g.cao; y++) for (let x = 0; x < g.rong; x++) {
      const m = { item: id, x, y, xoay };
      const cells = K.al(g, m, it); if (!cells) continue;
      const ck = [...cells].sort((a, b) => a - b).join(','); if (seen.has(ck)) continue; seen.add(ck);
      // chèn vào ô trống, hoặc thay một món đang chiếm
      const hit = nv0.kinhMach.manh.map((p, i) => ((K.al(g, p, Cc.items.get(p.item)) || []).some((c) => cells.includes(c)) ? i : -1)).filter((i) => i >= 0);
      if (hit.length > 3) continue;
      const manh = nv0.kinhMach.manh.filter((p, i) => !hit.includes(i));
      const nvT = clone(nv0); nvT.kinhMach.manh = manh.map((p) => ({ ...p }));
      let err; try { err = K.Jh(nvT, Cc, m); } catch { err = 'x'; }
      if (err) continue;
      manh.push(m);
      const v = sc(manh) - base; if (v > best) { best = v; bestManh = manh; }
    }
    return { q: best, manh: bestManh };
  }
  // ── Bí cảnh: lịch mở, loại, đồ rơi, sức đánh
  const TC_TEN = { co_duyen: 'cơ duyên', nguy_hiem: 'nguy hiểm', nhan_qua: 'nhân quả', ky_van: 'kỳ vận' };
  function bcLoot(def, vars, cg) {
    const out = [], seen = new Set(); let lt = 0, ho = 0;
    const condOk = (cond) => {
      if (!cond || cond === 'won') return true;
      const list = cond.all || (Array.isArray(cond) ? cond : [cond]);
      return list.every((x) => { if (!x || typeof x !== 'object' || x.canh_gioi === undefined) return true; const m = /^(==|>=|<=|>|<)\s*(\d+)/.exec(String(x.canh_gioi)); if (!m) return true; const v = +m[2]; return { '==': cg === v, '>=': cg >= v, '<=': cg <= v, '>': cg > v, '<': cg < v }[m[1]]; });
    };
    const walkEff = (ef) => {
      if (!ef || typeof ef !== 'object') return;
      if (ef.linh_thach && ef.linh_thach.bac) lt += ef.linh_thach.bac;
      if (ef.roi_ho) ho++;
      let id = null;
      if (typeof ef.roi_quy === 'string' && condOk(ef.if)) id = ef.roi_quy;
      if (typeof ef.add_item === 'string') { const m = /^\{(\w+)\}$/.exec(ef.add_item); id = m ? vars && vars[m[1]] : ef.add_item; if (m && !id) out.push({ txt: 'một món theo cảnh giới' }); }
      if (id && typeof id === 'string' && !seen.has(id)) { seen.add(id); const it = C().items.get(id); if (it) out.push({ it, quy: !!ef.roi_quy }); }
    };
    const walk = (choices) => (choices || []).forEach((ch) => [ch.effects, ch.success, ch.failure].forEach((l) => (l || []).forEach(walkEff)));
    walk(def.choices); for (const sc of Object.values(def.scenes || {})) walk(sc && sc.choices);
    return { items: out, lt, ho };
  }
  async function scanBiCanh(prog) {
    const K = S.core, c0 = ctx(), run = c0.run, nv = run.nhanVat;
    const slots = c0.world.slots.filter((x) => !x.an).map((x) => x.id);
    const found = [];
    for (let i = 0; i < slots.length; i++) {
      if (i % 150 === 0) { prog(0.4 * i / slots.length, 'Tìm bí cảnh trên bản đồ…'); await sleep0(); }
      let lich; try { lich = K.bcLich(c0, run, slots[i]); } catch { continue; }
      if (lich) found.push({ slot: slots[i], lich });
    }
    const out = [];
    for (let k = 0; k < found.length; k++) {
      const b = found[k]; prog(0.4 + 0.6 * k / Math.max(1, found.length), `Xem bí cảnh ${k + 1}/${found.length}…`); await sleep0();
      let def; try { def = K.bcLoai(c0, run, b.slot); } catch {}
      if (!def) continue;
      let y = Infinity; try { y = K.mf(c0, b.slot); } catch {}
      if (!isFinite(y)) continue;
      const arrive = run.nam + y;
      const cA = ctx(); cA.run.nam = arrive;
      let la = b.lich; try { la = K.bcLich(cA, cA.run, b.slot) || la; } catch {}
      const entered = run.noiChon && run.noiChon[b.slot] && run.noiChon[b.slot].enteredCycle;
      const vaoNgay = la.open && entered !== la.cycle;
      const moLuc = vaoNgay ? arrive : (la.open ? la.opensAt + la.period : la.opensAt);
      const dongLuc = vaoNgay ? la.closesAt : moLuc + (la.closesAt - la.opensAt);
      let cam = null; try { cam = K.bcVao(def, nv.canhGioi) || null; } catch {}
      let vars = null; try { const cV = ctx(); cV.run.nam = arrive; cV.noi = b.slot; vars = K.bcVars(cV, def, b.slot, {}); } catch {}
      let th = null; try { th = vars ? encThreat(def.id, b.slot, vars, arrive) : null; } catch {}
      out.push({ slot: b.slot, def, y, arrive, vaoNgay, moLuc, dongLuc, period: la.period, nowOpen: b.lich.open, nowClose: b.lich.closesAt, cam, th, loot: bcLoot(def, vars, nv.canhGioi) });
    }
    return out;
  }
  // Từng trận theo thứ tự đi sâu: biết đánh tới đâu thì nên rút ra (bí cảnh cho rút ra giữa chừng, mang theo đồ đã gom)
  function bcThreatHtml(th) {
    if (th === null) return '<span class="vk-mu">?</span>';
    if (!th.length) return '<span class="vk-mu">không phải đánh</span>';
    let firstBad = th.findIndex((x) => lvRank(x) < 2);
    const head = firstBad < 0 ? lvTag(th.reduce((a, b) => (lvRank(b) < lvRank(a) ? b : a))) : firstBad === 0 ? '<span class="vk-bad">Trận đầu đã khó</span>' : `<span class="vk-ok">Qua được ${firstBad}/${th.length} trận</span>`;
    return `${head}<br><span style="font-size:12px">${th.map((x, i) => `${i + 1}. ${esc(x.enemy || '?')}${x.realm ? ' · ' + esc(x.realm) : ''}: ${lvTag(x)}`).join('<br>')}</span>`;
  }
  function biCanhHtml(list, nv) {
    const c = ctx();
    const ok = (b) => !b.cam;
    const rows = list.slice().sort((a, b) => ok(b) - ok(a) || (a.moLuc - b.moLuc) || threatRank(b.th) - threatRank(a.th));
    return `<table class="vk-t">${rows.map((b) => {
      const tc = ((b.def.tags && b.def.tags.tinh_chat) || []).map((x) => TC_TEN[x] || x).join(', ');
      const cgR = (b.def.tags && b.def.tags.canh_gioi) || [0, 5];
      const when = b.vaoNgay ? `<span class="vk-ok">tới là vào được</span> (tới năm ${num(b.arrive)}, đóng năm ${num(b.dongLuc)})` : `tới năm ${num(b.arrive)}, <b>mở năm ${num(b.moLuc)} – ${num(b.dongLuc)}</b> (còn ${num(Math.max(0, b.moLuc - c.run.nam))} năm nữa)`;
      const items = b.loot.items.map((x) => x.it ? `${esc(x.it.ten)}${x.it.pham_cap ? ' <span class="vk-mu">(' + (PHAM_TEN[(x.it.pham_cap || 1) - 1] || '') + ')</span>' : ''}${x.quy ? '' : ' <span class="vk-mu">(ví dụ)</span>'}` : esc(x.txt));
      if (b.loot.ho) items.push('nguyên liệu rơi từ quái');
      if (b.loot.lt) items.push('linh thạch');
      return `<tr><td><b>${esc(b.def.ten)}</b> <span class="vk-mu" style="font-size:12px">ở ${esc(placeName(c, b.slot))} · đi ${yrs(b.y)}</span><br>
        <span style="font-size:13px">${when}</span><br>
        <span class="vk-mu" style="font-size:12px">${b.nowOpen ? `Đang mở tới năm ${num(b.nowClose)}. ` : ''}Cứ khoảng ${Math.round(b.period)} năm mở một lần. Cho ${esc(realmName(cgR[0]))} – ${esc(realmName(cgR[1]))}${tc ? ' · ' + esc(tc) : ''}.</span>
        ${b.cam ? `<br><span class="vk-bad" style="font-size:13px">${esc(b.cam)}</span>` : ''}
        <br><span style="font-size:13px">Đồ: ${items.join(', ') || 'không rõ'}</span>
        <br><button class="vk-btn vk-pin" data-slot="${esc(b.slot)}" style="padding:4px 8px;font-size:13px;margin:4px 4px 0 0;background:#fff;color:#7a1f1a;border:1px solid #7a1f1a">📍 Xem trên bản đồ</button><button class="vk-btn vk-go" data-slot="${esc(b.slot)}" style="padding:4px 8px;font-size:13px;margin:4px 0 0">Đi tới</button></td>
        <td style="min-width:110px">${b.cam ? '<span class="vk-mu">không vào được</span>' : bcThreatHtml(b.th)}</td></tr>`;
    }).join('')}</table><div class="vk-mu" style="font-size:12px">Lịch mở và loại bí cảnh tính bằng chính code game. Quái và món "(ví dụ)" là một lần rút thử: mỗi lần vào game rút lại nên có thể khác, cùng mức cảnh giới. Món không ghi "(ví dụ)" là phần thưởng cố định cho cảnh giới của bạn khi phá tới cuối. Mỗi kỳ mở chỉ vào được một lần. Trận đánh xếp theo thứ tự đi sâu; trong bí cảnh có lựa chọn "Rút ra, mang theo đồ đã gom" — đánh tới trận cuối còn thắng thì rút.</div>`;
  }
  function tabSan() {
    const nv = nvNow(), Cc = C();
    body.innerHTML = `
    <div class="vk-card"><h3>Bí cảnh: khi nào, ở đâu, có gì</h3>
      <div class="vk-mu" style="font-size:13px">Tìm mọi bí cảnh bạn đi tới được: lịch mở (tính cả thời gian đi), loại bí cảnh, đồ có thể lấy, và đánh với quái bên trong có thắng không. Bấm 📍 để bản đồ chạy tới chỗ đó.</div>
      ${has('bcLich', 'bcLoai') ? `<button class="vk-btn" id="vk-bcg" style="margin-top:8px">Tìm bí cảnh</button>${progressHtml('vk-prbc')}<div id="vk-bco">${S.bcHtml || ''}</div>` : '<div class="vk-mu">Bản game này tool chưa đọc được lịch bí cảnh.</div>'}</div>
    <div class="vk-card"><h3>Đồ nên săn (cả game)</h3>
      <div class="vk-mu" style="font-size:13px">Tool xét <b>mọi</b> công pháp và pháp khí bạn dùng được ở cảnh giới hiện tại, ưu tiên món hợp linh căn (${esc(((nv.linhCan && nv.linhCan.he) || []).map(heTen).join(', '))}) và màu kinh mạch, thử từng món vào kinh mạch rồi đánh trận mẫu để đo lợi thật. Không cần món đó đang bày ở chợ.</div>
      <div style="margin:8px 0"><select class="vk-sel" id="vk-sb"><option value="1">Giá ≤ linh thạch đang có (${Math.floor(nv.linhThach || 0)})</option><option value="2" selected>Giá ≤ 2 lần số đang có</option><option value="5">Giá ≤ 5 lần</option><option value="0">Không giới hạn giá</option></select></div>
      <label style="display:block;font-size:14px;margin-bottom:6px"><input type="checkbox" id="vk-ss" checked> Chỉ món mua được ở tiệm (bỏ món chỉ luyện chế, chỉ có trong bí cảnh, dị bảo, đồ tông môn)</label>
      <button class="vk-btn" id="vk-sg">Tìm đồ</button>${progressHtml('vk-pr9')}<div id="vk-so">${S.san || ''}</div></div>`;
    const bindBc = () => { body.querySelectorAll('#vk-bco .vk-pin').forEach((b) => (b.onclick = () => locateSlot(b.dataset.slot))); body.querySelectorAll('#vk-bco .vk-go').forEach((b) => (b.onclick = () => goSlot(b.dataset.slot))); };
    bindBc();
    const bcg = body.querySelector('#vk-bcg');
    if (bcg) bcg.onclick = async () => {
      bcg.disabled = true; const prog = bindProgress(body.querySelector('#vk-prbc'));
      try { const list = await scanBiCanh(prog); body.querySelector('#vk-prbc').style.display = 'none'; S.bcHtml = list.length ? biCanhHtml(list, nv) : '<div class="vk-mu">Không tìm thấy bí cảnh nào đi tới được.</div>'; body.querySelector('#vk-bco').innerHTML = S.bcHtml; bindBc(); }
      catch (e) { console.error(e); body.querySelector('#vk-bco').innerHTML = errBox(e); }
      bcg.disabled = false;
    };
    body.querySelector('#vk-sg').onclick = async (ev) => {
      ev.target.disabled = true; S.abort = false;
      const prog = bindProgress(body.querySelector('#vk-pr9'));
      try {
        const mult = +body.querySelector('#vk-sb').value, onlyShop = body.querySelector('#vk-ss').checked;
        const money = nv.linhThach || 0, cap = mult ? Math.max(50, money * mult) : Infinity;
        const cands = [...Cc.items.values()].filter((it) => (it.loai === 'cong_phap' || it.loai === 'phap_khi') && it.hinh && (it.canh_gioi ?? 0) <= nv.canhGioi && !(nv.tuiDo[it.id] > 0) && (!onlyShop || shopable(it)) && (it.gia || 0) <= cap && !(it.tag || []).includes('ma') && !(it.tag || []).includes('nghich'));
        // 1) xếp hiện tại làm nền
        prog(0.02, 'Lấy cách xếp nền…');
        const nv0 = clone(nv); nv0.kinhMach.manh = [];
        const base = await anneal({ nv0, mode: 'bal', iters: 700, init: nv.kinhMach.manh, onProg: (f) => prog(0.02 + 0.13 * f, 'Lấy cách xếp nền…') });
        // 2) lọc nhanh bằng hệ số kinh mạch (giữ 80 món hợp hệ / phẩm cao nhất)
        cands.sort((a, b) => (fitElem(b, nv) + 0.25 * (b.pham_cap || 0) + 0.6 * (b.canh_gioi ?? 0)) - (fitElem(a, nv) + 0.25 * (a.pham_cap || 0) + 0.6 * (a.canh_gioi ?? 0)));
        const nAll = cands.length; cands.splice(80);
        const quick = [];
        for (let i = 0; i < cands.length && !S.abort; i++) {
          if (i % 6 === 0) { prog(0.15 + 0.35 * i / cands.length, `Thử nhanh ${i}/${cands.length} món…`); await sleep0(); }
          const it = cands[i]; let q = -Infinity, manh = null; try { ({ q, manh } = quickGain(nv, base.manh, it.id)); } catch {}
          if (manh) quick.push({ it, q, manh, fit: fitElem(it, nv) });
        }
        quick.sort((a, b) => (b.q + 3 * b.fit) - (a.q + 3 * a.fit));
        const top = quick.filter((x) => x.q > 0.01).slice(0, 12);
        for (const x of quick) { if (top.length >= 10) break; if (!top.includes(x)) top.push(x); }
        // 3) đo thật bằng trận mẫu
        const res = [];
        for (let k = 0; k < top.length && !S.abort; k++) {
          const x = top[k]; const nvX = clone(nv0); nvX.tuiDo[x.it.id] = 1;
          const r = await anneal({ nv0: nvX, mode: 'bal', iters: 500, init: x.manh, onProg: (f) => prog(0.5 + 0.5 * (k + f) / top.length, `Đo ${x.it.ten}…`) });
          const r2 = stripDead(nvX, r, 'bal');
          res.push({ ...x, gain: r2.score - base.score, wins: r2.wins, n: r2.n });
        }
        res.sort((a, b) => b.gain - a.gain);
        body.querySelector('#vk-pr9').style.display = 'none';
        const good = res.filter((x) => x.gain > 1);
        const html = good.length ? `<div class="vk-mu" style="font-size:13px;margin:6px 0">Mốc hiện tại: thắng ${base.wins}/${base.n} trận mẫu. Đã xét ${nAll} món, đo kỹ ${res.length} món hứa hẹn nhất.</div><table class="vk-t"><tr><th>Món</th><th>Giá</th><th>Lợi</th></tr>${good.map((x) => {
          const where = whereToGet(x.it.id); const src = sourceNote(x.it);
          return `<tr><td><b>${esc(x.it.ten)}</b><br><span class="vk-mu" style="font-size:12px">${esc((x.it.he || ['vo_sac']).map(heTen).join('/'))} · phẩm ${x.it.pham_cap} · ${itemDesc(x.it)}${src.length ? '<br>' + esc(src.join(' · ')) : ''}${where ? '<br>Có ở: ' + where : ''}</span></td><td>~${x.it.gia}${x.it.gia > (nv.linhThach || 0) ? '<br><span class="vk-bad" style="font-size:12px">chưa đủ tiền</span>' : ''}</td><td class="vk-ok">+${Math.round(x.gain)}<br><span class="vk-mu" style="font-size:12px">${x.wins}/${x.n} thắng</span></td></tr>`;
        }).join('')}</table><div class="vk-mu" style="font-size:12px">"Lợi" = điểm sức mạnh tăng thêm sau khi tool xếp lại kinh mạch có món đó (tính cả thắng trận, linh lực hồi, tu luyện, đột phá). Món có "Tàng Kinh Các" thì đổi bằng cống hiến, không tốn linh thạch.<br>Giá là giá gốc; ở tiệm thật lệch theo nơi (gần vùng sản sinh rẻ hơn). Muốn biết chỗ nào đang bán: quét tab Chợ quanh đây rồi quay lại đây.</div>` : `<div class="vk-mu">Không món nào mạnh hơn rõ rệt so với đồ đang có${mult ? ' trong tầm giá này. Thử nới giới hạn giá.' : '. Kinh mạch hiện tại đã dùng tốt đồ đang có; muốn mạnh thêm cần mở thêm ô kinh mạch.'}</div>`;
        S.san = html; body.querySelector('#vk-so').innerHTML = html;
      } catch (e) { body.querySelector('#vk-so').innerHTML = errBox(e); }
      ev.target.disabled = false;
    };
  }

  // ── Tab Đồ trong game: danh mục theo công dụng
  const DUNG_TXT = (d) => {
    const k = Object.keys(d)[0], v = d[k];
    const f = {
      heal: () => `chữa ${v} bậc thương thế`, tho_nguyen: () => `+${v} năm thọ`, tam_ma: () => `giảm ${Math.abs(v)} tâm ma`, tu_vi: () => `tăng tu vi (mức ${v})`,
      pha_binh_canh: () => `phá bình cảnh ${realmName(v.canh_gioi)}`, duong_pham: () => `nâng phẩm đạo cơ ${realmName(v.canh_gioi)} (${v.nam} năm)`,
      unlock_cell: () => `+${v} lượt khai thông kinh mạch`, recolor_cell: () => `đổi màu ${v} ô kinh mạch theo linh căn`, heal_cell: () => `chữa ô kinh mạch tổn`,
      stat: () => Object.entries(v).map(([a, b]) => `${({ than_thuc: 'thần thức', ngo_tinh: 'ngộ tính', than_phap: 'thân pháp', can_cot: 'căn cốt', dao_tam: 'đạo tâm', khi_van: 'khí vận' })[a] || a} +${b}`).join(', '),
      dung_truyen_tong_phu: () => `truyền tống tới trận đã biết, tầm ${v.tam}`, do_duong: () => 'dò đường quanh vùng', tranh_hiem: () => 'tránh nguy hiểm', truyen_am: () => 'truyền âm',
      tu_luyen: () => `tu luyện ×${v.he_so} trong ${v.nam} năm`, heal_breakthrough_scar: () => 'chữa vết thương do đột phá hụt',
    }[k];
    return f ? f() : k;
  };
  function itemFull(it) {
    const out = [];
    const d = itemDesc(it); if (d) out.push(d);
    if (it.dot_pha && it.dot_pha.pham) out.push(`đột phá ra phẩm cao hơn ${it.dot_pha.pham} bậc`);
    if (it.dot_pha && it.dot_pha.ti_le) out.push(`+${pct(it.dot_pha.ti_le || 0)} tỉ lệ đột phá${it.dot_pha.canh_gioi !== undefined ? ' lên ' + realmName(it.dot_pha.canh_gioi) : ''}${it.dot_pha.tam_ma ? ', +' + it.dot_pha.tam_ma + ' tâm ma' : ''}`);
    if (it.tu_luyen) out.push(`+${pct(it.tu_luyen.toc_do)} tu luyện trong ${it.tu_luyen.nam} năm${it.tu_luyen.canh_gioi !== undefined ? ' (' + realmName(it.tu_luyen.canh_gioi) + ')' : ''}`);
    for (const dd of it.dung || []) if (dd && typeof dd === 'object') out.push(DUNG_TXT(dd));
    if (it.tran) out.push('trong trận: ' + Object.entries(it.tran).map(([k, v]) => ({
      khi_huyet: () => `hồi ${pct(v)} khí huyết`, linh_luc: () => `hồi ${v} linh lực`, bo_chay: () => `bỏ chạy chắc hơn (${typeof v === 'number' && v <= 1 ? pct(v) : v})`,
      chieu: () => `tung đòn uy lực ${v.uy}`, bao_phat: () => 'bạo phát', khong_che: () => `khống chế địch ${v} lượt`, thuan: () => `khiên ${pct(v)} khí huyết`, thuong_the: () => `chữa ${v} bậc thương thế`,
    })[k]?.() || k).join(', '));
    if (it.loai === 'phuong_tien') out.push(`tốc độ đi ×${it.di_lai}${it.tam ? ', tầm ' + it.tam : ''}${it.bay ? ', bay' : ''}${it.vuot_bien ? ', vượt biển' : ''}${it.bo_chay !== undefined ? ', thời gian bỏ chạy ×' + it.bo_chay : ''}${it.phuc_kich !== undefined ? ', bị phục kích ×' + it.phuc_kich : ''}${it.duoi_theo ? ', đuổi theo +' + pct(it.duoi_theo) : ''}`);
    if (it.tru_vat) out.push(`+${it.tru_vat} ô túi`);
    if (it.noi_tai && it.loai !== 'cong_phap' && it.loai !== 'phap_khi') out.push(Object.entries(it.noi_tai).map(([k, v]) => ({ gia_mua: `giá mua ×${v}`, gia_ban: `giá bán ×${v}`, nhin_hang: 'xem hàng tiệm từ xa', luyen_dan_them: `+${v} viên mỗi lò` })[k] || `${k} ${v}`).join(', '));
    if (it.loai === 'dung_cu') out.push(`${({ luyen_dan: 'đan lô', luyen_bao: 'khí lô', che_phu: 'phù bút' })[it.dung_cu] || it.dung_cu} phẩm ${it.pham_cap}`);
    if (it.di_hoa) out.push(`dị hỏa +${it.di_hoa} điểm luyện chế, trang bị thì chiêu hệ ${(it.he && it.he.length ? it.he : ['hoa']).map(heTen).join('/')} +${DIHOA_PCT[(it.pham_cap || 1) - 1] || 0}%`);
    if (typeof it.khuon === 'string' && it.khuon.startsWith('enemy.')) { const en = C().enemies.get(it.khuon); if (en) out.push(`${it.loai === 'trung_thu' ? 'nở ra' : 'luyện ra'}: ${en.ten}`); }
    if (it.ngu_linh && it.ngu_linh.o) out.push(`mở ${it.ngu_linh.o} ô ${({ thu: 'thú', khoi_loi: 'khôi lỗi', trung: 'cổ trùng', thi: 'thi khôi', hon: 'quỷ hồn' })[it.ngu_linh.loai] || 'linh vật'}`);
    if (it.loai === 'don_phuong' && it.day) { const dp = C().donPhuong.get(it.day); const raId = dp && (dp.ra || dp.san_pham || dp.ket_qua); const ra = raId && C().items.get(typeof raId === 'object' ? raId.id : raId); if (ra) out.push(`dạy ${({ luyen_dan: 'luyện', luyen_bao: 'luyện', che_phu: 'chế' })[dp.nghe] || 'làm'} ${ra.ten}${dp.chu ? ' (cần ' + dp.chu.map((x) => (C().items.get(x.id)?.ten || x.id) + ' ×' + x.so).join(', ') + (dp.linh_thach ? ', ' + dp.linh_thach + ' linh thạch' : '') + ')' : ''}`); else if (dp && dp.ten) out.push('dạy ' + dp.ten); }
    return out.join(' · ').replace(/\+-/g, '-').replace(/(\d)\.(\d)/g, '$1,$2');
  }
  function categorize(it) {
    const dung = JSON.stringify(it.dung || '');
    if (it.loai === 'cong_phap') return it.chieu ? 'Đấu pháp (công pháp có chiêu)' : 'Tâm pháp (tu luyện, bị động)';
    if (it.loai === 'phap_khi') return it.chieu ? 'Pháp khí chiến đấu' : 'Pháp bảo bị động (giáp, ngọc…)';
    if (it.loai === 'dan_duoc') {
      if (it.dot_pha) return 'Đan tăng tỉ lệ đột phá';
      if (dung.includes('pha_binh_canh')) return 'Đan phá bình cảnh';
      if (dung.includes('tho_nguyen')) return 'Đan tăng thọ';
      if (dung.includes('_cell')) return 'Đan kinh mạch (khai thông, đổi màu)';
      if (dung.includes('duong_pham')) return 'Đan nâng phẩm đạo cơ';
      if (it.tu_luyen || dung.includes('"tu_vi"') || dung.includes('"tu_luyen"')) return 'Đan tăng tu luyện / tu vi';
      if (dung.includes('"heal')) return 'Đan chữa thương';
      if (dung.includes('tam_ma')) return 'Đan giảm tâm ma';
      if (dung.includes('"stat"')) return 'Đan tăng chỉ số';
      if (dung.includes('truyen_tong') || dung.includes('do_duong') || dung.includes('tranh_hiem') || dung.includes('truyen_am')) return 'Đi lại (phương tiện)';
      if (it.tran) return 'Đan dùng trong trận';
      return 'Đan khác';
    }
    if (it.loai === 'phuong_tien') return 'Đi lại (phương tiện)';
    if (it.loai === 'tru_vat') return 'Túi trữ vật';
    if (it.loai === 'dung_cu') return it.dung_cu === 'luyen_dan' ? 'Đan lô' : it.dung_cu === 'luyen_bao' ? 'Khí lô' : 'Phù bút';
    if (it.loai === 'di_hoa') return 'Dị hỏa';
    if (it.loai === 'phu_luc') return 'Phù lục';
    if (it.loai === 'don_phuong') return 'Đơn phương (công thức)';
    if (it.loai === 'linh_duoc') return 'Linh dược';
    if (it.loai === 'yeu_tai') return 'Yêu tài';
    if (it.loai === 'nguyen_lieu') return 'Nguyên liệu';
    if (it.loai === 'dac_san') return 'Đặc sản vùng';
    if (it.loai === 'lenh_bai') return 'Lệnh bài';
    return 'Khác';
  }
  const CAT_ORDER = ['Tâm pháp (tu luyện, bị động)', 'Đấu pháp (công pháp có chiêu)', 'Pháp khí chiến đấu', 'Pháp bảo bị động (giáp, ngọc…)', 'Đan tăng tỉ lệ đột phá', 'Đan tăng tu luyện / tu vi', 'Đan phá bình cảnh', 'Đan tăng thọ', 'Đan chữa thương', 'Đan giảm tâm ma', 'Đan nâng phẩm đạo cơ', 'Đan tăng chỉ số', 'Đan kinh mạch (khai thông, đổi màu)', 'Đan dùng trong trận', 'Đan khác', 'Đi lại (phương tiện)', 'Túi trữ vật', 'Đan lô', 'Khí lô', 'Phù bút', 'Dị hỏa', 'Phù lục', 'Đơn phương (công thức)', 'Linh dược', 'Yêu tài', 'Nguyên liệu', 'Đặc sản vùng', 'Lệnh bài', 'Khác'];
  function tabDoGame() {
    const nv = nvNow(), Cc = C();
    body.innerHTML = `
    <div class="vk-card"><h3>Đồ trong game</h3>
      <input class="vk-sel" id="vk-dq" style="width:100%" placeholder="Gõ tên hoặc công dụng (không cần dấu): tho, dot pha, lo, kiem…" autocomplete="off">
      <div style="margin-top:6px;font-size:14px"><label><input type="checkbox" id="vk-dr"> Chỉ món dùng được ở cảnh giới hiện tại</label> · <label><input type="checkbox" id="vk-do"> Chỉ món đang có</label></div>
      <div class="vk-mu" style="font-size:12px;margin-top:4px">${Cc.items.size} món. Bấm vào nhóm để mở. Chữ "có" = đang có trong túi.</div></div>
    <div id="vk-dl"></div>`;
    const all = [...Cc.items.values()].map((it) => ({ it, cat: categorize(it), key: fold(it.ten + ' ' + it.id) }));
    const draw = () => {
      const q = fold(body.querySelector('#vk-dq').value).trim(), onlyRealm = body.querySelector('#vk-dr').checked, onlyOwn = body.querySelector('#vk-do').checked;
      const groups = new Map();
      for (const x of all) {
        if (onlyRealm && (x.it.canh_gioi ?? 0) > nv.canhGioi) continue;
        if (onlyOwn && !(nv.tuiDo[x.it.id] > 0)) continue;
        if (q && !x.key.includes(q) && !fold(x.cat).includes(q) && !(q.length >= 3 && fold(itemFull(x.it)).includes(q))) continue;
        if (!groups.has(x.cat)) groups.set(x.cat, []); groups.get(x.cat).push(x.it);
      }
      const cats = [...groups.keys()].sort((a, b) => CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b));
      body.querySelector('#vk-dl').innerHTML = cats.map((cat) => `<details class="vk-card" ${q ? 'open' : ''} data-cat="${esc(cat)}"><summary><b>${esc(cat)}</b> <span class="vk-mu">· ${groups.get(cat).length}</span></summary><div class="vk-cl"></div></details>`).join('') || '<div class="vk-card vk-mu">Không thấy món nào.</div>';
      body.querySelectorAll('#vk-dl details').forEach((el) => {
        const fill = () => {
          if (el.dataset.done) return; el.dataset.done = 1;
          const items = groups.get(el.dataset.cat).sort((a, b) => (a.canh_gioi ?? 0) - (b.canh_gioi ?? 0) || (a.pham_cap || 0) - (b.pham_cap || 0) || (a.gia || 0) - (b.gia || 0));
          el.querySelector('.vk-cl').innerHTML = `<table class="vk-t">${items.map((it) => {
            const src = sourceNote(it); const own = nv.tuiDo[it.id] > 0;
            return `<tr><td><b>${esc(it.ten)}</b>${own ? ' <span class="vk-ok" style="font-size:12px">có</span>' : ''}<br><span class="vk-mu" style="font-size:12px">${it.he && it.he.length ? esc(it.he.map(heTen).join('/')) + ' · ' : ''}phẩm ${it.pham_cap}${it.canh_gioi !== undefined ? ' · từ ' + esc(realmName(it.canh_gioi)) : ''}</span><br><span style="font-size:13px">${itemFull(it) || ''}</span>${src.length ? `<br><span class="vk-mu" style="font-size:12px">${esc(src.join(' · '))}</span>` : ''}${it.mo_ta ? `<details><summary class="vk-mu" style="font-size:12px">Mô tả</summary><span style="font-size:12px">${esc(it.mo_ta)}</span>${it.goi_y ? `<br><span class="vk-mu" style="font-size:12px">Gợi ý: ${esc(it.goi_y)}</span>` : ''}</details>` : ''}</td><td style="white-space:nowrap">${it.gia ? '~' + it.gia : '—'}</td></tr>`;
          }).join('')}</table>`;
        };
        if (el.open) fill();
        el.addEventListener('toggle', () => el.open && fill());
      });
    };
    let tmr; body.querySelector('#vk-dq').oninput = () => { clearTimeout(tmr); tmr = setTimeout(draw, 250); };
    body.querySelector('#vk-dr').onchange = draw; body.querySelector('#vk-do').onchange = draw;
    draw();
  }


  // ═════════════════════════ BẢN 2.5: Lối build theo lưu phái ═════════════════════════
  const SCHOOLS = ['kiem', 'dan', 'am', 'khi', 'phu', 'tran', 'phat', 'the', 'ngu_thu', 'khoi_loi', 'ma', 'thi', 'doc', 'hop_hoan', 'quy'];
  const NL2S = { thu: 'ngu_thu', khoi_loi: 'khoi_loi', trung: 'doc', thi: 'thi', hon: 'quy' };
  const schoolsOf = (it) => { const t = (it.tag || []).filter((x) => SCHOOLS.includes(x)); const nl = it.ngu_linh && NL2S[it.ngu_linh.loai]; if (nl && !t.includes(nl)) t.push(nl); if ((it.tag || []).includes('nghich') && !t.includes('ma')) t.push('ma'); return t; };
  // Phẩm → cảnh giới mà món còn đủ sức (code game: uy bị kẹp khi vượt quá cảnh giới (bậc phẩm)+1; hiệu ứng giảm nửa khi vượt 2, mất khi vượt 3)
  const TIER_CG = [0, 0, 1, 2, 3, 4, 5, 99];
  const PHAM_TEN = ['Phàm', 'Hoàng', 'Huyền', 'Địa', 'Thiên', 'Tiên', 'Thần', 'Nghịch Thiên'];
  const tierCg = (it) => (it.tran_phai ? 4 : TIER_CG[Math.max(1, Math.min(8, it.pham_cap || 2)) - 1]);
  const freshAt = (it, R) => R <= tierCg(it) + 1;
  const DIHOA_PCT = [0, 0, 6, 8, 10, 12, 15, 20];

  const REALM_STEPS = {
    1: ['Tìm tâm pháp Huyền phẩm đầu tiên và đặt cho thông mạch (chạm đan điền hoặc nối chuỗi công pháp đã thông).', 'Đánh trận, đi xa để giữ lịch luyện; bế quan khi lịch luyện cạn chỉ được khoảng 3/10 tu vi.', 'Gom Trúc Cơ Đan (+15%) trước khi tới Đại viên mãn; đột phá sớm bị trừ rất nặng.', 'Vào tông môn nếu chưa có: có Tàng Kinh Các đổi công pháp bằng cống hiến.'],
    2: ['Đồ Phàm/Hoàng phẩm từ đây bắt đầu yếu đi (uy bị kẹp): thay dần sang Huyền rồi Địa phẩm.', 'Uống đan nâng phẩm đạo cơ (Cố Cơ Đan) trong thời gian Trúc Cơ: đạo cơ tốt thì đường sau dễ.', 'Từ Trúc Cơ: phương tiện vượt biển cho qua biển sớm; mở bộ kinh mạch thứ 2 (1.000 linh thạch) để có bộ đánh và bộ bế quan riêng.', 'Gom Kết Kim Đan (+12%) cho lần lên Kết Đan.'],
    3: ['Từ Kết Đan có bình cảnh: mọi khoản cộng đột phá (trừ gốc và đạo tâm) chỉ còn 85% khi lên Kết Đan, 65% khi lên Nguyên Anh.', 'Thay đồ sang Địa/Thiên phẩm; Huyền phẩm hết hiệu ứng phụ (chảy máu, phá giáp…) giảm một nửa.', 'Gom Dưỡng Anh Đan / Hóa Anh Đan, chú ý tâm ma (mỗi điểm −1% đột phá).', 'Thọ ~500 năm: lên kế hoạch bế quan ngay khi đủ lịch luyện, đừng để dư.'],
    4: ['Từ Nguyên Anh có uy áp: chênh cảnh giới làm bên thấp gây ít, chịu nhiều (cả độc, thiêu, khống chế). Đừng đánh vượt cấp.', 'Muốn lên Hóa Thần phải ngộ đạo: chỉ có khi bế quan ở Nguyên Anh Đại viên mãn, mỗi năm 2% × (1 + ngộ tính/100). Gom đồ ngộ tính.', 'Thay đồ sang Thiên/Tiên phẩm.', 'Ngộ Đạo Trà, Thiên Nhất Đan cho lần lên Hóa Thần.'],
    5: ['Đồ Tiên/Thần phẩm; Nghịch Thiên không bao giờ bị kẹp sức.', 'Hóa Thần là đỉnh nhân gian: dồn vào đồ mạnh nhất và tích điểm luân hồi cho kiếp sau.'],
  };

  const BUILDS = [
    { k: 'kiem', ten: 'Kiếm tu', nhom: 'Chính đạo', he: ['kim'], core: [
      'Đồ có nhãn kiếm: chiêu × (1 + kiếm uy lực). Thể chất <b>Kiếm cốt</b> cho +25% uy kiếm và kinh lộ dài 7 công pháp (người thường 5) — pháp khí kiếm cuối chuỗi dài được cộng nhiều hơn.',
      'Kiếm phần lớn hệ Kim; đặt kiếm lên huyệt, nối chuỗi tâm pháp Kim từ đan điền tới kiếm (mỗi công pháp cùng họ hệ +10%).',
      'Tông kiếm: mảnh kiếm trong sơn môn rẻ hơn.',
      'Dị hỏa trang bị cùng hệ với chiêu (vd Kim) cho chiêu +6% → +20% theo phẩm dị hỏa.'] },
    { k: 'the', ten: 'Thể tu', nhom: 'Chính đạo', he: ['tho', 'kim'], core: [
      'Bắt buộc: một <b>tâm pháp luyện thể</b> (nhãn thể) đang thông. Có rồi thì quyền cước và chiêu công của đồ thể tu đánh bằng sức thân: sức = sức pháp × 1,15 × √((1 + 1%×căn cốt) × (1 + khí huyết thân)). Chưa có thì đồ thể tu chỉ như món thường.',
      'Gom căn cốt và đồ tăng khí huyết; càng về sau tăng càng chậm (căn bậc hai).',
      'Thể chất hợp: Thiết cốt (+20% khí huyết), Huyền Vũ (+30%), Hoang Cổ thánh thể (+50%, tu chậm).',
      'Coi chừng địch "Thạch bì" (đòn thường/thể tu −35%) và "Phản chấn" (phản 20% sát thương thể tu): gặp chúng nên dùng pháp thuật.'] },
    { k: 'phat', ten: 'Phật tu', nhom: 'Chính đạo', he: ['kim', 'hoa', 'tho'], core: [
      'Đồ Phật nhiều kháng tâm ma, chiêu thủ và khống chế: lối chậm mà chắc, đột phá ít hụt.',
      'Tông Phật: tâm ma tăng chỉ còn một nửa (perk chùa −25% nữa). Nhưng giết tu sĩ người là phạm sát giới, bị trừ cống hiến.',
      'Chính đạo: mỗi điểm tâm ma −1% đột phá; hóa giải bằng đan tĩnh tâm, tĩnh tâm ở chùa, sư phụ áp chế.'] },
    { k: 'ma', ten: 'Ma tu (huyết)', nhom: 'Tà đạo', he: ['hoa', 'vo_sac'], core: [
      'Mảnh tà chiếm ≥ 1/3 số ô đang thông thì lưới ngả tà; giữ đủ số năm (5/5/10/20/40/60 năm theo cảnh giới) thì đạo cơ đổi sang tà.',
      '<b>Ma niệm</b>: chiêu tà ×(1 + 3% mỗi 10 ma niệm), tu nhanh hơn, đột phá không bị trừ. Trần = 30 + 10×cảnh giới + bản tâm; vượt trần mỗi điểm +2% mất kiểm soát trong trận (tối đa 50%), đột phá dễ tẩu hỏa.',
      'Ma công hút máu 10% + 1% mỗi 10 ma niệm; khi ma niệm ≥ 80% trần và chiêu có "ma hóa" thì hút gấp đôi.',
      'Mang mảnh tà là có ma khí: vào đất chính đạo dễ bị nhận ra (tới 80% mỗi lần), thành lớn, sơn môn, chùa soi kỹ nhất. Liễm tức giảm nguy cơ.',
      'Thể chất: Huyền Vũ (phản phệ ×0,75), Hoang Cổ (×0,5) hợp tà công; Liệt Dương (×1,5) thì tránh.'] },
    { k: 'doc', ten: 'Độc cổ', nhom: 'Tà đạo', he: ['moc', 'thuy'], core: [
      'Chiêu độc mạnh theo ma niệm: tỉ lệ độc ×(1 + 1% mỗi 10 ma niệm); khi ma hóa độc kéo dài thêm 2 lượt.',
      'Nuôi <b>cổ trùng</b> (nghi thức Luyện cổ: độc nang, cổ huyết tinh…): cần công pháp triệu trùng trên kinh mạch mới mở ô ngự linh.',
      'Luật tà đạo, ma niệm, ma khí giống Ma tu.'] },
    { k: 'hop_hoan', ten: 'Hợp hoan', nhom: 'Tà đạo', he: ['moc', 'phong', 'vo_sac'], core: [
      'Chiêu khống chế tỉ lệ +1% mỗi 10 ma niệm; ma hóa khống thêm 1 lượt.',
      'Song tu kiểu hợp hoan: phải là tà tu và có công pháp hợp hoan đang vận hành.',
      'Luật tà đạo, ma niệm, ma khí giống Ma tu.'] },
    { k: 'thi', ten: 'Luyện thi', nhom: 'Tà đạo', he: ['tho', 'thuy'], core: [
      '<b>Thi khôi</b> từ nghi thức Luyện thi (thi du, bạch cốt phấn, thi hạch…): chỉ lớn khi chủ luyện, không ham đồ khi bị ném dụ. Cần công pháp triệu thi để mở ô (tối đa 3 ô ngự linh).',
      'Ma hóa: thi khí bồi thân, cộng khí huyết cho thi khôi.',
      'Thể chất Âm Hồn: giữ thêm 1 thi khôi/quỷ hồn. Tông ma/thi: thắng trận được thêm cống hiến.'] },
    { k: 'quy', ten: 'Quỷ tu', nhom: 'Tà đạo', he: ['vo_sac', 'thuy'], core: [
      '<b>Quỷ hồn</b> từ nghi thức Luyện hồn (oán hồn ty, âm phù chỉ…). Tâm pháp quỷ (Dưỡng Hồn, Dưỡng Quỷ, Bách Quỷ…) mở 1–2 ô hồn.',
      'Ma hóa: chiêu quỷ gắn ấn hồn lên địch.',
      'Thể chất Âm Hồn: giữ thêm 1 hồn. Trận Câu hồn: địch ngã đứng dậy đánh cho mình 2 lượt (trận tà, +1 tâm ma mỗi lần bày).'] },
    { k: 'ngu_thu', ten: 'Ngự thú', nhom: 'Ngự linh', he: ['moc', 'phong'], core: [
      'Ai cũng có 1 ô linh thú. Công pháp ngự thú mở thêm ô (tối đa 3); tháo công pháp thì ô đóng, con về túi.',
      'Thú ấp từ trứng (Ấp thú: yêu đan, huyết linh chi…), lớn theo năm và khi cho ăn; tới bình cảnh phải tiến hóa mới lên tiếp.',
      'Trận Khốn: hạ địch bằng đòn nào cũng xét thu phục (cần công pháp triệu hồi đúng loại).'] },
    { k: 'khoi_loi', ten: 'Khôi lỗi', nhom: 'Ngự linh', he: ['kim', 'tho'], core: [
      'Cần <b>đồ phổ khôi lỗi</b> + nghi thức Luyện khôi (hàn thiết, linh kim, yêu đan, khôi hạch…). Khôi lỗi chỉ lớn khi chủ luyện, không ăn, không ham đồ.',
      'Công pháp khôi lỗi (Nhiếp Hạch Thuật…) mở ô; khôi lỗi hỏng có thể sửa, thu hồi không tốn lượt.',
      'Hợp với nghề Luyện bảo (thần thức, căn cốt) để tự làm vật liệu.'] },
    { k: 'phu', ten: 'Phù tu', nhom: 'Nghề', he: ['hoa', 'thuy'], core: [
      'Nghề <b>Chế phù</b> (chỉ số thần thức, đạo tâm; cần phù bút). Phù dùng giữa trận: công, khống chế, hộ thân (hộ thuẫn giữ tới hết trận), độn thổ thoát thân.',
      'Phù phẩm thấp hơn cảnh giới thì nhạt: luôn chế/mua phù đúng phẩm.',
      'Trận Dẫn linh: tỉ lệ khống chế, hiệu ứng hại và phù +15%.'] },
    { k: 'tran', ten: 'Trận tu', nhom: 'Nghề', he: ['tho', 'loi'], core: [
      'Nghề <b>Trận pháp</b> (ngộ tính, thần thức; cần trận bút). Trận bàn: sức theo phẩm so cảnh giới — thấp 2 phẩm vô dụng, thấp 1 ×0,5, vừa ×1, cao hơn ×1,5. Tối đa 2 trận cùng lúc.',
      'Bày giữa trận tốn cả lượt và khóa 20% linh lực tối đa tới khi trận tan (trận nhãn vỡ là tan).',
      'Trận trong chiến: Sát (đòn lan 30%), Ngũ hành (+20% đòn đúng hệ), Dẫn linh (+15% khống chế/phù), Tán linh (địch −25% linh lực), Tuyệt sinh (địch hồi máu −50%), Phá thuẫn, Mê, Khốn, Tỏa linh, Phòng hộ.',
      'Trận động phủ: Tụ linh (+1 bậc linh khí bế quan), Phòng hộ, Mê, Dục linh (linh điền chín nhanh 30%), Truyền tống.'] },
    { k: 'dan', ten: 'Đan tu', nhom: 'Nghề', he: ['moc', 'hoa'], core: [
      'Nghề <b>Luyện đan</b>: đan lô + dị hỏa; thi Đan sư luôn chọn lửa lớn (đỗ cao nhất).',
      'Tông đan: đan trong bảo khố rẻ 20%, Đan phòng sơn môn không tốn cống hiến. Thể chất Bách Thảo: dược kháng chậm, đan hồi trong trận +25%.',
      'Công pháp đan tu thiên về hồi phục và tu luyện: lối an toàn, kiếm tiền bằng bán đan.'] },
    { k: 'khi', ten: 'Khí tu (luyện bảo)', nhom: 'Nghề', he: ['hoa', 'kim'], core: [
      'Nghề <b>Luyện bảo</b> (thần thức, căn cốt; cần khí lô): tự luyện pháp khí, đúc lại đồ.',
      'Công pháp khí tu tăng thần thức và tu luyện. Dị hỏa cũng tăng điểm luyện chế.',
      'Đi kèm khôi lỗi hoặc kiếm tu rất hợp: tự làm đồ đánh cho mình.'] },
  ];
  for (const [h, ten] of [['loi', 'Lôi tu'], ['hoa', 'Hỏa tu'], ['bang', 'Băng tu'], ['phong', 'Phong tu'], ['kim', 'Kim tu'], ['moc', 'Mộc tu'], ['thuy', 'Thủy tu'], ['tho', 'Thổ tu']]) {
    BUILDS.push({ k: 'he_' + h, ten, nhom: 'Theo hệ', he: [h], elem: h, core: [
      `Dồn công pháp, pháp khí hệ ${heTen(h)}; linh căn có ${heTen(h)} thì ô kinh mạch màu ${heTen(h)} nhiều, đặt đúng màu tối đa ×1,3.`,
      `Trang bị <b>dị hỏa</b> hệ ${heTen(h)} (nếu có): mọi chiêu hệ ${heTen(h)} +6% (Huyền) → +20% (Nghịch Thiên).`,
      `Trận bàn Ngũ hành hệ ${heTen(h)}: đòn đúng hệ +20% khi bày.`,
      'Sinh khắc: món kề nhau mà hệ này sinh hệ kia +15%, khắc −15%; chọn hệ phụ là hệ sinh ra hệ chính để nối chuỗi.'] });
  }

  function buildMatch(b, it) {
    if (b.elem) return (it.he || []).includes(b.elem);
    return schoolsOf(it).includes(b.k);
  }
  function itemGroup(it) {
    if (it.loai === 'cong_phap' || it.loai === 'phap_khi') {
      if (it.ngu_linh && !it.chieu) return 'ngulinh';
      if (!it.chieu) return it.loai === 'cong_phap' ? 'tam' : 'bd';
      const d = it.chieu.dang; return d === 'cong' ? 'cong' : d === 'khong_che' ? 'kc' : 'thu';
    }
    if (it.loai === 'tran_ban') return 'tran'; if (it.loai === 'phu_luc') return 'phu';
    if (it.loai === 'trung_thu') return 'trung'; if (it.loai === 'nguyen_lieu' && (it.tag || []).includes('khoi_loi')) return 'dopho';
    if (it.loai === 'di_hoa') return 'dihoa'; if (it.loai === 'dung_cu') return 'dungcu';
    return null;
  }
  const GROUP_TEN = { tam: 'Tâm pháp (đặt cho thông, cộng tu luyện/chỉ số)', ngulinh: 'Công pháp ngự linh (mở ô linh vật)', cong: 'Chiêu công', kc: 'Chiêu khống chế', thu: 'Chiêu thủ / hồi', bd: 'Pháp bảo bị động', trung: 'Trứng linh thú', dopho: 'Đồ phổ khôi lỗi', tran: 'Trận bàn', phu: 'Phù lục', dihoa: 'Dị hỏa (trang bị)', dungcu: 'Dụng cụ nghề' };
  const BUILD_EXTRA = { ngu_thu: ['trung'], khoi_loi: ['dopho'], tran: ['tran', 'dungcu'], phu: ['phu', 'dungcu'], dan: ['dihoa', 'dungcu'], khi: ['dihoa', 'dungcu'], ma: ['tran'], quy: ['tran'] };
  const NGHE_DC = { dan: 'luyen_dan', khi: 'luyen_bao', phu: 'che_phu', tran: 'tran_phap' };

  function buildPicks(b, R) {
    const Cc = C(), out = {};
    for (const it of Cc.items.values()) {
      const g = itemGroup(it); if (!g) continue;
      if ((it.canh_gioi ?? 0) > R) continue;
      let ok = buildMatch(b, it);
      const extra = BUILD_EXTRA[b.k] || [];
      if (!ok && extra.includes(g)) {
        if (g === 'dungcu') ok = it.dung_cu === NGHE_DC[b.k];
        else if (g === 'dihoa') ok = true;
        else if (g === 'tran') ok = b.k === 'tran' || (b.k === 'quy' && it.tran_phap && it.tran_phap.kieu === 'cau_hon') || (b.k === 'ma' && it.tran_phap && it.tran_phap.kieu === 'huyet_te');
        else ok = true;
      }
      if (b.elem && ['trung', 'dopho', 'dungcu'].includes(g)) ok = false;
      if (!ok && !b.elem && g === 'tam' && b.k !== 'the' && (it.he || []).includes(b.he[0]) && freshAt(it, R)) { (out.tamhe = out.tamhe || []).push({ it, sc: (it.pham_cap || 1) * 10 + ((it.bi_dong && it.bi_dong.toc_do) || 0) * 10 }); continue; }
      if (b.elem && (g === 'dihoa' || g === 'tran') && !(it.he || []).includes(b.elem)) ok = false;
      if (b.elem && g === 'tran' && !(it.tran_phap && it.tran_phap.kieu === 'ngu_hanh')) ok = false;
      if (!ok) continue;
      const tc = tierCg(it);
      if (g !== 'dungcu' && g !== 'dopho' && g !== 'trung' && !freshAt(it, R)) continue;
      const sc = (it.pham_cap || 1) * 10 + (tc >= R - 1 ? 30 : 0) + (it.theo_kiep ? -100 : 0) + ((it.tag || []).includes('chi_khai_bao') ? -5 : 0)
        + (it.chieu ? (it.chieu.uy || 0) * 5 : 0) + ((it.bi_dong && it.bi_dong.toc_do) || 0) * 10 + (it.ngu_linh && it.ngu_linh.o ? 8 * it.ngu_linh.o : 0);
      (out[g] = out[g] || []).push({ it, sc });
    }
    if (out.tamhe) { const n0 = (out.tam || []).length; if (n0 < 2) out.tam = [...(out.tam || []), ...out.tamhe.sort((a, b2) => b2.sc - a.sc).slice(0, 3 - n0).map((x) => ({ ...x, sc: x.sc - 1000, he: true }))]; delete out.tamhe; }
    for (const g of Object.keys(out)) out[g] = out[g].sort((a, b2) => b2.sc - a.sc).slice(0, g === 'dungcu' ? 2 : 4).map((x) => x.it);
    return out;
  }

  function buildFit(b, nv, R0) {
    const Cc = C(); let s = 0; const why = [];
    let onKm = 0, inBag = 0;
    for (const m of nv.kinhMach.manh) { const it = Cc.items.get(m.item); if (it && buildMatch(b, it)) onKm++; }
    for (const [id, n] of Object.entries(nv.tuiDo)) { const it = Cc.items.get(id); if (n > 0 && it && (it.loai === 'cong_phap' || it.loai === 'phap_khi') && buildMatch(b, it)) inBag++; }
    if (onKm) { s += 3 * onKm; why.push(`${onKm} món đang trên kinh mạch`); }
    if (inBag) { s += inBag; why.push(`${inBag} món trong túi`); }
    const lc = (nv.linhCan && nv.linhCan.he) || [];
    const hm = b.he.filter((h) => lc.includes(h)); if (hm.length) { s += 4 * hm.length; why.push('hợp linh căn ' + hm.map(heTen).join('/')); }
    const tc = String(nv.theChat || '');
    const TC = { kiem: 'kiem_cot', the: ['thiet_cot', 'hoang_co', 'huyen_vu'], thi: 'am_hon', quy: 'am_hon', dan: 'bach_thao', ma: ['huyen_vu', 'hoang_co'], doc: ['huyen_vu', 'hoang_co'] };
    if (TC[b.k] && [TC[b.k]].flat().some((x) => tc.includes(x))) { s += 8; why.push('thể chất hợp'); }
    if (tc.includes('liet_duong') && ['ma', 'doc', 'hop_hoan', 'thi', 'quy'].includes(b.k)) { s -= 6; why.push('Liệt Dương phản phệ tà công ×1,5'); }
    return { s, why };
  }

  function tabBuild() {
    const nv = nvNow(), Cc = C();
    const R0 = Math.max(1, Math.min(5, nv.canhGioi || 1));
    if (!S.bld) {
      const ranked = BUILDS.map((b) => ({ b, f: buildFit(b, nv, R0) })).sort((a, b) => b.f.s - a.f.s);
      S.bld = { k: ranked[0].b.k, R: R0 };
    }
    const ranked = BUILDS.map((b) => ({ b, f: buildFit(b, nv, R0) })).sort((a, b) => b.f.s - a.f.s).slice(0, 3);
    const b = BUILDS.find((x) => x.k === S.bld.k) || BUILDS[0], R = S.bld.R;
    const groups = [...new Set(BUILDS.map((x) => x.nhom))];
    const sel = `<select class="vk-sel" id="vk-bk">${groups.map((g) => `<optgroup label="${g}">${BUILDS.filter((x) => x.nhom === g).map((x) => `<option value="${x.k}" ${x.k === b.k ? 'selected' : ''}>${x.ten}</option>`).join('')}</optgroup>`).join('')}</select>`;
    const rsel = `<div class="vk-pills" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${[1, 2, 3, 4, 5].map((r) => `<button class="vk-btn" data-r="${r}" style="padding:6px 10px;${r === R ? '' : 'background:#fff;color:#7a1f1a;border:1px solid #7a1f1a'}">${esc(realmName(r))}${r === R0 ? ' ●' : ''}</button>`).join('')}</div>`;
    const picks = buildPicks(b, R);
    const ORDER = ['tam', 'ngulinh', 'cong', 'kc', 'thu', 'bd', 'trung', 'dopho', 'tran', 'phu', 'dihoa', 'dungcu'];
    const row = (it) => {
      const own = (nv.tuiDo[it.id] > 0) || nv.kinhMach.manh.some((m) => m.item === it.id);
      const src = sourceNote(it); const where = (typeof whereToGet === 'function') ? whereToGet(it.id) : '';
      return `<tr><td><b>${esc(it.ten)}</b>${own ? ' <span class="vk-ok" style="font-size:12px">có</span>' : ''}<br><span class="vk-mu" style="font-size:12px">${it.he && it.he.length ? esc(it.he.map(heTen).join('/')) + ' · ' : ''}${PHAM_TEN[(it.pham_cap || 1) - 1] || ''} phẩm · từ ${esc(realmName(it.canh_gioi ?? 0))}${it.ngu_linh && it.ngu_linh.o ? ' · mở ' + it.ngu_linh.o + ' ô' : ''}</span><br><span style="font-size:13px">${itemFull(it)}</span>${src.length ? `<br><span class="vk-mu" style="font-size:12px">${esc(src.join(' · '))}</span>` : ''}${where && !own ? `<br><span class="vk-mu" style="font-size:12px">Có ở: ${where}</span>` : ''}</td><td style="white-space:nowrap">${it.gia ? '~' + it.gia : '—'}</td></tr>`;
    };
    const dp = [...Cc.items.values()].filter((it) => it.loai === 'dan_duoc' && it.dot_pha && it.dot_pha.canh_gioi === R + 1);
    const extraSteps = {
      ngu_thu: { 1: 'Ấp trứng thú đầu tiên; đặt công pháp ngự thú để mở ô.', 2: 'Cho thú ăn đều; chuẩn bị nguyên liệu tiến hóa trước bình cảnh.' },
      khoi_loi: { 1: 'Mua đồ phổ Mộc Nhân/Mộc Hầu, gom hàn thiết + yêu đan cấp 1 để luyện khôi.', 2: 'Lên đồ phổ Mộc Lang; nâng khôi hạch.' },
      thi: { 1: 'Gom thi du, bạch cốt phấn để Luyện thi; tâm pháp thi mở ô.' }, quy: { 1: 'Gom oán hồn ty, âm phù chỉ để Luyện hồn; Dưỡng Hồn Quyết mở 1 ô.' },
      doc: { 1: 'Gom độc nang để Luyện cổ; công pháp triệu trùng mở ô.' },
      phu: { 1: 'Mua phù bút, học đơn phương phù (Hỏa Đạn, Kim Cương, Độn thổ) và luyện tay nghề.' }, tran: { 1: 'Mua trận bút, học trận bàn Sát/Phòng hộ; bày Tụ linh ở động phủ khi bế quan.' },
      dan: { 1: 'Mua đan lô, thi Đan sư bằng lửa lớn; luyện đan bán lấy vốn.' }, khi: { 1: 'Mua khí lô, luyện pháp khí phẩm thấp để lên tay nghề.' },
      ma: { 1: 'Từ đây quyết chính hay tà: mảnh tà ≥ 1/3 ô thông là lưới ngả tà.', 3: 'Ma niệm dồn nhanh: giữ dưới trần, bế quan trấn ma khi gần trần.' },
      the: { 1: 'Ưu tiên tâm pháp nhãn thể cho thông trước rồi mới tới chiêu thể tu.' },
    };
    body.innerHTML = `
    <div class="vk-card"><h3>Lối build</h3>
      <div class="vk-mu" style="font-size:13px">Hợp nhân vật nhất lúc này: ${ranked.map((x) => `<b>${x.b.ten}</b>${x.f.why.length ? ' (' + esc(x.f.why.join(', ')) + ')' : ''}`).join(' · ')}</div>
      <div style="margin-top:8px">${sel}</div>${rsel}
      <div style="margin-top:10px">${S.path && S.path.k === b.k && S.path.w > 0 ? `<span class="vk-ok">✓ Đang theo lối này khi xếp kinh mạch</span> <button class="vk-btn" id="vk-bf0" style="padding:6px 10px;background:#fff;color:#7a1f1a;border:1px solid #7a1f1a">Thôi theo</button>` : `<button class="vk-btn" id="vk-bf">Theo lối này khi xếp</button>`}
      <div class="vk-mu" style="font-size:12px;margin-top:4px">Khi theo lối, tab Kinh mạch (xếp, 2 bộ, ô nên mở) và Đồ nên săn sẽ ưu tiên đồ của lối này và giữ đúng điều kiện của lối (vd thể tu cần tâm pháp luyện thể thông, tà tu cần mảnh tà ≥ 1/3).</div></div></div>
    <div class="vk-card"><h3>${esc(b.ten)} · cốt lõi</h3><ul style="margin:0;padding-left:18px;font-size:14px">${b.core.map((x) => `<li>${x}</li>`).join('')}</ul></div>
    <div class="vk-card"><h3>Ở ${esc(realmName(R))} cần làm gì</h3><ul style="margin:0;padding-left:18px;font-size:14px">
      ${(extraSteps[b.k] && extraSteps[b.k][R]) ? `<li><b>${esc(extraSteps[b.k][R])}</b></li>` : ''}
      <li>Đồ nên dùng ở cảnh giới này: <b>${PHAM_TEN.filter((_, i) => TIER_CG[i] + 1 >= R && TIER_CG[i] <= R).join(', ')} phẩm</b>. Đồ phẩm thấp hơn bị kẹp uy lực, hiệu ứng phụ nhạt dần.</li>
      ${(REALM_STEPS[R] || []).map((x) => `<li>${x}</li>`).join('')}
      ${dp.length ? `<li>Đan đột phá lên ${esc(realmName(R + 1))}: ${dp.map((d) => `${esc(d.ten)} (+${pct(d.dot_pha.ti_le || 0)}${d.dot_pha.tam_ma ? ', +' + d.dot_pha.tam_ma + ' tâm ma' : ''}, ~${d.gia})`).join(', ')}</li>` : ''}
    </ul></div>
    <div class="vk-card"><h3>Đồ lắp ở ${esc(realmName(R))}</h3>
      <div class="vk-mu" style="font-size:12px">Món tốt nhất của lối này dùng được ở cảnh giới này và chưa bị kẹp sức. "có" = đang có.</div>
      ${ORDER.filter((g) => picks[g] && picks[g].length).map((g) => `<div style="margin-top:8px"><b>${GROUP_TEN[g]}</b><table class="vk-t">${picks[g].map(row).join('')}</table></div>`).join('') || '<div class="vk-mu">Lối này chưa có món nào ở cảnh giới này.</div>'}</div>
    <details class="vk-card"><summary><b>Luật chung (đọc từ code game)</b></summary><ul style="margin:6px 0 0;padding-left:18px;font-size:14px">
      <li><b>Theo lối là gặp cơ duyên của lối đó:</b> có tâm pháp mang nhãn lưu phái đang trên kinh mạch, hoặc ≥ 2 món cùng lưu phái (kinh mạch + trang bị), hoặc tông môn cùng phái, hoặc linh vật đúng loại → sự kiện của lưu phái đó xuất hiện nhiều gấp 3.</li>
      <li><b>Phẩm và cảnh giới:</b> Phàm/Hoàng phẩm đủ sức tới Luyện Khí, Huyền tới Trúc Cơ, Địa tới Kết Đan, Thiên tới Nguyên Anh, Tiên tới Hóa Thần. Quá mức đó uy chiêu bị kẹp; vượt 2 cảnh giới thì hiệu ứng (phá giáp, băng hàn…) còn một nửa, vượt 3 thì mất. Nghịch Thiên không bao giờ bị kẹp.</li>
      <li><b>Chính / tà:</b> mảnh tà (ma, nghịch, thi, quỷ, độc, hợp hoan) chiếm ≥ 1/3 ô đang thông thì lưới ngả tà; giữ đủ 5/5/10/20/40/60 năm (Phàm Nhân → Hóa Thần) thì đạo cơ đổi theo, đổi lưới giữa chừng là mất số năm đã dồn.</li>
      <li><b>Ngự linh:</b> 1 ô linh thú cho mọi người; ô thú, trùng, khôi lỗi, thi, hồn chỉ mở khi có công pháp triệu hồi đúng loại trên kinh mạch, tối đa 3.</li>
      <li><b>Dị hỏa trang bị:</b> chiêu cùng hệ với dị hỏa +6% (Huyền), 8% (Địa), 10% (Thiên), 12% (Tiên), 15% (Thần), 20% (Nghịch Thiên).</li>
      <li><b>Bộ kinh mạch:</b> tối đa 3 bộ, đổi miễn phí; mở bộ 2 tốn 1.000, bộ 3 tốn 15.000 linh thạch. Dùng tab Kinh mạch → "Xếp 2 bộ".</li>
    </ul></details>
    <div class="vk-card"><h3>Đo thử lối này với nhân vật</h3>
      <div class="vk-mu" style="font-size:13px">Thêm vào túi (giả định) các món đề xuất ở ${esc(realmName(R0))} còn thiếu, xếp lại kinh mạch kiểu đánh rồi đánh trận mẫu, so với đồ đang có.</div>
      <button class="vk-btn" id="vk-bm" ${nv.canhGioi < 1 ? 'disabled' : ''}>Đo thử</button>${progressHtml('vk-prb')}<div id="vk-bmo"></div></div>`;
    body.querySelector('#vk-bk').onchange = (e) => { S.bld.k = e.target.value; tabBuild(); };
    const bf = body.querySelector('#vk-bf'); if (bf) bf.onclick = () => { S.path = { k: b.k, w: (S.path && S.path.w > 0) ? S.path.w : 1 }; savePath(); S.best = null; S.san = ''; tabBuild(); };
    const bf0 = body.querySelector('#vk-bf0'); if (bf0) bf0.onclick = () => { S.path = { k: b.k, w: 0 }; savePath(); S.best = null; S.san = ''; tabBuild(); };
    body.querySelectorAll('[data-r]').forEach((el) => (el.onclick = () => { S.bld.R = +el.dataset.r; tabBuild(); }));
    body.querySelector('#vk-bm').onclick = async (ev) => {
      ev.target.disabled = true; S.abort = false;
      const prog = bindProgress(body.querySelector('#vk-prb'));
      const sp0 = S.path;
      try {
        const p0 = buildPicks(b, R0);
        const add = ['tam', 'ngulinh', 'cong', 'kc', 'thu', 'bd'].flatMap((g) => (p0[g] || []).slice(0, g === 'cong' ? 3 : 2)).filter((it) => (it.canh_gioi ?? 0) <= nv.canhGioi && it.hinh && !(nv.tuiDo[it.id] > 0));
        const savedPath = S.path; S.path = null;
        let base;
        try { base = await optimizeMode(nv, 'danh', 1500, prog, 0, 0.45, 'Mốc đồ đang có…'); } finally { S.path = savedPath; }
        S.path = { k: b.k, w: 1 };
        const nvB = clone(nv); for (const it of add) nvB.tuiDo[it.id] = 1;
        const r1 = await optimizeMode(nvB, 'danh', 1500, prog, 0.45, 0.8, 'Xếp với đồ của lối build…');
        const nvB0 = clone(nvB); nvB0.kinhMach.manh = [];
        const r2 = stripDead(nvB, await anneal({ nv0: nvB0, mode: 'danh', iters: 900, init: base.manh, onProg: (f) => prog(0.8 + 0.2 * f, 'Thử thay từ cách xếp hiện tại…') }), 'danh');
        S.path = savedPath;
        const r = [r1, r2, { ...base }].sort((x, y) => y.score - x.score)[0];
        body.querySelector('#vk-prb').style.display = 'none';
        const used = new Set(r.manh.map((m) => m.item));
        body.querySelector('#vk-bmo').innerHTML = `<table class="vk-t"><tr><th></th><th>Đồ đang có</th><th>Có đồ ${esc(b.ten)}</th></tr>
          <tr><td>Thắng trận mẫu</td><td>${base.wins}/${base.n}</td><td><b>${r.wins}/${r.n}</b></td></tr>
          <tr><td>Tu luyện</td><td>+${pct(base.R.biDong.toc_do || 0)}</td><td>+${pct(r.R.biDong.toc_do || 0)}</td></tr>
          <tr><td>Linh lực hồi/lượt</td><td>${num(base.P ? base.P.linhLucMoiLuot : 0)}</td><td>${num(r.P ? r.P.linhLucMoiLuot : 0)}</td></tr></table>
          <div style="font-size:13px;margin-top:6px">Món mới được dùng: ${add.filter((it) => used.has(it.id)).map((it) => '<b>' + esc(it.ten) + '</b>').join(', ') || 'không món nào (kinh mạch hiện tại không nhét vừa hoặc không hợp)'}</div>${drawGrid(nvB, r.manh)}`;
      } catch (e) { S.path = sp0; console.error(e); body.querySelector('#vk-bmo').innerHTML = errBox(e); }
      ev.target.disabled = false;
    };
  }

  S.dbg = { anneal, optimizeMode, evalCurrent, benchEnemies, fight, enemyAt, stripDead };
  render();
})();