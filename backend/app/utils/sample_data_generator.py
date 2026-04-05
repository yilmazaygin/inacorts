"""
INACORTS — Sample Data Generator

Generates a large, realistic dataset that simulates 6 months of a Turkish
industrial supplies business.  Every entity type is covered with plausible
Turkish names, addresses, phone numbers, and amounts.

Dataset size
────────────
  25 customers · 40 contacts · 8 product categories · 50 products
  80 orders (with 1-6 items each) · deliveries · payments
  40 expenses (with edit history) · 30 notes · 12 tags

Usage
─────
  cd backend
  python -m app.utils.sample_data_generator          # generate data
  python -m app.utils.sample_data_generator --reset   # reset DB first, then generate
"""

import sys
import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict

from sqlalchemy.orm import Session
from sqlalchemy import func
from loguru import logger

from app.db.session import SessionLocal
from app.db.base import import_models
from app.models import (
    User, Customer, Contact, Category, Product, StockMovement,
    Order, OrderItem, OrderDelivery, Payment, Expense, ExpenseCategory,
    ExpenseHistory, Note, Tag, TagLink,
    customer_contact_association,
    OrderStatus, PaymentStatus, DeliveryStatus,
    StockMovementType, PaymentMethod, EntityType, TagEntityType,
)

# ── Reproducible randomness ─────────────────────────────────────────
SEED = 42
random.seed(SEED)

# ── Time helpers ─────────────────────────────────────────────────────
NOW = datetime.now(timezone.utc)
HISTORY_DAYS = 180  # 6 months of data


def _ago(days: int, hours: int = 0) -> datetime:
    return NOW - timedelta(days=days, hours=hours)


def _random_date_between(start_days_ago: int, end_days_ago: int) -> datetime:
    d = random.randint(end_days_ago, start_days_ago)
    h = random.randint(8, 17)
    m = random.randint(0, 59)
    return _ago(d, -h) + timedelta(minutes=m)


# =====================================================================
#  TURKISH REALISTIC DATA POOLS
# =====================================================================

TURKISH_CITIES = [
    "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Kocaeli",
    "Trabzon", "Konya", "Adana", "Gaziantep", "Mersin", "Kayseri",
    "Eskişehir", "Denizli", "Sakarya", "Samsun", "Erzurum", "Manisa",
    "Tekirdağ", "Diyarbakır",
]

STREET_NAMES = [
    "Atatürk Cad.", "Cumhuriyet Blv.", "İstiklal Cad.", "Sanayi Mah.",
    "Organize San. Böl.", "Fatih Mah.", "Yeni Mah.", "Çarşı Mah.",
    "Bahçelievler Mah.", "Zafer Cad.", "Kazım Karabekir Cad.",
    "Menderes Blv.", "Ankara Cad.", "İnönü Cad.", "Fevzi Çakmak Cad.",
]

FIRST_NAMES = [
    "Ahmet", "Mehmet", "Mustafa", "Ali", "Hüseyin", "Hasan", "İbrahim",
    "Yusuf", "Osman", "Emre", "Burak", "Murat", "Serkan", "Cem", "Tolga",
    "Fatma", "Ayşe", "Emine", "Hatice", "Zeynep", "Elif", "Merve",
    "Selin", "Büşra", "Derya", "Gül", "Nalan", "Pınar", "Ece", "Esra",
]

LAST_NAMES = [
    "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Yıldırım",
    "Öztürk", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan",
    "Çetin", "Koç", "Kurt", "Özkan", "Şimşek", "Polat", "Korkmaz",
    "Erdoğan", "Acar", "Güneş", "Aktaş", "Kaplan", "Tekin", "Taş",
]

COMPANY_SUFFIXES = ["A.Ş.", "Ltd. Şti.", "San. Tic.", "Tic. Ltd.", "San. A.Ş.", "Ltd."]

DOMAINS = [".com.tr", ".com", ".net", ".org"]


def _gen_phone(area: str = None) -> str:
    if area:
        return f"+90 {area} {random.randint(100,999)} {random.randint(1000,9999)}"
    mobile = random.choice(["530", "531", "532", "533", "534", "535", "536", "537", "538", "539",
                            "540", "541", "542", "543", "544", "545", "546", "505", "506", "507"])
    return f"+90 {mobile} {random.randint(100,999)} {random.randint(10,99)} {random.randint(10,99)}"


def _gen_address(city: str = None) -> str:
    city = city or random.choice(TURKISH_CITIES)
    street = random.choice(STREET_NAMES)
    no = random.randint(1, 250)
    return f"{street} No:{no}, {city}"


def _gen_email(name_parts: str, domain: str) -> str:
    clean = name_parts.lower().replace(" ", "").replace("ı", "i").replace("ö", "o") \
        .replace("ü", "u").replace("ç", "c").replace("ş", "s").replace("ğ", "g")
    return f"{clean}@{domain}"


# =====================================================================
#  CLEARING
# =====================================================================

def clear_data(db: Session) -> None:
    """Delete all non-system rows in FK-safe order."""
    logger.info("Clearing existing data…")
    db.query(ExpenseHistory).delete()
    db.query(Expense).delete()
    db.query(TagLink).delete()
    db.query(Tag).delete()
    db.query(Note).delete()
    db.query(Payment).delete()
    db.query(OrderDelivery).delete()
    db.query(StockMovement).delete()
    db.query(OrderItem).delete()
    db.query(Order).delete()
    db.execute(customer_contact_association.delete())
    db.query(Contact).delete()
    db.query(Product).delete()
    db.query(Category).delete()
    db.query(Customer).delete()
    db.commit()
    logger.info("✓ Data cleared")


