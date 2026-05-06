#!/usr/bin/env bash
# Deploy Torque & Tension to IONOS VPS
# Usage: ./deploy.sh
# Run from the repo root on the server (or via SSH).
set -euo pipefail

APP_DIR="/var/www/torque-tension"
BRANCH="main"

echo "==> Pulling latest code..."
git pull origin "$BRANCH"

echo "==> Installing server dependencies..."
npm ci --workspace=server --omit=dev

echo "==> Installing client dependencies..."
npm ci --workspace=client

echo "==> Building client..."
npm run build -w client

echo "==> Syncing built files..."
rsync -a --delete client/dist/ "$APP_DIR/client/dist/"
rsync -a client/public/images/ "$APP_DIR/client/public/images/"

echo "==> Updating nginx config..."
sudo cp nginx.conf /etc/nginx/sites-enabled/pilates

echo "==> Restarting server with PM2..."
pm2 restart torque-tension 2>/dev/null || \
  pm2 start server/index.js --name torque-tension --cwd "$(pwd)"

echo "==> Testing nginx config..."
sudo nginx -t

echo "==> Reloading nginx..."
sudo systemctl reload nginx

echo ""
echo "Done! App is live at https://pilates.coupleswhobuildtogether.com"
