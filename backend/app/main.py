from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.core.logging import logger, rotate_logs
from app.core.config import settings
from app.core.exceptions import AppException
from app.core.backup import run_weekly_backup
from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.api.v1 import (
    auth,
    customers,
    contacts,
    categories,
    products,
    stock_movements,
    orders,
    order_items,
    payments,
    notes,
    tags,
    expenses,
    users
)
import time


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting INACORTS application (environment={settings.ENVIRONMENT})")
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    # Run weekly database backup on startup
    run_weekly_backup()
    # Rotate logs: archive old active logs, delete expired backup logs
    rotate_logs()
    yield
    logger.info("Shutting down INACORTS application")


# ---------------------------------------------------------------------------
# Conditionally disable Swagger UI / ReDoc / OpenAPI schema in production.
# In development mode, /docs and /redoc remain available for local testing.
# ---------------------------------------------------------------------------
docs_url = "/docs" if not settings.is_production else None
redoc_url = "/redoc" if not settings.is_production else None
openapi_url = "/openapi.json" if not settings.is_production else None

app = FastAPI(
    title="INACORTS",
    description="Inventory Accounting Customer Order Tracking System",
    version="1.2.0",
    lifespan=lifespan,
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
)

# ---------------------------------------------------------------------------
# CORS — only origins listed in ALLOWED_ORIGINS are permitted.
# In Docker production mode the only origin is the frontend container's
# public URL (http://localhost:3000).
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Trusted-host middleware.  In production, only requests arriving via the
# Docker internal network (Host header = "backend" or "backend:8000") or
# from the container itself (localhost) are accepted.  Everything else gets
# a 403.  In development mode this middleware is a no-op (all hosts allowed).
# ---------------------------------------------------------------------------
# Hosts that are always trusted (container-internal healthcheck, etc.)
_TRUSTED_HOSTS: set[str] = {
    "localhost",
    "localhost:8000",
    "127.0.0.1",
    "127.0.0.1:8000",
    "backend",
    "backend:8000",
}


@app.middleware("http")
async def trusted_host_middleware(request: Request, call_next):
    """Block requests from untrusted hosts in production."""
    if settings.is_production:
        host = request.headers.get("host", "").lower()
        if host not in _TRUSTED_HOSTS:
            logger.warning(f"Blocked request from untrusted host: {host} → {request.url.path}")
            return JSONResponse(status_code=403, content={"detail": "Forbidden"})
    return await call_next(request)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log request
    logger.info(f"→ {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    # Calculate processing time
    process_time = (time.time() - start_time) * 1000
    
    # Log response
    logger.info(f"← {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.2f}ms")
    
    return response


@app.exception_handler(AppException)
def app_exception_handler(request: Request, exc: AppException):
    logger.warning(f"Application exception: {exc.message} (Status: {exc.status_code}) - Path: {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )


@app.exception_handler(Exception)
def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)} - Path: {request.url.path}")
    logger.exception(exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


@app.get("/")
def root():
    return {
        "name": "INACORTS",
        "version": "1.2.0",
        "description": "Inventory Accounting Customer Order Tracking System"
    }


# Healthcheck endpoint — always available (used by Docker HEALTHCHECK).
@app.get("/health")
def health():
    return {"status": "healthy"}


app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["Customers"])
app.include_router(contacts.router, prefix="/api/v1/contacts", tags=["Contacts"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["Categories"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(stock_movements.router, prefix="/api/v1/stock-movements", tags=["Stock Movements"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(order_items.router, prefix="/api/v1/order-items", tags=["Order Items"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(notes.router, prefix="/api/v1/notes", tags=["Notes"])
app.include_router(tags.router, prefix="/api/v1/tags", tags=["Tags"])
app.include_router(expenses.router, prefix="/api/v1/expenses", tags=["Expenses"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