# =====================================================================
#  ENTITY GENERATORS
# =====================================================================

def _uid(db: Session) -> int:
    """Return admin user id."""
    u = db.query(User).filter(User.username == "admin").first()
    if not u:
        raise RuntimeError("Admin user not found — run the app once first.")
    return u.id


# ── Customers ────────────────────────────────────────────────────────

def create_customers(db: Session, uid: int) -> List[Customer]:
    customers_data = [
        # (company_name, city, area_code, has_website)
        ("Yılmaz Ticaret",           "Kocaeli",    "262", True),
        ("Demir Yapı Malzemeleri",   "İstanbul",   "212", True),
        ("Akdeniz Endüstri",         "Antalya",    "242", True),
        ("Karadeniz Makina Sanayi",  "Trabzon",    "462", True),
        ("Ege Parça",                "İzmir",      "232", False),
        ("Başkent Tedarik",          "Ankara",     "312", True),
        ("Marmara Hırdavat",         "Bursa",      "224", False),
        ("Doğu Teknik Servis",       "Erzurum",    "442", False),
        ("Güney Elektrik",           "Adana",      "322", True),
        ("Anadolu Metal Sanayi",     "Konya",      "332", True),
        ("İç Anadolu Otomasyon",     "Kayseri",    "352", False),
        ("Trakya İnşaat Malz.",      "Tekirdağ",   "282", True),
        ("Akçay Su Arıtma",         "Denizli",    "258", False),
        ("Yüce Isıtma Soğutma",     "Eskişehir",  "222", True),
        ("Kartal Güvenlik Sist.",    "Gaziantep",  "342", False),
        ("Özdemir Ambalaj",          "Mersin",     "324", True),
        ("Bolu Mobilya Aksesuar",    "Sakarya",    "264", False),
        ("Çukurova Kimyasal",        "Adana",      "322", False),
        ("Batı Plastik Sanayi",      "Manisa",     "236", True),
        ("Kuzey Mühendislik",        "Samsun",     "362", True),
        ("Doğanay Hırdavat",         "Diyarbakır", "412", False),
        ("Yıldırım Makina",          "Bursa",      "224", True),
        ("Sedef İnşaat Taahhüt",     "İstanbul",   "216", True),
        ("Altın Çelik Sanayi",       "Kocaeli",    "262", True),
        ("Vatan Elektrik Malz.",     "Ankara",     "312", False),
    ]

    suffix_pool = list(COMPANY_SUFFIXES)
    customers: List[Customer] = []

    for i, (name, city, area, has_web) in enumerate(customers_data):
        suffix = random.choice(suffix_pool)
        full_name = f"{name} {suffix}"
        clean_key = name.lower().replace(" ", "").replace("ı", "i").replace("ö", "o") \
            .replace("ü", "u").replace("ç", "c").replace("ş", "s").replace("ğ", "g")
        domain = f"{clean_key[:15]}{random.choice(DOMAINS)}"
        email = f"info@{domain}" if random.random() > 0.15 else None
        website = f"www.{domain}" if has_web else None

        c = Customer(
            name=full_name,
            address=_gen_address(city),
            phone=_gen_phone(area),
            email=email,
            website=website,
            created_by=uid, updated_by=uid,
            created_at=_ago(HISTORY_DAYS - i * 5),
        )
        db.add(c)
        customers.append(c)

    db.commit()
    for c in customers:
        db.refresh(c)
    logger.info(f"✓ {len(customers)} customers")
    return customers


# ── Contacts ─────────────────────────────────────────────────────────

def create_contacts(db: Session, customers: List[Customer], uid: int) -> List[Contact]:
    contacts: List[Contact] = []
    used_names = set()

    for _ in range(40):
        while True:
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            full = f"{first} {last}"
            if full not in used_names:
                used_names.add(full)
                break

        phone = _gen_phone()
        email = _gen_email(f"{first}{last}", f"{last.lower().replace('ı','i').replace('ö','o').replace('ü','u').replace('ç','c').replace('ş','s').replace('ğ','g')}{random.choice(DOMAINS)}") if random.random() > 0.2 else None

        ct = Contact(name=full, phone=phone, email=email,
                     created_by=uid, updated_by=uid)
        db.add(ct)
        contacts.append(ct)

    db.flush()

    # Link contacts to customers — each customer gets 1-3 contacts
    contact_idx = 0
    for cust in customers:
        n_links = random.randint(1, 3)
        for _ in range(n_links):
            if contact_idx < len(contacts):
                db.execute(customer_contact_association.insert().values(
                    customer_id=cust.id, contact_id=contacts[contact_idx].id))
                contact_idx += 1
        if contact_idx >= len(contacts):
            break

    # Some contacts linked to multiple customers (shared contacts)
    for _ in range(8):
        ci = random.randint(0, len(contacts) - 1)
        cu = random.randint(0, len(customers) - 1)
        try:
            db.execute(customer_contact_association.insert().values(
                customer_id=customers[cu].id, contact_id=contacts[ci].id))
        except Exception:
            pass  # duplicate link — ignore

    db.commit()
    logger.info(f"✓ {len(contacts)} contacts")
    return contacts


