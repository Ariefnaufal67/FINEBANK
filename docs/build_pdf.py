from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
                                Preformatted, KeepTogether)
from reportlab.graphics.shapes import Drawing, Rect, String, Line

ss = getSampleStyleSheet()
H1 = ParagraphStyle('H1', parent=ss['Heading1'], fontSize=16, spaceBefore=14, spaceAfter=8, textColor=colors.HexColor('#0f5f54'))
H2 = ParagraphStyle('H2', parent=ss['Heading2'], fontSize=12, spaceBefore=10, spaceAfter=4)
B = ParagraphStyle('B', parent=ss['BodyText'], fontSize=10, leading=14)
CODE = ParagraphStyle('C', parent=ss['Code'], fontSize=8, leading=10.5, backColor=colors.HexColor('#f3f4f6'), borderPadding=5, spaceBefore=4, spaceAfter=8)
SMALL = ParagraphStyle('S', parent=B, fontSize=8.5, leading=11)
TITLE = ParagraphStyle('T', parent=ss['Title'], fontSize=24, textColor=colors.HexColor('#0f5f54'))

def code(t): return Preformatted(t.strip('\n'), CODE)
def p(t, s=B): return Paragraph(t, s)
def table(rows, widths, header=True):
    cell = [[Paragraph(str(c), SMALL) for c in r] for r in rows]
    t = Table(cell, colWidths=widths, repeatRows=1 if header else 0)
    st = [('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#cbd5e1')), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
          ('LEFTPADDING', (0, 0), (-1, -1), 4), ('RIGHTPADDING', (0, 0), (-1, -1), 4)]
    if header: st += [('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#d7efe9'))]
    t.setStyle(TableStyle(st)); return t

def erd():
    d = Drawing(480, 268)
    def box(x, y, w, title, fields):
        h = 18 + 12 * len(fields)
        d.add(Rect(x, y - h, w, h, fillColor=colors.white, strokeColor=colors.HexColor('#0f5f54'), strokeWidth=1))
        d.add(Rect(x, y - 16, w, 16, fillColor=colors.HexColor('#0f5f54'), strokeColor=colors.HexColor('#0f5f54')))
        d.add(String(x + 6, y - 12, title, fontName='Helvetica-Bold', fontSize=9, fillColor=colors.white))
        for i, f in enumerate(fields):
            d.add(String(x + 6, y - 28 - 12 * i, f, fontName='Helvetica', fontSize=7.5))
        return (x, y, w, h)
    box(10, 240, 130, 'users', ['PK id', 'name', 'email (unique)', 'passwordHash', 'role: admin|user'])
    box(180, 240, 130, 'categories', ['PK id', 'FK userId', 'name', 'unique(userId,name)'])
    box(180, 150, 130, 'expenses', ['PK id', 'FK userId', 'FK categoryId (null)', 'title', 'amount DECIMAL(14,2)', 'date', 'note'])
    box(340, 240, 130, 'bills', ['PK id', 'FK userId', 'name', 'amount DECIMAL(14,2)', 'dueDate', 'status: unpaid|paid', 'paidAt'])
    L = lambda x1, y1, x2, y2: d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor('#475569'), strokeWidth=1))
    # users -> categories
    L(140, 215, 180, 215); d.add(String(146, 218, '1:N', fontSize=7))
    # users -> bills (lewat atas)
    L(75, 240, 75, 254); L(75, 254, 405, 254); L(405, 254, 405, 240); d.add(String(230, 257, 'users 1:N bills', fontSize=7))
    # users -> expenses (lewat kiri-bawah)
    L(75, 162, 75, 100); L(75, 100, 180, 100); d.add(String(100, 103, '1:N', fontSize=7))
    # categories -> expenses
    L(245, 174, 245, 150); d.add(String(250, 158, '1:N (SET NULL)', fontSize=7))
    return d

story = []
story += [Spacer(1, 3 * cm), p('FineBank API', TITLE),
          p('Dokumentasi &amp; Tutorial Backend', ParagraphStyle('sub', parent=B, fontSize=14, alignment=1)),
          Spacer(1, 1 * cm),
          table([['Mata kuliah', 'Pemrograman Sisi Server'], ['Dosen', 'Ajib Susanto, M.Kom'],
                 ['Nama', 'Arief Naufal Al-Azmi'], ['NIM', 'A11.2023.15048'],
                 ['Program Studi', 'Teknik Informatika (S1), Universitas Dian Nuswantoro'],
                 ['Proyek asal', 'FineBank Admin UI (Pemrograman Sisi Klien) - github.com/Ariefnaufal67/admin-ui'],
                 ['Repository backend', 'github.com/Ariefnaufal67/finebank-api (isi setelah di-push)'],
                 ['URL hosting', '(isi setelah deploy, mis. https://finebank-api.vercel.app)']],
                [4 * cm, 11.5 * cm], header=False),
          PageBreak()]

