import json
import re
from typing import Optional, List

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func

from app.models import SiteSettings, Product, Category, User, UserAgreement
from app.schemas.site import SalesConsultantPublic
from app.schemas.site import SiteContent, PublicCategory, PublicProduct, PublicProductPage, default_site_content
from app.core.exceptions import ForbiddenException, NotFoundException
from app.utils.product_images import (
    category_image_url,
    delete_favicon,
    filenames_from,
    image_url_for,
    save_favicon,
    user_photo_url,
)

_SKIP_BRAND_FIELDS = {
    "company_name",
    "tab_title",
    "email",
    "phone",
    "sales1_phone",
    "sales2_phone",
    "favicon_url",
}


def replace_brand(text: str, old: str, new: str) -> str:
    old_name = old.strip()
    new_name = new.strip()
    if not text or not old_name or old_name.casefold() == new_name.casefold():
        return text
    pattern = re.compile(rf"(?<![\w@.]){re.escape(old_name)}(?![\w@.])", re.IGNORECASE)
    return pattern.sub(lambda _match: new_name, text)


def _rename_value(value, old_name: str, new_name: str):
    if isinstance(value, str):
        return replace_brand(value, old_name, new_name)
    if isinstance(value, dict):
        return {key: _rename_value(item, old_name, new_name) for key, item in value.items()}
    if isinstance(value, list):
        return [_rename_value(item, old_name, new_name) for item in value]
    return value


def apply_system_name(previous: SiteContent, data: SiteContent) -> SiteContent:
    new_name = data.company_name.strip() or previous.company_name.strip()
    payload = data.model_dump()
    old_name = previous.company_name.strip()
    if old_name and new_name and old_name.casefold() != new_name.casefold():
        for key, value in payload.items():
            if key in _SKIP_BRAND_FIELDS:
                continue
            payload[key] = _rename_value(value, old_name, new_name)
    payload["company_name"] = new_name
    payload["tab_title"] = new_name
    return SiteContent(**payload)


def merge_site_content(stored: dict) -> SiteContent:
    defaults = default_site_content().model_dump()
    labels = dict(defaults.get("labels") or {})
    incoming_labels = stored.get("labels")
    if isinstance(incoming_labels, dict):
        for key, value in incoming_labels.items():
            if isinstance(value, str) and value.strip():
                labels[key] = value
    faqs = stored["faqs"] if isinstance(stored.get("faqs"), list) else defaults["faqs"]
    payload = {
        key: value
        for key, value in stored.items()
        if key in defaults and key not in ("labels", "faqs")
    }
    defaults.update(payload)
    defaults["labels"] = labels
    defaults["faqs"] = faqs
    return SiteContent(**defaults)


