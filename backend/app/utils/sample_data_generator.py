"""
INACORTS — Sample Data Generator

Generates a small, realistic dataset suitable for demos and local testing.
Covers every entity type: users, customers, contacts, product categories,
products, stock movements, orders (with items, deliveries, payments),
expenses (with history), notes, and tags.

The data is intentionally compact (≈ 8 customers, 12 products, 15 orders)
so the UI stays readable and every feature is exercisable without noise.

Usage
─────
  cd backend
  python -m app.utils.sample_data_generator          # generates data
  python -m app.utils.sample_data_generator --reset   # reset DB first, then generate
"""

import sys
import random
from datetime import datetime, timedelta
from typing import List

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

# ── reproducible randomness ──────────────────────────────────────────
SEED = 42
random.seed(SEED)

# ── time helpers ─────────────────────────────────────────────────────
NOW = datetime.utcnow()


def _ago(days: int, hours: int = 0) -> datetime:
    return NOW - timedelta(days=days, hours=hours)


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


def create_customers(db: Session, uid: int) -> List[Customer]:
    data = [
        ("Yılmaz Ticaret A.Ş.",    "Sanayi Mah. 123. Sk. No:5, Kocaeli",  "+90 262 555 0101", "info@yilmazticaret.com.tr",    "www.yilmazticaret.com.tr"),
        ("Demir Yapı Malzemeleri",  "Atatürk Cad. No:78, İstanbul",        "+90 212 555 0202", "satis@demiryapi.com",          "www.demiryapi.com"),
        ("Akdeniz Endüstri Ltd.",   "OSB 4. Cadde No:12, Antalya",         "+90 242 555 0303", "siparis@akdenizend.com.tr",    None),
        ("Karadeniz Makina San.",   "Limanüstü Mah. No:34, Trabzon",       "+90 462 555 0404", "info@karadenizmakina.com",     "www.karadenizmakina.com"),
        ("Ege Parça Ltd. Şti.",     "Organize San. Böl. No:9, İzmir",      "+90 232 555 0505", "satis@egeparca.com",           None),
        ("Başkent Tedarik A.Ş.",    "İvedik OSB No:56, Ankara",            "+90 312 555 0606", "tedarik@baskentas.com.tr",     "www.baskentas.com.tr"),
        ("Marmara Hırdavat",        "Çarşı Mah. No:3, Bursa",             "+90 224 555 0707", None,                           None),
        ("Doğu Teknik Servis",      "Cumhuriyet Cad. No:22, Erzurum",      "+90 442 555 0808", "servis@doguteknik.com",        None),
    ]
    customers: List[Customer] = []
    for i, (name, addr, phone, email, web) in enumerate(data):
        c = Customer(name=name, address=addr, phone=phone, email=email,
                     website=web, created_by=uid, updated_by=uid,
                     created_at=_ago(120 - i * 10))
        db.add(c)
        customers.append(c)
    db.commit()
    for c in customers:
        db.refresh(c)
    logger.info(f"✓ {len(customers)} customers")
    return customers


def create_contacts(db: Session, customers: List[Customer], uid: int) -> List[Contact]:
    profiles = [
        ("Ahmet Yılmaz",    "+90 532 111 2233", "ahmet@yilmazticaret.com.tr"),
        ("Fatma Demir",     "+90 533 222 3344", "fatma@demiryapi.com"),
        ("Mehmet Kaya",     "+90 534 333 4455", "mehmet@akdenizend.com.tr"),
        ("Ayşe Çelik",     "+90 535 444 5566", "ayse@akdenizend.com.tr"),
        ("Hasan Öztürk",   "+90 536 555 6677", "hasan@karadenizmakina.com"),
        ("Zeynep Arslan",  "+90 537 666 7788", "zeynep@egeparca.com"),
        ("Ali Yıldız",     "+90 538 777 8899", "ali@baskentas.com.tr"),
        ("Elif Şahin",     "+90 539 888 9900", "elif@baskentas.com.tr"),
        ("Mustafa Koç",    "+90 530 999 0011", None),
        ("Selin Aydın",    "+90 531 000 1122", "selin@doguteknik.com"),
    ]
    contacts: List[Contact] = []
    for name, phone, email in profiles:
        ct = Contact(name=name, phone=phone, email=email,
                     created_by=uid, updated_by=uid)
        db.add(ct)
        contacts.append(ct)
    db.flush()

    # link contacts → customers  (first 2 to customer 0, next 2 to customer 1, etc.)
    pairs = [(0, 0), (0, 1), (1, 1), (2, 2), (2, 3), (3, 4), (4, 5),
             (5, 6), (5, 7), (6, 8), (7, 9)]
    for ci, cti in pairs:
        if ci < len(customers) and cti < len(contacts):
            db.execute(customer_contact_association.insert().values(
                customer_id=customers[ci].id, contact_id=contacts[cti].id))
    db.commit()
    logger.info(f"✓ {len(contacts)} contacts")
    return contacts


