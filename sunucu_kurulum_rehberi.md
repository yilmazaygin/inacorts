# 🚀 INACORTS — Ubuntu 24.04 Sunucu Kurulum Rehberi (Sıfırdan)

> Sıfır bir Ubuntu 24.04 CLI sunucusunda, projeyi Docker ile ayağa kaldırıp HTTPS ile yayınlamak için gereken **tüm adımlar**.

---

## BÖLÜM 1: Sistemi Hazırla

### Adım 1 — Sistem Güncelleme

```bash
sudo apt update
sudo apt upgrade -y
```

### Adım 2 — Temel Araçları Kur

```bash
sudo apt install -y ca-certificates curl gnupg git nano ufw
```

| Araç | Ne İşe Yarar |
|------|-------------|
| `ca-certificates`, `curl`, `gnupg` | Docker repo'su için gerekli |
| `git` | Projeyi GitHub'dan çekmek için |
| `nano` | Dosya düzenlemek için |
| `ufw` | Firewall yönetimi |

---

## BÖLÜM 2: Docker Kurulumu

### Adım 3 — Docker GPG Anahtarı Ekle

```bash
sudo install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

### Adım 4 — Docker Repo'sunu Ekle

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### Adım 5 — Docker'ı Kur

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Adım 6 — Docker'ı Sudo'suz Kullan

```bash
sudo usermod -aG docker $USER
```

> [!IMPORTANT]
> Bu komuttan sonra **oturumu kapat ve tekrar aç** ki grup değişikliği aktif olsun:
> ```bash
> exit
> ```
> Sonra SSH ile tekrar bağlan.

### Adım 7 — Docker'ın Çalıştığını Doğrula

```bash
docker --version
docker compose version
docker run --rm hello-world
```

Çıktıda `Hello from Docker!` görmelisin. ✅

---

## BÖLÜM 3: Projeyi Çek ve Yapılandır

### Adım 8 — Projeyi GitHub'dan Çek

```bash
cd ~
git clone https://github.com/yilmazaygin/inacorts-ex.git
cd inacorts-ex
```

### Adım 9 — Production .env Dosyası Oluştur

Proje **kök dizininde** (docker-compose.yml'nin yanında) bir `.env` dosyası oluştur:

```bash
nano .env
```

İçine şunları yaz:

```env
ENVIRONMENT=production
SECRET_KEY=BURAYA_GERCEK_KEY_YAZ
ALLOWED_ORIGINS=https://senindomain.com
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
LOG_LEVEL=INFO
```

> [!CAUTION]
> `SECRET_KEY` için rastgele güçlü bir anahtar oluştur. Şu komutu çalıştırıp çıktısını yapıştır:
> ```bash
> python3 -c "import secrets; print(secrets.token_urlsafe(48))"
> ```
> Eğer python3 yoksa:
> ```bash
> openssl rand -base64 48
> ```

> [!IMPORTANT]
> `ALLOWED_ORIGINS` değerini kendi domain adresinle değiştir.
> - Domain varsa: `https://senindomain.com`
> - Domain yoksa (sadece IP): `http://SUNUCU_IP:3000`

`nano`'dan çıkmak için: `Ctrl+X` → `Y` → `Enter`

---

## BÖLÜM 4: Docker ile Projeyi Ayağa Kaldır

### Adım 10 — Build ve Çalıştır

```bash
cd ~/inacorts-ex
docker compose up --build -d
```

Bu işlem ilk seferde **3-5 dakika** sürebilir (imajları indirip derliyor).

### Adım 11 — Durumu Kontrol Et

```bash
docker compose ps
```

**Beklenen çıktı:**
```
NAME                IMAGE                    STATUS
inacorts-backend    inacorts-ex-backend      Up ... (healthy)
inacorts-frontend   inacorts-ex-frontend     Up ... (healthy)
```

