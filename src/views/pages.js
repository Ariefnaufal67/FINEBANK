// Halaman web FineBank (disematkan sebagai string agar ikut ter-bundle di Vercel serverless).
// Semua data dimuat dari API lewat fetch; nilai ditampilkan dengan textContent (aman dari XSS).

const css = `
:root{--bg:#0f1f1d;--card:#16302c;--card2:#1b3b36;--text:#f6f5f0;--muted:#a9c4bf;--accent:#299d91;--amber:#e8a23b;--bad:#e5686a;--line:#244a44}
*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:var(--bg);color:var(--text)}
a{color:var(--accent)}header{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;padding:16px 28px;border-bottom:1px solid var(--line)}
header b{font-size:18px}nav{display:flex;flex-wrap:wrap;gap:8px}nav a{color:var(--muted);text-decoration:none;padding:6px 12px;border-radius:8px}nav a:hover,nav a.on{background:var(--card);color:var(--text)}
main{max-width:1100px;margin:0 auto;padding:24px 28px 56px}h1{margin:0 0 4px;font-size:26px}h2{font-size:16px;margin:0 0 12px;color:var(--amber)}p.sub{margin:0 0 20px;color:var(--muted)}
.grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}.cols{display:grid;gap:14px;grid-template-columns:1fr 1fr;margin-top:14px}@media(max-width:800px){.cols{grid-template-columns:1fr}}
.card{background:var(--card);border-radius:12px;padding:16px 18px}.card .l{font-size:13px;color:var(--muted)}.card .v{font-size:24px;font-weight:700;margin-top:6px}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--line)}th{color:var(--muted);font-weight:500}td.r,th.r{text-align:right}
.mono{font-family:ui-monospace,Consolas,monospace;font-size:13px}.bad{color:var(--bad)}.ok{color:var(--accent)}.warn{color:var(--amber)}
button,.btn{background:var(--accent);color:#04201c;border:0;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block;font-size:14px}
button.ghost,.btn.ghost{background:transparent;color:var(--muted);border:1px solid var(--line)}input{background:#0b1716;border:1px solid var(--line);color:var(--text);border-radius:8px;padding:10px 12px;font-size:14px;width:100%}
.login{max-width:380px;margin:40px auto;background:var(--card);padding:24px;border-radius:14px;display:grid;gap:12px}.login .err{color:var(--bad);font-size:13px;min-height:18px}
.empty{color:var(--muted);padding:12px 0}.chart{position:relative;height:260px}.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.right{margin-left:auto}
`;

const shell = (title, active, body, script, extraHead = '') => `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · FineBank</title>${extraHead}<style>${css}</style></head><body>
<header><b>FineBank API</b><nav>
<a href="/" class="${active === 'home' ? 'on' : ''}">Beranda</a>
<a href="/statistik" class="${active === 'stat' ? 'on' : ''}">Statistik</a>
<a href="/profiling" class="${active === 'prof' ? 'on' : ''}">Profiling</a>
<a href="/docs">Docs (Swagger)</a><a href="/health">Health</a>
<a href="#" id="logout" style="display:none">Keluar</a></nav></header>
<main id="app">${body}</main>
<script>${common}</script><script>${script}</script></body></html>`;

