"""Local demo catalogue for an industrial consumables supplier.

Loaded only when SEED_DEMO_PRODUCTS is true and the product table is empty.
Category photos live in app/assets/catalog and are copied into the uploads volume.
"""

import json
import shutil
from pathlib import Path

from sqlalchemy.orm import Session
from loguru import logger

from app.models import Category, Product
from app.utils.product_images import products_dir

_ASSETS = Path(__file__).resolve().parents[1] / "assets" / "catalog"

# name, description, list price (TRY), stock
_CATALOG = [
    ("Klips", "klips", [
        ("Evrak Klipsi 19 mm", "Siyah metal evrak klipsi, 12'li kutu. İnce dosya ve fiş desteleri için.", 24.50, 240),
        ("Evrak Klipsi 25 mm", "Siyah metal evrak klipsi, 12'li kutu. Günlük evrak için standart ölçü.", 28.00, 180),
        ("Evrak Klipsi 32 mm", "Siyah metal evrak klipsi, 12'li kutu. Kalın klasör ve rapor destesi tutar.", 34.00, 140),
        ("Evrak Klipsi 41 mm", "Siyah metal evrak klipsi, 12'li kutu. Geniş evrak ve numune dosyaları için.", 42.00, 90),
        ("Evrak Klipsi 50 mm", "Siyah metal evrak klipsi, 12'li kutu. En geniş ağız, ağır desteler için.", 55.00, 60),
        ("Kablo Klipsi 5 mm", "Yapışkanlı beyaz kablo klipsi, 100'lü paket. İnce kablo ve hortum sabitlemek için.", 18.00, 300),
        ("Kablo Klipsi 8 mm", "Yapışkanlı beyaz kablo klipsi, 100'lü paket. Tezgah ve pano kenarı için.", 22.00, 220),
        ("Kablo Klipsi 10 mm", "Yapışkanlı beyaz kablo klipsi, 100'lü paket. Kalın kablo demetlerini toplar.", 26.00, 160),
        ("Askı Klipsi", "Panel ve tabela askı klipsi, 50'li paket. Raf ve stant etiketleri için.", 15.00, 0),
        ("Çelik Bağ Klipsi", "Hortum ve kablo demeti için çelik bağ klipsi, 25'li kutu.", 36.00, 75),
    ]),
    ("Jel", "jel", [
        ("El Dezenfektan Jeli 100 ml", "Alkol bazlı el dezenfektan jeli, cep boy. Saha ve servis ekipleri için.", 35.00, 200),
        ("El Dezenfektan Jeli 500 ml", "Pompalı el dezenfektan jeli. Atölye girişi ve lavabo yanı için.", 85.00, 120),
        ("El Dezenfektan Jeli 1 L", "Yedek dolumluk el dezenfektan jeli. Pompalı dispenserlere uygundur.", 140.00, 80),
        ("Ultrason Jeli 250 ml", "İletken ultrason ve bakım jeli. Tıkanmayan kapak, damlatmaz kıvam.", 75.00, 64),
        ("Ultrason Jeli 5 L", "Bidon ultrason jeli. Servis ve bakım atölyelerinde ekonomik dolum.", 420.00, 24),
        ("Antibakteriyel El Jeli 50 ml", "Kemer askılıklı küçük şişe. Saha personeli için günlük boy.", 22.00, 260),
        ("Koruyucu El Kremi 100 ml", "Yağlı ve solventli ortamda çalışan eller için bariyer krem.", 48.00, 90),
        ("Montaj Kayganlaştırıcı Jel 100 g", "Conta ve hortum montajında kullanılan su bazlı kayganlaştırıcı jel.", 65.00, 40),
        ("İletken Elektrot Jeli 250 ml", "Ölçüm ve test elektrotları için iletken jel. Kurumayan formül.", 95.00, 30),
        ("Pompalı Dezenfektan Jel 5 L", "Ortak alanlar için pompalı bidon. Hijyen noktalarına dolumluk.", 390.00, 18),
    ]),
    ("Eldiven", "eldiven", [
        ("Nitril Muayene Eldiveni S", "Pudrasız mavi nitril, 100'lü kutu. İnce iş ve kontrol için küçük beden.", 95.00, 150),
        ("Nitril Muayene Eldiveni M", "Pudrasız mavi nitril, 100'lü kutu. En çok tercih edilen beden.", 95.00, 220),
        ("Nitril Muayene Eldiveni L", "Pudrasız mavi nitril, 100'lü kutu. Bakım ve montaj ekipleri için.", 95.00, 180),
        ("Nitril Muayene Eldiveni XL", "Pudrasız mavi nitril, 100'lü kutu. Geniş el ölçüsü.", 98.00, 70),
        ("Lateks Muayene Eldiveni M", "Pudralı lateks, 100'lü kutu. Esnek tutuş, orta beden.", 78.00, 90),
        ("Lateks Muayene Eldiveni L", "Pudralı lateks, 100'lü kutu. Büyük beden.", 78.00, 80),
        ("Vinil Eldiven M", "Kısa süreli işler için şeffaf vinil, 100'lü kutu. Orta beden.", 62.00, 110),
        ("Vinil Eldiven L", "Kısa süreli işler için şeffaf vinil, 100'lü kutu. Büyük beden.", 62.00, 40),
        ("Nitril Kaplı İş Eldiveni 9", "Avuç içi nitril kaplı örme iş eldiveni, 12'li paket. 9 numara.", 145.00, 55),
        ("Nitril Kaplı İş Eldiveni 10", "Avuç içi nitril kaplı örme iş eldiveni, 12'li paket. 10 numara.", 145.00, 48),
        ("Kesilmeye Dayanıklı Eldiven", "Seviye C kesilme dirençli örme eldiven, çift. Sac ve cam kenarı için.", 210.00, 36),
        ("Kaynakçı Eldiveni", "Isıya dayanıklı deri kaynak eldiveni, çift. Uzun konç.", 185.00, 28),
        ("Isıya Dayanıklı Eldiven", "250°C'ye kadar kısa temas için ısı eldiveni, çift.", 240.00, 16),
        ("Pamuk Örme Eldiven", "Genel amaçlı beyaz pamuk eldiven, 12'li paket. Hafif işler için.", 42.00, 0),
        ("Kimyasal Koruyucu Eldiven", "Uzun konçlu nitril kimyasal eldiven, çift. Solvent ve asit sıçramasına karşı.", 165.00, 22),
    ]),
    ("Streç Film", "strec", [
        ("El Tipi Streç 17 mikron", "2,2 kg el tipi palet streçi. Hafif koliler ve düzensiz yük için.", 185.00, 80),
        ("El Tipi Streç 23 mikron", "2,4 kg el tipi streç. Standart palet sarımı, şeffaf.", 230.00, 70),
        ("Makine Tipi Streç 23 mikron", "Makine sarımı için 23 mikron şeffaf streç. Yüksek metraj.", 410.00, 24),
        ("Siyah Streç Film", "İçeriği gizleyen siyah el tipi streç, 2 kg. Sevkiyat güvenliği için.", 245.00, 30),
        ("Mavi Streç Film", "Renk kodlu mavi el tipi streç, 2 kg. Hat ve vardiya ayrımı için.", 245.00, 26),
        ("Gıda Streçi 30 cm", "Şeffaf gıda streçi, 300 m rulo. Tezgah ve porsiyon kapatma.", 68.00, 140),
        ("Gıda Streçi 45 cm", "Geniş şeffaf gıda streçi, 300 m rulo. Tepsi ve kasa örtmek için.", 92.00, 90),
        ("Palet Streç 50 cm", "50 cm eninde palet streçi. Geniş taban ve uzun paletler için.", 275.00, 34),
        ("Mini Streç 10 cm", "Dar mini streç, 150 m. Demet, kablo ve küçük paket gruplamak için.", 38.00, 160),
        ("Kodlama Streçi Kırmızı", "Kırmızı renk kodlu el tipi streç, 2 kg.", 250.00, 18),
        ("Kodlama Streçi Yeşil", "Yeşil renk kodlu el tipi streç, 2 kg.", 250.00, 18),
        ("Kodlama Streçi Sarı", "Sarı renk kodlu el tipi streç, 2 kg.", 250.00, 12),
        ("Ön Gerdirmeli Streç", "Ön gerdirmeli el tipi streç. Aynı paleti daha az filmle sarar.", 290.00, 20),
        ("Ekonomik Streç 12 mikron", "12 mikron hafif yük streçi, 1,8 kg. Düz ve keskin kenarsız koliler için.", 145.00, 44),
        ("Kalın Palet Streçi 30 mikron", "30 mikron kalın streç. Ağır ve köşeli yükler için.", 340.00, 15),
    ]),
    ("Koku", "koku", [
        ("Ortam Kokusu Limon 500 ml", "Sprey ortam kokusu, limon. Atölye, ofis ve soyunma alanı için.", 55.00, 80),
        ("Ortam Kokusu Lavanta 500 ml", "Sprey ortam kokusu, lavanta. Kapalı depo ve bekleme alanı için.", 55.00, 70),
        ("Ortam Kokusu Okyanus 500 ml", "Sprey ortam kokusu, okyanus. Günlük serinletici koku.", 55.00, 64),
        ("Endüstriyel Koku Giderici 5 L", "Yoğun koku giderici konsantre, 5 L bidon. Sulandırılarak kullanılır.", 320.00, 14),
        ("Araç ve Kabin Kokusu", "Askılıklı kabin kokusu, 10'lu koli. Servis araçları ve forklift kabini için.", 90.00, 40),
    ]),
    ("Elektrik Soketi", "soket", [
        ("Topraklı Duvar Prizi", "Sıva altı topraklı priz, beyaz. Ofis ve pano yanı hatları için.", 45.00, 100),
        ("Sıva Üstü Grup Priz 3'lü", "Sıva üstü üçlü grup priz, topraklı. Tezgah ve makine yanı için.", 125.00, 40),
        ("Endüstriyel Soket 16A", "16A 3P+N+E endüstriyel makine soketi. Atölye besleme hattı için.", 210.00, 22),
        ("Kauçuk Uzatma Prizi", "Darbeye dayanıklı kauçuk tekli priz. Saha ve ıslak zemin kenarı için.", 85.00, 36),
        ("UPS Bilgisayar Prizi", "Topraklı UPS prizi, beyaz. Bilgisayar ve yazıcı hatları için.", 68.00, 0),
    ]),
]


def seed_demo_catalog(db: Session, user_id: int) -> None:
    if db.query(Product).count() > 0:
        logger.info("Demo catalogue skipped; products already exist")
        return

    upload_dir = products_dir()
    created = 0
    for category_name, slug, items in _CATALOG:
        category = Category(
            name=category_name,
            created_by=user_id,
            updated_by=user_id,
        )
        db.add(category)
        db.flush()

        image_filename = None
        source = _ASSETS / f"catalog-{slug}.png"
        if source.is_file():
            image_filename = f"demo-{slug}.png"
            destination = upload_dir / image_filename
            if not destination.exists():
                shutil.copyfile(source, destination)

        for name, description, price, stock in items:
            db.add(Product(
                name=name,
                description=description,
                image_filename=image_filename,
                image_filenames=json.dumps([image_filename]) if image_filename else None,
                category_id=category.id,
                list_price=price,
                current_stock=stock,
                created_by=user_id,
                updated_by=user_id,
            ))
            created += 1

    db.commit()
    logger.info(f"Demo catalogue loaded: {created} products")