story += [p('1. Latar Belakang &amp; Ruang Lingkup', H1),
          p('Pada mata kuliah Pemrograman Sisi Klien dibuat <b>FineBank Admin UI</b> (React + Vite + Tailwind + MUI) dengan halaman Expenses dan Bills. '
            'Tugas ini membangun backend pasangannya: REST API yang menyimpan data pengguna, kategori, pengeluaran (expenses), dan tagihan (bills) '
            'sehingga frontend tidak lagi bergantung pada data statis.'),
          table([['Ketentuan tugas', 'Implementasi'],
                 ['Desain database, model &amp; schema', 'Bab 2: 4 tabel dengan relasi, index, dan constraint (Sequelize)'],
                 ['API', 'Bab 4: REST JSON, 21 endpoint, format respons seragam'],
                 ['Auth', 'JWT Bearer + role admin/user, bcrypt'],
                 ['Throttling, pagination, filtering', 'express-rate-limit; page/limit/sort; q, rentang nominal &amp; tanggal, kategori, status'],
                 ['Unit testing', '25 test (node:test + supertest), semua lulus'],
                 ['Docs', 'Swagger UI (/docs), OpenAPI JSON, dokumen PDF ini'],
                 ['Uji Postman', 'Koleksi di folder postman/ dengan test script otomatis'],
                 ['Hosting', 'Vercel + Neon PostgreSQL (Bab 8)']],
                [5.5 * cm, 10 * cm]),
          p('2. Desain Database', H1),
          p('Database relasional dipilih karena data keuangan bersifat terstruktur dan butuh integritas referensial. Pengembangan memakai SQLite, produksi memakai PostgreSQL; '
            'pergantian cukup lewat variabel <font face="Courier">DATABASE_URL</font> karena ORM Sequelize menyamakan model.'),
          erd(),
          p('Gambar 1. ERD FineBank API', SMALL),
          p('Aturan relasi', H2),
          table([['Relasi', 'Kardinalitas', 'On delete'],
                 ['users - categories', '1 : N', 'CASCADE'],
                 ['users - expenses', '1 : N', 'CASCADE'],
                 ['users - bills', '1 : N', 'CASCADE'],
                 ['categories - expenses', '1 : N (categoryId opsional)', 'SET NULL']],
                [6 * cm, 5.5 * cm, 4 * cm]),
          p('Index &amp; constraint', H2),
          table([['Tabel', 'Aturan'],
                 ['users', 'email UNIQUE; passwordHash dikecualikan dari query default (defaultScope)'],
                 ['categories', 'UNIQUE (userId, name)'],
                 ['expenses', 'INDEX (userId, date), INDEX (categoryId); amount DECIMAL(14,2)'],
                 ['bills', 'INDEX (userId, dueDate), INDEX (status); status ENUM unpaid|paid. Status "overdue" tidak disimpan, dihitung dari unpaid + dueDate &lt; hari ini']],
                [3 * cm, 12.5 * cm]),
          PageBreak()]

