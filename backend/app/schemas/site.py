from pydantic import BaseModel
from typing import List, Optional


class SiteContent(BaseModel):
    company_name: str
    tab_title: str
    favicon_url: Optional[str] = None
    phone: str
    email: str
    address: str
    hours: str
    sales1_name: str
    sales1_phone: str
    sales2_name: str
    sales2_phone: str
    order_out_of_stock: bool = False
    hero_title_tr: str
    hero_title_en: str
    hero_subtitle_tr: str
    hero_subtitle_en: str
    about_tr: str
    about_en: str
    contact_intro_tr: str
    contact_intro_en: str
    feature1_title_tr: str
    feature1_title_en: str
    feature1_text_tr: str
    feature1_text_en: str
    feature2_title_tr: str
    feature2_title_en: str
    feature2_text_tr: str
    feature2_text_en: str
    feature3_title_tr: str
    feature3_title_en: str
    feature3_text_tr: str
    feature3_text_en: str


class SalesConsultantPublic(BaseModel):
    name: str
    phone: str
    photo_url: Optional[str] = None


class PublicSite(SiteContent):
    sales_consultants: List[SalesConsultantPublic] = []


class PublicCategory(BaseModel):
    id: int
    name: str
    product_count: int
    image_url: Optional[str] = None


class PublicProduct(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    category_id: int
    category_name: str
    list_price: float
    in_stock: bool
    image_url: Optional[str] = None
    image_urls: List[str] = []


def default_site_content() -> SiteContent:
    return SiteContent(
        company_name="INACORTS",
        tab_title="INACORTS",
        favicon_url=None,
        phone="0212 000 00 00",
        email="info@inacorts.com",
        address="İkitelli OSB, Başakşehir / İstanbul",
        hours="Hafta içi 08:30–18:00",
        sales1_name="Muharrem Gülmez",
        sales1_phone="541 943 44 04",
        sales2_name="Efe Uğur",
        sales2_phone="541 943 44 04",
        order_out_of_stock=False,
        hero_title_tr="Sanayi sarf malzemesinde tek adres",
        hero_title_en="Industrial supplies, from one supplier",
        hero_subtitle_tr="Klips, jel, eldiven, streç film, koku ve elektrik soketini toptan ulaştırıyoruz.",
        hero_subtitle_en="Wholesale clips, gel, gloves, stretch film, air fresheners and electrical sockets.",
        about_tr=(
            "INACORTS, her gün tükenen sanayi sarfını tek noktadan tedarik eder. Üretim hattı, bakım ekibi ve ofis aynı kalemleri ayrı ayrı aramasın diye klipsten eldivene, el jelinden palet streçine, ortam kokusundan elektrik soketine kadar sık yenilenen ürünleri depoda tutarız.\n\n"
            "Her kalemin açıklamasında ölçü, kutu adedi ve kullanım yeri yazar. Liste fiyatı vitrinde görünür; koli ve palet alımlarında bu fiyatın altında çalışırız. Aynı ürünü tekrar istediğinizde beden veya mikron bilgisini yeniden aramanız gerekmez, önceki siparişte netleşen ölçüyle devam ederiz.\n\n"
            "Stokta olanı ve termin süresini açık söyleriz. Alternatif beden, renk kodu veya numune istendiğinde depoya sormadan söz vermeyiz. Teklif ve stok sorularına hafta içi aynı gün döner, sevkiyatı adres ve adet netleşince hazırlarız."
        ),
        about_en=(
            "INACORTS supplies the industrial consumables that run out every day, from one warehouse. Production lines, maintenance crews and offices should not have to chase the same items separately, so we keep clips, gloves, hand gel, pallet stretch film, air fresheners and electrical sockets in stock.\n\n"
            "Each product page states the size, the pack quantity and where it is used. The list price is on the page; case and pallet orders are priced below it. When you reorder, you do not have to look up the size again — we continue with the one already confirmed.\n\n"
            "We say plainly what is in stock and how soon it can leave. If you ask for another size, a colour code or a sample, we check the warehouse before we promise it. Quote and stock questions are answered the same weekday, and the shipment is prepared once the address and quantity are clear."
        ),
        contact_intro_tr="Teklif ve toplu sipariş için satış danışmanlarımızı arayabilir veya e-posta yazabilirsiniz. Mesajınıza ölçü ve adet eklerseniz cevap aynı gün netleşir.",
        contact_intro_en="Call our sales consultants or email us for a quote and bulk orders. Add the size and quantity and we can answer the same day.",
        feature1_title_tr="Stoktan sevkiyat",
        feature1_title_en="Ships from stock",
        feature1_text_tr="Sık kullanılan ölçüler depoda hazır. Siparişiniz bekletilmeden çıkar.",
        feature1_text_en="The sizes you reorder are already in the warehouse and leave without delay.",
        feature2_title_tr="Toptan fiyat",
        feature2_title_en="Wholesale pricing",
        feature2_text_tr="Koli ve palet alımlarında liste fiyatının altında çalışırız.",
        feature2_text_en="Case and pallet quantities are priced below the list rate.",
        feature3_title_tr="Geniş sarf yelpazesi",
        feature3_title_en="A wide consumables range",
        feature3_text_tr="Ambalaj, hijyen, koku ve elektrik ihtiyacını ayrı tedarikçilere bölmezsiniz.",
        feature3_text_en="Packaging, hygiene, scent and electrical needs stay with one supplier.",
    )
