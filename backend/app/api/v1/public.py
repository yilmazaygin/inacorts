from fastapi import APIRouter
from typing import Optional, List

from app.api.v1.dependencies import DatabaseSession
from app.services.site_service import SiteService
from app.schemas.agreement import PublicAgreement
from app.schemas.site import PublicSite, PublicCategory, PublicProduct
from app.services.agreement_service import AgreementService

router = APIRouter()


@router.get("/site", response_model=PublicSite)
def get_public_site(db: DatabaseSession):
    service = SiteService(db)
    content = service.get_content()
    return PublicSite(**content.model_dump(), sales_consultants=service.sales_consultants())


@router.get("/agreement", response_model=PublicAgreement)
def get_public_agreement(db: DatabaseSession):
    return AgreementService(db).get_public()


@router.get("/categories", response_model=List[PublicCategory])
def list_public_categories(db: DatabaseSession):
    return SiteService(db).list_categories()


@router.get("/products", response_model=List[PublicProduct])
def list_public_products(
    db: DatabaseSession,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
):
    return SiteService(db).list_products(category_id, search)