story += [p('3. Struktur Proyek', H1),
          code("""
finebank-api/
  src/
    app.js            # susunan middleware & route (createApp)
    server.js         # koneksi DB, sync, listen
    config.js  db.js  # env, koneksi Sequelize
    models/index.js   # User, Category, Expense, Bill + relasi
    schemas.js        # validasi Zod
    openapi.js        # spesifikasi Swagger
    middleware/       # auth (JWT, role), validate, error
    routes/           # auth, categories, expenses, bills, users
    utils/            # pagination, errors
    seed.js           # data contoh
  test/               # *.test.js
  postman/            # koleksi Postman
  api/index.js vercel.json .env.example README.md"""),
          p('Alur request: <b>rate limiter</b> &rarr; <b>authenticate</b> (verifikasi JWT, muat user) &rarr; <b>validate</b> (Zod) &rarr; route handler (query ber-scope user) &rarr; '
            '<b>errorHandler</b>. Express 5 meneruskan error dari handler async secara otomatis.'),
          p('4. Daftar Endpoint', H1),
          table([['Method', 'Path', 'Auth', 'Keterangan'],
                 ['POST', '/api/auth/register', '-', 'Daftar; 201, 400, 409'],
                 ['POST', '/api/auth/login', '-', 'Login, kembalikan token; 401'],
                 ['GET', '/api/auth/me', 'Bearer', 'Profil user login'],
                 ['GET/POST', '/api/categories', 'Bearer', 'Daftar / buat kategori'],
                 ['PUT/DELETE', '/api/categories/:id', 'Bearer', 'Ubah / hapus kategori'],
                 ['GET', '/api/expenses', 'Bearer', 'Daftar + pagination, filter, sort'],
                 ['GET', '/api/expenses/summary', 'Bearer', 'Total &amp; ringkasan per kategori'],
                 ['POST', '/api/expenses', 'Bearer', 'Tambah expense'],
                 ['GET/PUT/DELETE', '/api/expenses/:id', 'Bearer', 'Detail / ubah / hapus'],
                 ['GET', '/api/bills', 'Bearer', 'Daftar + pagination, filter status, sort'],
                 ['POST', '/api/bills', 'Bearer', 'Tambah bill'],
                 ['GET/PUT/DELETE', '/api/bills/:id', 'Bearer', 'Detail / ubah / hapus'],
                 ['POST', '/api/bills/:id/pay', 'Bearer', 'Tandai lunas (isi paidAt)'],
                 ['GET', '/api/users', 'Admin', 'Daftar user + pagination, q, role'],
                 ['DELETE', '/api/users/:id', 'Admin', 'Hapus user'],
                 ['GET', '/health, /docs, /openapi.json', '-', 'Health check &amp; dokumentasi']],
                [2.6 * cm, 5.2 * cm, 1.8 * cm, 5.9 * cm]),
          p('Format respons', H2),
          code("""
// sukses
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 10, "total": 25,
                                              "totalPages": 3, "hasNext": true, "hasPrev": false } }
// gagal
{ "success": false, "message": "Validasi gagal",
  "errors": [ { "field": "amount", "message": "Nominal harus lebih dari 0" } ] }"""),
          PageBreak()]

story += [p('5. Auth, Throttling, Pagination &amp; Filtering', H1),
          p('5.1 Autentikasi', H2),
          p('Password di-hash dengan bcrypt (cost 10). Login mengembalikan JWT (HS256, masa berlaku 1 hari) berisi id dan role. '
            'Middleware <font face="Courier">authenticate</font> memverifikasi token dan memuat user dari database, sehingga akun yang sudah dihapus langsung kehilangan akses. '
            'Role <b>user</b> hanya melihat data miliknya (query selalu ber-scope <font face="Courier">userId</font>, data orang lain menghasilkan 404); '
            'role <b>admin</b> melihat seluruh data dan dapat mengelola user. Registrasi publik selalu membuat role user; admin dibuat lewat seed/DB.'),
          code("""
POST /api/auth/login
{ "email": "arief@finebank.test", "password": "password123" }
-> 200 { "success": true, "data": { "user": {...}, "token": "eyJhbGci..." } }

GET /api/expenses
Authorization: Bearer eyJhbGci..."""),
          p('5.2 Throttling', H2),
          table([['Cakupan', 'Batas default', 'Env'],
                 ['Semua /api/*', '100 request / 15 menit / IP', 'RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS'],
                 ['/api/auth/login &amp; /register', '10 request / 15 menit / IP', 'RATE_LIMIT_AUTH_MAX']],
                [5 * cm, 5 * cm, 5.5 * cm]),
          p('Kelebihan batas dijawab <b>429</b> dengan pesan JSON dan header standar <font face="Courier">RateLimit-*</font>. '
            'Pada uji langsung, 12 percobaan login berturut-turut menghasilkan 401 sebanyak 9 kali lalu 429 mulai percobaan ke-10 (satu request login awal ikut terhitung).'),
          p('5.3 Pagination, filter, dan sort', H2),
          table([['Parameter', 'Endpoint', 'Contoh / aturan'],
                 ['page, limit', 'semua list', 'default 1 dan 10; limit maksimum 100'],
                 ['sort', 'expenses, bills', 'sort=-amount (desc), sort=date (asc); hanya kolom yang diizinkan'],
                 ['q', 'expenses, bills, users', 'pencarian teks pada title / name'],
                 ['categoryId', 'expenses', 'categoryId=2'],
                 ['minAmount, maxAmount', 'expenses', 'rentang nominal'],
                 ['from, to', 'expenses (date), bills (dueDate)', 'format YYYY-MM-DD, divalidasi'],
                 ['status', 'bills', 'unpaid | paid | overdue']],
                [3.6 * cm, 4.4 * cm, 7.5 * cm]),
          code("GET /api/expenses?q=kopi&minAmount=10000&from=2026-10-01&sort=-amount&page=1&limit=5\nGET /api/bills?status=overdue"),
          p('Sort memakai whitelist kolom sehingga nilai sembarang (mis. passwordHash) diabaikan. Query memakai parameter terikat Sequelize, bukan penggabungan string, sehingga aman dari SQL injection.'),
          PageBreak()]

