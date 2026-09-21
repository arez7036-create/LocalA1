#!/usr/bin/env bash
# LocalAI Custom - Deploy to Vultr
# Run on fresh Ubuntu 24.04 server as root

set -euo pipefail

echo "🚀 Deploying LocalAI Custom..."

# Install Docker
apt-get update && apt-get install -y ca-certificates curl gnupg git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

# Clone repo
REPO_URL="https://github.com/arez7036-create/LocalA1.git"
INSTALL_DIR="/opt/LocalAI-Custom"

if [ -d "$INSTALL_DIR/.git" ]; then
    git -C "$INSTALL_DIR" pull --ff-only
else
    git clone "$REPO_URL" "$INSTALL_DIR"
fi
cd "$INSTALL_DIR"

# Setup .env
if [ ! -f .env ]; then
    cp .env.example .env
    SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    DB_PASS=$(openssl rand -base64 24 2>/dev/null || head -c 24 /dev/urandom | base64)
    ADMIN_PASS=$(openssl rand -base64 16 2>/dev/null || head -c 16 /dev/urandom | base64)
    sed -i "s|openssl_rand_base64_24|$DB_PASS|" .env
    sed -i "s|openssl_rand_base64_32|$SECRET|" .env
    sed -i "s|strong_password_123|$ADMIN_PASS|" .env
    echo "Generated secrets saved to .env. Admin credentials are stored only in that file."
fi

# Start stack
docker compose up -d

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to be ready..."
for i in {1..30}; do
    if docker exec localai-custom-ollama-1 ollama list >/dev/null 2>&1; then
        echo "✅ Ollama ready"
        break
    fi
    sleep 2
done

# Pull model
echo "📥 Pulling model (this takes 5-10 minutes)..."
docker exec localai-custom-ollama-1 ollama pull dolphin-llama3:8b

IP=$(curl -s ifconfig.me || curl -s icanhazip.com)
echo ""
echo "✅ LocalAI Custom deployed!"
echo "🌐 Access: http://$IP"
echo "👤 Admin: http://$IP/admin (login with admin email from .env)"
echo ""
echo "📊 Monitor: docker compose logs -f"
