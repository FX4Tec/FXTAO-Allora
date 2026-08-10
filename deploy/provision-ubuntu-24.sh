#!/usr/bin/env bash
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-fxtao}"
SSH_PUBLIC_KEY="${SSH_PUBLIC_KEY:-}"
APP_DOMAIN="${APP_DOMAIN:-}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@fx4.com.br}"
DISABLE_PASSWORD_SSH="${DISABLE_PASSWORD_SSH:-true}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Execute como root." >&2
  exit 1
fi

if [[ -z "${SSH_PUBLIC_KEY}" ]]; then
  echo "Informe SSH_PUBLIC_KEY com a chave publica do usuario de deploy." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get -y upgrade
apt-get install -y \
  apparmor apparmor-utils auditd ca-certificates curl fail2ban git gnupg \
  lsb-release nginx openssl python3-certbot-nginx sudo ufw unattended-upgrades

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

if ! id "${DEPLOY_USER}" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "${DEPLOY_USER}"
fi
usermod -aG sudo,docker "${DEPLOY_USER}"
install -d -m 0700 -o "${DEPLOY_USER}" -g "${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"
printf '%s\n' "${SSH_PUBLIC_KEY}" > "/home/${DEPLOY_USER}/.ssh/authorized_keys"
chown "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh/authorized_keys"
chmod 0600 "/home/${DEPLOY_USER}/.ssh/authorized_keys"
echo "${DEPLOY_USER} ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/90-${DEPLOY_USER}"
chmod 0440 "/etc/sudoers.d/90-${DEPLOY_USER}"

cat >/etc/docker/daemon.json <<'JSON'
{
  "live-restore": true,
  "userland-proxy": false,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
JSON
systemctl enable --now docker
systemctl restart docker

cat >/etc/sysctl.d/99-fxtao-hardening.conf <<'EOF'
net.ipv4.conf.all.rp_filter=1
net.ipv4.conf.default.rp_filter=1
net.ipv4.conf.all.accept_redirects=0
net.ipv4.conf.default.accept_redirects=0
net.ipv6.conf.all.accept_redirects=0
net.ipv6.conf.default.accept_redirects=0
net.ipv4.conf.all.send_redirects=0
net.ipv4.conf.default.send_redirects=0
net.ipv4.tcp_syncookies=1
net.ipv4.conf.all.log_martians=1
kernel.kptr_restrict=2
kernel.dmesg_restrict=1
fs.protected_hardlinks=1
fs.protected_symlinks=1
EOF
sysctl --system >/dev/null

cat >/etc/fail2ban/jail.d/sshd-local.conf <<'EOF'
[sshd]
enabled = true
maxretry = 4
findtime = 15m
bantime = 1h
EOF
systemctl enable --now fail2ban

cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
systemctl enable --now unattended-upgrades

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

if [[ "${DISABLE_PASSWORD_SSH}" == "true" ]]; then
  cat >/etc/ssh/sshd_config.d/99-fxtao-hardening.conf <<EOF
PermitRootLogin prohibit-password
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers ${DEPLOY_USER} root
EOF
  sshd -t
  systemctl reload ssh || systemctl reload sshd
fi

install -d -o "${DEPLOY_USER}" -g "${DEPLOY_USER}" /opt/FXTAO /opt/backups/fxtao

cat >/etc/logrotate.d/fxtao <<'EOF'
/opt/FXTAO/logs/*.log {
  daily
  rotate 14
  compress
  missingok
  notifempty
  copytruncate
}
EOF

echo "Hardening base concluido."
if [[ -n "${APP_DOMAIN}" ]]; then
  echo "Dominio informado: ${APP_DOMAIN}. O certificado sera configurado no deploy."
fi
echo "Usuario de deploy: ${DEPLOY_USER}"
