from typing import Optional

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_orders: int
    total_products: int
    total_customers: int
    total_revenue: float
    total_expenses: float
    net_profit: float


class CategoryAmount(BaseModel):
    category_id: int
    category_name: str
    amount: float


class OrderInsight(BaseModel):
    order_id: int
    value: float


class FinancialReport(BaseModel):
    revenue: float
    expenses: float
    net_profit: float
    profit_margin: float
    category_breakdown: list[CategoryAmount]
    highest_line_items: Optional[OrderInsight] = None
    highest_volume: Optional[OrderInsight] = None
    highest_quantity: Optional[OrderInsight] = None


class ExpenseSummary(BaseModel):
    total_amount: float
    count: int
