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
.modal{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;z-index:10}.modal form,.modal .box{background:var(--card);border-radius:14px;padding:22px;width:100%;max-width:460px;display:grid;gap:12px;max-height:92vh;overflow:auto}
label{font-size:12px;color:var(--muted);display:grid;gap:6px;letter-spacing:.04em}select,textarea{background:#0b1716;border:1px solid var(--line);color:var(--text);border-radius:8px;padding:10px 12px;font-size:14px;width:100%;font-family:inherit}
.badge{padding:2px 8px;border-radius:999px;font-size:12px;background:var(--card2)}.badge.bad{background:rgba(229,104,106,.18)}.badge.ok{background:rgba(41,157,145,.2)}.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 14px;align-items:center}.toolbar input,.toolbar select{width:auto;min-width:150px}.act button{padding:4px 10px;font-size:12px;margin-left:4px}button.danger{background:transparent;color:var(--bad);border:1px solid var(--bad)}.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--card2);padding:10px 18px;border-radius:10px;z-index:20}.errbox{color:var(--bad);font-size:13px}
.empty{color:var(--muted);padding:12px 0}.chart{position:relative;height:260px}.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.right{margin-left:auto}
`;

const shell = (title, active, body, script, extraHead = '') => `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · FineBank</title>${extraHead}<style>${css}</style></head><body>
<header><b>FineBank API</b><nav>
<a href="/" class="${active === 'home' ? 'on' : ''}">Beranda</a>
<a href="/statistik" class="${active === 'stat' ? 'on' : ''}">Statistik</a>
<a href="/pengeluaran" class="${active === 'exp' ? 'on' : ''}">Pengeluaran</a>
<a href="/tagihan" class="${active === 'bill' ? 'on' : ''}">Tagihan</a>
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
  if(!r.ok){const e=new Error(j.message||('HTTP '+r.status));e.status=r.status;e.details=j.errors;throw e}
  return opt.full?j:(j.data!==undefined?j.data:j);
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


const crudLib = `
function toast(t){const e=el('div','toast',t);document.body.appendChild(e);setTimeout(()=>e.remove(),2200)}
function errText(x){return x.message+(Array.isArray(x.details)?': '+x.details.map(d=>(d.field?d.field+' ':'')+d.message).join('; '):'')}
// Modal form: fields=[{name,label,type,options,required,value}]; onSave(values) mengembalikan promise
function formModal(title,fields,onSave,submitLabel){
  const bg=el('div','modal');const f=el('form');f.appendChild(el('h1','',title));f.lastChild.style.fontSize='20px';
  const inputs={};
  fields.forEach(d=>{const l=el('label','',d.label.toUpperCase());let i;
    if(d.type==='select'){i=el('select');d.options.forEach(o=>{const op=el('option','',o.label);op.value=o.value;i.appendChild(op)})}
    else if(d.type==='textarea'){i=el('textarea');i.rows=3}
    else{i=el('input');i.type=d.type||'text';if(d.type==='number'){i.step='any';i.min='0'}}
    if(d.required)i.required=true;i.value=d.value==null?'':d.value;inputs[d.name]=i;l.appendChild(i);f.appendChild(l)});
  const err=el('div','errbox');const row=el('div','row');const cancel=el('button','ghost','Batal');cancel.type='button';cancel.onclick=()=>bg.remove();
  const ok=el('button','',submitLabel||'Simpan');ok.type='submit';row.appendChild(cancel);row.appendChild(ok);f.appendChild(err);f.appendChild(row);
  f.onsubmit=async(e)=>{e.preventDefault();err.textContent='';const v={};fields.forEach(d=>{v[d.name]=inputs[d.name].value});ok.disabled=true;
    try{await onSave(v);bg.remove()}catch(x){err.textContent=errText(x);ok.disabled=false}};
  bg.appendChild(f);document.body.appendChild(bg);const first=f.querySelector('input,select,textarea');if(first)first.focus();
}
function pager(box,meta,go){box.textContent='';const prev=el('button','ghost','‹ Sebelumnya');prev.disabled=!meta.hasPrev;prev.onclick=()=>go(meta.page-1);
  const next=el('button','ghost','Berikutnya ›');next.disabled=!meta.hasNext;next.onclick=()=>go(meta.page+1);
  box.appendChild(prev);box.appendChild(el('span','sub','Halaman '+meta.page+' dari '+meta.totalPages+' · '+meta.total+' data'));box.appendChild(next);box.className='row';box.style.marginTop='14px'}
function authGuard(app,render){
  if(!getToken())return showLogin(app,()=>{wireLogout();render()});render()}
function qs(o){return Object.entries(o).filter(([,v])=>v!==''&&v!=null).map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&')}
`;

