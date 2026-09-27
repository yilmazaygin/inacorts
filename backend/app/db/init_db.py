import json

from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from app.db.base import Base, import_models
from app.db.session import engine
from app.models import User, ExpenseCategory
from app.core.security import hash_password
from app.core.config import settings
from app.services.agreement_service import AgreementService
from app.services.site_service import SiteService
from app.utils.demo_catalog import seed_demo_catalog
from loguru import logger


def _add_column_if_not_exists(db: Session, table: str, column: str, col_type: str) -> None:
    """Add a column to a table if it doesn't already exist (SQLite compatible)."""
    inspector = inspect(engine)
    existing_columns = [c["name"] for c in inspector.get_columns(table)]
    if column not in existing_columns:
        db.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
        db.commit()
        logger.info(f"Added column '{column}' to table '{table}'")


def _migrate_users_table(db: Session) -> None:
    """Ensure the users table has all required columns for the extended schema."""
    # Note: SQLite does not allow non-constant defaults in ALTER TABLE,
    # so we add columns as nullable and then backfill existing rows.
    migrations = [
        ("email", "VARCHAR(255)"),
        ("created_by", "INTEGER REFERENCES users(id)"),
        ("created_at", "DATETIME"),
        ("updated_at", "DATETIME"),
        ("deactivated_at", "DATETIME"),
        ("name", "VARCHAR(255)"),
        ("surname", "VARCHAR(255)"),
        ("address", "TEXT"),
        ("backup_email", "VARCHAR(255)"),
        ("phone_number", "VARCHAR(50)"),
        ("security_question_1", "VARCHAR(500)"),
        ("security_answer_1_hash", "VARCHAR(255)"),
        ("security_question_2", "VARCHAR(500)"),
        ("security_answer_2_hash", "VARCHAR(255)"),
        ("is_sales_consultant", "BOOLEAN NOT NULL DEFAULT 0"),
        ("photo_filename", "VARCHAR(255)"),
    ]
    inspector = inspect(engine)
    if "users" in inspector.get_table_names():
        for col_name, col_type in migrations:
            _add_column_if_not_exists(db, "users", col_name, col_type)
        # Backfill created_at/updated_at for existing rows that have NULL values
        db.execute(text(
            "UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"
        ))
        db.execute(text(
            "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL"
        ))
        db.commit()


def _migrate_products_table(db: Session) -> None:
    """Add product image storage and drop the removed barcode column."""
    inspector = inspect(engine)
    if "products" not in inspector.get_table_names():
        return
    _add_column_if_not_exists(db, "products", "image_filename", "VARCHAR(255)")
    _add_column_if_not_exists(db, "products", "image_filenames", "TEXT")
    rows = db.execute(text(
        "SELECT id, image_filename, image_filenames FROM products"
    )).fetchall()
    for row in rows:
        if row.image_filenames or not row.image_filename:
            continue
        db.execute(
            text("UPDATE products SET image_filenames = :value WHERE id = :id"),
            {"value": json.dumps([row.image_filename]), "id": row.id},
        )
    db.commit()
    columns = [c["name"] for c in inspect(engine).get_columns("products")]
    if "barcode" in columns:
        try:
            db.execute(text("DROP INDEX IF EXISTS ix_products_barcode"))
            db.execute(text("ALTER TABLE products DROP COLUMN barcode"))
            db.commit()
            logger.info("Dropped column 'barcode' from table 'products'")
        except Exception as exc:
            db.rollback()
            logger.warning(f"Could not drop products.barcode: {exc}")


def init_db(db: Session) -> None:
    # Ensure all models are imported before creating tables
    import_models()
    Base.metadata.create_all(bind=engine)
    
    # Migrate existing tables to add new columns
    _migrate_users_table(db)
    _migrate_products_table(db)
    _add_column_if_not_exists(db, "categories", "image_filename", "VARCHAR(255)")
    
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            hashed_password=hash_password("admin"),
            is_admin=True,
            is_active=True
        )
        db.add(admin_user)
        db.flush()
        # Admin user is created by itself (system user)
        admin_user.created_by = admin_user.id
        db.commit()
        logger.info("Admin user created")
    else:
        # Ensure existing admin user has created_by set
        if admin_user.created_by is None:
            admin_user.created_by = admin_user.id
            db.commit()
    
    system_user = db.query(User).filter(User.username == "system").first()
    if not system_user:
        system_user = User(
            username="system",
            hashed_password=hash_password("system-internal-use-only"),
            is_admin=False,
            is_active=True,
            created_by=admin_user.id
        )
        db.add(system_user)
        db.commit()
        logger.info("System user created")
    else:
        # Ensure existing system user has created_by set
        if system_user.created_by is None:
            system_user.created_by = admin_user.id
            db.commit()

    admin_user.is_sales_consultant = False
    system_user.is_sales_consultant = False
    consultants = [
        {"username": "muharrem", "password": "muharrem", "name": "Muharrem", "surname": "Gülmez"},
        {"username": "efe", "password": "efeugur", "name": "Efe", "surname": "Uğur"},
    ]
    for person in consultants:
        existing = db.query(User).filter(User.username == person["username"]).first()
        if existing:
            continue
        db.add(User(
            username=person["username"],
            hashed_password=hash_password(person["password"]),
            is_admin=False,
            is_sales_consultant=True,
            is_active=True,
            name=person["name"],
            surname=person["surname"],
            phone_number="541 943 44 04",
            created_by=admin_user.id,
        ))
        logger.info(f"Sales consultant created: {person['username']}")
    db.commit()
    
    # Create default expense categories
    default_categories = [
        {"name": "Fuel / Transportation", "description": "Benzin, yol masrafı"},
        {"name": "Product Purchase", "description": "Ürün alımı"},
        {"name": "Gifts / Samples", "description": "Eşantiyon, hediye"},
        {"name": "Logistics", "description": "Lojistik, nakliye"},
        {"name": "Office Supplies", "description": "Kırtasiye, ofıs malzemeleri"},
        {"name": "Miscellaneous", "description": "Diğer masraflar"},
    ]
    
    for cat_data in default_categories:
        existing = db.query(ExpenseCategory).filter(ExpenseCategory.name == cat_data["name"]).first()
        if not existing:
            category = ExpenseCategory(
                name=cat_data["name"],
                description=cat_data["description"],
                created_by=system_user.id,
                updated_by=system_user.id
            )
            db.add(category)
            logger.info(f"Expense category created: {cat_data['name']}")
    
    db.commit()
    SiteService(db).ensure_content(admin_user.id)
    AgreementService(db).ensure(admin_user.id)
    if settings.SEED_DEMO_PRODUCTS:
        seed_demo_catalog(db, admin_user.id)
    logger.info("Database initialized")


if __name__ == "__main__":
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
