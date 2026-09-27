from fastapi import APIRouter

from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.schemas.agreement import AgreementAdmin, AgreementUpdate
from app.services.agreement_service import AgreementService

router = APIRouter()


@router.get("", response_model=AgreementAdmin)
def get_agreement(current_user: CurrentUser, db: DatabaseSession):
    return AgreementService(db).get_admin()


@router.put("", response_model=AgreementAdmin)
def update_agreement(data: AgreementUpdate, current_user: CurrentUser, db: DatabaseSession):
    return AgreementService(db).update(data, current_user)