# ── Categories ───────────────────────────────────────────────────────

def create_categories(db: Session, uid: int) -> List[Category]:
    names = [
        "Hırdavat & Bağlantı",
        "Elektrik & Aydınlatma",
        "Boru & Vana & Tesisat",
        "Boya & Kimyasal",
        "El Aletleri & Takım",
        "Güvenlik & İş Güvenliği",
        "İnşaat Malzemesi",
        "Otomasyon & Endüstriyel",
    ]
    cats: List[Category] = []
    for n in names:
        c = Category(name=n, created_by=uid, updated_by=uid)
        db.add(c)
        cats.append(c)
    db.commit()
    for c in cats:
        db.refresh(c)
    logger.info(f"✓ {len(cats)} product categories")
    return cats


# ── Products ─────────────────────────────────────────────────────────

def create_products(db: Session, cats: List[Category], uid: int) -> List[Product]:
    # (name, description, list_price, category_index)
    product_defs = [
        # ── Hırdavat & Bağlantı (0) ──
        ("M10 Civata (100'lü)",         "DIN 931, galvaniz kaplı, 8.8 kalite",         45.00,  0),
        ("Somun M10 (100'lü)",          "DIN 934, galvaniz, sınıf 8",                  22.00,  0),
        ("Pul M10 (100'lü)",            "DIN 125A, galvaniz kaplı",                     9.50,  0),
        ("M8 Civata (200'lü)",          "DIN 933, tam diş, galvaniz",                  65.00,  0),
        ("M12 Saplama (50'li)",         "DIN 976, 8.8 kalite, 100mm",                  78.00,  0),
        ("Dübel 10mm (100'lü)",         "Naylon, genel amaçlı",                        18.50,  0),
        ("Paslanmaz Vida 5x50 (200)",   "A2 paslanmaz çelik, havşa baş",              125.00,  0),

        # ── Elektrik & Aydınlatma (1) ──
        ("Kablo 3x2.5mm NYM (100m)",    "TSE belgeli, bakır iletken",                 780.00,  1),
        ("Kablo 3x1.5mm NYM (100m)",    "TSE belgeli, iç mekan",                      520.00,  1),
        ("Priz Kasası Sıvaaltı",        "Derin model, turuncu, IP20",                    4.50,  1),
        ("LED Panel 60x60 40W",         "6500K gün ışığı, slim kasa, 4000lm",         185.00,  1),
        ("LED Spot 7W (10'lu)",         "GU10, 3000K sıcak beyaz",                    240.00,  1),
        ("Sigorta Otomatiği 16A",       "B tipi, 1P, 6kA",                             38.00,  1),
        ("Sigorta Otomatiği 25A",       "C tipi, 1P, 6kA",                             42.00,  1),
        ("Kaçak Akım Rölesi 40A",       "2P, 30mA, tip A",                            165.00,  1),

        # ── Boru & Vana & Tesisat (2) ──
        ("PPR Boru 20mm (4m)",          "PN20, beyaz, TSE belgeli",                    32.00,  2),
        ("PPR Boru 25mm (4m)",          "PN20, beyaz, TSE belgeli",                    45.00,  2),
        ("PPR Dirsek 20mm (10'lu)",     "90°, düz dişli",                              28.00,  2),
        ("Küresel Vana 1/2\"",          "Pirinç, tam geçişli, krom",                   28.00,  2),
        ("Küresel Vana 3/4\"",          "Pirinç, tam geçişli, krom",                   42.00,  2),
        ("Küresel Vana 1\"",            "Pirinç, tam geçişli, ağır hizmet",            68.00,  2),
        ("Flex Batarya Hortumu 50cm",   "1/2\", paslanmaz örgülü",                     22.00,  2),
        ("Sifon (lavabo)",              "Plastik, açılır kapak",                        15.00,  2),

        # ── Boya & Kimyasal (3) ──
        ("Silikon (280ml)",             "Genel amaçlı, şeffaf, UV dayanımlı",          35.00,  3),
        ("Astar Boya 2.5L",            "Su bazlı, iç cephe, beyaz",                   95.00,  3),
        ("İç Cephe Boya 15L",          "Su bazlı, silinebilir, mat beyaz",            420.00,  3),
        ("Dış Cephe Boya 15L",         "Silikon bazlı, hava koşullarına dayanıklı",   680.00,  3),
        ("Epoksi Zemin Boya 5L",       "İki bileşenli, endüstriyel gri",              540.00,  3),
        ("Macun (25kg)",                "İç cephe, ince, su bazlı",                    180.00,  3),

        # ── El Aletleri & Takım (4) ──
        ("Kombine Anahtar Takımı",      "6-32mm, 12 parça, krom vanadyum",            320.00,  4),
        ("Lokma Takımı 1/2\"",          "10-32mm, 24 parça, CrV çelik",               450.00,  4),
        ("Matkap Ucu Seti",             "HSS, 1-13mm, 25 parça, metal kutu",          185.00,  4),
        ("Tornavida Seti 18 Parça",     "Düz + yıldız, izoleli sap",                  145.00,  4),
        ("Şarjlı Matkap 18V",          "Li-ion, 2 akü, çift hız, çantalı",           1450.00, 4),
        ("Avuç Taşlama 125mm",         "850W, hız ayarlı, ince gövde",                680.00,  4),
        ("Lazer Metre 50m",             "±2mm hassasiyet, LCD ekran",                  420.00,  4),

        # ── Güvenlik & İş Güvenliği (5) ──
        ("Baret (CE)",                   "HDPE, 6 nokta iç askı, beyaz",               45.00,  5),
        ("Koruyucu Gözlük",            "Anti-fog, UV filtre, EN166",                   28.00,  5),
        ("İş Eldiveni Nitril (12)",     "Mavi, kalın, kimyasal dirençli",              85.00,  5),
        ("Reflektif Yelek",             "Sarı, 2 bant, sınıf 2",                       18.00,  5),
        ("İş Güvenliği Ayakkabı",       "S3, çelik burun, kaymaz, 43 numara",         390.00,  5),
        ("Yangın Söndürücü 6kg",        "ABC kuru kimyevi, TSE belgeli",               280.00,  5),

        # ── İnşaat Malzemesi (6) ──
        ("Çimento (50kg)",              "CEM I 42.5R, torbalı",                         85.00,  6),
        ("Alçı (25kg)",                 "Saten alçı, ince sıva, beyaz",                65.00,  6),
        ("Seramik Yapıştırıcı (25kg)",  "Esnek, iç-dış mekan, C2TE-S1",               92.00,  6),
        ("Derz Dolgu 5kg",              "Gri, 1-6mm, su itici",                        48.00,  6),

        # ── Otomasyon & Endüstriyel (7) ──
        ("Kontaktör 25A",               "AC3, 1NO+1NC, 230V bobin",                   145.00,  7),
        ("Termik Röle 12-18A",          "Ayarlanabilir, sınıf 10A",                    120.00,  7),
        ("Endüstriyel Priz 32A",        "5 pin, IP67, 400V",                           85.00,  7),
    ]

    products: List[Product] = []
    for name, desc, price, ci in product_defs:
        barcode = f"869{random.randint(1000000000, 9999999999)}" if random.random() > 0.25 else None
        p = Product(
            name=name, description=desc,
            barcode=barcode,
            category_id=cats[ci].id, list_price=price,
            current_stock=0,
            created_by=uid, updated_by=uid,
        )
        db.add(p)
        products.append(p)

    db.commit()
    for p in products:
        db.refresh(p)
    logger.info(f"✓ {len(products)} products")
    return products


