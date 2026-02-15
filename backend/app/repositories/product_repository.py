from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.models import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, product_id: int) -> Optional[Product]:
        return (
            self.db.query(Product)
            .options(joinedload(Product.created_by_user))
            .filter(Product.id == product_id)
            .first()
        )
    
    def list_all(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "id",
        order: str = "asc",
        search: Optional[str] = None,
        category_id: Optional[int] = None
    ) -> Tuple[List[Product], int]:
        query = self.db.query(Product).options(joinedload(Product.created_by_user))
        
        if search:
            query = query.filter(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.description.ilike(f"%{search}%"),
                    Product.barcode.ilike(f"%{search}%")
                )
            )
        
        if category_id:
            query = query.filter(Product.category_id == category_id)
        
        total = query.count()
        
        if hasattr(Product, sort_by):
            column = getattr(Product, sort_by)
            if order == "desc":
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())
        
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        
        return items, total
    
    def create(self, data: ProductCreate, user_id: int) -> Product:
        product = Product(
            **data.model_dump(),
            current_stock=0,
            created_by=user_id,
            updated_by=user_id
        )
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product
    
    def update(self, product: Product, data: ProductUpdate, user_id: int) -> Product:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(product, key, value)
        product.updated_by = user_id
        self.db.commit()
        self.db.refresh(product)
        return product
    
    def update_stock(self, product: Product, quantity_delta: int) -> Product:
        product.current_stock += quantity_delta
        self.db.commit()
        self.db.refresh(product)
        return product
    
    def delete(self, product: Product) -> None:
        self.db.delete(product)
        self.db.commit()
