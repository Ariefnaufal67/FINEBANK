# FineBank API

Backend REST API untuk **FineBank Admin UI** (proyek Pemrograman Sisi Klien) — tugas Pemrograman Sisi Server.
Stack: Node.js 22, Express 5, Sequelize (SQLite lokal / PostgreSQL produksi), JWT, Zod, express-rate-limit, Swagger UI, node:test + supertest.

## Menjalankan
```bash
npm install
cp .env.example .env      # isi JWT_SECRET
npm run seed              # data contoh (password semua akun: password123)
npm run dev               # http://localhost:3000  | docs: /docs
npm test                  # 25 unit/integration test
```
Akun seed: `admin@finebank.test` (admin), `arief@finebank.test` (user).

## Fitur
- Auth JWT (register, login, me) + role `admin` / `user`
- CRUD Categories, Expenses, Bills; endpoint `GET /api/expenses/summary`, `POST /api/bills/:id/pay`
- Pagination (`page`, `limit`), filter (`q`, `categoryId`, `minAmount`, `maxAmount`, `from`, `to`, `status`), sort (`sort=-amount`)
- Throttling: 100 req/15 menit per IP untuk `/api`, 10 req/15 menit untuk login & register
- Validasi Zod, error JSON seragam, isolasi data per user
- Docs: Swagger UI di `/docs`, spesifikasi di `/openapi.json`; koleksi Postman di `postman/`

## Hosting gratis (Vercel + Neon)
1. Buat database di [neon.tech](https://neon.tech), salin connection string (`...?sslmode=require`).
2. Isi `DATABASE_URL` di `.env` lokal lalu `npm run seed` (membuat tabel + data contoh).
3. Push ke GitHub, impor repo di Vercel (`api/index.js` + `vercel.json` sudah disiapkan).
4. Environment Variables di Vercel: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`.
5. Cek `/health` dan `/docs`.