# ── Stock ────────────────────────────────────────────────────────────

def create_initial_stock(db: Session, products: List[Product], uid: int) -> None:
    """Two waves of IN movements — initial load + a mid-period restock."""
    for p in products:
        # First stock: 150 days ago
        qty1 = random.randint(50, 300) if p.list_price < 100 else random.randint(10, 80)
        sm1 = StockMovement(
            product_id=p.id, quantity=qty1,
            type=StockMovementType.IN,
            reason="İlk stok girişi",
            created_by=uid, updated_by=uid,
            created_at=_ago(150),
        )
        db.add(sm1)
        p.current_stock = qty1

        # Restock: ~60 days ago for 70% of products
        if random.random() > 0.3:
            qty2 = random.randint(30, 150) if p.list_price < 100 else random.randint(5, 40)
            sm2 = StockMovement(
                product_id=p.id, quantity=qty2,
                type=StockMovementType.IN,
                reason="Tedarikçi siparişi — stok yenilemesi",
                created_by=uid, updated_by=uid,
                created_at=_ago(random.randint(50, 70)),
            )
            db.add(sm2)
            p.current_stock += qty2

    # A few ADJUSTMENT movements (audit corrections)
    for _ in range(5):
        p = random.choice(products)
        adj = random.choice([-3, -5, -2, 2, 4])
        sm = StockMovement(
            product_id=p.id, quantity=adj,
            type=StockMovementType.ADJUSTMENT,
            reason="Sayım düzeltmesi" if adj < 0 else "Sayım fazlası tespit",
            created_by=uid, updated_by=uid,
            created_at=_ago(random.randint(20, 40)),
        )
        db.add(sm)
        p.current_stock += adj

    db.commit()
    logger.info("✓ Initial stock movements (2 waves + adjustments)")


# ── Orders (80) ──────────────────────────────────────────────────────

