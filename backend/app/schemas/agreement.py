from datetime import datetime
from typing import List

from pydantic import BaseModel


class AgreementUpdate(BaseModel):
    body_tr: str
    body_en: str


class PublicAgreement(BaseModel):
    body_tr: str
    body_en: str
    updated_at: datetime


class AgreementLogEntry(BaseModel):
    id: int
    username: str
    edited_at: datetime

    class Config:
        from_attributes = True


class AgreementAdmin(PublicAgreement):
    logs: List[AgreementLogEntry]


def default_agreement() -> AgreementUpdate:
    return AgreementUpdate(
        body_tr=(
            "Kapsam\n\n"
            "Bu metin, INACORTS sitesini ziyaret eden ve ürünlere bakan kişiler için geçerlidir.\n\n"
            "Fiyat ve stok\n\n"
            "Sitedeki açıklamalar, görseller ve liste fiyatları bilgilendirme amaçlıdır. Sipariş, teslimat ve ödeme koşulları satış danışmanıyla ayrıca netleşir. Stok ve fiyat, görüşme anındaki bilgiye göre değişebilir.\n\n"
            "Sepet\n\n"
            "Sepete eklenen ürünler henüz bir satış değildir. Siteyi kullanmaya devam etmeniz, yayımlanmış bu metni okuduğunuz anlamına gelir. Metin güncellendiğinde sitedeki güncel hali geçerlidir."
        ),
        body_en=(
            "Scope\n\n"
            "This text applies to people who visit the INACORTS site and look at the products.\n\n"
            "Price and stock\n\n"
            "Descriptions, images and list prices on the site are for information. Order, delivery and payment terms are confirmed separately with a sales consultant. Stock and price can change by the time you speak with us.\n\n"
            "Cart\n\n"
            "Adding a product to the cart is not a sale. Continuing to use the site means you have read this published text. When the text is updated, the version on the site is the one that applies."
        ),
    )
