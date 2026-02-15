from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from app.models import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


class ExpenseRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, expense_id: int) -> Optional[Expense]:
        return (
            self.db.query(Expense)
            .options(joinedload(Expense.created_by_user), joinedload(Expense.category))
            .filter(Expense.id == expense_id)
            .first()
        )
    
    def list_all(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "date",
        order: str = "desc",
        category_id: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Tuple[List[Expense], int]:
        query = (
            self.db.query(Expense)
            .options(joinedload(Expense.created_by_user), joinedload(Expense.category))
        )
        
        if category_id:
            query = query.filter(Expense.category_id == category_id)
        
        if start_date:
            query = query.filter(Expense.date >= start_date)
        
        if end_date:
            query = query.filter(Expense.date <= end_date)
        
        total = query.count()
        
        # Sort
        sort_column = getattr(Expense, sort_by, Expense.date)
        if order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        
        return items, total
    
    def create(self, data: ExpenseCreate, user_id: int) -> Expense:
        expense_data = data.model_dump()
        # Convert date string to datetime if needed
        if expense_data.get('date') and isinstance(expense_data['date'], str):
            try:
                expense_data['date'] = datetime.fromisoformat(expense_data['date'])
            except (ValueError, TypeError):
                expense_data['date'] = datetime.utcnow()
        elif not expense_data.get('date'):
            expense_data['date'] = datetime.utcnow()
        expense = Expense(
            **expense_data,
            created_by=user_id,
            updated_by=user_id
        )
        self.db.add(expense)
        self.db.commit()
        self.db.refresh(expense)
        
        # Load relationships
        self.db.refresh(expense, attribute_names=['created_by_user', 'category'])
        return expense
    
    def update(self, expense: Expense, data: ExpenseUpdate, user_id: int) -> Expense:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(expense, key, value)
        
        expense.updated_by = user_id
        self.db.commit()
        self.db.refresh(expense)
        
        # Load relationships
        self.db.refresh(expense, attribute_names=['created_by_user', 'category'])
        return expense
    
    def delete(self, expense: Expense) -> None:
        self.db.delete(expense)
        self.db.commit()