def create_orders(db: Session, customers: List[Customer],
                  products: List[Product], uid: int) -> List[Order]:
    """
    80 orders spread over 6 months with realistic status distribution:
      ~35 completed, ~15 partial, ~25 open, ~5 canceled
    """
    orders: List[Order] = []
    n_orders = 80

    status_weights = ["completed"] * 35 + ["partial"] * 15 + ["open"] * 25 + ["canceled"] * 5
    random.shuffle(status_weights)

    for i in range(n_orders):
        cust = random.choice(customers)
        days_ago = random.randint(1, HISTORY_DAYS - 10)
        date = _random_date_between(HISTORY_DAYS - 10, max(1, days_ago))
        target = status_weights[i % len(status_weights)]
        n_items = random.randint(1, 6)

        order = Order(
            customer_id=cust.id, total_amount=0,
            payment_status=PaymentStatus.UNPAID,
            delivery_status=DeliveryStatus.NOT_DELIVERED,
            order_status=OrderStatus.OPEN,
            created_by=uid, updated_by=uid,
            created_at=date, updated_at=date,
        )
        db.add(order)
        db.flush()

        # ── Items ──
        chosen = random.sample(products, min(n_items, len(products)))
        total = 0.0
        items: List[OrderItem] = []
        for prod in chosen:
            qty = random.randint(1, 30) if prod.list_price < 100 else random.randint(1, 8)
            # Price with small variation (±10%)
            up = round(prod.list_price * random.uniform(0.90, 1.10), 2)
            oi = OrderItem(
                order_id=order.id, product_id=prod.id,
                quantity=qty, delivered_quantity=0, unit_price=up,
                created_by=uid, updated_by=uid, created_at=date,
            )
            db.add(oi)
            items.append(oi)
            total += qty * up

        order.total_amount = round(total, 2)
        db.flush()

        # ── Apply status ──
        if target == "completed":
            _fully_deliver(db, order, items, uid)
            _fully_pay(db, order, uid)
            order.order_status = OrderStatus.COMPLETED
        elif target == "partial":
            if random.random() > 0.5:
                _partially_deliver(db, order, items, uid)
            if random.random() > 0.3:
                _partially_pay(db, order, uid)
        elif target == "canceled":
            order.order_status = OrderStatus.CANCELED
        # "open" → left as-is

        orders.append(order)

    db.commit()
    for o in orders:
        db.refresh(o)
    logger.info(f"✓ {len(orders)} orders")
    return orders


def _fully_deliver(db: Session, order: Order, items: List[OrderItem], uid: int):
    for it in items:
        it.delivered_quantity = it.quantity
        sm = StockMovement(
            product_id=it.product_id, quantity=-it.quantity,
            type=StockMovementType.OUT,
            related_order_id=order.id,
            reason=f"Sipariş #{order.id} teslimat",
            created_by=uid, updated_by=uid,
            created_at=order.created_at + timedelta(days=random.randint(1, 3)),
        )
        db.add(sm)
        prod = db.get(Product, it.product_id)
        if prod:
            prod.current_stock -= it.quantity

    od = OrderDelivery(
        order_id=order.id,
        delivered_by_user_id=uid,
        delivered_at=order.created_at + timedelta(days=random.randint(1, 3)),
        note="Tüm kalemler teslim edildi",
    )
    db.add(od)
    order.delivery_status = DeliveryStatus.DELIVERED


def _partially_deliver(db: Session, order: Order, items: List[OrderItem], uid: int):
    # Deliver 1 to N-1 items
    n_deliver = random.randint(1, max(1, len(items) - 1))
    delivered_items = random.sample(items, n_deliver)

    for it in delivered_items:
        partial_qty = random.randint(1, it.quantity)
        it.delivered_quantity = partial_qty
        sm = StockMovement(
            product_id=it.product_id, quantity=-partial_qty,
            type=StockMovementType.OUT,
            related_order_id=order.id,
            reason=f"Sipariş #{order.id} kısmi teslimat",
            created_by=uid, updated_by=uid,
            created_at=order.created_at + timedelta(days=random.randint(2, 5)),
        )
        db.add(sm)
        prod = db.get(Product, it.product_id)
        if prod:
            prod.current_stock -= partial_qty

    od = OrderDelivery(
        order_id=order.id,
        delivered_by_user_id=uid,
        delivered_at=order.created_at + timedelta(days=random.randint(2, 5)),
        note=f"{n_deliver} kalem kısmen teslim edildi",
    )
    db.add(od)
    order.delivery_status = DeliveryStatus.PARTIALLY_DELIVERED


def _fully_pay(db: Session, order: Order, uid: int):
    # Sometimes paid in 2 installments
    if random.random() > 0.7 and order.total_amount > 500:
        first = round(order.total_amount * random.uniform(0.4, 0.6), 2)
        second = round(order.total_amount - first, 2)
        p1 = Payment(
            order_id=order.id, amount=first,
            method=random.choice([PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER]),
            created_by=uid, updated_by=uid,
            created_at=order.created_at + timedelta(days=random.randint(1, 5)),
        )
        p2 = Payment(
            order_id=order.id, amount=second,
            method=random.choice([PaymentMethod.BANK_TRANSFER, PaymentMethod.CREDIT_CARD]),
            created_by=uid, updated_by=uid,
            created_at=order.created_at + timedelta(days=random.randint(6, 15)),
        )
        db.add(p1)
        db.add(p2)
    else:
        p = Payment(
            order_id=order.id, amount=order.total_amount,
            method=random.choice([PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER,
                                  PaymentMethod.CREDIT_CARD]),
            created_by=uid, updated_by=uid,
            created_at=order.created_at + timedelta(days=random.randint(1, 7)),
        )
        db.add(p)
    order.payment_status = PaymentStatus.PAID


def _partially_pay(db: Session, order: Order, uid: int):
    amount = round(order.total_amount * random.uniform(0.2, 0.6), 2)
    p = Payment(
        order_id=order.id, amount=amount,
        method=random.choice([PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER]),
        created_by=uid, updated_by=uid,
        created_at=order.created_at + timedelta(days=random.randint(1, 5)),
    )
    db.add(p)
    order.payment_status = PaymentStatus.PARTIALLY_PAID


# ── Expenses ─────────────────────────────────────────────────────────

