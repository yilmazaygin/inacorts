from fastapi import APIRouter, status
from typing import Optional
from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.services.expense_service import ExpenseService
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
from typing import List

router = APIRouter()


# Expense endpoints
@router.get("", response_model=PaginatedResponse[ExpenseResponse])
def list_expenses(
    current_user: CurrentUser,
    db: DatabaseSession,
    page: int = 1,
    page_size: int = 20,
    sort_by: str = "date",
    order: str = "desc",
    category_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    List all expenses with filtering and pagination.
    Shows WHO created each expense for full audit trail.
    """
    service = ExpenseService(db)
    return service.list_expenses(page, page_size, sort_by, order, category_id, start_date, end_date)


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """
    Get a single expense by ID.
    Includes creator username for accountability.
    """
    service = ExpenseService(db)
    return service.get_expense(expense_id)


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    data: ExpenseCreate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """
    Create a new expense record.
    Automatically tracks WHO created it.
    """
    service = ExpenseService(db)
    return service.create_expense(data, current_user.id)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """Update an existing expense."""
    service = ExpenseService(db)
    return service.update_expense(expense_id, data, current_user.id)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """Delete an expense."""
    service = ExpenseService(db)
    service.delete_expense(expense_id)


@router.get("/{expense_id}/history", response_model=List[ExpenseHistoryResponse])
def get_expense_history(
    expense_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """Get the change history for an expense."""
    service = ExpenseService(db)
    return service.get_expense_history(expense_id)


# Expense Category endpoints
@router.get("/categories/list", response_model=PaginatedResponse[ExpenseCategoryResponse])
def list_expense_categories(
    current_user: CurrentUser,
    db: DatabaseSession,
    page: int = 1,
    page_size: int = 100
):
    """List all expense categories."""
    service = ExpenseService(db)
    return service.list_categories(page, page_size)


@router.get("/categories/{category_id}", response_model=ExpenseCategoryResponse)
def get_expense_category(
    category_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """Get a single expense category by ID."""
    service = ExpenseService(db)
    return service.get_category(category_id)


@router.post("/categories", response_model=ExpenseCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_expense_category(
    data: ExpenseCategoryCreate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """Create a new expense category."""
    service = ExpenseService(db)
    return service.create_category(data, current_user.id)


@router.put("/categories/{category_id}", response_model=ExpenseCategoryResponse)
def update_expense_category(
    category_id: int,
    data: ExpenseCategoryUpdate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """Update an expense category."""
    service = ExpenseService(db)
    return service.update_category(category_id, data, current_user.id)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense_category(
    category_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """Delete an expense category (only if no expenses exist)."""
    service = ExpenseService(db)
    service.delete_category(category_id)
