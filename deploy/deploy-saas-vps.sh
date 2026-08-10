#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/FXTAO}"
APP_DOMAIN="${APP_DOMAIN:-}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@fx4.com.br}"
TENANT_SLUG="${TENANT_SLUG:-engetec}"
TENANT_NAME="${TENANT_NAME:-Engetec}"
TENANT_LEGAL_NAME="${TENANT_LEGAL_NAME:-Engetec}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/fxtao}"

get_env_value() {
  local key="$1"
  if [[ ! -f deploy/.env ]]; then
    return 0
  fi
  awk -F= -v key="${key}" '$1 == key { sub(/^[^=]*=/, ""); print; exit }' deploy/.env
}

cd "${APP_DIR}"
mkdir -p "${BACKUP_DIR}" logs

if [[ -f deploy/.env ]]; then
  cp deploy/.env "${BACKUP_DIR}/env-$(date +%Y%m%d%H%M%S).bak"
fi

EXISTING_POSTGRES_PASSWORD="$(get_env_value POSTGRES_PASSWORD)"
EXISTING_JWT_SECRET="$(get_env_value JWT_SECRET)"
EXISTING_FRONTEND_URL="$(get_env_value FRONTEND_URL)"

if [[ -z "${APP_DOMAIN}" && -n "${EXISTING_FRONTEND_URL}" ]]; then
  APP_DOMAIN="${EXISTING_FRONTEND_URL#https://}"
  APP_DOMAIN="${APP_DOMAIN#http://}"
  APP_DOMAIN="${APP_DOMAIN%%/*}"
fi

if [[ -z "${APP_DOMAIN}" ]]; then
  echo "Informe APP_DOMAIN, ex: tao.engetec.com.br" >&2
  exit 1
fi

POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-${EXISTING_POSTGRES_PASSWORD:-$(openssl rand -base64 36 | tr -d '\n')}}"
JWT_SECRET="${JWT_SECRET:-${EXISTING_JWT_SECRET:-$(openssl rand -base64 48 | tr -d '\n')}}"

cat > deploy/.env <<EOF
POSTGRES_DB=fxtao_db
POSTGRES_USER=admin
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
DATABASE_URL=postgresql://admin:${POSTGRES_PASSWORD}@db:5432/fxtao_db
FRONTEND_URL=https://${APP_DOMAIN}
VITE_API_URL=https://${APP_DOMAIN}/api/v1
VITE_ENABLE_MICROSOFT_LOGIN=false
JWT_SECRET=${JWT_SECRET}
CORS_ALLOWED_ORIGINS=https://${APP_DOMAIN}
REQUEST_BODY_LIMIT=10mb
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX_REQUESTS=600
AUTH_RATE_LIMIT_WINDOW_MINUTES=15
AUTH_RATE_LIMIT_MAX_REQUESTS=30
UPLOAD_RATE_LIMIT_WINDOW_MINUTES=60
UPLOAD_RATE_LIMIT_MAX_REQUESTS=40
UPLOAD_MAX_FILE_SIZE_MB=10
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=https://${APP_DOMAIN}/api/v1/auth/microsoft/callback
MICROSOFT_TENANT_ID=
SHAREPOINT_API_AUDIENCE=
SHAREPOINT_REQUIRED_SCOPE=access_as_user
SHAREPOINT_ALLOWED_CLIENT_IDS=
SAAS_DEFAULT_TENANT_SLUG=${TENANT_SLUG}
SAAS_DEFAULT_TENANT_NAME=${TENANT_NAME}
SAAS_DEFAULT_TENANT_LEGAL_NAME=${TENANT_LEGAL_NAME}
SAAS_DEFAULT_TENANT_DOMAIN=${APP_DOMAIN}
SAAS_CENTRAL_DOMAINS=${APP_DOMAIN}
SAAS_DEFAULT_DATABASE_LABEL=tenant-${TENANT_SLUG}
SAAS_DEFAULT_PLAN_CODE=enterprise
SAAS_DEFAULT_LOCAL_LOGIN_ENABLED=true
SAAS_DEFAULT_MICROSOFT_LOGIN_ENABLED=false
PORT=3000
NODE_ENV=production
EOF
chmod 0600 deploy/.env

docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml up -d --build

docker exec fxtao_db pg_isready -U admin -d fxtao_db
docker cp backend/prisma/migrations/20260810_saas_catalog_foundation/migration.sql fxtao_db:/tmp/saas_catalog.sql
docker exec fxtao_db psql -U admin -d fxtao_db -f /tmp/saas_catalog.sql
docker exec fxtao node src/scripts/bootstrapSaasCatalog.js

cat >/usr/local/sbin/fxtao-backup.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
BACKUP_DIR="/opt/backups/fxtao"
mkdir -p "${BACKUP_DIR}"
chmod 0700 "${BACKUP_DIR}"
docker exec fxtao_db pg_dump -U admin -d fxtao_db -Fc > "${BACKUP_DIR}/fxtao_db_$(date +%Y%m%d%H%M%S).dump"
find "${BACKUP_DIR}" -type f -name 'fxtao_db_*.dump' -mtime +14 -delete
EOF
chmod 0750 /usr/local/sbin/fxtao-backup.sh

cat >/etc/systemd/system/fxtao-backup.service <<'EOF'
[Unit]
Description=FXTAO PostgreSQL backup
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/fxtao-backup.sh
EOF

cat >/etc/systemd/system/fxtao-backup.timer <<'EOF'
[Unit]
Description=Run FXTAO PostgreSQL backup daily

[Timer]
OnCalendar=*-*-* 03:20:00
Persistent=true
RandomizedDelaySec=15m

[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now fxtao-backup.timer

cat >/etc/nginx/sites-available/fxtao.conf <<EOF
server {
    listen 80;
    server_name ${APP_DOMAIN};
    server_tokens off;
    client_max_body_size 12m;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Request-Id \$request_id;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
    }
}
EOF
ln -sf /etc/nginx/sites-available/fxtao.conf /etc/nginx/sites-enabled/fxtao.conf
nginx -t
systemctl reload nginx

certbot --nginx -d "${APP_DOMAIN}" --non-interactive --agree-tos -m "${ADMIN_EMAIL}" --redirect --keep-until-expiring
systemctl reload nginx

curl -fsS "https://${APP_DOMAIN}/api/v1/saas/context" >/dev/null
echo "Deploy SaaS concluido em https://${APP_DOMAIN}"