story += [p('6. Unit Testing', H1),
          p('Test memakai <font face="Courier">node:test</font> bawaan Node.js dan <font face="Courier">supertest</font>, dengan SQLite in-memory yang direset sebelum tiap test. Jalankan <font face="Courier">npm test</font>.'),
          table([['Berkas', 'Yang diuji'],
                 ['pagination.test.js (3)', 'parsePagination, parseSort, buildMeta (unit murni)'],
                 ['auth.test.js (7)', 'register, isi klaim JWT, validasi, duplikat email, login benar/salah, /me, throttling login &amp; global'],
                 ['expenses.test.js (8)', 'wajib login, CRUD, validasi, pagination meta, filter + sort, isolasi data &amp; akses admin, categoryId milik orang lain, summary'],
                 ['bills.test.js (6)', 'isOverdue, bayar bill, filter status, pagination, akses khusus admin, 404 &amp; JSON rusak']],
                [4.6 * cm, 10.9 * cm]),
          p('Hasil eksekusi:', H2),
          code("""
# tests 25
# pass 25
# fail 0"""),
          p('7. Pengujian dengan Postman', H1),
          p('Impor <font face="Courier">postman/FineBank.postman_collection.json</font>, set variabel <font face="Courier">baseUrl</font> (lokal atau URL hosting), lalu jalankan dengan Collection Runner. '
            'Folder berurutan: Auth, Categories, Expenses, Bills. Token dan id disimpan otomatis ke variabel koleksi lewat test script, dan tiap request memeriksa status code (termasuk kasus 400 dan 401). '
            'Jalankan <font face="Courier">npm run seed</font> dulu agar request "Login (seed)" berhasil.'),
          p('Bukti uji langsung terhadap server yang berjalan (curl):', H2),
          code("""
GET /api/expenses?limit=2&sort=-amount   -> 200, 2 data, meta {total:4, totalPages:2, hasNext:true}
GET /api/bills?status=overdue            -> 200, hanya bill "Listrik" (isOverdue:true)
GET /docs/                               -> 200 (Swagger UI)
12x POST /api/auth/login salah           -> 401 x9, lalu 429"""),
          p('Lampirkan tangkapan layar Collection Runner pada bagian ini sebelum dikumpulkan.', SMALL),
          PageBreak()]

