# Changelog

All notable changes to INACORTS are documented in this file.

---

## [1.2.0] — 2026-03-03

### Added

**Backend Security**
- `ENVIRONMENT` setting (`development` / `production`) controls Swagger UI and security behaviour
- Trusted-host middleware blocks requests from unknown `Host` headers in production (403 Forbidden)
- `ALLOWED_ORIGINS` environment variable for configurable CORS origins
- Swagger UI (`/docs`), ReDoc (`/redoc`), and OpenAPI schema (`/openapi.json`) disabled in production mode

**Nginx Hardening**
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`
- Nginx now sets `Host: backend` when proxying to the backend (passes trusted-host check)
- `/docs`, `/redoc`, `/openapi.json` return 404 at the Nginx level in production

### Changed

**Docker Network Isolation**
- Backend container no longer publishes port 8000 to the host — uses `expose: 8000` (internal only)
- All external traffic reaches the backend exclusively through the Nginx reverse proxy on port 3000
- Docker Compose defaults to `ENVIRONMENT=production` and `ALLOWED_ORIGINS=http://localhost:3000`
- Added inline security documentation to `docker-compose.yml`

**Documentation**
- README restructured with dedicated Security section (network isolation, Swagger visibility table, trusted-host docs)
- Access table updated — backend API marked as "internal only"
- Environment variables table includes `ENVIRONMENT` and `ALLOWED_ORIGINS`
- `.env.example` updated with new security-related variables

---

## [1.1.0] — 2026-03-03

### Added

**Docker Ecosystem**
- Full Docker Compose deployment — single command: `docker compose up --build`
- Backend Dockerfile: Python 3.11-slim, Uvicorn, healthcheck on `/health`
- Frontend Dockerfile: multi-stage build (Node 20 → Nginx Alpine), gzip, SPA fallback
- Nginx reverse proxy config: proxies `/api`, `/docs`, `/health` to backend; serves React SPA for all other routes
- `docker-compose.yml` with isolated bridge network, restart policies, and health-based dependency ordering
- Named Docker volumes for persistent storage across rebuilds and updates:
  - `inacorts_database` — SQLite DB + weekly backups
  - `inacorts_logs` — active logs (7 days) + archived logs (14 days)
- `.dockerignore` files for both backend and frontend to keep images lean

### Improved

**API Client**
- Changed `VITE_API_BASE_URL` default from hardcoded `localhost:8000` to empty string (same-origin)
- Enables both Vite dev proxy and Nginx Docker proxy to work transparently

**Localisation**
- Replaced 34 hardcoded English error/fallback strings across 12 page components with i18n keys (`errors.loadFailed`, `errors.saveFailed`, `errors.deleteFailed`)
- Affected pages: Customers, Orders, Products, Payments, Stock, Contacts, Categories, Dashboard, and their detail views

**Logging System**
- Tiered log retention: 7-day active logs in `logs/`, 14-day archived logs in `logs/backups/`
- Automatic log rotation on application startup (`rotate_logs()`)
- Logs older than 7 days are moved to the backup directory; backups older than 14 days are deleted
- Date-safe filename parsing with graceful skip for non-matching files

**Database Backups**
- Weekly backup now keeps only one file (single-rotation policy)
- Previous backup is automatically deleted when a new one is created
- Stale backup cleanup runs even when current week's backup already exists

**Project Hygiene**
- `.gitignore` updated to exclude log files while preserving `.gitkeep` placeholders
- Added `.gitkeep` files for `backend/logs/` and `backend/logs/backups/`

**Documentation**
- README updated with Docker quick-start guide, volume persistence table, and troubleshooting section
- Project structure in README updated to reflect Dockerfiles, nginx.conf, and docker-compose.yml
- CHANGELOG updated with all v1.1.0 changes

---

## [1.0.0] — 2025-01-01

### Added

**Core System**
- FastAPI backend with SQLAlchemy 2 ORM and Pydantic v2 validation
- React 18 + TypeScript frontend with Vite and Tailwind CSS
- JWT-based authentication with admin and standard user roles
- SQLite database with 17 entity models

**Customer & Contact Management**
- Customer CRUD with address, phone, email, website fields
- Contact directory with many-to-many customer linking
- Customer detail page with linked contacts, orders, and notes

**Product & Inventory**
- Product catalogue with categories, barcode, and list price
- Real-time stock tracking with current stock per product
- Stock movements: IN (purchase), OUT (sale/delivery), ADJUSTMENT
- Stock movement log with reason, related order, and user tracking

**Order Management**
- Full order lifecycle: Open → Completed / Canceled
- Order items with quantity, unit price, and delivered quantity tracking
- Delivery recording with delivery date, user, and notes
- Order status auto-calculation based on payment and delivery states
- Order detail page with items, deliveries, payments, and notes

**Payments**
- Payment recording per order (Cash, Bank Transfer, Credit Card, Other)
- Payment status tracking: Unpaid → Partially Paid → Paid
- Payment list with filtering and order linking

**Expense Tracking**
- Expense CRUD with categorised expenses and date tracking
- 6 default expense categories (Fuel, Product Purchase, Gifts, Logistics, Office, Misc.)
- Expense edit history with field-level audit trail

**Financial Overview**
- Dashboard with revenue, expense, and order KPI cards
- Financials page with revenue vs. expense summary
- Payment method breakdown

**Notes & Tags**
- Polymorphic notes on customers, orders, and products
- Polymorphic tags with entity linking (customers, products)

**Internationalisation**
- Turkish (default) and English language support
- Runtime language switching via i18next
- Locale-aware date and currency formatting
- Compact currency display (₺1.2M, ₺450K)

**UI / UX**
- Dark and light theme with system-aware detection
- Responsive sidebar navigation
- Reusable component library (13 common components)
- Pagination, search, and filtering across all list views

**Developer Tools**
- Database reset utility (`python -m app.utils.reset_db`)
- Sample data generator with realistic demo dataset
- Environment variable templates (`.env.example`)
- Comprehensive `.gitignore` for safe public publishing

---

*Next updates: Will be added soon.*
