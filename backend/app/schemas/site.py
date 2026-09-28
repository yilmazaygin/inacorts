from pydantic import BaseModel, Field, field_validator
from typing import Dict, List, Optional


class FaqItem(BaseModel):
    question_tr: str = ""
    question_en: str = ""
    answer_tr: str = ""
    answer_en: str = ""


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
    consultant_whatsapp_tr: str
    consultant_whatsapp_en: str
    bulk_price_note_tr: str = "Toplu alım için fiyat sorun."
    bulk_price_note_en: str = "Ask for a bulk price."
    featured_category_ids: List[int] = Field(default_factory=list)
    featured_master_product_id: Optional[int] = None
    featured_product_ids: List[int] = Field(default_factory=list)
    labels: Dict[str, str] = Field(default_factory=dict)
    faqs: List[FaqItem] = Field(default_factory=list)

    @field_validator("featured_master_product_id")
    @classmethod
    def master_id(cls, value: Optional[int]) -> Optional[int]:
        if not value or value < 1:
            return None
        return value

    @field_validator("featured_category_ids", "featured_product_ids")
    @classmethod
    def unique_ids(cls, value: List[int]) -> List[int]:
        seen: List[int] = []
        for item in value:
            if item not in seen:
                seen.append(item)
        return seen[:12]


class SalesConsultantPublic(BaseModel):
    name: str
    phone: str
    email: str = ""
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


class PublicProductPage(BaseModel):
    items: List[PublicProduct]
    total: int
    page: int
    page_size: int


