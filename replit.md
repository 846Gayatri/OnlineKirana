# GramFresh — Online Kirana / 10-Minute Grocery Delivery

A grocery delivery app for Vijayawada, AP, India with per-gram pricing.

## Architecture

Three-part project:

| Part | Directory | Port | Description |
|------|-----------|------|-------------|
| Backend API | `backend/` | 3000 | Node.js + Express + SQLite |
| Customer App | `customer/` | 5000 | React + Vite (main preview) |
| Admin Dashboard | `admin/` | 5173 | React + Vite |

## Workflows

- **Backend API** — `cd backend && node server.js` (port 3000, console)
- **Start application** — `cd customer && npm run dev` (port 5000, webview)
- **Admin Dashboard** — `cd admin && npm run dev` (port 5173, console)

## Backend

- **Framework**: Express
- **Database**: SQLite via `better-sqlite3` (replaced `node:sqlite` which requires Node v22.5+)
- **Auth**: JWT + bcrypt (OTP-based for customers, phone+password for admins)
- **Migrations**: SQL files in `backend/src/models/migrations/`
- **Config**: `backend/.env` (JWT_SECRET, DB_PATH, UPLOAD_DIR, PORT)

## Frontend (Customer & Admin)

- **Stack**: React 19 + Vite
- **API**: Relative URLs (`/api`) proxied to backend at localhost:3000 via Vite proxy
- **Auth**: JWT stored in localStorage (`gf_token` for customer, `gf_admin_token` for admin)

## Key Notes

- Both frontends use `allowedHosts: true` and `host: '0.0.0.0'` for Replit proxy compatibility
- API calls use relative URLs (`/api`) so they work through Replit's proxy
- CORS in backend set to `origin: true` to allow all origins in dev
- OTP for customer login is always `123456` in development mode
- Default admin: must be seeded via `cd backend && node src/seed.js` if needed
