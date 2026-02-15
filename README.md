# INACORTS — Inventory, Accounting, Customer & Order Tracking System

> A full-stack business management application for small-to-medium enterprises.
> Track customers, products, orders, stock, payments, and expenses — all from one dashboard.

![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![Node](https://img.shields.io/badge/node-18%2B-green)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688)
![React](https://img.shields.io/badge/frontend-React%2018-61DAFB)
![TypeScript](https://img.shields.io/badge/types-TypeScript-3178C6)

---

## About

**INACORTS** is a modern, self-hosted business management system designed for
inventory tracking, order management, customer relations, payment recording, and
expense monitoring. It is built with a clean REST API backend and a responsive
single-page frontend.

The project was developed with **AI-assisted coding** (GitHub Copilot & Claude)
and is released as **open-source software** under the MIT License.

---

## Features

| Module | Highlights |
| --- | --- |
| **Dashboard** | Revenue, expense, and order KPIs at a glance |
| **Customers** | Customer profiles with contacts, notes, and tags |
| **Contacts** | Shared contact directory linked to customers (M2M) |
| **Products** | Product catalogue with categories, pricing, and barcode |
| **Inventory** | Real-time stock levels; IN / OUT / ADJUSTMENT movements |
| **Orders** | Full order lifecycle — items, deliveries, payments, status |
| **Payments** | Cash, bank transfer, credit card tracking per order |
| **Expenses** | Categorised expense logging with edit history |
| **Financials** | Revenue vs. expense overview, payment-method breakdown |
| **Notes & Tags** | Polymorphic notes and tags on any entity |
| **Auth** | JWT-based login with admin / standard roles |
| **i18n** | Turkish (default) & English; runtime language switch |
| **Dark Mode** | System-aware dark / light theme toggle |

---

## Tech Stack

### Backend

- **Python 3.10+**
- **FastAPI** — async REST API framework
- **SQLAlchemy 2** — ORM with SQLite (swappable to PostgreSQL)
- **Pydantic v2** — request/response validation
- **python-jose** — JWT authentication
- **passlib + bcrypt** — password hashing
- **Loguru** — structured logging
- **Faker** — sample data generation

### Frontend

- **React 18** with functional components & hooks
- **TypeScript 5**
- **Vite 5** — build tooling
- **Tailwind CSS 3** — utility-first styling
- **React Router 6** — client-side routing
- **Axios** — HTTP client
- **i18next** — internationalisation (TR / EN)
- **date-fns** — date formatting

---

## Project Structure

```
inacorts/
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── api/v1/        # Route handlers (13 modules)
│   │   ├── core/          # Config, security, JWT, logging
│   │   ├── db/            # Engine, session, init_db
│   │   ├── models/        # SQLAlchemy models (17 entities)
│   │   ├── repositories/  # Data-access layer
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── utils/         # reset_db, sample_data_generator
│   ├── requirements.txt
│   └── .env.example
├── frontend/              # React SPA
│   ├── src/
│   │   ├── api/           # Axios service modules
│   │   ├── components/    # Reusable UI (13 common + layout)
│   │   ├── contexts/      # Auth & Theme providers
│   │   ├── i18n/          # TR / EN locale files
│   │   ├── pages/         # 11 page modules
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Formatting helpers
│   ├── package.json
│   └── .env.example
├── CHANGELOG.md
└── README.md              ← you are here
```

---

## Getting Started

### Prerequisites

- Python ≥ 3.10
- Node.js ≥ 18 & npm

### 1. Clone

```bash
git clone https://github.com/<your-username>/inacorts.git
cd inacorts
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env and set a strong SECRET_KEY (see .env.example for instructions)

uvicorn app.main:app --reload
```

The API starts at **http://localhost:8000**. Interactive docs at **/docs**.

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The UI opens at **http://localhost:5173**.

### 4. Default Login

| Username | Password |
| --- | --- |
| `admin` | `admin` |

> **Change the default password** before any production or public use.

---

## Development Utilities

### Database Reset

Drops all tables, recreates the schema, and seeds default data (admin user +
expense categories):

```bash
cd backend
python -m app.utils.reset_db          # interactive confirmation
python -m app.utils.reset_db --yes    # skip confirmation
```

### Sample Data Generator

Populates the database with realistic demo data (8 customers, 12 products,
15 orders, expenses, notes, tags, etc.):

```bash
cd backend
python -m app.utils.sample_data_generator          # generate only
python -m app.utils.sample_data_generator --reset   # reset DB first
```

---

## API Endpoints

All endpoints are prefixed with `/api/v1/`. Authentication is via `Bearer` JWT
token obtained from `POST /api/v1/auth/login`.

| Resource | Endpoints |
| --- | --- |
| Auth | `POST /auth/login`, `GET /auth/me` |
| Customers | CRUD + search, detail with contacts |
| Contacts | CRUD + link/unlink to customers |
| Categories | CRUD for product categories |
| Products | CRUD + stock summary |
| Stock Movements | List, create (IN/OUT/ADJUSTMENT) |
| Orders | CRUD + status transitions |
| Order Items | CRUD within an order |
| Payments | CRUD per order |
| Notes | Polymorphic CRUD (customer/order/product) |
| Tags | CRUD + link/unlink to entities |
| Expenses | CRUD with category + edit history |

Full interactive documentation: **http://localhost:8000/docs**

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `SECRET_KEY` | JWT signing key | *(must be set)* |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./inacorts.db` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token TTL | `1440` (24 h) |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |

---

## License

This project is released under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## Acknowledgements

- Built with AI-assisted development using **GitHub Copilot** and **Claude**
- Icons and UI patterns inspired by modern SaaS dashboards
- Turkish localisation provided as the default language

---

*INACORTS — Inventory, Accounting, Customer & Order Tracking System*
