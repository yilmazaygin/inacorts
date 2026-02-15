from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from app.models import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, category_id: int) -> Optional[Category]:
        return (
            self.db.query(Category)
            .options(joinedload(Category.created_by_user))
            .filter(Category.id == category_id)
            .first()
        )
    
    def list_all(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "id",
        order: str = "asc"
    ) -> Tuple[List[Category], int]:
        query = self.db.query(Category).options(joinedload(Category.created_by_user))
        
        total = query.count()
        
        if hasattr(Category, sort_by):
            column = getattr(Category, sort_by)
            if order == "desc":
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())
        
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        
        return items, total
    
    def create(self, data: CategoryCreate, user_id: int) -> Category:
        category = Category(
            **data.model_dump(),
            created_by=user_id,
            updated_by=user_id
        )
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category
    
    def update(self, category: Category, data: CategoryUpdate, user_id: int) -> Category:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(category, key, value)
        category.updated_by = user_id
        self.db.commit()
        self.db.refresh(category)
        return category
    
    def delete(self, category: Category) -> None:
        self.db.delete(category)
        self.db.commit()