def create_expenses(db: Session, uid: int) -> None:
    """40 expenses over 6 months with realistic Turkish business costs."""
    cats = db.query(ExpenseCategory).all()
    if not cats:
        logger.warning("No expense categories found — skipping expenses")
        return

    cat_map: Dict[str, int] = {c.name: c.id for c in cats}
    fallback_id = cats[0].id

    expense_data = [
        # (category_key, amount, description, days_ago)
        ("Fuel / Transportation",   350.00,   "İstanbul – Kocaeli yakıt (dizel)",           170),
        ("Fuel / Transportation",   420.00,   "Ankara müşteri ziyareti ulaşım",             160),
        ("Product Purchase",       4200.00,   "Hırdavat toplu alım — Yılmaz Tic.",          155),
        ("Logistics",              1100.00,   "Kargo gönderimi (Antalya, 3 palet)",          148),
        ("Office Supplies",         280.00,   "Yazıcı toneri ve A4 kâğıt (5 top)",          140),
        ("Fuel / Transportation",   380.00,   "İzmir fuar ziyareti yakıt",                  132),
        ("Product Purchase",       8500.00,   "Elektrik malz. toplu sipariş",               125),
        ("Logistics",               650.00,   "Trabzon sevkiyat (tek palet)",                118),
        ("Gifts / Samples",         750.00,   "Müşteri hediye paketi — bayram",              112),
        ("Fuel / Transportation",   290.00,   "Bursa gidiş-dönüş yakıt",                   105),
        ("Office Supplies",         185.00,   "Ofis temizlik malzemesi",                      98),
        ("Product Purchase",      12000.00,   "Boru & vana stok yenilemesi",                  92),
        ("Logistics",              1350.00,   "Konya + Kayseri sevkiyat",                     85),
        ("Fuel / Transportation",   310.00,   "Eskişehir müşteri teslimi yakıt",              80),
        ("Miscellaneous",           190.00,   "Ofis su sebili + su (3 ay)",                   75),
        ("Product Purchase",       6800.00,   "El aletleri yeni sezon alımı",                 68),
        ("Fuel / Transportation",   445.00,   "Gaziantep 2 günlük iş seyahati",               62),
        ("Gifts / Samples",         320.00,   "Müşteri numune gönderimi (Ege bölgesi)",       55),
        ("Logistics",               890.00,   "İstanbul depo→şube nakliye",                   50),
        ("Office Supplies",         420.00,   "Bilgisayar aksesuarları (mouse, klavye, kablo)",45),
        ("Product Purchase",       5400.00,   "Güvenlik malz. toplu sipariş",                 40),
        ("Fuel / Transportation",   265.00,   "Sakarya teslimat yakıt",                       38),
        ("Logistics",              1500.00,   "Güneydoğu bölge sevkiyat (Diyarbakır)",        35),
        ("Miscellaneous",           340.00,   "Yıllık muhasebe danışmanlık (1. taksit)",      32),
        ("Fuel / Transportation",   370.00,   "Tekirdağ + Edirne ziyareti yakıt",             28),
        ("Product Purchase",       3200.00,   "İnşaat malz. küçük parti alım",                25),
        ("Gifts / Samples",         480.00,   "Yılbaşı müşteri hediyeleri",                   22),
        ("Office Supplies",         550.00,   "Yeni ofis koltuğu (2 adet)",                   20),
        ("Fuel / Transportation",   310.00,   "Mersin liman teslimi yakıt",                   18),
        ("Logistics",               720.00,   "Denizli kargo (otomasyon malz.)",               15),
        ("Product Purchase",       9200.00,   "Aylık rutin tedarik siparişi",                  12),
        ("Miscellaneous",           150.00,   "Araç cam suyu + yıkama",                       10),
        ("Fuel / Transportation",   395.00,   "Samsun müşteri toplantısı yakıt",                8),
        ("Office Supplies",         680.00,   "Yazıcı bakım + toner (renkli)",                  7),
        ("Logistics",              1050.00,   "Marmara bölge dağıtım",                          6),
        ("Fuel / Transportation",   285.00,   "Kocaeli depo ziyareti",                          5),
        ("Gifts / Samples",         220.00,   "Ürün tanıtım broşürü baskı",                    4),
        ("Miscellaneous",           410.00,   "Ofis klima bakım + filtre değişimi",             3),
        ("Fuel / Transportation",   330.00,   "Ankara resmi daire ziyareti yakıt",              2),
        ("Product Purchase",       7100.00,   "Aydınlatma ürünleri stok yenilemesi",            1),
    ]

    expenses_created = []
    for cat_key, amount, desc, days in expense_data:
        cat_id = cat_map.get(cat_key, fallback_id)
        exp = Expense(
            amount=amount, description=desc,
            category_id=cat_id,
            date=_ago(days),
            created_by=uid, updated_by=uid,
            created_at=_ago(days),
        )
        db.add(exp)
        db.flush()
        expenses_created.append((exp, days))

    # Add edit history to ~8 expenses (realistic corrections)
    edit_scenarios = [
        (2,  "amount",      "3900.00",  "4200.00",  3),
        (6,  "amount",      "8000.00",  "8500.00",  2),
        (11, "amount",      "11500.00", "12000.00", 4),
        (11, "description", "Boru stok yenilemesi", "Boru & vana stok yenilemesi", 3),
        (15, "amount",      "7200.00",  "6800.00",  2),
        (20, "amount",      "5000.00",  "5400.00",  1),
        (26, "amount",      "450.00",   "480.00",   1),
        (30, "amount",      "9000.00",  "9200.00",  2),
    ]
    for idx, field, old, new, edit_days_later in edit_scenarios:
        if idx < len(expenses_created):
            exp, orig_days = expenses_created[idx]
            eh = ExpenseHistory(
                expense_id=exp.id,
                changed_at=_ago(max(0, orig_days - edit_days_later)),
                changed_by=uid,
                field_name=field,
                old_value=old,
                new_value=new,
            )
            db.add(eh)

    db.commit()
    logger.info(f"✓ {len(expense_data)} expenses (with {len(edit_scenarios)} edit-history entries)")