> [!NOTE]
> İlk açılışta healthcheck'ler birkaç dakika `(health: starting)` gösterebilir. 1-2 dakika bekleyip tekrar `docker compose ps` çalıştır. Her ikisi de `(healthy)` olmalı.

### Adım 12 — Log Kontrol

Sıkıntı varsa logları kontrol et:

```bash
# Backend logları
docker compose logs backend

# Frontend logları
docker compose logs frontend

# Canlı takip (Ctrl+C ile çık)
docker compose logs -f
```

### Adım 13 — HTTP Testi (Domain'siz)

```bash
# Frontend test (sunucu içinden)
curl -I http://localhost:3000

# API proxy test (Nginx üzerinden)
curl http://localhost:3000/api/v1/auth/login
```

Frontend testi `HTTP/1.1 200 OK` dönmeli. ✅

> **Domain'in yoksa burada durabilirsin.** Tarayıcıdan `http://SUNUCU_IP:3000` ile erişebilirsin. HTTPS istiyorsan devam et ↓

---

## BÖLÜM 5: Firewall Ayarları

### Adım 14 — UFW Firewall'u Yapılandır

```bash
# SSH'yi aç (bunu MUTLAKA önce yap, yoksa kendini sunucudan kilitlersin!)
sudo ufw allow OpenSSH

# HTTP ve HTTPS portlarını aç
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Docker frontend portu (domain kullanmıyorsan gerekli)
sudo ufw allow 3000/tcp

# Firewall'u aktifleştir
sudo ufw enable

# Durumu kontrol et
sudo ufw status
```

> [!CAUTION]
> `sudo ufw allow OpenSSH` komutunu **firewall'u aktifleştirmeden ÖNCE** çalıştır. Yoksa SSH bağlantın kesilir ve sunucuya erişemezsin!

---

## BÖLÜM 6: Host Nginx + HTTPS (Domain Varsa)

> [!IMPORTANT]
> Bu bölüm sadece **domain adresin varsa** gerekli. Domain yoksa BÖLÜM 5'te bırakabilirsin, `http://SUNUCU_IP:3000` ile erişirsin.

### Adım 15 — Host Nginx Kur

```bash
sudo apt install -y nginx
```

### Adım 16 — Nginx'in Çalıştığını Kontrol Et

```bash
sudo systemctl status nginx
```

`active (running)` görmeli. ✅

### Adım 17 — INACORTS Site Config Oluştur

```bash
sudo nano /etc/nginx/sites-available/inacorts
```

