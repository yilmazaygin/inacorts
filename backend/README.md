# INACORTS Backend

FastAPI REST API powering the INACORTS business management system.

---

## Quick Start

```bash
# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — set a strong SECRET_KEY

# 4. Run
uvicorn app.main:app --reload
```

API: **http://localhost:8000** | Docs: **http://localhost:8000/docs**

---

## Project Structure

```
backend/
├── requirements.txt          # Python dependencies
├── .env.example              # Environment variable template
├── app/
│   ├── main.py               # FastAPI application entry point
│   ├── __init__.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/               # Versioned route handlers
│   │       ├── auth.py           # Login, token, current user
│   │       ├── customers.py      # Customer CRUD + search
│   │       ├── contacts.py       # Contact CRUD + link/unlink
│   │       ├── categories.py     # Product category CRUD
│   │       ├── products.py       # Product CRUD + stock summary
│   │       ├── stock_movements.py# Stock IN / OUT / ADJUSTMENT
│   │       ├── orders.py         # Order lifecycle management
│   │       ├── order_items.py    # Line items within orders
│   │       ├── payments.py       # Payment recording per order
│   │       ├── notes.py          # Polymorphic notes (any entity)
│   │       ├── tags.py           # Tag CRUD + entity linking
│   │       ├── expenses.py       # Expense CRUD + history
│   │       └── dependencies.py   # Shared FastAPI dependencies
│   │
│   ├── core/                 # Application-wide configuration
│   │   ├── config.py             # Pydantic Settings (env loading)
│   │   ├── security.py           # Password hashing (bcrypt)
│   │   ├── jwt.py                # JWT token create / verify
│   │   ├── logging.py            # Loguru configuration
│   │   └── exceptions.py         # Custom exception classes
│   │
│   ├── db/                   # Database layer
│   │   ├── session.py            # SQLAlchemy engine & SessionLocal
│   │   ├── base.py               # Declarative base & import_models()
│   │   └── init_db.py            # Seed: admin user, system user,
│   │                             #        default expense categories
│   │
│   ├── models/               # SQLAlchemy ORM models
│   │   └── __init__.py           # All 17 models + enums defined here
│   │
│   ├── repositories/         # Data-access layer (one per entity)
│   │   ├── user_repository.py
│   │   ├── customer_repository.py
│   │   ├── contact_repository.py
│   │   ├── category_repository.py
│   │   ├── product_repository.py
│   │   ├── stock_movement_repository.py
│   │   ├── order_repository.py
│   │   ├── order_item_repository.py
│   │   ├── order_delivery_repository.py
│   │   ├── payment_repository.py
│   │   ├── expense_repository.py
│   │   ├── expense_category_repository.py
│   │   ├── note_repository.py
│   │   └── tag_repository.py
│   │
│   ├── schemas/              # Pydantic request / response schemas
│   │   ├── auth.py
│   │   ├── common.py             # Shared base schemas
│   │   ├── customer.py
│   │   ├── contact.py
│   │   ├── category.py
│   │   ├── product.py
│   │   ├── stock_movement.py
│   │   ├── order.py
│   │   ├── order_delivery.py
│   │   ├── payment.py
│   │   ├── expense.py
│   │   ├── note.py
│   │   ├── tag.py
│   │   └── user.py
│   │
│   ├── services/             # Business logic layer
│   │   ├── auth_service.py
│   │   ├── customer_service.py
│   │   ├── contact_service.py
│   │   ├── category_service.py
│   │   ├── product_service.py
│   │   ├── stock_movement_service.py
│   │   ├── order_service.py
│   │   ├── payment_service.py
│   │   ├── expense_service.py
│   │   ├── note_service.py
│   │   └── tag_service.py
│   │
│   └── utils/                # Development utilities
│       ├── reset_db.py           # Drop & recreate all tables
│       └── sample_data_generator.py  # Generate demo dataset
│
└── logs/                     # Runtime log files (gitignored)
```

---

## Architecture

```
Request → FastAPI Router (api/v1/) → Service → Repository → SQLAlchemy Model → DB
                                         ↑                        ↑
                                    Pydantic Schema          Session (db/)
```