def default_labels() -> Dict[str, str]:
    return {
        "home_tr": "Anasayfa",
        "home_en": "Home",
        "products_tr": "Ürünler",
        "products_en": "Products",
        "about_tr": "Hakkımızda",
        "about_en": "About",
        "contact_tr": "İletişim",
        "contact_en": "Contact",
        "admin_tr": "Yönetim",
        "admin_en": "Admin",
        "browseProducts_tr": "Ürünleri incele",
        "browseProducts_en": "Browse the catalog",
        "getInTouch_tr": "Bize ulaşın",
        "getInTouch_en": "Talk to sales",
        "replyGuaranteeKicker_tr": "Dönüş garantisi",
        "replyGuaranteeKicker_en": "Guaranteed reply",
        "replyGuaranteeBefore_tr": "Tüm mesajlara en geç",
        "replyGuaranteeBefore_en": "Every message, within",
        "replyGuaranteeTime_tr": "12 saat",
        "replyGuaranteeTime_en": "12 hours",
        "replyGuaranteeAfter_tr": " içinde.",
        "replyGuaranteeAfter_en": ".",
        "categories_tr": "Kategoriler",
        "categories_en": "Categories",
        "featured_tr": "Öne çıkanlar",
        "featured_en": "From the warehouse",
        "viewAll_tr": "Tümünü gör",
        "viewAll_en": "View all",
        "orderHeading_tr": "Sipariş",
        "orderHeading_en": "Ordering",
        "faqHeading_tr": "Merak edilenler",
        "faqHeading_en": "Before you order",
        "faqLead_tr": "Ödeme sitede alınmaz. Fiyat, stok ve teslimat satış danışmanıyla netleşir.",
        "faqLead_en": "The site does not take payment. Price, stock and delivery are settled with a sales consultant.",
        "howToOrder_tr": "Nasıl Sipariş Veririm?",
        "howToOrder_en": "How do I place an order?",
        "myCart_tr": "Sepetim",
        "myCart_en": "My cart",
        "cart_tr": "Sepet",
        "cart_en": "Cart",
        "userAgreement_tr": "Kullanıcı sözleşmesi",
        "userAgreement_en": "User agreement",
        "storageNoticeTitle_tr": "Bilgilendirme",
        "storageNoticeTitle_en": "Notice",
        "storageNoticeOk_tr": "Tamam",
        "storageNoticeOk_en": "OK",
        "storageNotice_tr": "Bu site çerez kullanmaz. Sepet, dil, tema ve liste görünümü tarayıcınızda yerel olarak tutulur. Reklam veya analiz amaçlı takip yoktur.",
        "storageNotice_en": "This site does not use cookies. The cart, language, theme and list view are kept locally in your browser. There is no advertising or analytics tracking.",
        "salesConsultant_tr": "Satış danışmanı",
        "salesConsultant_en": "Sales consultant",
        "phone_tr": "Telefon",
        "phone_en": "Phone",
        "whatsapp_tr": "WhatsApp",
        "whatsapp_en": "WhatsApp",
        "consultantEmail_tr": "E-posta",
        "consultantEmail_en": "Email",
        "catalogIntro_tr": "Atölye ve tesis için sarf malzemesi. Kategoriye göre süzün, ada veya fiyata göre sıralayın.",
        "catalogIntro_en": "Consumables for workshops and plants. Filter by category, then sort by name or price.",
        "searchPlaceholder_tr": "Ürün veya açıklama ara",
        "searchPlaceholder_en": "Search by product or description",
        "category_tr": "Kategori",
        "category_en": "Category",
        "allCategories_tr": "Tümü",
        "allCategories_en": "All",
        "sort_tr": "Sıralama",
        "sort_en": "Sort",
        "sortAz_tr": "A → Z",
        "sortAz_en": "A → Z",
        "sortZa_tr": "Z → A",
        "sortZa_en": "Z → A",
        "sortPriceAsc_tr": "Ucuzdan pahalıya",
        "sortPriceAsc_en": "Price: low to high",
        "sortPriceDesc_tr": "Pahalıdan ucuza",
        "sortPriceDesc_en": "Price: high to low",
        "viewGrid_tr": "Izgara görünüm",
        "viewGrid_en": "Grid view",
        "viewList_tr": "Yatay görünüm",
        "viewList_en": "Horizontal view",
        "noProducts_tr": "Bu aramaya uygun ürün yok.",
        "noProducts_en": "No products match this search.",
        "listPrice_tr": "Liste fiyatı",
        "listPrice_en": "List price",
        "addToCart_tr": "Sepete ekle",
        "addToCart_en": "Add to cart",
        "outOfStock_tr": "Stokta yok",
        "outOfStock_en": "Out of stock",
        "details_tr": "Ürün detayı",
        "details_en": "Product details",
        "productCount_tr": "{{count}} ürün",
        "productCount_en": "{{count}} products",
        "prevImage_tr": "Önceki görsel",
        "prevImage_en": "Previous image",
        "nextImage_tr": "Sonraki görsel",
        "nextImage_en": "Next image",
        "cartEmpty_tr": "Sepetiniz boş.",
        "cartEmpty_en": "Your cart is empty.",
        "cartIntroBefore_tr": "Nasıl sipariş vereceğinizi bilmiyorsanız",
        "cartIntroBefore_en": "If you are not sure how to order,",
        "cartIntroLink_tr": "buraya tıklayın",
        "cartIntroLink_en": "click here",
        "clearCart_tr": "Sepeti boşalt",
        "clearCart_en": "Clear cart",
        "unitListPrice_tr": "Adet liste fiyatı: {{price}}",
        "unitListPrice_en": "Unit list price: {{price}}",
        "cartTotal_tr": "Liste fiyatı toplamı",
        "cartTotal_en": "List price total",
        "acceptAgreementBefore_tr": "",
        "acceptAgreementBefore_en": "I have read and accept the ",
        "acceptAgreementName_tr": "Kullanıcı sözleşmesini",
        "acceptAgreementName_en": "user agreement",
        "acceptAgreementAfter_tr": " okudum ve kabul ediyorum.",
        "acceptAgreementAfter_en": ".",
        "placeOrder_tr": "Sipariş ver",
        "placeOrder_en": "Place order",
        "pickConsultant_tr": "Satış danışmanı seçin",
        "pickConsultant_en": "Choose a sales consultant",
        "noConsultantPhone_tr": "Numara tanımlı değil. Site ayarlarından ekleyin.",
        "noConsultantPhone_en": "No number yet. Add it in site settings.",
        "orderIntro_tr": "Merhaba, aşağıdaki ürünlerle ilgili sipariş oluşturmak istiyorum:",
        "orderIntro_en": "Hello, I would like to place an order for the products below:",
        "orderLine_tr": "{{count}} adet {{name}}",
        "orderLine_en": "{{count}} x {{name}}",
        "howToOrderLead_tr": "Sipariş siteden ödeme alınmadan satış danışmanına WhatsApp ile iletilir.",
        "howToOrderLead_en": "The order is sent to a sales consultant on WhatsApp. The site does not take payment.",
        "howToOrderStep1Title_tr": "Ürünleri seçin",
        "howToOrderStep1Title_en": "Choose the products",
        "howToOrderStep1_tr": "Katalogda kategoriye göre süzün, ada veya açıklamaya göre arayın, liste veya tablo görünümünden bakın. Ürün kartındaki Sepete ekle ile kalemi sepete alın. Açılan pencerede ölçü, kutu adedi ve kullanım yeri yazar. Gösterilen tutar liste fiyatıdır; koli ve palet için satış danışmanı ayrıca fiyat verir.",
        "howToOrderStep1_en": "Filter the catalog by category, search by name or description, and switch between list and grid. Add a line with Add to cart. The product window states the size, pack quantity and where it is used. The amount shown is the list price; a sales consultant quotes case and pallet orders separately.",
        "howToOrderStep2Title_tr": "Sepeti kontrol edin",
        "howToOrderStep2Title_en": "Check the cart",
        "howToOrderStep2_tr": "Sepette her kalemin adedini artırıp azaltabilir, satırı silebilir veya sepeti boşaltabilirsiniz. Sağdaki tutar, adet ile liste fiyatının çarpımıdır. Toplam da bu liste fiyatlarının toplamıdır; sitede tahsilat yapılmaz.",
        "howToOrderStep2_en": "In the cart you can change a quantity, remove a line or clear the cart. The amount beside a line is the quantity times the list price. The total is the sum of those list prices. The site does not take payment.",
        "howToOrderStep3Title_tr": "Danışman seçin",
        "howToOrderStep3Title_en": "Choose a consultant",
        "howToOrderStep3_tr": "Kullanıcı sözleşmesini okuyun, Sipariş ver’e basın ve açılan listeden bir satış danışmanı seçin. Danışmanın numarası tanımlı değilse o satır seçilemez.",
        "howToOrderStep3_en": "Read the user agreement, press Place order, and pick a sales consultant. A consultant without a phone number cannot be selected.",
        "howToOrderStep4Title_tr": "WhatsApp’tan gönderin",
        "howToOrderStep4Title_en": "Send it on WhatsApp",
        "howToOrderStep4_tr": "WhatsApp, ürün adları ve adetler yazılı mesajla açılır. Gönder’e basınca sipariş danışmana ulaşır. Teslimat adresi, ödeme ve termin bu yazışmada netleşir. Mesajlara en geç 12 saat içinde dönüş yapılır.",
        "howToOrderStep4_en": "WhatsApp opens with the product names and quantities already written. Sending the message delivers the order. Delivery address, payment and timing are settled in that chat. Every message is answered within 12 hours.",
        "howToOrderClose_tr": "Stokta olmayan bir kalem sepette Stokta yok diye görünür ve eklenemez. Danışman, stok ve sevkiyatı depodan teyit etmeden söz vermez.",
        "howToOrderClose_en": "An out-of-stock item shows Out of stock in the cart and cannot be added. The consultant does not promise stock or a ship date before checking the warehouse.",
        "orderAgreementBefore_tr": "Sipariş vermeden önce",
        "orderAgreementBefore_en": "Before you place an order, you need to accept the",
        "orderAgreementName_tr": "kullanıcı sözleşmesini",
        "orderAgreementName_en": "user agreement",
        "orderAgreementAfter_tr": " kabul etmeniz gerekir.",
        "orderAgreementAfter_en": ".",
        "goBack_tr": "Geri dön",
        "goBack_en": "Go back",
        "agreementLanguage_tr": "Türkçe",
        "agreementLanguage_en": "English",
        "lastEdited_tr": "Son düzenleme: {{date}}",
        "lastEdited_en": "Last updated: {{date}}",
        "printAgreement_tr": "Yazdır",
        "printAgreement_en": "Print",
    }