// Utilitas bersama: token di sessionStorage, fetch ber-token, form login, format.
const common = `
const TK='fb_token';
const getToken=()=>{try{return sessionStorage.getItem(TK)}catch(e){return null}};
const setToken=(t)=>{try{t?sessionStorage.setItem(TK,t):sessionStorage.removeItem(TK)}catch(e){}};
function role(){try{return JSON.parse(atob(getToken().split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role}catch(e){return null}}
async function api(path,opt={}){
  const r=await fetch(path,Object.assign({},opt,{headers:Object.assign({'Content-Type':'application/json',Authorization:'Bearer '+getToken()},opt.headers||{})}));
  if(r.status===204)return null;
  const j=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(j.message||('HTTP '+r.status));e.status=r.status;throw e}
  return j.data!==undefined?j.data:j;
}
const rp=(n)=>'Rp '+Number(n||0).toLocaleString('id-ID');
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined&&text!==null)e.textContent=text;return e}
function card(label,value,cls){const c=el('div','card');c.appendChild(el('div','l',label));c.appendChild(el('div','v '+(cls||''),value));return c}
function table(headers,rows,rightFrom){const t=el('table');const th=el('tr');headers.forEach((h,i)=>th.appendChild(el('th',i>=rightFrom?'r':'',h)));t.appendChild(th);
  rows.forEach(r=>{const tr=el('tr');r.forEach((c,i)=>tr.appendChild(el('td',(i>=rightFrom?'r ':'')+(c&&c.mono?'mono':''),c&&c.t!==undefined?c.t:c)));t.appendChild(tr)});return t}
function panel(title,node){const p=el('div','card');p.appendChild(el('h2','',title));p.appendChild(node);return p}
function showLogin(app,onDone,msg){
  app.textContent='';
  const f=el('form','login');f.appendChild(el('h1','','Masuk'));f.appendChild(el('p','sub',msg||'Gunakan akun FineBank (mis. admin@finebank.test).'));
  const em=el('input');em.type='email';em.placeholder='Email';em.required=true;const pw=el('input');pw.type='password';pw.placeholder='Password';pw.required=true;
  const err=el('div','err');const b=el('button','','Masuk');b.type='submit';[em,pw,err,b].forEach(x=>f.appendChild(x));
  f.onsubmit=async(e)=>{e.preventDefault();err.textContent='';try{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:em.value,password:pw.value})});const j=await r.json();if(!r.ok)throw new Error(j.message||'Login gagal');setToken(j.data.token);onDone()}catch(x){err.textContent=x.message}};
  app.appendChild(f);
}
function wireLogout(){const a=document.getElementById('logout');if(getToken()){a.style.display='';a.onclick=(e)=>{e.preventDefault();setToken(null);location.reload()}}}
wireLogout();
`;

const home = shell('Beranda', 'home', `
<h1>FineBank API</h1><p class="sub">Backend manajemen keuangan: pengeluaran, kategori, tagihan. Dibuat untuk Pemrograman Sisi Server.</p>
<div class="grid" id="quick"></div>
<div class="row" style="margin-top:24px"><a class="btn" href="/docs">Buka Swagger Docs</a><a class="btn ghost" href="/statistik">Lihat Statistik</a><a class="btn ghost" href="/profiling">Profiling (admin)</a></div>
<div class="cols"><div class="card"><h2>Fitur</h2><table><tr><td>Auth JWT + role user/admin</td></tr><tr><td>CRUD pengeluaran, kategori, tagihan</td></tr><tr><td>Pagination, filter, sort, throttling</td></tr><tr><td>Import CSV massal, query relasional, agregasi</td></tr><tr><td>Profiling query ORM</td></tr><tr><td>Docker + PostgreSQL</td></tr></table></div>
<div class="card"><h2>Akun contoh (hasil seed)</h2><table><tr><td class="mono">admin@finebank.test</td><td class="r">admin</td></tr><tr><td class="mono">arief@finebank.test</td><td class="r">user</td></tr></table><p class="sub" style="margin-top:12px">Password sama dengan yang tertera di README.</p></div></div>`,
`(async()=>{const q=document.getElementById('quick');
 if(!getToken()){q.appendChild(card('Status','Belum masuk — buka Statistik untuk login'));return}
 try{const d=await api('/api/stats/expenses');q.appendChild(card('Total pengeluaran',rp(d.total)));q.appendChild(card('Jumlah pengeluaran',d.expenseCount));q.appendChild(card('Rata-rata',rp(d.avg)));
  const b=await api('/api/stats/bills');q.appendChild(card('Tagihan terlambat',b.overdue.count,b.overdue.count?'bad':'ok'))}catch(e){q.appendChild(card('Status',e.message,'bad'))}})();`);

const chartJs = '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.js"></script>';

