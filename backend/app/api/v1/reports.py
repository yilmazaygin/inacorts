from fastapi import APIRouter, Query

from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.schemas.report import DashboardStats, FinancialReport
from app.services.report_service import ReportService

router = APIRouter()


@router.get("/dashboard", response_model=DashboardStats)
def dashboard_stats(current_user: CurrentUser, db: DatabaseSession):
    return ReportService(db).dashboard()


@router.get("/financials", response_model=FinancialReport)
def financial_report(
    current_user: CurrentUser,
    db: DatabaseSession,
    period: str = Query("all_time", pattern="^(last_month|last_year|all_time)$"),
):
    return ReportService(db).financials(period)