# ── Notes ────────────────────────────────────────────────────────────

def create_notes(db: Session, customers: List[Customer],
                 orders: List[Order], products: List[Product], uid: int) -> None:
    note_pool = [
        # Customer notes
        (EntityType.CUSTOMER, 0,  "VIP müşteri — öncelikli sevkiyat ve özel fiyat uygulanıyor"),
        (EntityType.CUSTOMER, 2,  "Yıllık sözleşme var, %8 iskonto uygulanıyor"),
        (EntityType.CUSTOMER, 4,  "Ödeme vadesi 45 gün — kredi limiti: ₺50.000"),
        (EntityType.CUSTOMER, 5,  "Ankara bölge müdürü ile görüşülecek — yeni teklif hazırlanacak"),
        (EntityType.CUSTOMER, 7,  "Erzurum teslimatında kargo yerine özel araç tercih ediyor"),
        (EntityType.CUSTOMER, 9,  "Yeni müşteri — ilk siparişte referans indirimi uygulandı"),
        (EntityType.CUSTOMER, 11, "Trakya bölgesi ana bayi adayı — yıl sonu değerlendirilecek"),
        (EntityType.CUSTOMER, 14, "Fatura adresi ile teslimat adresi farklı — dikkat"),
        (EntityType.CUSTOMER, 18, "2026 yılı sözleşme yenileme görüşmesi yapılacak"),
        (EntityType.CUSTOMER, 22, "Toplu alımlarda kargo bedelsiz anlaşması var"),
    ]

    # Order notes — pick from completed/partial orders
    active_orders = [o for o in orders if o.order_status != OrderStatus.CANCELED]
    order_notes_texts = [
        "Müşteri acil teslimat istedi — öncelikli kargolama",
        "Fatura e-posta ile gönderildi",
        "Sevk irsaliyesi müşteri tarafından onaylandı",
        "İade riski var — kalite kontrol yapılacak",
        "Müşteri ek kalem talep edebilir — sipariş açık tutulacak",
        "Kısmi teslimat yapıldı, kalan haftaya",
        "Ödeme banka havalesi ile yapılacak, dekont bekleniyor",
        "Özel ambalajlama istendi — ek maliyet faturaya yansıtıldı",
    ]
    for i, text in enumerate(order_notes_texts):
        if i < len(active_orders):
            note_pool.append((EntityType.ORDER, active_orders[i].id, text))

    # Product notes
    product_notes = [
        (4,  "Tedarikçi fiyat güncelledi — yeni liste bekleniyor"),
        (7,  "Minimum stok seviyesi: 30 adet — altına düşünce tedarikçiye bilgi ver"),
        (10, "LED panel stok devir hızı yüksek — haftalık kontrol"),
        (15, "PPR boru 25mm — Antalya müşterisi sürekli talep ediyor"),
        (20, "Vana 1\" — kalite şikayeti geldi, partiyi kontrol et"),
        (30, "Kombine anahtar takımı — yeni tedarikçi ile fiyat karşılaştır"),
        (34, "Şarjlı matkap — garanti süreci ile ilgili tedarikçi bilgilendirildi"),
        (44, "Çimento stoku — mevsimsel talep artışı bekleniyor"),
        (48, "Kontaktör 25A — alternatif marka deneme siparişi verilecek"),
    ]
    for pidx, text in product_notes:
        if pidx < len(products):
            note_pool.append((EntityType.PRODUCT, products[pidx].id, text))

    # Create notes from pool
    created_count = 0
    for etype, eid_or_idx, text in note_pool:
        if etype == EntityType.CUSTOMER:
            if eid_or_idx >= len(customers):
                continue
            eid = customers[eid_or_idx].id
        elif etype == EntityType.ORDER:
            eid = eid_or_idx  # Already an ID
        elif etype == EntityType.PRODUCT:
            eid = eid_or_idx  # Already an ID from the product_notes block
        else:
            continue

        db.add(Note(
            entity_type=etype, entity_id=eid, text=text,
            created_by=uid, created_at=_ago(random.randint(1, 60)),
        ))
        created_count += 1

    db.commit()
    logger.info(f"✓ {created_count} notes")


# ── Tags ─────────────────────────────────────────────────────────────