const shellCrud = (title, active, script) => shell(title, active, '<div id="content"></div>', crudLib + script);

const pengeluaran = shellCrud('Pengeluaran', 'exp', `
const app=document.getElementById('content');
const state={page:1,q:'',categoryId:'',sort:'-date'};let cats=[];
async function loadCats(){cats=await api('/api/categories')}
const catOptions=(withAll)=>[{value:'',label:withAll?'Semua kategori':'Tanpa kategori'}].concat(cats.map(c=>({value:c.id,label:c.name})));
function expenseForm(e){
  const t=new Date().toISOString().slice(0,10);
  formModal(e?'Ubah Pengeluaran':'Tambah Pengeluaran',[
    {name:'title',label:'Judul',required:true,value:e&&e.title},
    {name:'amount',label:'Jumlah (Rp)',type:'number',required:true,value:e&&e.amount},
    {name:'date',label:'Tanggal',type:'date',required:true,value:e?e.date:t},
    {name:'categoryId',label:'Kategori',type:'select',options:catOptions(false),value:e&&e.category?e.category.id:''},
    {name:'note',label:'Catatan',type:'textarea',value:e&&e.note}],
    async(v)=>{const body={title:v.title,amount:Number(v.amount),date:v.date,categoryId:v.categoryId?Number(v.categoryId):null,note:v.note};
      await api(e?'/api/expenses/'+e.id:'/api/expenses',{method:e?'PUT':'POST',body:JSON.stringify(body)});toast(e?'Pengeluaran diubah':'Pengeluaran ditambah');load()});
}
function categoryManager(){
  const bg=el('div','modal');const box=el('div','box');box.appendChild(el('h1','','Kelola Kategori'));box.firstChild.style.fontSize='20px';
  const list=el('div');const err=el('div','errbox');
  async function draw(){await loadCats();list.textContent='';
    if(!cats.length)list.appendChild(el('div','empty','Belum ada kategori'));
    cats.forEach(c=>{const r=el('div','row');r.style.padding='6px 0';r.appendChild(el('span','',c.name));r.lastChild.style.flex='1';
      const ed=el('button','ghost','Ubah');ed.onclick=()=>formModal('Ubah Kategori',[{name:'name',label:'Nama',required:true,value:c.name}],async(v)=>{await api('/api/categories/'+c.id,{method:'PUT',body:JSON.stringify({name:v.name})});draw();load()});
      const del=el('button','danger','Hapus');del.onclick=async()=>{if(!confirm('Hapus kategori "'+c.name+'"? Pengeluaran terkait menjadi tanpa kategori.'))return;try{await api('/api/categories/'+c.id,{method:'DELETE'});draw();load()}catch(x){err.textContent=errText(x)}};
      r.appendChild(ed);r.appendChild(del);list.appendChild(r)})}
  const add=el('button','','+ Kategori baru');add.onclick=()=>formModal('Kategori Baru',[{name:'name',label:'Nama',required:true}],async(v)=>{await api('/api/categories',{method:'POST',body:JSON.stringify({name:v.name})});draw()});
  const close=el('button','ghost','Tutup');close.onclick=()=>bg.remove();const row=el('div','row');row.appendChild(add);row.appendChild(close);
  [list,err,row].forEach(x=>box.appendChild(x));bg.appendChild(box);document.body.appendChild(bg);draw();
}
async function load(){
  let res;
  try{res=await api('/api/expenses?'+qs({page:state.page,limit:10,q:state.q,categoryId:state.categoryId,sort:state.sort}),{full:true})}
  catch(x){if(x.status===401){setToken(null);return showLogin(app,()=>{wireLogout();init()},'Sesi berakhir. Silakan masuk lagi.')}toast(errText(x));return}
  const body=document.getElementById('tbody'),pg=document.getElementById('pager');body.textContent='';
  if(!res.data.length){const tr=el('tr');const td=el('td','empty','Belum ada pengeluaran');td.colSpan=5;tr.appendChild(td);body.appendChild(tr)}
  res.data.forEach(e=>{const tr=el('tr');tr.appendChild(el('td','',e.date));tr.appendChild(el('td','',e.title));
    const c=el('td');c.appendChild(el('span','badge',e.category?e.category.name:'—'));tr.appendChild(c);tr.appendChild(el('td','r',rp(e.amount)));
    const a=el('td','r act');const ed=el('button','ghost','Ubah');ed.onclick=()=>expenseForm(e);
    const del=el('button','danger','Hapus');del.onclick=async()=>{if(!confirm('Hapus "'+e.title+'"?'))return;try{await api('/api/expenses/'+e.id,{method:'DELETE'});toast('Pengeluaran dihapus');load()}catch(x){toast(errText(x))}};
    a.appendChild(ed);a.appendChild(del);tr.appendChild(a);body.appendChild(tr)});
  pager(pg,res.meta,(p)=>{state.page=p;load()});
}
async function init(){
  wireLogout();await loadCats();app.textContent='';
  const top=el('div','row');const h=el('div');h.appendChild(el('h1','','Pengeluaran'));h.appendChild(el('p','sub','CRUD pengeluaran: /api/expenses'+(role()==='admin'?' (admin: semua pengguna)':'')));top.appendChild(h);
  const add=el('button','','+ Tambah Pengeluaran');add.onclick=()=>expenseForm(null);const km=el('button','ghost','Kelola Kategori');km.onclick=categoryManager;const ba=el('div','row right');ba.appendChild(km);ba.appendChild(add);top.appendChild(ba);app.appendChild(top);
  const tb=el('div','toolbar');const q=el('input');q.placeholder='Cari judul...';q.value=state.q;
  let t;q.oninput=()=>{clearTimeout(t);t=setTimeout(()=>{state.q=q.value;state.page=1;load()},300)};
  const cs=el('select');catOptions(true).forEach(o=>{const op=el('option','',o.label);op.value=o.value;cs.appendChild(op)});cs.onchange=()=>{state.categoryId=cs.value;state.page=1;load()};
  const so=el('select');[['-date','Terbaru'],['date','Terlama'],['-amount','Termahal'],['amount','Termurah']].forEach(o=>{const op=el('option','',o[1]);op.value=o[0];so.appendChild(op)});so.value=state.sort;so.onchange=()=>{state.sort=so.value;load()};
  [q,cs,so].forEach(x=>tb.appendChild(x));app.appendChild(tb);
  const card=el('div','card');const tbl=el('table');const hd=el('tr');['Tanggal','Judul','Kategori','Jumlah','Aksi'].forEach((x,i)=>hd.appendChild(el('th',i>=3?'r':'',x)));tbl.appendChild(hd);
  const tbody=el('tbody');tbody.id='tbody';tbl.appendChild(tbody);card.appendChild(tbl);app.appendChild(card);const pg=el('div');pg.id='pager';app.appendChild(pg);load();
}
authGuard(app,init);`);

