# INACORTS — Inventory, Accounting, Customer & Order Tracking System

> A full-stack business management application for small-to-medium enterprises.
> Track customers, products, orders, stock, payments, and expenses — all from one dashboard.

![License](https://img.shields.io/badge/license-GPL--3.0--or--later-blue)
![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![Node](https://img.shields.io/badge/node-18%2B-green)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688)
![React](https://img.shields.io/badge/frontend-React%2018-61DAFB)
![TypeScript](https://img.shields.io/badge/types-TypeScript-3178C6)
![Docker](https://img.shields.io/badge/deploy-Docker-2496ED)

---

## About

**INACORTS** is a modern, self-hosted business management system designed for
inventory tracking, order management, customer relations, payment recording, and
expense monitoring. It is built with a clean REST API backend and a responsive
single-page frontend.

The project was developed with **AI-assisted coding** (GitHub Copilot & Claude)
and is released as **free software** under the GNU General Public License v3.0 or later.

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
| **Auth** | JWT login, refresh tokens, security questions, forgot-password flow |
| **User Management** | Admin-only user CRUD, profile self-service, password change |
| **i18n** | Turkish (default) & English; runtime language switch |
| **Dark Mode** | System-aware dark / light theme toggle |
| **Landing Page** | Public welcome page with login link |
| **Logging** | Tiered log retention — 7-day active, 14-day archived |
| **Backups** | Automatic weekly SQLite backups (single-rotation) |
| **Docker** | Single-command deployment with persistent volumes |
| **Security** | Backend network-isolated; Swagger disabled in production |

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
│   ├── Dockerfile         # Python 3.11 + Uvicorn
│   ├── app/
│   │   ├── api/v1/        # Route handlers (13 modules)
│   │   ├── core/          # Config, security, JWT, logging, backup
│   │   ├── db/            # Engine, session, init_db
│   │   ├── models/        # SQLAlchemy models (17 entities)
│   │   ├── repositories/  # Data-access layer
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── utils/         # reset_db, sample_data_generator
│   ├── logs/              # Active logs (7 days) + backups/ (14 days)
│   ├── requirements.txt
│   └── .env.example
├── frontend/              # React SPA
│   ├── Dockerfile         # Multi-stage: Node 20 build → Nginx serve
│   ├── nginx.conf         # Reverse proxy + SPA fallback
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
├── database/              # SQLite DB + weekly backups (gitignored)
├── docker-compose.yml     # Single-command deployment
├── CHANGELOG.md
└── README.md              ← you are here
```

---

## Getting Started

### Option A — Docker (recommended)

The fastest way to run INACORTS. Requires only Docker.

#### 1. Install Docker (Ubuntu)

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker --now
```

> On other systems install [Docker Desktop](https://docs.docker.com/get-docker/).

#### 2. Configure

Create a `.env` file in the project root (next to `docker-compose.yml`):

```bash
# Generate a secure secret key
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(48))" > .env
```

Or manually:

```dotenv
SECRET_KEY=your-strong-random-key-here
```

#### 3. Start

```bash
docker compose up --build
```

#### 4. Access

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend API | Internal only (proxied via frontend at `/api/`) |

> The backend port (8000) is **not exposed** to the host. All API requests
> are routed through the Nginx reverse proxy on port 3000.

Default login: `admin` / `admin` — **change the password immediately**.

#### 5. Stop

```bash
docker compose down          # stop containers (data is preserved)
docker compose down -v       # stop AND delete all persistent data
```

#### Persistence

Docker volumes keep data safe across restarts and image rebuilds:

| Volume | Container path | Contents |
| --- | --- | --- |
| `inacorts_database` | `/database/` | SQLite DB + weekly backups |
| `inacorts_logs` | `/app/logs/` | Active logs (7 d) + archived logs (14 d) |

> Volumes survive `docker compose down`. Only `docker compose down -v` removes them.

#### Troubleshooting

| Problem | Solution |
| --- | --- |
| Port already in use | `docker ps` → stop conflicting container, or change port in `docker-compose.yml` |
| Database not persisting | Verify volumes with `docker volume ls \| grep inacorts` |
| Logs missing | Check volume mount: `docker exec inacorts-backend ls /app/logs/` |
| Frontend can't reach API | Ensure both containers are on `inacorts-net`: `docker network inspect inacorts-net` |
| Permission denied (Docker) | Add your user to the docker group: `sudo usermod -aG docker $USER` |

---

### Option B — Local development

#### Prerequisites

- Python ≥ 3.10
- Node.js ≥ 18 & npm

#### 1. Clone

```bash
git clone https://github.com/yilmazaygin/inacorts.git
cd inacorts
```

#### 2. Backend Setup

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

#### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The UI opens at **http://localhost:3000** (proxied to the backend API).

#### 4. Routing

| Path | Description |
| --- | --- |
| `/` | Public landing page (no auth required) |
| `/admin/login` | Login page |
| `/admin/dashboard` | Main dashboard (requires auth) |
| `/admin/*` | All admin routes (requires auth) |

#### 5. Default Login

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
| Auth | `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/verify-password` |
| Forgot Password | `POST /auth/forgot-password/questions`, `POST /auth/forgot-password/verify-answers`, `POST /auth/forgot-password/reset` |
| Users | Admin-only CRUD + self-service profile, password change, security questions |
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

Full interactive documentation: **http://localhost:8000/docs** *(local development only — disabled in Docker production mode)*

---

## Security

### Network Isolation (Docker)

In production (`ENVIRONMENT=production`, the Docker default):

- The **backend container has no published ports** — it is only reachable by
  other containers on the `inacorts-net` Docker bridge network.
- The **frontend Nginx** container is the sole entry point (port 3000) and
  proxies `/api/` requests to `backend:8000` on the internal network.
- Direct `http://localhost:8000` access from the host is **not possible**.

### Swagger UI / ReDoc

| Mode | `/docs` | `/redoc` | `/openapi.json` |
| --- | --- | --- | --- |
| `development` | ✅ Available | ✅ Available | ✅ Available |
| `production` | ❌ Disabled (404) | ❌ Disabled (404) | ❌ Disabled (404) |

To temporarily enable docs in Docker for debugging:

```dotenv
# In your project-root .env file:
ENVIRONMENT=development
```

### Trusted Host Middleware

In production, the backend accepts requests only from known internal hosts:
`backend`, `backend:8000`, `localhost`, `localhost:8000`, `127.0.0.1`.
Requests with any other `Host` header receive `403 Forbidden`.

### CORS

Only origins listed in `ALLOWED_ORIGINS` may make cross-origin requests.
The Docker default restricts this to `http://localhost:3000` (the frontend).

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `SECRET_KEY` | JWT signing key | *(must be set)* |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///../database/inacorts.db` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `ENVIRONMENT` | `development` or `production` | `development` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000,http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |

---

## License

This project is licensed under the **GNU General Public License v3.0 or later**. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

- Built with AI-assisted development using **GitHub Copilot** and **Claude**
- Icons and UI patterns inspired by modern SaaS dashboards
- Turkish localisation provided as the default language

> **Note:** The Docker ecosystem (Dockerfiles, docker-compose.yml, nginx.conf),
> the React frontend, this README, and the CHANGELOG were entirely generated by AI.

---

*INACORTS — Inventory, Accounting, Customer & Order Tracking System*
