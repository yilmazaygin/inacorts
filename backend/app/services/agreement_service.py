from datetime import datetime

from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenException
from app.models import User, UserAgreement, UserAgreementLog
from app.schemas.agreement import AgreementAdmin, AgreementLogEntry, AgreementUpdate, PublicAgreement, default_agreement


class AgreementService:
    def __init__(self, db: Session):
        self.db = db

    def ensure(self, user_id: int | None) -> None:
        if self.db.query(UserAgreement).first():
            return
        text = default_agreement()
        self.db.add(UserAgreement(
            body_tr=text.body_tr,
            body_en=text.body_en,
            updated_by=user_id,
            updated_at=datetime.utcnow(),
        ))
        self.db.commit()

    def _row(self) -> UserAgreement:
        row = self.db.query(UserAgreement).order_by(UserAgreement.id.asc()).first()
        if not row:
            self.ensure(None)
            row = self.db.query(UserAgreement).order_by(UserAgreement.id.asc()).first()
        return row

    def get_public(self) -> PublicAgreement:
        row = self._row()
        return PublicAgreement(body_tr=row.body_tr, body_en=row.body_en, updated_at=row.updated_at)

    def get_admin(self) -> AgreementAdmin:
        row = self._row()
        logs = (
            self.db.query(UserAgreementLog)
            .order_by(UserAgreementLog.edited_at.desc(), UserAgreementLog.id.desc())
            .limit(50)
            .all()
        )
        return AgreementAdmin(
            body_tr=row.body_tr,
            body_en=row.body_en,
            updated_at=row.updated_at,
            logs=[AgreementLogEntry.model_validate(item) for item in logs],
        )

    def update(self, data: AgreementUpdate, user: User) -> AgreementAdmin:
        if not user.is_admin:
            raise ForbiddenException("Only admins can edit the user agreement")
        row = self._row()
        changed = row.body_tr != data.body_tr or row.body_en != data.body_en
        if changed:
            now = datetime.utcnow()
            row.body_tr = data.body_tr
            row.body_en = data.body_en
            row.updated_by = user.id
            row.updated_at = now
            self.db.add(UserAgreementLog(
                username=user.username,
                edited_by=user.id,
                edited_at=now,
            ))
            self.db.commit()
        return self.get_admin()