const tagihan = shellCrud('Tagihan', 'bill', `
const app=document.getElementById('content');
const state={page:1,q:'',status:'',sort:'dueDate'};
function billForm(b){
  const t=new Date().toISOString().slice(0,10);
  formModal(b?'Ubah Tagihan':'Tambah Tagihan',[
    {name:'name',label:'Nama tagihan',required:true,value:b&&b.name},
    {name:'amount',label:'Jumlah (Rp)',type:'number',required:true,value:b&&b.amount},
    {name:'dueDate',label:'Jatuh tempo',type:'date',required:true,value:b?b.dueDate:t}],
    async(v)=>{const body={name:v.name,amount:Number(v.amount),dueDate:v.dueDate};
      await api(b?'/api/bills/'+b.id:'/api/bills',{method:b?'PUT':'POST',body:JSON.stringify(body)});toast(b?'Tagihan diubah':'Tagihan ditambah');load()});
}
async function load(){
  let res;
  try{res=await api('/api/bills?'+qs({page:state.page,limit:10,q:state.q,status:state.status,sort:state.sort}),{full:true})}
  catch(x){if(x.status===401){setToken(null);return showLogin(app,()=>{wireLogout();init()},'Sesi berakhir. Silakan masuk lagi.')}toast(errText(x));return}
  const body=document.getElementById('tbody'),pg=document.getElementById('pager');body.textContent='';
  if(!res.data.length){const tr=el('tr');const td=el('td','empty','Belum ada tagihan');td.colSpan=5;tr.appendChild(td);body.appendChild(tr)}
  res.data.forEach(b=>{const tr=el('tr');tr.appendChild(el('td','',b.dueDate));tr.appendChild(el('td','',b.name));tr.appendChild(el('td','r',rp(b.amount)));
    const s=el('td');s.appendChild(el('span','badge '+(b.status==='paid'?'ok':(b.isOverdue?'bad':'')),b.status==='paid'?'Lunas':(b.isOverdue?'Terlambat':'Belum dibayar')));tr.appendChild(s);
    const a=el('td','r act');
    if(b.status!=='paid'){const pay=el('button','','Bayar');pay.onclick=async()=>{try{await api('/api/bills/'+b.id+'/pay',{method:'POST'});toast('Ditandai lunas');load()}catch(x){toast(errText(x))}};a.appendChild(pay)}
    const ed=el('button','ghost','Ubah');ed.onclick=()=>billForm(b);
    const del=el('button','danger','Hapus');del.onclick=async()=>{if(!confirm('Hapus "'+b.name+'"?'))return;try{await api('/api/bills/'+b.id,{method:'DELETE'});toast('Tagihan dihapus');load()}catch(x){toast(errText(x))}};
    a.appendChild(ed);a.appendChild(del);tr.appendChild(a);body.appendChild(tr)});
  pager(pg,res.meta,(p)=>{state.page=p;load()});
}
function init(){
  wireLogout();app.textContent='';
  const top=el('div','row');const h=el('div');h.appendChild(el('h1','','Tagihan'));h.appendChild(el('p','sub','CRUD tagihan: /api/bills · status "Terlambat" dihitung dari belum dibayar dan lewat jatuh tempo'));top.appendChild(h);
  const add=el('button','right','+ Tambah Tagihan');add.onclick=()=>billForm(null);top.appendChild(add);app.appendChild(top);
  const tb=el('div','toolbar');const q=el('input');q.placeholder='Cari nama...';q.value=state.q;let t;q.oninput=()=>{clearTimeout(t);t=setTimeout(()=>{state.q=q.value;state.page=1;load()},300)};
  const st=el('select');[['','Semua status'],['unpaid','Belum dibayar'],['overdue','Terlambat'],['paid','Lunas']].forEach(o=>{const op=el('option','',o[1]);op.value=o[0];st.appendChild(op)});st.onchange=()=>{state.status=st.value;state.page=1;load()};
  const so=el('select');[['dueDate','Jatuh tempo terdekat'],['-dueDate','Jatuh tempo terjauh'],['-amount','Termahal']].forEach(o=>{const op=el('option','',o[1]);op.value=o[0];so.appendChild(op)});so.onchange=()=>{state.sort=so.value;load()};
  [q,st,so].forEach(x=>tb.appendChild(x));app.appendChild(tb);
  const card=el('div','card');const tbl=el('table');const hd=el('tr');['Jatuh tempo','Nama','Jumlah','Status','Aksi'].forEach((x,i)=>hd.appendChild(el('th',(i===2||i===4)?'r':'',x)));tbl.appendChild(hd);
  const tbody=el('tbody');tbody.id='tbody';tbl.appendChild(tbody);card.appendChild(tbl);app.appendChild(card);const pg=el('div');pg.id='pager';app.appendChild(pg);load();
}
authGuard(app,init);`);

module.exports = { home, statistik, profiling, pengeluaran, tagihan };