const statistik = shell('Statistik', 'stat', `<div id="content"></div>`,
`const app=document.getElementById('content');
let charts=[];
function chart(id,cfg){const c=new Chart(document.getElementById(id),cfg);charts.push(c)}
async function render(){
  charts.forEach(c=>c.destroy());charts=[];app.textContent='';
  let e,b;
  try{[e,b]=await Promise.all([api('/api/stats/expenses'),api('/api/stats/bills')])}catch(x){if(x.status===401){setToken(null);return showLogin(app,()=>{wireLogout();render()},'Sesi berakhir. Silakan masuk lagi.')}app.appendChild(el('p','bad',x.message));return}
  wireLogout();
  app.appendChild(el('h1','','Statistik Keuangan'));app.appendChild(el('p','sub','Data diambil dari /api/stats/expenses dan /api/stats/bills'+(role()==='admin'?' (admin: gabungan semua pengguna)':'')));
  const g=el('div','grid');[['Total pengeluaran',rp(e.total)],['Jumlah transaksi',e.expenseCount],['Rata-rata',rp(e.avg)],['Terendah',rp(e.min)],['Tertinggi',rp(e.max)]].forEach(x=>g.appendChild(card(x[0],x[1])));app.appendChild(g);
  const c1=el('div','cols');
  const a=el('div','card');a.appendChild(el('h2','','Pengeluaran per kategori'));const w1=el('div','chart');const cv1=el('canvas');cv1.id='ch1';w1.appendChild(cv1);a.appendChild(w1);
  const m=el('div','card');m.appendChild(el('h2','','Tren bulanan'));const w2=el('div','chart');const cv2=el('canvas');cv2.id='ch2';w2.appendChild(cv2);m.appendChild(w2);
  c1.appendChild(a);c1.appendChild(m);app.appendChild(c1);
  if(window.Chart){
    chart('ch1',{type:'bar',data:{labels:e.byCategory.map(x=>x.category),datasets:[{label:'Total',data:e.byCategory.map(x=>x.total),backgroundColor:'#299d91'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#a9c4bf'}},y:{ticks:{color:'#a9c4bf'},beginAtZero:true}}}});
    chart('ch2',{type:'line',data:{labels:e.monthly.map(x=>x.month),datasets:[{label:'Total',data:e.monthly.map(x=>x.total),borderColor:'#e8a23b',backgroundColor:'rgba(232,162,59,.2)',fill:true,tension:.3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#a9c4bf'}},y:{ticks:{color:'#a9c4bf'},beginAtZero:true}}}});
  }else{w1.replaceWith(el('p','empty','Grafik tidak tersedia (Chart.js gagal dimuat). Data tabel tetap tampil.'));w2.replaceWith(el('p','empty','—'))}
  const c2=el('div','cols');
  const rows=(l)=>l.map(x=>[x.title,x.category||'—',rp(x.amount)]);
  c2.appendChild(panel('Termurah',e.cheapest.length?table(['Judul','Kategori','Jumlah'],rows(e.cheapest),2):el('div','empty','Belum ada data')));
  c2.appendChild(panel('Termahal',e.mostExpensive.length?table(['Judul','Kategori','Jumlah'],rows(e.mostExpensive),2):el('div','empty','Belum ada data')));app.appendChild(c2);
  const c3=el('div','cols');
  c3.appendChild(panel('Tagihan',table(['Status','Jumlah','Total'],[['Lunas',b.paid.count,rp(b.paid.total)],['Belum dibayar',b.unpaid.count,rp(b.unpaid.total)],[{t:'Terlambat'},{t:b.overdue.count},{t:rp(b.overdue.total)}]],1)));
  c3.appendChild(panel('Per kategori',e.byCategory.length?table(['Kategori','Transaksi','Total'],e.byCategory.map(x=>[x.category,x.count,rp(x.total)]),1):el('div','empty','Belum ada data')));app.appendChild(c3);
  if(role()==='admin'){try{const u=await api('/api/stats/users');
    app.appendChild(el('h1','','Statistik Pengguna'));app.lastChild.style.marginTop='28px';app.appendChild(el('p','sub','Khusus admin: /api/stats/users'));
    const ug=el('div','grid');[['Total pengguna',u.totalUsers],['Punya pengeluaran',u.usersWithExpenses],['Tanpa pengeluaran',u.usersWithoutExpenses],['Rata-rata transaksi/user',u.avgExpensesPerUser]].forEach(x=>ug.appendChild(card(x[0],x[1])));app.appendChild(ug);
    const c4=el('div','cols');c4.appendChild(panel('Pengguna teraktif',table(['Nama','Email','Transaksi','Total'],u.topUsers.map(x=>[x.name,x.email,x.expenseCount,rp(x.total)]),2)));
    c4.appendChild(panel('Belum punya pengeluaran',u.usersNoExpenses.length?table(['Nama','Email'],u.usersNoExpenses.map(x=>[x.name,x.email]),9):el('div','empty','Semua pengguna sudah punya pengeluaran')));app.appendChild(c4)}catch(x){}}
}
if(!getToken())showLogin(app,()=>{wireLogout();render()});else render();`, chartJs);