def create_tags(db: Session, customers: List[Customer],
                products: List[Product], uid: int) -> None:
    tag_names = [
        "VIP", "Toptan", "Perakende", "Yeni Müşteri", "Çok Satan",
        "Bayram Kampanya", "Stok Takip", "Risksiz", "Sözleşmeli",
        "Bölge Bayi", "İade Riski", "Fiyat Güncelle",
    ]
    tags: List[Tag] = []
    for n in tag_names:
        t = Tag(name=n, created_by=uid, updated_by=uid)
        db.add(t)
        tags.append(t)
    db.flush()

    # Customer tags
    customer_tag_links = [
        (0, 0),  (0, 1),  (0, 8),   # Yılmaz: VIP, Toptan, Sözleşmeli
        (1, 1),  (1, 7),             # Demir: Toptan, Risksiz
        (2, 0),  (2, 8),             # Akdeniz: VIP, Sözleşmeli
        (3, 1),  (3, 9),             # Karadeniz: Toptan, Bölge Bayi
        (4, 2),                       # Ege: Perakende
        (5, 0),  (5, 1),             # Başkent: VIP, Toptan
        (6, 2),                       # Marmara: Perakende
        (7, 3),                       # Doğu: Yeni Müşteri
        (8, 1), (8, 9),              # Güney: Toptan, Bölge Bayi
        (9, 8),                       # Anadolu: Sözleşmeli
        (11, 9),                      # Trakya: Bölge Bayi
        (19, 3),                      # Kuzey: Yeni Müşteri
        (20, 3),                      # Doğanay: Yeni Müşteri
        (23, 0), (23, 1),            # Altın Çelik: VIP, Toptan
    ]
    link_count = 0
    for ci, ti in customer_tag_links:
        if ci < len(customers) and ti < len(tags):
            db.add(TagLink(tag_id=tags[ti].id, entity_type=TagEntityType.CUSTOMER,
                           entity_id=customers[ci].id, created_by=uid))
            link_count += 1

    # Product tags
    product_tag_links = [
        (0,  4),   # Civata: Çok Satan
        (7,  4),   # Kablo 3x2.5: Çok Satan
        (10, 4),   # LED Panel: Çok Satan
        (10, 6),   # LED Panel: Stok Takip
        (15, 6),   # PPR 20mm: Stok Takip
        (20, 10),  # Vana 1": İade Riski
        (24, 4),   # Silikon: Çok Satan
        (30, 4),   # Kombine Anahtar: Çok Satan
        (34, 11),  # Şarjlı Matkap: Fiyat Güncelle
        (44, 6),   # Çimento: Stok Takip
        (48, 11),  # Kontaktör: Fiyat Güncelle
    ]
    for pi, ti in product_tag_links:
        if pi < len(products) and ti < len(tags):
            db.add(TagLink(tag_id=tags[ti].id, entity_type=TagEntityType.PRODUCT,
                           entity_id=products[pi].id, created_by=uid))
            link_count += 1

    db.commit()
    logger.info(f"✓ {len(tags)} tags, {link_count} links")


# =====================================================================
#  SUMMARY
# =====================================================================

def print_summary(db: Session) -> None:
    logger.info("─" * 55)
    logger.info("DATASET SUMMARY")
    logger.info("─" * 55)
    rows = [
        ("Customers",            db.query(Customer).count()),
        ("Contacts",             db.query(Contact).count()),
        ("Product categories",   db.query(Category).count()),
        ("Products",             db.query(Product).count()),
        ("Stock movements",      db.query(StockMovement).count()),
        ("Orders",               db.query(Order).count()),
        ("  ├ Open",             db.query(Order).filter(Order.order_status == OrderStatus.OPEN).count()),
        ("  ├ Completed",        db.query(Order).filter(Order.order_status == OrderStatus.COMPLETED).count()),
        ("  └ Canceled",         db.query(Order).filter(Order.order_status == OrderStatus.CANCELED).count()),
        ("Order items",          db.query(OrderItem).count()),
        ("Deliveries",           db.query(OrderDelivery).count()),
        ("Payments",             db.query(Payment).count()),
        ("Expenses",             db.query(Expense).count()),
        ("Expense edits",        db.query(ExpenseHistory).count()),
        ("Notes",                db.query(Note).count()),
        ("Tags",                 db.query(Tag).count()),
        ("Tag links",            db.query(TagLink).count()),
    ]
    for label, count in rows:
        logger.info(f"  {label:<22} {count:>5}")

    total_val  = db.query(func.sum(Order.total_amount)).scalar() or 0
    total_paid = db.query(func.sum(Payment.amount)).scalar() or 0
    total_exp  = db.query(func.sum(Expense.amount)).scalar() or 0
    logger.info("─" * 55)
    logger.info(f"  Order value        ₺{total_val:>14,.2f}")
    logger.info(f"  Payments received  ₺{total_paid:>14,.2f}")
    logger.info(f"  Total expenses     ₺{total_exp:>14,.2f}")
    logger.info(f"  Net revenue        ₺{total_paid - total_exp:>14,.2f}")
    logger.info("─" * 55)


# =====================================================================
#  MAIN
# =====================================================================

def main() -> None:
    logger.info("=" * 55)
    logger.info("  INACORTS — Sample Data Generator")
    logger.info("=" * 55)

    do_reset = "--reset" in sys.argv
    if do_reset:
        from app.utils.reset_db import reset_database
        reset_database(skip_confirm=True)

    db = SessionLocal()
    try:
        uid = _uid(db)
        clear_data(db)

        customers = create_customers(db, uid)
        create_contacts(db, customers, uid)
        cats      = create_categories(db, uid)
        products  = create_products(db, cats, uid)
        create_initial_stock(db, products, uid)
        orders    = create_orders(db, customers, products, uid)
        create_expenses(db, uid)
        create_notes(db, customers, orders, products, uid)
        create_tags(db, customers, products, uid)

        print_summary(db)
        logger.info("")
        logger.info("✓ Sample data generated successfully!")
    except Exception as exc:
        logger.error(f"✗ {exc}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
