from fastapi import APIRouter, Response
from typing import Optional, List

from app.api.v1.dependencies import DatabaseSession
from app.core.site_gate import assert_storefront_open, load_gate
from app.services.site_service import SiteService
from app.schemas.agreement import PublicAgreement
from app.schemas.site import PublicSite, PublicCategory, PublicProduct, PublicProductPage
from app.schemas.site_gate import GateStatus
from app.services.agreement_service import AgreementService

router = APIRouter()


@router.get("/gate", response_model=GateStatus)
def get_gate(response: Response):
    response.headers["Cache-Control"] = "no-store"
    return load_gate().public()


@router.get("/site", response_model=PublicSite)
def get_public_site(db: DatabaseSession):
    service = SiteService(db)
    content = service.get_content()
    return PublicSite(**content.model_dump(), sales_consultants=service.sales_consultants())


@router.get("/agreement", response_model=PublicAgreement)
def get_public_agreement(db: DatabaseSession):
    assert_storefront_open()
    return AgreementService(db).get_public()


@router.get("/categories", response_model=List[PublicCategory])
def list_public_categories(db: DatabaseSession):
    assert_storefront_open()
    return SiteService(db).list_categories()


@router.get("/products", response_model=PublicProductPage)
def list_public_products(
    db: DatabaseSession,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 12,
    sort: str = "az",
):
    assert_storefront_open()
    return SiteService(db).list_products(category_id, search, page, page_size, sort)


@router.get("/products/{product_id}", response_model=PublicProduct)
def get_public_product(product_id: int, db: DatabaseSession):
    assert_storefront_open()
    return SiteService(db).get_product(product_id)
