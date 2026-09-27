"""Local storage for product images.

Files live under ``{UPLOAD_DIR}/products`` and are served at ``/uploads/products``.
A product can keep several files; the first one is the cover.
"""

import json
from pathlib import Path
from uuid import uuid4

from app.core.config import settings
from app.core.exceptions import BadRequestException

_ALLOWED_SIGNATURES = (
    (b"\xff\xd8\xff", ".jpg"),
    (b"\x89PNG\r\n\x1a\n", ".png"),
    (b"GIF87a", ".gif"),
    (b"GIF89a", ".gif"),
)


def products_dir() -> Path:
    directory = Path(settings.UPLOAD_DIR) / "products"
    directory.mkdir(parents=True, exist_ok=True)
    return directory.resolve()


MAX_PRODUCT_IMAGES = 8


def image_url_for(filename: str | None) -> str | None:
    if not filename:
        return None
    return f"/uploads/products/{filename}"


def filenames_from(raw: str | None, cover: str | None) -> list[str]:
    names: list[str] = []
    if raw:
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = None
        if isinstance(parsed, list):
            names = [item for item in parsed if isinstance(item, str) and item]
    if not names and cover:
        names = [cover]
    return names


def dump_filenames(names: list[str]) -> str | None:
    return json.dumps(names) if names else None


def _detect_extension(data: bytes) -> str:
    for signature, extension in _ALLOWED_SIGNATURES:
        if data.startswith(signature):
            return extension
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    raise BadRequestException("Only JPEG, PNG, WEBP and GIF images are allowed")


def _safe_path(filename: str) -> Path:
    directory = products_dir()
    path = (directory / filename).resolve()
    if path.parent != directory:
        raise BadRequestException("Invalid image path")
    return path


def save_product_image(product_id: int, data: bytes) -> str:
    if not data:
        raise BadRequestException("Empty file")
    if len(data) > settings.MAX_PRODUCT_IMAGE_BYTES:
        raise BadRequestException("Image must be 5 MB or smaller")

    extension = _detect_extension(data)
    filename = f"{product_id}_{uuid4().hex}{extension}"
    _safe_path(filename).write_bytes(data)
    return filename


def save_favicon(data: bytes) -> str:
    if not data:
        raise BadRequestException("Empty file")
    if len(data) > 1024 * 1024:
        raise BadRequestException("Favicon must be 1 MB or smaller")

    if data.startswith(b"\x00\x00\x01\x00"):
        extension = ".ico"
    else:
        extension = _detect_extension(data)

    directory = Path(settings.UPLOAD_DIR) / "site"
    directory.mkdir(parents=True, exist_ok=True)
    filename = f"favicon_{uuid4().hex}{extension}"
    path = (directory / filename).resolve()
    if path.parent != directory.resolve():
        raise BadRequestException("Invalid image path")
    path.write_bytes(data)
    return f"/uploads/site/{filename}"


def delete_favicon(url: str | None) -> None:
    if not url or not url.startswith("/uploads/site/"):
        return
    filename = url.rsplit("/", 1)[-1]
    directory = (Path(settings.UPLOAD_DIR) / "site").resolve()
    path = (directory / filename).resolve()
    if path.parent != directory or not path.is_file():
        return
    path.unlink()


def user_photo_url(filename: str | None) -> str | None:
    if not filename:
        return None
    return f"/uploads/users/{filename}"


def save_user_photo(user_id: int, data: bytes) -> str:
    if not data:
        raise BadRequestException("Empty file")
    if len(data) > settings.MAX_PRODUCT_IMAGE_BYTES:
        raise BadRequestException("Image must be 5 MB or smaller")

    extension = _detect_extension(data)
    directory = Path(settings.UPLOAD_DIR) / "users"
    directory.mkdir(parents=True, exist_ok=True)
    filename = f"{user_id}_{uuid4().hex}{extension}"
    path = (directory / filename).resolve()
    if path.parent != directory.resolve():
        raise BadRequestException("Invalid image path")
    path.write_bytes(data)
    return filename


def delete_user_photo(filename: str | None) -> None:
    if not filename:
        return
    directory = (Path(settings.UPLOAD_DIR) / "users").resolve()
    path = (directory / filename).resolve()
    if path.parent != directory or not path.is_file():
        return
    path.unlink()


def category_image_url(filename: str | None) -> str | None:
    if not filename:
        return None
    return f"/uploads/categories/{filename}"


def save_category_image(category_id: int, data: bytes) -> str:
    if not data:
        raise BadRequestException("Empty file")
    if len(data) > settings.MAX_PRODUCT_IMAGE_BYTES:
        raise BadRequestException("Image must be 5 MB or smaller")

    extension = _detect_extension(data)
    directory = Path(settings.UPLOAD_DIR) / "categories"
    directory.mkdir(parents=True, exist_ok=True)
    filename = f"{category_id}_{uuid4().hex}{extension}"
    path = (directory / filename).resolve()
    if path.parent != directory.resolve():
        raise BadRequestException("Invalid image path")
    path.write_bytes(data)
    return filename


def delete_category_image(filename: str | None) -> None:
    if not filename:
        return
    directory = (Path(settings.UPLOAD_DIR) / "categories").resolve()
    path = (directory / filename).resolve()
    if path.parent != directory or not path.is_file():
        return
    path.unlink()


def delete_product_image(filename: str | None) -> None:
    if not filename:
        return
    path = _safe_path(filename)
    if path.is_file():
        path.unlink()
