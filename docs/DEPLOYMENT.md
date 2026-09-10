# Wdrożenie na VPS (Ubuntu + nginx + PM2 + certbot)

Cel: `https://nowybrowargdanski.pl` obsługiwane przez aplikację Node działającą pod PM2, za reverse proxy nginx, z certyfikatem Let's Encrypt.

## 1. Serwer

- Ubuntu 24.04 LTS, min. 1 vCPU / 1 GB RAM / 20 GB SSD (SQLite + sharp — bez bazy zewnętrznej).
- Użytkownik `deploy` (nie root):
  ```bash
  adduser deploy && usermod -aG sudo deploy
  ```
- Firewall i aktualizacje:
  ```bash
  ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
  apt update && apt install -y unattended-upgrades
  ```

## 2. Node + PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nginx git build-essential sqlite3
sudo npm i -g pm2
```

## 3. Kod

```bash
sudo mkdir -p /var/www/kknbg-website && sudo chown deploy:deploy /var/www/kknbg-website
cd /var/www/kknbg-website
git clone https://github.com/pogan/kknbg-website.git .
npm ci
cp .env.example .env
```

W `.env` ustaw produkcyjnie:

```
NODE_ENV=production
BASE_URL=https://nowybrowargdanski.pl
SESSION_SECRET=<openssl rand -hex 32>
COOKIE_SECURE=true
AUTH_MODE=google
ADMIN_EMAILS=karol.konop@gmail.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://nowybrowargdanski.pl/auth/google/callback
MAILER=smtp            # + dane SMTP gdy podłączymy realny transport
PAYMENTS_PROVIDER=autopay   # docelowo; w prototypie: mock
```

Build + baza + start:

```bash
npm run build
npm run migrate
npm run seed          # tylko przy pierwszym uruchomieniu / środowisku demo
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup            # wykonaj polecenie, które wypisze
```

## 4. nginx + HTTPS

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/nowybrowargdanski.pl
# popraw ścieżki (root) jeśli inne niż /var/www/kknbg-website
sudo ln -s /etc/nginx/sites-available/nowybrowargdanski.pl /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d nowybrowargdanski.pl -d www.nowybrowargdanski.pl
# auto-odnawianie: certbot instaluje timer systemd (sprawdź: systemctl list-timers | grep certbot)
```

## 5. Logi i kopie zapasowe

```bash
pm2 install pm2-logrotate
# cron backupu bazy + uploads (codziennie 3:15)
( crontab -l 2>/dev/null; echo "15 3 * * * /var/www/kknbg-website/scripts/backup-db.sh" ) | crontab -
```

## 6. Aktualizacje

```bash
cd /var/www/kknbg-website
git pull --ff-only
npm ci --omit=dev
npm run build
npm run migrate
pm2 reload ecosystem.config.js --env production
```

Albo automatycznie przez GitHub Actions — patrz `.github/workflows/ci.yml` (sekcja `deploy` do odkomentowania + sekrety `DEPLOY_HOST/USER/KEY`).

## 7. Google OAuth (produkcja)

1. https://console.cloud.google.com → nowy projekt → „OAuth consent screen” (External, tryb produkcyjny).
2. „Credentials” → OAuth client ID (Web) → Authorized redirect URI: `https://nowybrowargdanski.pl/auth/google/callback`.
3. Wpisz `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` w `.env`, ustaw `AUTH_MODE=google`, `pm2 reload`.

## 8. Migracja z WordPressa

- Zbierz stare URL-e (`/?p=`, `/menu/`, `/o-nas/` itd.) i dodaj mapę 301 w nginx lub w aplikacji.
- Po przełączeniu DNS: zgłoś nową `sitemap.xml` w Google Search Console, sprawdź „Coverage”.
- Zachowaj profil Google Business Profile — zaktualizuj tylko link do strony.
