# Changelog

All notable changes to INACORTS are documented in this file.

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
