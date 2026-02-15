from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.core.logging import logger
from app.core.exceptions import AppException
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
    expenses
)
import time


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting INACORTS application")
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    yield
    logger.info("Shutting down INACORTS application")


app = FastAPI(
    title="INACORTS",
    description="Inventory Accounting Customer Order Tracking System",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev server ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        "version": "1.0.0",
        "description": "Inventory Accounting Customer Order Tracking System"
    }


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