- **Routers** handle HTTP, authentication, and request validation.
- **Services** contain business logic (status transitions, stock calculations).
- **Repositories** encapsulate all database queries.
- **Models** define the ORM schema — all 17 in a single `models/__init__.py`.
- **Schemas** validate input / serialise output via Pydantic v2.

---

## Models

| Model | Description |
| --- | --- |
| `User` | Application users (admin + standard roles) |
| `Customer` | Company / individual customers |
| `Contact` | Contact people (M2M with customers) |
| `Category` | Product categories |
| `Product` | Product catalogue (name, barcode, price, stock) |
| `StockMovement` | IN / OUT / ADJUSTMENT stock changes |
| `Order` | Customer orders with status tracking |
| `OrderItem` | Line items within an order |
| `OrderDelivery` | Delivery records per order |
| `Payment` | Payments against orders |
| `ExpenseCategory` | Expense classification |
| `Expense` | Expense records with date and amount |
| `ExpenseHistory` | Audit trail for expense edits |
| `Note` | Polymorphic notes on any entity |
| `Tag` | Reusable tag labels |
| `TagLink` | Polymorphic tag ↔ entity association |

**Enums:** `OrderStatus`, `PaymentStatus`, `DeliveryStatus`, `PaymentMethod`,
`StockMovementType`, `EntityType`, `TagEntityType`

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
| --- | --- | --- |
| `SECRET_KEY` | JWT signing secret — **must be changed** | *(none)* |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./inacorts.db` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token lifespan | `1440` (24 hours) |

Generate a strong secret key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

---

## Dependencies

| Package | Version | Purpose |
| --- | --- | --- |
| fastapi | 0.109.0 | Web framework |
| uvicorn | 0.27.0 | ASGI server |
| sqlalchemy | 2.0.25 | ORM |
| pydantic | 2.5.3 | Data validation |
| pydantic-settings | 2.1.0 | Settings from env |
| python-jose | 3.3.0 | JWT tokens |
| passlib | 1.7.4 | Password hashing |
| bcrypt | 4.0.1 | Bcrypt backend for passlib |
| python-dotenv | 1.0.0 | .env file loading |
| python-multipart | 0.0.6 | Form data parsing |
| loguru | 0.7.2 | Logging |
| faker | 22.6.0 | Sample data generation |

---

## Utilities

### Database Reset

Drops all tables, recreates the schema, and seeds defaults:

```bash
python -m app.utils.reset_db          # asks for confirmation
python -m app.utils.reset_db --yes    # non-interactive
```

**Seeded defaults:** admin user (`admin` / `admin`), system user, 6 expense categories.

### Sample Data Generator

Generates a compact demo dataset:

```bash
python -m app.utils.sample_data_generator          # generate data
python -m app.utils.sample_data_generator --reset   # reset first, then generate
```

**Generated:** 8 customers, 10 contacts, 4 product categories, 12 products,
15 orders (7 completed, 2 partial, 5 open, 1 canceled), deliveries, payments,
10 expenses with edit history, 6 notes, 5 tags.

---

## Default Users

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `admin` | Administrator |
| `system` | `system-internal-use-only` | Internal (non-login) |

> Change the admin password immediately in any non-development environment.

---

## API Routes

All routes are prefixed with `/api/v1/`.

| Prefix | Module | Auth |
| --- | --- | --- |
| `/auth` | Login, current user | Public (login) |
| `/customers` | Customer CRUD | Required |
| `/contacts` | Contact CRUD + link | Required |
| `/categories` | Category CRUD | Required |
| `/products` | Product CRUD | Required |
| `/stock-movements` | Stock movement log | Required |
| `/orders` | Order management | Required |
| `/order-items` | Order line items | Required |
| `/payments` | Payment recording | Required |
| `/notes` | Polymorphic notes | Required |
| `/tags` | Tags + entity linking | Required |
| `/expenses` | Expense tracking | Required |

Swagger UI: **http://localhost:8000/docs**
