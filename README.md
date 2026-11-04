# FineBank API

Backend REST API untuk **FineBank Admin UI** (proyek Pemrograman Sisi Klien) — tugas Pemrograman Sisi Server.
Stack: Node.js 22, Express 5, Sequelize (SQLite lokal / PostgreSQL produksi), JWT, Zod, express-rate-limit, Swagger UI, node:test + supertest.

## Menjalankan
```bash
npm install
cp .env.example .env      # isi JWT_SECRET
npm run migrate           # buat tabel lewat migrasi (folder migrations/)
npm run seed              # data contoh (NB: seed mereset tabel) (password semua akun: password123)
npm run dev               # http://localhost:3000  | docs: /docs
npm test                  # 39 unit/integration test
```
Akun seed: `admin@finebank.test` (admin), `arief@finebank.test` (user).

## Fitur
- Auth JWT (register, login, me) + role `admin` / `user`
- CRUD Categories, Expenses, Bills; endpoint `GET /api/expenses/summary`, `POST /api/bills/:id/pay`
- Pagination (`page`, `limit`), filter (`q`, `categoryId`, `minAmount`, `maxAmount`, `from`, `to`, `status`), sort (`sort=-amount`)
- Throttling: 100 req/15 menit per IP untuk `/api`, 10 req/15 menit untuk login & register
- Validasi Zod, error JSON seragam, isolasi data per user
- Docs: Swagger UI di `/docs`, spesifikasi di `/openapi.json`; koleksi Postman di `postman/`

## Migrasi dan seeder

- `migrations/`: riwayat skema (users, categories, expenses, bills) dengan `up` dan `down`, format sama dengan sequelize-cli. Status tercatat di tabel `SequelizeMeta`.
- `npm run migrate` memasang migrasi baru, `npm run migrate:undo [n]` membatalkan n migrasi terakhir (default 1), `npm run migrate:status` melihat status.
- `seeders/demo-seed.js` (`npm run seed`) dan `csv_data/` (`npm run import`) mengisi data contoh.
- Gunakan migrasi pada database baru. Database yang tabelnya sudah dibuat lewat `sync()` (mis. di Vercel/Neon sekarang) tidak perlu dimigrasi ulang.

## Halaman web

| URL | Isi |
|---|---|
| `/` | Beranda dan ringkasan |
| `/statistik` | Dashboard statistik (kartu, grafik Chart.js, tabel); admin juga melihat statistik pengguna |
| `/profiling` | Dashboard profiling request dan query ORM (khusus admin) |
| `/docs` | Swagger UI |

Halaman meminta login (token disimpan di sessionStorage), lalu memanggil API.

## Docker + PostgreSQL

```bash
docker compose up -d --build           # api (port 3000) + PostgreSQL 17
docker compose exec api npm run import # isi data dari csv_data/
# buka http://localhost:3000   (tabel dibuat otomatis oleh `npm run migrate`)
docker compose down                    # hentikan (data tetap di volume pgdata)
```

## Import CSV massal

`npm run import` membaca `csv_data/{users,categories,expenses,bills}.csv` lalu memasukkannya dengan `bulkCreate`
(satu query per tabel). Idempotent: baris yang sudah ada dilewati. Akun hasil import: `admin2@finebank.test` (admin),
`najwa@`, `ghiyatsi@`, `puji@finebank.test` (user), semua dengan password `password123`.

## Query relasional dan statistik

- `GET /api/stats/expenses`: COUNT/SUM/MIN/MAX/AVG, termurah dan termahal (JOIN kategori), total per kategori (GROUP BY), tren bulanan.
- `GET /api/stats/bills`: jumlah dan total per status, termasuk overdue.
- `GET /api/stats/users` (admin): LEFT JOIN + GROUP BY untuk pengguna teraktif, subquery NOT IN untuk pengguna tanpa pengeluaran.

## Profiling & optimasi ORM

Profiling aktif secara default (matikan dengan `DB_PROFILING=false`; ambang query lambat `SLOW_QUERY_MS=100`):
- Setiap respons `/api` membawa header `X-DB-Query-Count` dan `X-DB-Time-Ms`.
- Dashboard `/profiling` (admin) menampilkan jumlah request, rata-rata waktu, rata-rata query per request, request paling lama / paling banyak query / paling lama di database, dan SQL terlambat.
- Query lambat dan kemungkinan N+1 (>10 query per request) dicatat di log.
- `GET /api/profiling` memberi data yang sama dalam JSON; `DELETE /api/profiling` mereset.

Optimasi yang diterapkan: index (userId+date, categoryId, userId+dueDate, status), eager loading kategori dalam satu JOIN,
`count` tanpa JOIN yang paralel dengan data, `/expenses/summary` dan `/stats/*` memakai agregasi di database
(jumlah query konstan), pagination maksimum 100, pemilihan kolom, dan `bulkCreate` untuk import.

## Hosting gratis (Vercel + Neon)
1. Buat database di [neon.tech](https://neon.tech), salin connection string (`...?sslmode=require`).
2. Isi `DATABASE_URL` di `.env` lokal lalu `npm run seed` (membuat tabel + data contoh) atau `npm run migrate` lalu `npm run import`.
3. Push ke GitHub, impor repo di Vercel (`api/index.js` + `vercel.json` sudah disiapkan).
4. Environment Variables di Vercel: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`.
5. Cek `/health` dan `/docs`.
