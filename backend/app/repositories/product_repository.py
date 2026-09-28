from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.models import Product, TagEntityType
from app.schemas.product import ProductCreate, ProductUpdate
from app.repositories.list_filters import restrict_records


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
        category_id: Optional[int] = None,
        created_by: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        tag_id: Optional[int] = None,
        show_on_site: Optional[bool] = None,
    ) -> Tuple[List[Product], int]:
        query = self.db.query(Product).options(joinedload(Product.created_by_user))
        
        if search:
            query = query.filter(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.description.ilike(f"%{search}%"),
                    Product.sku.ilike(f"%{search}%"),
                )
            )
        
        if category_id:
            query = query.filter(Product.category_id == category_id)
        if show_on_site is not None:
            query = query.filter(Product.show_on_site.is_(show_on_site))
        query = restrict_records(
            query, Product,
            created_by=created_by, start_date=start_date, end_date=end_date,
            tag_id=tag_id, tag_type=TagEntityType.PRODUCT,
        )
        
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
    
    def bulk_adjust_price(self, product_ids: List[int], mode: str, value: float, user_id: int) -> int:
        products = self.db.query(Product).filter(Product.id.in_(product_ids)).all()
        for product in products:
            if mode == "percent":
                product.list_price = round(product.list_price * (1 + value / 100), 2)
            else:
                product.list_price = round(product.list_price + value, 2)
            if product.list_price < 0:
                product.list_price = 0
            product.updated_by = user_id
        self.db.commit()
        return len(products)

    def delete(self, product: Product) -> None:
        self.db.delete(product)
        self.db.commit()