const profiling = shell('Profiling', 'prof', `<div id="content"></div>`,
`const app=document.getElementById('content');let timer=null;
const ms=(n)=>Number(n||0).toLocaleString('id-ID')+' ms';
const rowReq=(r)=>[{t:r.method+' '+r.path,mono:1},{t:String(r.status)},{t:ms(r.ms)},{t:ms(r.dbMs)},{t:String(r.queries)}];
async function render(first){
  let d;
  try{d=await api('/api/profiling')}catch(x){clearInterval(timer);if(x.status===401){setToken(null);return showLogin(app,()=>{wireLogout();render(true)},'Sesi berakhir. Silakan masuk lagi.')}
    if(x.status===403){app.textContent='';app.appendChild(el('h1','','Khusus admin'));app.appendChild(el('p','sub','Akun ini bukan admin. Masuk dengan akun admin.'));const b=el('button','','Ganti akun');b.onclick=()=>{setToken(null);location.reload()};app.appendChild(b);return}
    app.appendChild(el('p','bad',x.message));return}
  wireLogout();app.textContent='';
  const top=el('div','row');const t=el('div');t.appendChild(el('h1','','Profiling'));t.appendChild(el('p','sub',d.enabled?'Profiling aktif · refresh otomatis tiap 5 detik':'Profiling nonaktif (set DB_PROFILING=true)'));top.appendChild(t);
  const rb=el('button','ghost right','Reset data');rb.onclick=async()=>{await api('/api/profiling',{method:'DELETE'});render()};top.appendChild(rb);app.appendChild(top);
  const s=d.summary,g=el('div','grid');[['Request',s.requests],['Rata-rata waktu',ms(s.avgMs)],['Rata-rata query/request',s.avgQueries],['Rata-rata waktu DB',ms(s.avgDbMs)],['Total query',d.queries],['Query lambat (≥'+d.slowThresholdMs+' ms)',d.slowQueries,d.slowQueries?'bad':'ok']].forEach(x=>g.appendChild(card(x[0],x[1],x[2])));app.appendChild(g);
  const H=['Request','Status','Waktu','Waktu DB','Query'];
  const c1=el('div','cols');
  c1.appendChild(panel('Paling lama (overall)',d.mostTime.length?table(H,d.mostTime.map(rowReq),1):el('div','empty','Belum ada request')));
  c1.appendChild(panel('Paling banyak query',d.mostQueries.length?table(H,d.mostQueries.map(rowReq),1):el('div','empty','Belum ada request')));app.appendChild(c1);
  const c2=el('div','cols');
  c2.appendChild(panel('Paling lama di database',d.mostDbTime.length?table(H,d.mostDbTime.map(rowReq),1):el('div','empty','Belum ada request')));
  c2.appendChild(panel('Query SQL terlambat',d.slowest.length?table(['SQL','Waktu'],d.slowest.map(q=>[{t:q.sql.slice(0,90),mono:1},{t:ms(q.ms)}]),1):el('div','empty','Belum ada query')));app.appendChild(c2);
  if(first!==false&&!timer)timer=setInterval(()=>render(false),5000);
}
if(!getToken())showLogin(app,()=>{wireLogout();render(true)});else render(true);`);

module.exports = { home, statistik, profiling };