def create_categories(db: Session, uid: int) -> List[Category]:
    names = ["Hırdavat", "Elektrik Malz.", "Boru & Vana", "Boya & Kimyasal"]
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


def create_products(db: Session, cats: List[Category], uid: int) -> List[Product]:
    # (name, desc, price, cat_index)
    defs = [
        ("M10 Civata (100'lü)",     "DIN 931, galvaniz",           45.00, 0),
        ("Somun M10 (100'lü)",      "DIN 934, galvaniz",           22.00, 0),
        ("Pul M10 (100'lü)",        "DIN 125, galvaniz",            9.50, 0),
        ("Kombine Anahtar Takımı",  "6-32mm, 12 parça, krom",     320.00, 0),
        ("Kablo 3x2.5mm NYM (100m)","TSE belgeli",                 780.00, 1),
        ("Priz Kasası Sıvaaltı",    "Derin model, turuncu",          4.50, 1),
        ("LED Panel 60x60 40W",     "Gün ışığı, slim kasa",        185.00, 1),
        ("Sigorta Otomatiği 16A",   "B tipi, 1P",                   38.00, 1),
        ("PPR Boru 20mm (4m)",      "PN20, beyaz",                  32.00, 2),
        ("Küresel Vana 1/2\"",      "Pirinç, tam geçişli",          28.00, 2),
        ("Silikon (280ml)",         "Genel amaçlı, şeffaf",         35.00, 3),
        ("Astar Boya 2.5L",        "Su bazlı, iç cephe, beyaz",    95.00, 3),
    ]
    products: List[Product] = []
    for i, (name, desc, price, ci) in enumerate(defs):
        p = Product(
            name=name, description=desc,
            barcode=f"869{random.randint(1000000000, 9999999999)}" if random.random() > 0.3 else None,
            category_id=cats[ci].id, list_price=price,
            current_stock=0, created_by=uid, updated_by=uid,
        )
        db.add(p)
        products.append(p)
    db.commit()
    for p in products:
        db.refresh(p)
    logger.info(f"✓ {len(products)} products")
    return products


def create_initial_stock(db: Session, products: List[Product], uid: int) -> None:
    """IN movements 60 days ago — initial inventory."""
    for p in products:
        qty = random.randint(40, 200) if p.list_price < 100 else random.randint(10, 60)
        sm = StockMovement(product_id=p.id, quantity=qty,
                           type=StockMovementType.IN,
                           reason="İlk stok girişi",
                           created_by=uid, updated_by=uid,
                           created_at=_ago(60))
        db.add(sm)
        p.current_stock = qty
    db.commit()
    logger.info("✓ Initial stock movements")


# ── Orders, Deliveries, Payments ─────────────────────────────────────

def create_orders(db: Session, customers: List[Customer],
                  products: List[Product], uid: int) -> List[Order]:
    """
    15 orders spread over the last 50 days with varying statuses.
    Each order gets 1-4 items chosen randomly.
    """
    orders: List[Order] = []

    order_blueprints = [
        # (customer_idx, days_ago, num_items, target_status)
        (0, 48, 3, "completed"),
        (1, 45, 2, "completed"),
        (2, 40, 4, "completed"),
        (0, 35, 2, "completed"),
        (3, 33, 1, "completed"),
        (4, 28, 3, "completed"),
        (5, 25, 2, "completed"),
        (1, 20, 3, "partial"),
        (6, 18, 2, "partial"),
        (2, 15, 1, "open"),
        (3, 12, 2, "open"),
        (0, 8,  3, "open"),
        (7, 5,  2, "open"),
        (5, 3,  1, "open"),
        (4, 1,  2, "canceled"),
    ]

    for ci, days, n_items, target in order_blueprints:
        cust = customers[ci % len(customers)]
        date = _ago(days)

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

        # ── items ──
        chosen = random.sample(products, min(n_items, len(products)))
        total = 0.0
        items: List[OrderItem] = []
        for prod in chosen:
            qty = random.randint(1, 20) if prod.list_price < 100 else random.randint(1, 5)
            up  = round(prod.list_price * random.uniform(0.90, 1.05), 2)
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

        # ── delivery & payment based on target ──
        if target == "completed":
            _fully_deliver(db, order, items, uid)
            _fully_pay(db, order, uid)
            order.order_status = OrderStatus.COMPLETED
        elif target == "partial":
            _partially_deliver(db, order, items, uid)
            _partially_pay(db, order, uid)
        elif target == "canceled":
            order.order_status = OrderStatus.CANCELED
        # "open" → leave as-is

        orders.append(order)

    db.commit()
    for o in orders:
        db.refresh(o)
    logger.info(f"✓ {len(orders)} orders")
    return orders


