import calendar
from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Customer, Expense, ExpenseCategory, Order, OrderItem, Payment, Product
from app.schemas.report import CategoryAmount, DashboardStats, FinancialReport, OrderInsight


def _shift_months(moment: datetime, months: int) -> datetime:
    month_index = moment.month - 1 + months
    year = moment.year + month_index // 12
    month = month_index % 12 + 1
    day = min(moment.day, calendar.monthrange(year, month)[1])
    return moment.replace(year=year, month=month, day=day)


class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def dashboard(self) -> DashboardStats:
        revenue = float(self.db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0)
        expenses = float(self.db.query(func.coalesce(func.sum(Expense.amount), 0)).scalar() or 0)
        return DashboardStats(
            total_orders=int(self.db.query(func.count(Order.id)).scalar() or 0),
            total_products=int(self.db.query(func.count(Product.id)).scalar() or 0),
            total_customers=int(self.db.query(func.count(Customer.id)).scalar() or 0),
            total_revenue=revenue,
            total_expenses=expenses,
            net_profit=revenue - expenses,
        )

    def financials(self, period: str) -> FinancialReport:
        start = self._period_start(period)
        revenue = self._sum_payments(start)
        expenses = self._sum_expenses(start)
        net_profit = revenue - expenses
        margin = (net_profit / revenue * 100) if revenue > 0 else 0
        return FinancialReport(
            revenue=revenue,
            expenses=expenses,
            net_profit=net_profit,
            profit_margin=margin,
            category_breakdown=self._expense_categories(start),
            highest_line_items=self._top_line_items(start),
            highest_volume=self._top_volume(start),
            highest_quantity=self._top_quantity(start),
        )

    def _period_start(self, period: str) -> Optional[datetime]:
        now = datetime.utcnow()
        if period == "last_month":
            return _shift_months(now, -1)
        if period == "last_year":
            return _shift_months(now, -12)
        return None

    def _sum_payments(self, start: Optional[datetime]) -> float:
        query = self.db.query(func.coalesce(func.sum(Payment.amount), 0))
        if start:
            query = query.filter(Payment.created_at >= start)
        return float(query.scalar() or 0)

    def _sum_expenses(self, start: Optional[datetime]) -> float:
        query = self.db.query(func.coalesce(func.sum(Expense.amount), 0))
        if start:
            query = query.filter(Expense.date >= start)
        return float(query.scalar() or 0)

    def _expense_categories(self, start: Optional[datetime]) -> list[CategoryAmount]:
        query = (
            self.db.query(Expense.category_id, ExpenseCategory.name, func.sum(Expense.amount))
            .join(ExpenseCategory, Expense.category_id == ExpenseCategory.id)
            .group_by(Expense.category_id, ExpenseCategory.name)
        )
        if start:
            query = query.filter(Expense.date >= start)
        rows = query.all()
        breakdown = [
            CategoryAmount(category_id=category_id, category_name=name, amount=float(amount or 0))
            for category_id, name, amount in rows
        ]
        breakdown.sort(key=lambda row: row.amount, reverse=True)
        return breakdown

    def _order_query(self, start: Optional[datetime]):
        query = self.db.query(Order)
        if start:
            query = query.filter(Order.created_at >= start)
        return query

    def _top_volume(self, start: Optional[datetime]) -> Optional[OrderInsight]:
        row = self._order_query(start).order_by(Order.total_amount.desc(), Order.id.desc()).first()
        if not row:
            return None
        return OrderInsight(order_id=row.id, value=float(row.total_amount))

    def _top_line_items(self, start: Optional[datetime]) -> Optional[OrderInsight]:
        query = (
            self.db.query(Order.id, func.count(OrderItem.id).label("item_count"))
            .join(OrderItem, OrderItem.order_id == Order.id)
            .group_by(Order.id)
        )
        if start:
            query = query.filter(Order.created_at >= start)
        row = query.order_by(func.count(OrderItem.id).desc(), Order.id.desc()).first()
        if not row:
            return None
        return OrderInsight(order_id=row.id, value=float(row.item_count))

    def _top_quantity(self, start: Optional[datetime]) -> Optional[OrderInsight]:
        query = (
            self.db.query(Order.id, func.sum(OrderItem.quantity).label("qty"))
            .join(OrderItem, OrderItem.order_id == Order.id)
            .group_by(Order.id)
        )
        if start:
            query = query.filter(Order.created_at >= start)
        row = query.order_by(func.sum(OrderItem.quantity).desc(), Order.id.desc()).first()
        if not row:
            return None
        return OrderInsight(order_id=row.id, value=float(row.qty or 0))