class SiteService:
    def __init__(self, db: Session):
        self.db = db

    def get_content(self) -> SiteContent:
        row = self.db.query(SiteSettings).order_by(SiteSettings.id.asc()).first()
        if not row:
            return default_site_content()
        return merge_site_content(json.loads(row.data))

    def ensure_content(self, user_id: Optional[int]) -> None:
        row = self.db.query(SiteSettings).first()
        if not row:
            self.db.add(SiteSettings(
                data=default_site_content().model_dump_json(),
                updated_by=user_id,
            ))
            self.db.commit()
            return
        stored = json.loads(row.data)
        defaults = default_site_content().model_dump()
        changed = False
        # Replace the first short default copy so an existing local site picks up the longer text.
        if stored.get("about_tr", "").startswith("INACORTS, üretim hatları"):
            for key in (
                "hero_subtitle_tr", "hero_subtitle_en",
                "about_tr", "about_en",
            ):
                stored[key] = defaults[key]
            changed = True
        if stored.get("hero_subtitle_tr", "").startswith("Klips, jel, eldiven, streç film, ortam kokusu"):
            stored["hero_subtitle_tr"] = defaults["hero_subtitle_tr"]
            stored["hero_subtitle_en"] = defaults["hero_subtitle_en"]
            changed = True
        if "depo adresinden" in stored.get("contact_intro_tr", ""):
            stored["contact_intro_tr"] = defaults["contact_intro_tr"]
            stored["contact_intro_en"] = defaults["contact_intro_en"]
            changed = True
        for key in ("sales1_name", "sales1_phone", "sales2_name", "sales2_phone", "tab_title", "order_out_of_stock"):
            if key not in stored:
                stored[key] = defaults[key]
                changed = True
        for key in ("sales1_phone", "sales2_phone"):
            if not str(stored.get(key) or "").strip():
                stored[key] = defaults[key]
                changed = True
        if changed:
            row.data = json.dumps(stored, ensure_ascii=False)
            self.db.commit()

    def update_content(self, data: SiteContent, user: User) -> SiteContent:
        if not user.is_admin:
            raise ForbiddenException("Only admins can edit the public site")
        previous = self.get_content()
        data = apply_system_name(previous, data)
        if previous.company_name.strip().casefold() != data.company_name.strip().casefold():
            self._rename_agreement(previous.company_name, data.company_name)
        row = self.db.query(SiteSettings).order_by(SiteSettings.id.asc()).first()
        payload = data.model_dump_json()
        if row:
            row.data = payload
            row.updated_by = user.id
        else:
            self.db.add(SiteSettings(data=payload, updated_by=user.id))
        self.db.commit()
        return data

    def _rename_agreement(self, old: str, new: str) -> None:
        row = self.db.query(UserAgreement).order_by(UserAgreement.id.asc()).first()
        if not row:
            return
        row.body_tr = replace_brand(row.body_tr, old, new)
        row.body_en = replace_brand(row.body_en, old, new)

    def set_favicon(self, data: bytes, user: User) -> SiteContent:
        if not user.is_admin:
            raise ForbiddenException("Only admins can edit the public site")
        content = self.get_content()
        url = save_favicon(data)
        previous = content.favicon_url
        content.favicon_url = url
        saved = self.update_content(content, user)
        if previous and previous != url:
            delete_favicon(previous)
        return saved

    def clear_favicon(self, user: User) -> SiteContent:
        if not user.is_admin:
            raise ForbiddenException("Only admins can edit the public site")
        content = self.get_content()
        previous = content.favicon_url
        content.favicon_url = None
        saved = self.update_content(content, user)
        delete_favicon(previous)
        return saved

    def sales_consultants(self) -> List[SalesConsultantPublic]:
        rows = (
            self.db.query(User)
            .filter(
                User.is_sales_consultant.is_(True),
                User.is_active.is_(True),
                User.username.notin_(["admin", "system"]),
            )
            .order_by(User.name.asc(), User.surname.asc(), User.id.asc())
            .all()
        )
        people = []
        for user in rows:
            name = " ".join(part for part in (user.name, user.surname) if part).strip() or user.username
            people.append(SalesConsultantPublic(
                name=name,
                phone=(user.phone_number or "").strip(),
                email=(user.email or "").strip(),
                photo_url=user_photo_url(user.photo_filename),
            ))
        return people

    def list_categories(self) -> List[PublicCategory]:
        rows = (
            self.db.query(Category, func.count(Product.id))
            .outerjoin(Product, and_(Product.category_id == Category.id, Product.show_on_site.is_(True)))
            .group_by(Category.id)
            .order_by(Category.name.asc())
            .all()
        )
        return [
            PublicCategory(
                id=category.id,
                name=category.name,
                product_count=count,
                image_url=category_image_url(category.image_filename),
            )
            for category, count in rows
        ]

    def _public_product(self, product: Product) -> PublicProduct:
        urls = [
            url for name in filenames_from(product.image_filenames, product.image_filename)
            if (url := image_url_for(name))
        ]
        return PublicProduct(
            id=product.id,
            name=product.name,
            description=product.description,
            category_id=product.category_id,
            category_name=product.category.name if product.category else "",
            list_price=product.list_price,
            in_stock=product.current_stock > 0,
            image_url=urls[0] if urls else None,
            image_urls=urls,
        )

    def get_product(self, product_id: int) -> PublicProduct:
        product = (
            self.db.query(Product)
            .options(joinedload(Product.category))
            .filter(Product.id == product_id)
            .first()
        )
        if not product or not product.show_on_site:
            raise NotFoundException("Product not found")
        return self._public_product(product)

    def list_products(
        self,
        category_id: Optional[int] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 12,
        sort: str = "az",
    ) -> PublicProductPage:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 48)
        query = self.db.query(Product).filter(Product.show_on_site.is_(True))
        if category_id:
            query = query.filter(Product.category_id == category_id)
        needle = (search or "").strip()
        if needle:
            query = query.filter(or_(
                Product.name.ilike(f"%{needle}%"),
                Product.description.ilike(f"%{needle}%"),
                Product.sku.ilike(f"%{needle}%"),
            ))
        total = query.count()
        if sort == "za":
            ordering = (Product.name.desc(), Product.id.asc())
        elif sort == "price-asc":
            ordering = (Product.list_price.asc(), Product.name.asc(), Product.id.asc())
        elif sort == "price-desc":
            ordering = (Product.list_price.desc(), Product.name.asc(), Product.id.asc())
        else:
            ordering = (Product.name.asc(), Product.id.asc())
        rows = (
            query.options(joinedload(Product.category))
            .order_by(*ordering)
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return PublicProductPage(
            items=[self._public_product(product) for product in rows],
            total=total,
            page=page,
            page_size=page_size,
        )
