from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models import ExpenseCategory
from app.schemas.expense import ExpenseCategoryCreate, ExpenseCategoryUpdate


class ExpenseCategoryRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, category_id: int) -> Optional[ExpenseCategory]:
        return self.db.query(ExpenseCategory).filter(ExpenseCategory.id == category_id).first()
    
    def get_by_name(self, name: str) -> Optional[ExpenseCategory]:
        return self.db.query(ExpenseCategory).filter(ExpenseCategory.name == name).first()
    
    def list_all(
        self,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[ExpenseCategory], int]:
        query = self.db.query(ExpenseCategory)
        
        total = query.count()
        
        query = query.order_by(ExpenseCategory.name.asc())
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        
        return items, total
    
    def create(self, data: ExpenseCategoryCreate, user_id: int) -> ExpenseCategory:
        category = ExpenseCategory(
            **data.model_dump(),
            created_by=user_id,
            updated_by=user_id
        )
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category
    
    def update(self, category: ExpenseCategory, data: ExpenseCategoryUpdate, user_id: int) -> ExpenseCategory:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(category, key, value)
        
        category.updated_by = user_id
        self.db.commit()
        self.db.refresh(category)
        return category
    
    def delete(self, category: ExpenseCategory) -> None:
        self.db.delete(category)
        self.db.commit()
