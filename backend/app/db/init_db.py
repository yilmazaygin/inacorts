from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from app.db.base import Base, import_models
from app.db.session import engine
from app.models import User, ExpenseCategory
from app.core.security import hash_password
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


def init_db(db: Session) -> None:
    # Ensure all models are imported before creating tables
    import_models()
    Base.metadata.create_all(bind=engine)
    
    # Migrate existing tables to add new columns
    _migrate_users_table(db)
    
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
    logger.info("Database initialized")


if __name__ == "__main__":
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
