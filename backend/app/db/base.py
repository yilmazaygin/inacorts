from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import all models here to ensure they are registered with Base
# This must happen after Base is defined but before create_all() is called
def import_models():
    # Import models to register them with SQLAlchemy
    import app.models  # noqa: F401