def _fully_deliver(db: Session, order: Order, items: List[OrderItem], uid: int):
    for it in items:
        it.delivered_quantity = it.quantity
        # stock OUT
        sm = StockMovement(
            product_id=it.product_id, quantity=-it.quantity,
            type=StockMovementType.OUT,
            related_order_id=order.id,
            reason=f"Sipariş #{order.id} teslimat",
            created_by=uid, updated_by=uid,
            created_at=order.created_at + timedelta(days=1),
        )
        db.add(sm)
        prod = db.query(Product).get(it.product_id)
        if prod:
            prod.current_stock -= it.quantity
    # delivery record
    od = OrderDelivery(
        order_id=order.id,
        delivered_by_user_id=uid,
        delivered_at=order.created_at + timedelta(days=1),
        note="Tüm kalemler teslim edildi",
    )
    db.add(od)
    order.delivery_status = DeliveryStatus.DELIVERED


def _partially_deliver(db: Session, order: Order, items: List[OrderItem], uid: int):
    # deliver only the first item
    it = items[0]
    it.delivered_quantity = it.quantity
    sm = StockMovement(
        product_id=it.product_id, quantity=-it.quantity,
        type=StockMovementType.OUT,
        related_order_id=order.id,
        reason=f"Sipariş #{order.id} kısmi teslimat",
        created_by=uid, updated_by=uid,
        created_at=order.created_at + timedelta(days=2),
    )
    db.add(sm)
    prod = db.query(Product).get(it.product_id)
    if prod:
        prod.current_stock -= it.quantity
    od = OrderDelivery(
        order_id=order.id,
        delivered_by_user_id=uid,
        delivered_at=order.created_at + timedelta(days=2),
        note=f"{it.quantity} adet teslim edildi",
    )
    db.add(od)
    order.delivery_status = DeliveryStatus.PARTIALLY_DELIVERED


def _fully_pay(db: Session, order: Order, uid: int):
    p = Payment(
        order_id=order.id, amount=order.total_amount,
        method=random.choice([PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER]),
        created_by=uid, updated_by=uid,
        created_at=order.created_at + timedelta(days=random.randint(1, 5)),
    )
    db.add(p)
    order.payment_status = PaymentStatus.PAID


def _partially_pay(db: Session, order: Order, uid: int):
    amount = round(order.total_amount * random.uniform(0.3, 0.6), 2)
    p = Payment(
        order_id=order.id, amount=amount,
        method=PaymentMethod.CASH,
        created_by=uid, updated_by=uid,
        created_at=order.created_at + timedelta(days=2),
    )
    db.add(p)
    order.payment_status = PaymentStatus.PARTIALLY_PAID


# ── Expenses ─────────────────────────────────────────────────────────

def create_expenses(db: Session, uid: int) -> None:
    """Create ~10 expenses spanning last 60 days."""
    cats = db.query(ExpenseCategory).all()
    if not cats:
        logger.warning("No expense categories found — skipping expenses")
        return

    cat_map = {c.name: c.id for c in cats}

    expense_data = [
        (cat_map.get("Fuel / Transportation", cats[0].id), 350.00,  "İstanbul – Kocaeli yakıt",            55),
        (cat_map.get("Product Purchase", cats[0].id),     4200.00,  "Hırdavat toplu alım",                 50),
        (cat_map.get("Logistics", cats[0].id),            1100.00,  "Kargo gönderimi (Antalya)",            45),
        (cat_map.get("Office Supplies", cats[0].id),       280.00,  "Yazıcı toneri ve kâğıt",              40),
        (cat_map.get("Fuel / Transportation", cats[0].id), 420.00,  "Ankara ziyareti ulaşım",              35),
        (cat_map.get("Gifts / Samples", cats[0].id),       650.00,  "Müşteri hediye paketi",               28),
        (cat_map.get("Product Purchase", cats[0].id),     2800.00,  "LED panel stok yenilemesi",            20),
        (cat_map.get("Logistics", cats[0].id),             750.00,  "Trabzon sevkiyat",                     15),
        (cat_map.get("Miscellaneous", cats[0].id),         190.00,  "Ofis su ve temizlik",                  10),
        (cat_map.get("Fuel / Transportation", cats[0].id), 310.00,  "İzmir müşteri ziyareti",               5),
    ]

    for cat_id, amount, desc, days in expense_data:
        exp = Expense(
            amount=amount, description=desc,
            category_id=cat_id,
            date=_ago(days),
            created_by=uid, updated_by=uid,
            created_at=_ago(days),
        )
        db.add(exp)
        db.flush()

        # add an edit-history row for the second expense (simulate an edit)
        if days == 50:
            eh = ExpenseHistory(
                expense_id=exp.id,
                changed_at=_ago(days - 2),
                changed_by=uid,
                field_name="amount",
                old_value="3900.00",
                new_value=str(amount),
            )
            db.add(eh)

    db.commit()
    logger.info("✓ 10 expenses (with history)")


