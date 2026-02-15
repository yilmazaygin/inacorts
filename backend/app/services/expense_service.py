from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.expense_category_repository import ExpenseCategoryRepository
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseCategoryCreate,
    ExpenseCategoryUpdate,
    ExpenseCategoryResponse,
    ExpenseHistoryResponse
)
from app.schemas.common import PaginatedResponse
from app.core.exceptions import NotFoundException, BadRequestException
from app.models import ExpenseHistory
from math import ceil
from loguru import logger


class ExpenseService:
    def __init__(self, db: Session):
        self.db = db
        self.expense_repo = ExpenseRepository(db)
        self.category_repo = ExpenseCategoryRepository(db)
    
    def get_expense(self, expense_id: int) -> ExpenseResponse:
        expense = self.expense_repo.get_by_id(expense_id)
        if not expense:
            raise NotFoundException("Expense not found")
        
        response = ExpenseResponse.model_validate(expense)
        # Populate username and category name
        if expense.created_by_user:
            response.created_by_username = expense.created_by_user.username
        if expense.category:
            response.category_name = expense.category.name
        
        return response
    
    def list_expenses(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "date",
        order: str = "desc",
        category_id: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> PaginatedResponse[ExpenseResponse]:
        items, total = self.expense_repo.list_all(
            page, page_size, sort_by, order,
            category_id, start_date, end_date
        )
        
        responses = []
        for item in items:
            response = ExpenseResponse.model_validate(item)
            if item.created_by_user:
                response.created_by_username = item.created_by_user.username
            if item.category:
                response.category_name = item.category.name
            responses.append(response)
        
        return PaginatedResponse(
            items=responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=ceil(total / page_size) if total > 0 else 0
        )
    
    def create_expense(self, data: ExpenseCreate, user_id: int) -> ExpenseResponse:
        # Validate category exists
        category = self.category_repo.get_by_id(data.category_id)
        if not category:
            raise NotFoundException("Expense category not found")
        
        expense = self.expense_repo.create(data, user_id)
        logger.info(f"Expense {expense.id} created by user {user_id}")
        
        response = ExpenseResponse.model_validate(expense)
        if expense.created_by_user:
            response.created_by_username = expense.created_by_user.username
        if expense.category:
            response.category_name = expense.category.name
        
        return response
    
    def update_expense(self, expense_id: int, data: ExpenseUpdate, user_id: int) -> ExpenseResponse:
        expense = self.expense_repo.get_by_id(expense_id)
        if not expense:
            raise NotFoundException("Expense not found")
        
        # Validate category if being changed
        if data.category_id is not None:
            category = self.category_repo.get_by_id(data.category_id)
            if not category:
                raise NotFoundException("Expense category not found")
        
        # Record history for changed fields
        update_data = data.model_dump(exclude_unset=True)
        field_labels = {
            'amount': 'amount',
            'description': 'description',
            'category_id': 'category',
            'date': 'date',
        }
        for field, label in field_labels.items():
            if field in update_data:
                old_val = getattr(expense, field)
                new_val = update_data[field]
                if str(old_val) != str(new_val):
                    # For category_id, store category name instead
                    if field == 'category_id':
                        old_cat = self.category_repo.get_by_id(old_val) if old_val else None
                        new_cat = self.category_repo.get_by_id(new_val) if new_val else None
                        old_display = old_cat.name if old_cat else str(old_val)
                        new_display = new_cat.name if new_cat else str(new_val)
                    else:
                        old_display = str(old_val) if old_val is not None else None
                        new_display = str(new_val) if new_val is not None else None
                    
                    history = ExpenseHistory(
                        expense_id=expense_id,
                        changed_by=user_id,
                        field_name=label,
                        old_value=old_display,
                        new_value=new_display,
                    )
                    self.db.add(history)
        
        expense = self.expense_repo.update(expense, data, user_id)
        logger.info(f"Expense {expense_id} updated by user {user_id}")
        
        response = ExpenseResponse.model_validate(expense)
        if expense.created_by_user:
            response.created_by_username = expense.created_by_user.username
        if expense.category:
            response.category_name = expense.category.name
        
        return response
    
    def get_expense_history(self, expense_id: int) -> list[ExpenseHistoryResponse]:
        expense = self.expense_repo.get_by_id(expense_id)
        if not expense:
            raise NotFoundException("Expense not found")
        
        from sqlalchemy.orm import joinedload
        from app.models import ExpenseHistory as EH
        history_items = (
            self.db.query(EH)
            .options(joinedload(EH.changed_by_user))
            .filter(EH.expense_id == expense_id)
            .order_by(EH.changed_at.desc())
            .all()
        )
        
        responses = []
        for item in history_items:
            resp = ExpenseHistoryResponse.model_validate(item)
            if item.changed_by_user:
                resp.changed_by_username = item.changed_by_user.username
            responses.append(resp)
        return responses
    
    def delete_expense(self, expense_id: int) -> None:
        expense = self.expense_repo.get_by_id(expense_id)
        if not expense:
            raise NotFoundException("Expense not found")
        
        self.expense_repo.delete(expense)
        logger.info(f"Expense {expense_id} deleted")
    
    # Expense Category methods
    def get_category(self, category_id: int) -> ExpenseCategoryResponse:
        category = self.category_repo.get_by_id(category_id)
        if not category:
            raise NotFoundException("Expense category not found")
        
        return ExpenseCategoryResponse.model_validate(category)
    
    def list_categories(
        self,
        page: int = 1,
        page_size: int = 100
    ) -> PaginatedResponse[ExpenseCategoryResponse]:
        items, total = self.category_repo.list_all(page, page_size)
        
        return PaginatedResponse(
            items=[ExpenseCategoryResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=ceil(total / page_size) if total > 0 else 0
        )
    
    def create_category(self, data: ExpenseCategoryCreate, user_id: int) -> ExpenseCategoryResponse:
        # Check if category name already exists
        existing = self.category_repo.get_by_name(data.name)
        if existing:
            raise BadRequestException("Expense category with this name already exists")
        
        category = self.category_repo.create(data, user_id)
        logger.info(f"Expense category {category.id} created by user {user_id}")
        
        return ExpenseCategoryResponse.model_validate(category)
    
    def update_category(self, category_id: int, data: ExpenseCategoryUpdate, user_id: int) -> ExpenseCategoryResponse:
        category = self.category_repo.get_by_id(category_id)
        if not category:
            raise NotFoundException("Expense category not found")
        
        # Check if new name conflicts with existing
        if data.name is not None:
            existing = self.category_repo.get_by_name(data.name)
            if existing and existing.id != category_id:
                raise BadRequestException("Expense category with this name already exists")
        
        category = self.category_repo.update(category, data, user_id)
        
        return ExpenseCategoryResponse.model_validate(category)
    
    def delete_category(self, category_id: int) -> None:
        category = self.category_repo.get_by_id(category_id)
        if not category:
            raise NotFoundException("Expense category not found")
        
        # Check if category has expenses
        if category.expenses:
            raise BadRequestException("Cannot delete category with existing expenses")
        
        self.category_repo.delete(category)
        logger.info(f"Expense category {category_id} deleted")
