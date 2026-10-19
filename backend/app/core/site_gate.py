"""Persistent switches for the public storefront and management sign-in.

The state file sits next to the SQLite database, so it survives restarts and
image rebuilds. The CLI in ``app.utils.site_gate`` is the only writer.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from loguru import logger

from app.core.config import settings
from app.core.exceptions import ForbiddenException, NotFoundException

_BACKEND_DIR = Path(__file__).resolve().parents[2]
_PAGES = frozenset({"open", "closed", "page"})
_MAX_MESSAGE = 4000


@dataclass(frozen=True)
class GateState:
    login_locked: bool = False
    login_message: str = ""
    pages: str = "open"
    cover_admin: bool = False
    page_name: str = ""

    def public(self) -> dict:
        custom = self.pages == "page"
        return {
            "login_locked": self.login_locked,
            "login_message": self.login_message if self.login_locked else "",
            "pages": self.pages if self.pages in _PAGES else "open",
            "cover_admin": self.cover_admin if custom else False,
            "page_name": self.page_name if custom else "",
        }


def gate_path() -> Path:
    configured = (settings.SITE_GATE_PATH or "").strip()
    if configured:
        return Path(configured)
    database = _sqlite_file()
    if database is not None:
        return database.parent / "site_gate.json"
    return _BACKEND_DIR.parent / "database" / "site_gate.json"


def load_gate() -> GateState:
    path = gate_path()
    if not path.is_file():
        return GateState()
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError, UnicodeError):
        logger.warning(f"Site gate file is unreadable, leaving the site open: {path}")
        return GateState()
    if not isinstance(raw, dict):
        logger.warning(f"Site gate file has an unexpected shape, leaving the site open: {path}")
        return GateState()

    pages = raw.get("pages", "open")
    if pages not in _PAGES:
        pages = "open"
    message = raw.get("login_message", "")
    if not isinstance(message, str):
        message = ""
    page_name = raw.get("page_name", "")
    if not isinstance(page_name, str):
        page_name = ""
    return GateState(
        login_locked=bool(raw.get("login_locked")),
        login_message=message.strip(),
        pages=pages,
        cover_admin=bool(raw.get("cover_admin")),
        page_name=page_name.strip().lower(),
    )


def save_gate(state: GateState) -> GateState:
    path = gate_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "login_locked": state.login_locked,
        "login_message": state.login_message if state.login_locked else "",
        "pages": state.pages,
        "cover_admin": state.cover_admin if state.pages == "page" else False,
        "page_name": state.page_name if state.pages == "page" else "",
    }
    temporary = path.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)
    return GateState(**payload)


def assert_login_open() -> None:
    state = load_gate()
    if not state.login_locked:
        return
    logger.info("Rejected a management sign-in because login is closed")
    raise ForbiddenException(state.login_message or "Sign-in is closed")


def assert_storefront_open() -> None:
    if load_gate().pages == "open":
        return
    raise NotFoundException("Not found")


def _sqlite_file() -> Path | None:
    url = settings.DATABASE_URL
    if not url.startswith("sqlite:///"):
        return None
    raw = url.removeprefix("sqlite:///")
    if not raw or raw == ":memory:":
        return None
    path = Path(raw)
    if not path.is_absolute():
        path = (_BACKEND_DIR / path).resolve()
    return path


def clean_page_name(name: str) -> str:
    text = name.strip().lower()
    if not text:
        return ""
    if len(text) > 40 or any(character not in "abcdefghijklmnopqrstuvwxyz0123456789-" for character in text):
        raise ValueError("bad-name")
    return text


def clean_message(message: str) -> str:
    text = message.strip()
    if not text:
        raise ValueError("empty")
    if len(text) > _MAX_MESSAGE:
        raise ValueError("long")
    return text