Aşağıdaki içeriği yapıştır (**`senindomain.com`'u kendi domaininle değiştir**):

```nginx
server {
    listen 80;
    server_name senindomain.com;

    # --- Gzip sıkıştırma ---
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # --- Her şeyi Docker frontend'e proxy'le ---
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

`nano`'dan çık: `Ctrl+X` → `Y` → `Enter`

### Adım 18 — Site'ı Aktifleştir

```bash
# Default site'ı kaldır (opsiyonel, sadece tek site varsa)
sudo rm -f /etc/nginx/sites-enabled/default

# INACORTS site'ını aktifleştir
sudo ln -s /etc/nginx/sites-available/inacorts /etc/nginx/sites-enabled/

# Config'i test et
sudo nginx -t
```

`syntax is ok` ve `test is successful` görmeli. ✅

```bash
# Nginx'i yeniden yükle
sudo systemctl reload nginx
```

### Adım 19 — Domain DNS Ayarı

Domain sağlayıcında (Cloudflare, GoDaddy, Namecheap vb.) bir **A Record** ekle:

| Tip | Ad | Değer | TTL |
|-----|----|-------|-----|
| A | `@` veya `inacorts` | `SUNUCU_IP_ADRESIN` | Auto |

DNS yayılması birkaç dakika sürebilir. Test et:

```bash
dig senindomain.com +short
```

Sunucu IP'ni görmeli. ✅

### Adım 20 — Let's Encrypt SSL Sertifikası (HTTPS) BURADA KALDIN

```bash
# Certbot kur
sudo apt install -y certbot python3-certbot-nginx

# Sertifika al (otomatik Nginx yapılandırması)
sudo certbot --nginx -d senindomain.com
```

Certbot sana şunları soracak:
1. **Email adresi** → yaz (sertifika hatırlatmaları için)
2. **Terms of Service** → `Y` (kabul et)
3. **Email paylaşımı** → `N` (istemiyorsan)

İşlem tamamlanınca Certbot otomatik olarak:
- ✅ SSL sertifikası alır
- ✅ Nginx config'e HTTPS ayarlarını ekler
- ✅ HTTP → HTTPS yönlendirmesi yapar
- ✅ Otomatik yenileme cron job'u kurar

### Adım 21 — HTTPS'i Test Et

```bash
# Sertifika durumu
sudo certbot certificates

# Otomatik yenileme testi
sudo certbot renew --dry-run
```

Tarayıcıdan aç: `https://senindomain.com` 🔒✅

### Adım 22 — Docker .env'i HTTPS ile Güncelle

```bash
cd ~/inacorts-ex
nano .env
```

`ALLOWED_ORIGINS` satırını güncelle:

```env
ALLOWED_ORIGINS=https://senindomain.com
```

Docker'ı yeniden başlat:

```bash
docker compose down
docker compose up -d
```

---

## BÖLÜM 7: Son Kontroller

### Adım 23 — Her Şeyi Doğrula

```bash
# 1. Docker container'ları çalışıyor mu?
docker compose ps

# 2. HTTPS çalışıyor mu? (domain varsa)
curl -I https://senindomain.com

# 3. API proxy çalışıyor mu?
curl https://senindomain.com/api/v1/auth/login

# 4. HTTP → HTTPS yönlendirmesi çalışıyor mu?
curl -I http://senindomain.com
# Location: https://senindomain.com/ (301 redirect) görmeli
```

---

## BÖLÜM 8: Faydalı Komutlar (Günlük Kullanım)

```bash
# Logları izle
docker compose logs -f

# Servisleri yeniden başlat
docker compose restart

# Tamamen durdur
docker compose down

# Tamamen durdur + verileri sil (DİKKAT: veritabanı ve ürün görselleri silinir!)
docker compose down -v

# Güncellemeden sonra yeniden build
cd ~/inacorts-ex
git pull origin main
docker compose up --build -d

# Disk kullanımı
docker system df
```

---

## Özet Mimari

```
Kullanıcı
  │
  ▼
https://senindomain.com:443   ← Host Nginx (SSL termination)
  │
  ▼
http://127.0.0.1:3000         ← Docker Frontend (Nginx container)
  │
  ├── /api/*  →  backend:8000 ← Docker Backend (FastAPI, internal only)
  └── /*      →  index.html   ← React SPA
```

| Katman | Port | Dışa Açık? |
|--------|------|-----------|
| Host Nginx | 80, 443 | ✅ Evet |
| Docker Frontend | 3000 (host) → 80 (container) | ✅ Evet (localhost) |
| Docker Backend | 8000 (container only) | ❌ Hayır |

---

## BÖLÜM 9: Vitrin ve yönetim girişi

İki komut var. Biri yönetim girişini açıp kapatır. Diğeri ana sayfayı ve diğer vitrin sayfalarını değiştirir. Birbirinden bağımsız çalışırlar; ikisini aynı anda da kullanabilirsin.

Ayar, veritabanının yanındaki `site_gate.json` dosyasına yazılır. Konteyner yeniden başlasa da, imaj yenilense de durur. `docker compose down -v` bu dosyayı veritabanıyla birlikte siler. Komuttan sonra servisi yeniden başlatmana gerek yok. Açık sekme birkaç saniye içinde yeni hale geçer.

Komutları proje klasöründe çalıştır (`docker-compose.yml` dosyasının durduğu yer):

```bash
cd ~/inacorts-ex
./scripts/site-gate durum
```

### Girişi kapatmak ve açmak

Admin dahil hiçbir hesap giriş yapamaz. Şifre sıfırlama da kapanır. Açık oturum da düşer. Giriş kartı durur; formun yerinde senin yazın görünür.

```bash
./scripts/site-gate login --kapat --mesaj "Giriş geçici olarak kapalı."
./scripts/site-gate login --ac
```

### Vitrin sayfaları

| Komut | Ne olur |
| --- | --- |
| `pages --no-pages` | Ana sayfa, hakkımızda, iletişim, ürünler, sepet, nasıl sipariş verilir ve kullanıcı sözleşmesi görünmez. Adres çubuğuna yazılan başka bir vitrin yolu da boş kalır. `/admin` açılır. |
| `pages --page` | Bu adreslerin hepsi hazır sayfayı gösterir. `/admin` açılır. |
| `pages --page --yonetim` | Hazır sayfa `/admin` adresinde de görünür. |
| `pages --ac` | Vitrin normale döner. `/admin` de normale döner. |

```bash
./scripts/site-gate pages --no-pages
./scripts/site-gate pages --page
./scripts/site-gate pages --page --yonetim
./scripts/site-gate pages --ac
```

`--yonetim` yalnızca `--page` ile yazılır. Yönetimi yeniden açmak için aynı sayfa durusun istiyorsan komutu bayraksız tekrarla:

```bash
./scripts/site-gate pages --page
```

`--no-pages` açıkken sayfa boştur. Menü yoktur, yönetime giden bir bağlantı da yoktur. Yönetim için adresi kendin yazarsın: `/admin`.

Site kapalıyken de bu komutlar sunucudan çalışır. Geri açmak için yine bunları kullanırsın.

### Hazır sayfa

`pages --page` öncelikle depodaki bakım sayfasını gösterir. Dil, sitedeki dil anahtarıyla değişir.

- Türkçe: Sitemiz şu anda bakım altındadır.
- English: Our site is under maintenance right now.

Başka bir sayfa göstermek istersen, onu yalnızca o makinede tutabilirsin. Şu dosyayı oluştur:

`frontend/src/pages/site/StandbyPage.local.tsx`

Dosya `StandbyPage` adında bir React bileşeni export etmeli. Sayfa tam ekran çizilir; vitrin menüsü eklenmez. Görselleri `frontend/src/pages/site/standby-local/` içine koyup bu dosyadan import edebilirsin. İki yol da `.gitignore` içindedir. `git pull` bunları silmez ve GitHub'a göndermez.

```tsx
export const StandbyPage = () => (
  <main className="flex min-h-screen items-center justify-center bg-stone-50">
    <h1 className="text-3xl font-medium">Kendi sayfan</h1>
  </main>
);
```

Dosyayı ekledikten veya değiştirdikten sonra frontend imajını yeniden üret:

```bash
docker compose up --build -d
```

Bakım sayfasına dönmek için `StandbyPage.local.tsx` dosyasını sil ve aynı build komutunu tekrar çalıştır. `pages` komutunu değiştirmen gerekmez.

### İkisi birlikte

| Vitrin | Giriş | Sonuç |
| --- | --- | --- |
| `--ac` | `--ac` | Site ve giriş normal |
| `--no-pages` | `--ac` | Vitrin boş, `/admin` çalışır |
| `--no-pages` | `--kapat` | Vitrin boş, girişte senin yazın durur |
| `--page` | `--ac` | Vitrinde hazır sayfa, `/admin` çalışır |
| `--page` | `--kapat` | Vitrinde hazır sayfa, girişte senin yazın durur |
| `--page --yonetim` | fark etmez | Hazır sayfa vitrinde de `/admin` üzerinde de durur |

Güncel hali görmek için:

```bash
./scripts/site-gate durum
```