story += [p('8. Hosting (Vercel + Neon PostgreSQL, gratis)', H1),
          p('Vercel menjalankan kode sebagai serverless function sehingga file SQLite tidak persisten. Karena itu produksi memakai PostgreSQL dari <b>Neon</b> '
            '(paket gratis). Kode yang disiapkan untuk Vercel: <font face="Courier">api/index.js</font> (entry point yang mengekspor app Express dan membuat tabel sekali per cold start) '
            'dan <font face="Courier">vercel.json</font> (semua route diarahkan ke /api). Koneksi PostgreSQL memakai SSL otomatis bila URL memuat sslmode=require.'),
          table([['Langkah', 'Detail'],
                 ['1', 'Daftar di neon.tech, buat project, salin connection string (berakhiran ?sslmode=require).'],
                 ['2', 'Push proyek ke GitHub (repo sendiri; .env dan data/ sudah di .gitignore).'],
                 ['3', 'Isi data contoh ke Neon dari komputer lokal: tulis DATABASE_URL di file .env, lalu jalankan npm run seed (membuat tabel + akun contoh). Perhatian: seed menghapus isi tabel.'],
                 ['4', 'vercel.com: Add New Project, impor repo finebank-api. Framework preset: Other; build command dan output biarkan kosong.'],
                 ['5', 'Environment Variables: DATABASE_URL (dari Neon), JWT_SECRET (string acak panjang), CORS_ORIGIN = https://admin-ui-chi-rust.vercel.app. Lalu Deploy.'],
                 ['6', 'Uji: buka https://nama-proyek.vercel.app/health lalu /docs. Isi URL ini di sampul dan pada variabel baseUrl Postman.']],
                [2 * cm, 13.5 * cm]),
          p('Pengujian: handler Vercel dan seluruh endpoint dijalankan terhadap PostgreSQL sungguhan (login, pagination, filter, pencarian tanpa membedakan huruf besar/kecil, summary, bayar bill, '
            'duplikat kategori 409, penghapusan kategori mengosongkan categoryId) dan semuanya sesuai. Alternatif: Railway/Render dengan <font face="Courier">node src/server.js</font>.'),
          p('Catatan: batas rate limit disimpan di memori per instance, sehingga di serverless setiap instance menghitung sendiri.', SMALL),
          p('9. Integrasi dengan FineBank Admin UI', H1),
          p('Frontend sebelumnya memakai backend JWT milik mata kuliah (endpoint /login, /expenses, /bills; error berbentuk {msg}). '
            'Integrasi dilakukan hanya di <font face="Courier">src/services/authService.jsx</font>, sehingga halaman, komponen, dan tes Cypress tidak berubah:'),
          table([['Penyesuaian', 'Alasan'],
                 ['URL dari VITE_API_URL (default http://localhost:3000)', 'Dapat diganti ke URL hosting tanpa ubah kode; set juga di Environment Variables Vercel'],
                 ['POST /api/auth/login, hasilnya dikembalikan sebagai { refreshToken }', 'Signin.jsx tetap memakai properti refreshToken'],
                 ['JWT berisi name, email, role', 'authContext memakai jwtDecode, MainLayout menampilkan user.name'],
                 ['Error {message, errors} dipetakan ke { msg }', 'Komponen UI membaca err.msg'],
                 ['Expenses: limit=100, category objek diratakan menjadi nama string', 'API berhalaman (default 10); CardExpenseComparison mengharapkan category berupa string'],
                 ['Bills: status=unpaid, sort=dueDate', 'Kartu Upcoming Bill hanya menampilkan tagihan yang belum dibayar'],
                 ['Nama kategori seed: Food, Transport, Entertainment', 'Cocok dengan peta ikon kategori di frontend']],
                [7.2 * cm, 8.3 * cm]),
          code("""
// authService.jsx (ringkas)
const API_URL = (import.meta.env?.VITE_API_URL || "http://localhost:3000");
export const loginService = async (email, password) => {
  const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
  return { refreshToken: res.data.data.token };
};"""),
          p('Diverifikasi dengan menjalankan service frontend yang asli terhadap server backend: login, jwtDecode (name dan role terbaca), 4 expenses ber-kategori string, '
            '2 bills unpaid, serta pesan error login dan register terpetakan ke { msg }. Build Vite membaca VITE_API_URL dengan benar.'),
          p('10. Keamanan &amp; Batasan', H1),
          p('Terapan: helmet, CORS terkonfigurasi, bcrypt, batas ukuran body 100 KB, validasi semua input, scope data per user, secret lewat environment. '
            'Batasan yang diketahui: belum ada refresh token / logout server-side (token berlaku 1 hari), '
            'rate limit disimpan di memori proses sehingga tidak dibagi antar instance, dan skema dibuat dengan <font face="Courier">sync()</font> tanpa migrasi bertahap.'),
          p('11. Kesimpulan', H1),
          p('Backend FineBank memenuhi seluruh poin ruang lingkup tugas: desain database relasional, API REST ber-auth, throttling, pagination dan filtering, 25 test otomatis, dokumentasi Swagger, pengujian Postman, dan konfigurasi hosting.')]

def footer(c, d):
    c.saveState(); c.setFont('Helvetica', 8); c.setFillColor(colors.grey)
    c.drawString(2 * cm, 1.2 * cm, 'FineBank API - Pemrograman Sisi Server'); c.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f'Hal. {d.page}'); c.restoreState()

SimpleDocTemplate('docs/FineBank-API-Dokumentasi.pdf', pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=2 * cm, bottomMargin=2 * cm,
                  title='FineBank API - Dokumentasi', author='Arief Naufal Al-Azmi').build(story, onFirstPage=footer, onLaterPages=footer)
print('built')