def default_faqs() -> List[FaqItem]:
    return [
        FaqItem(
            question_tr="Nasıl sipariş veririm?",
            question_en="How do I place an order?",
            answer_tr="Ürünleri sepete ekleyin, Sipariş ver’e basın ve bir satış danışmanı seçin. WhatsApp’ta hazır mesaj açılır; gönderince sipariş danışmana ulaşır.",
            answer_en="Add products to the cart, press Place order, and choose a sales consultant. WhatsApp opens with the message ready; sending it delivers the order.",
        ),
        FaqItem(
            question_tr="Siteden ödeme alınıyor mu?",
            question_en="Does the site take payment?",
            answer_tr="Hayır. Sipariş satış danışmanına WhatsApp ile iletilir. Teslimat ve ödeme danışmanla netleşir.",
            answer_en="No. The order goes to a sales consultant on WhatsApp. Delivery and payment are settled with them.",
        ),
        FaqItem(
            question_tr="Listedeki fiyat kesin mi?",
            question_en="Is the listed price final?",
            answer_tr="Gösterilen tutar liste fiyatıdır. Toplu alım için fiyatı satış danışmanına sorun.",
            answer_en="The amount shown is the list price. Ask a sales consultant for a bulk price.",
        ),
        FaqItem(
            question_tr="Çerez kullanılıyor mu?",
            question_en="Does the site use cookies?",
            answer_tr="Hayır. Sepet, dil, tema ve liste görünümü tarayıcıda yerel olarak tutulur. Reklam veya analiz takibi yoktur.",
            answer_en="No. The cart, language, theme, and list view stay in the browser. There is no advertising or analytics tracking.",
        ),
    ]


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
        consultant_whatsapp_tr="Merhaba, numaranızı INACORTS websitenizden buldum. Sizinle iletişime geçmek istiyorum.",
        consultant_whatsapp_en="Hello, I found your number on the INACORTS website. I would like to get in touch.",
        bulk_price_note_tr="Toplu alım için fiyat sorun.",
        bulk_price_note_en="Ask for a bulk price.",
        labels=default_labels(),
        faqs=default_faqs(),
    )
