#!/usr/bin/env bash
# One-shot installer for the HomeWizard Energy Dashboard (Docker).
# Run from the repo root:  ./install.sh
set -euo pipefail

cd "$(dirname "$0")"

echo "▶ HomeWizard Energy Dashboard installer"

# 1. Check Docker.
if ! command -v docker >/dev/null 2>&1; then
  echo "✗ Docker is not installed. Install Docker first: https://docs.docker.com/get-docker/"
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "✗ 'docker compose' plugin not found. Install Docker Compose v2."
  exit 1
fi

# 2. Prepare backend .env.
ENV_FILE="backend/.env"
if [ ! -f "$ENV_FILE" ]; then
  cp backend/.env.example "$ENV_FILE"
  echo "✔ Created $ENV_FILE from template."

  read -rp "P1 meter IP [192.168.0.157]: " p1ip
  read -rp "P1 bearer token: " p1token
  read -rp "EMS URL [http://192.168.0.122/api/ems/measurements]: " emsurl

  [ -n "${p1ip:-}" ]    && sed -i.bak "s|^P1_IP=.*|P1_IP=${p1ip}|"        "$ENV_FILE"
  [ -n "${p1token:-}" ] && sed -i.bak "s|^P1_TOKEN=.*|P1_TOKEN=${p1token}|" "$ENV_FILE"
  [ -n "${emsurl:-}" ]  && sed -i.bak "s|^EMS_URL=.*|EMS_URL=${emsurl}|"   "$ENV_FILE"
  rm -f "${ENV_FILE}.bak"
  echo "✔ Configured $ENV_FILE. Edit PLUG_IPS / prices there if needed."
else
  echo "✔ Using existing $ENV_FILE."
fi

# 3. Persistent data directory.
mkdir -p data

# 4. Build and start.
echo "▶ Building and starting containers..."
docker compose up -d --build

echo ""
echo "✅ Done. Dashboard: http://localhost:8080"
echo "   API health:     http://localhost:8080/api/health"
echo "   Logs:           docker compose logs -f"