# ── Notes & Tags ─────────────────────────────────────────────────────

def create_notes(db: Session, customers: List[Customer],
                 orders: List[Order], products: List[Product], uid: int) -> None:
    note_rows = [
        (EntityType.CUSTOMER, customers[0].id, "VIP müşteri — öncelikli sevkiyat"),
        (EntityType.CUSTOMER, customers[2].id, "Yıllık sözleşme var, indirimli fiyat uygulanıyor"),
        (EntityType.ORDER,    orders[0].id,    "Müşteri acil teslimat istedi"),
        (EntityType.ORDER,    orders[3].id,    "Fatura e-posta ile gönderildi"),
        (EntityType.PRODUCT,  products[4].id,  "Tedarikçi fiyat güncelledi — kontrol et"),
        (EntityType.PRODUCT,  products[7].id,  "Minimum stok seviyesi: 20 adet"),
    ]
    for etype, eid, text in note_rows:
        db.add(Note(entity_type=etype, entity_id=eid, text=text,
                    created_by=uid, created_at=_ago(random.randint(1, 30))))
    db.commit()
    logger.info("✓ 6 notes")


def create_tags(db: Session, customers: List[Customer],
                products: List[Product], uid: int) -> None:
    tag_names = ["VIP", "Toptan", "Perakende", "Yeni Müşteri", "Çok Satan"]
    tags: List[Tag] = []
    for n in tag_names:
        t = Tag(name=n, created_by=uid, updated_by=uid)
        db.add(t)
        tags.append(t)
    db.flush()

    links = [
        (tags[0], TagEntityType.CUSTOMER, customers[0].id),
        (tags[1], TagEntityType.CUSTOMER, customers[0].id),
        (tags[1], TagEntityType.CUSTOMER, customers[3].id),
        (tags[2], TagEntityType.CUSTOMER, customers[6].id),
        (tags[3], TagEntityType.CUSTOMER, customers[7].id),
        (tags[4], TagEntityType.PRODUCT,  products[0].id),
        (tags[4], TagEntityType.PRODUCT,  products[4].id),
    ]
    for tag, et, eid in links:
        db.add(TagLink(tag_id=tag.id, entity_type=et, entity_id=eid,
                       created_by=uid))
    db.commit()
    logger.info(f"✓ {len(tags)} tags, {len(links)} links")


# =====================================================================
#  SUMMARY
# =====================================================================

def print_summary(db: Session) -> None:
    logger.info("─" * 50)
    logger.info("SUMMARY")
    logger.info("─" * 50)
    rows = [
        ("Customers",          db.query(Customer).count()),
        ("Contacts",           db.query(Contact).count()),
        ("Product categories", db.query(Category).count()),
        ("Products",           db.query(Product).count()),
        ("Stock movements",    db.query(StockMovement).count()),
        ("Orders",             db.query(Order).count()),
        ("  ├ Open",           db.query(Order).filter(Order.order_status == OrderStatus.OPEN).count()),
        ("  ├ Completed",      db.query(Order).filter(Order.order_status == OrderStatus.COMPLETED).count()),
        ("  └ Canceled",       db.query(Order).filter(Order.order_status == OrderStatus.CANCELED).count()),
        ("Order items",        db.query(OrderItem).count()),
        ("Deliveries",         db.query(OrderDelivery).count()),
        ("Payments",           db.query(Payment).count()),
        ("Expenses",           db.query(Expense).count()),
        ("Notes",              db.query(Note).count()),
        ("Tags",               db.query(Tag).count()),
    ]
    for label, count in rows:
        logger.info(f"  {label:<22} {count:>4}")

    total_val  = db.query(func.sum(Order.total_amount)).scalar() or 0
    total_paid = db.query(func.sum(Payment.amount)).scalar() or 0
    total_exp  = db.query(func.sum(Expense.amount)).scalar() or 0
    logger.info("─" * 50)
    logger.info(f"  Order value        ₺{total_val:>12,.2f}")
    logger.info(f"  Payments received  ₺{total_paid:>12,.2f}")
    logger.info(f"  Expenses           ₺{total_exp:>12,.2f}")
    logger.info("─" * 50)


# =====================================================================
#  MAIN
# =====================================================================

def main() -> None:
    logger.info("=" * 50)
    logger.info("  INACORTS — Sample Data Generator")
    logger.info("=" * 50)

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
