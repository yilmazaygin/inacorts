from sqlalchemy.orm import Session
from app.db.base import Base, import_models
from app.db.session import engine
from app.models import User, ExpenseCategory
from app.core.security import hash_password
from loguru import logger


def init_db(db: Session) -> None:
    # Ensure all models are imported before creating tables
    import_models()
    Base.metadata.create_all(bind=engine)
    
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            hashed_password=hash_password("admin"),
            is_admin=True,
            is_active=True
        )
        db.add(admin_user)
        logger.info("Admin user created")
    
    system_user = db.query(User).filter(User.username == "system").first()
    if not system_user:
        system_user = User(
            username="system",
            hashed_password=hash_password("system-internal-use-only"),
            is_admin=False,
            is_active=True
        )
        db.add(system_user)
        logger.info("System user created")
    
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
