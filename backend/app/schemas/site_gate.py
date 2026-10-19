from typing import Literal

from pydantic import BaseModel


class GateStatus(BaseModel):
    login_locked: bool
    login_message: str
    pages: Literal["open", "closed", "page"]
    cover_admin: bool
