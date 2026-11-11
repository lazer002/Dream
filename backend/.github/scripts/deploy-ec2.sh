#!/bin/bash

set -euo pipefail

APP_DIR="/home/ubuntu/projects/UrbanZoro"
PM2_APP_NAME="ecommerce-api"

echo "======================================"
echo "STARTING EC2 DEPLOYMENT"
echo "======================================"

echo "Application directory:"
echo "$APP_DIR"

echo "======================================"
echo "FIXING REPOSITORY OWNERSHIP"
echo "======================================"

chown -R ubuntu:ubuntu "$APP_DIR"

echo "Repository ownership fixed."

echo "======================================"
echo "RUNNING DEPLOYMENT AS UBUNTU"
echo "======================================"

sudo -u ubuntu -H env \
  HOME=/home/ubuntu \
  USER=ubuntu \
  LOGNAME=ubuntu \
  PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
  bash -c '

set -euo pipefail

APP_DIR="/home/ubuntu/projects/UrbanZoro"
PM2_APP_NAME="ecommerce-api"

echo "======================================"
echo "CONFIGURING SSH"
echo "======================================"

mkdir -p "$HOME/.ssh"

chmod 700 "$HOME/.ssh"

touch "$HOME/.ssh/known_hosts"

chmod 600 "$HOME/.ssh/known_hosts"

GITHUB_HOST_KEY="github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl"

if ! grep -qF "$GITHUB_HOST_KEY" "$HOME/.ssh/known_hosts"; then
  printf "%s\n" "$GITHUB_HOST_KEY" >> "$HOME/.ssh/known_hosts"
fi

echo "SSH configuration ready."

echo "======================================"
echo "CONFIGURING GIT"
echo "======================================"

git config --global --add safe.directory "$APP_DIR" || true

cd "$APP_DIR"

git remote set-url origin git@github.com:lazer002/UrbanZoro.git

echo "Git remote:"
git remote -v

echo "======================================"
echo "CURRENT COMMIT BEFORE DEPLOY"
echo "======================================"

git log -1 --oneline

echo "======================================"
echo "FETCHING LATEST MAIN"
echo "======================================"

git fetch origin main

echo "======================================"
echo "RESETTING TO ORIGIN/MAIN"
echo "======================================"

git reset --hard origin/main

echo "======================================"
echo "DEPLOYED COMMIT"
echo "======================================"

git log -1 --oneline

echo "======================================"
echo "INSTALLING DEPENDENCIES"
echo "======================================"

npm ci

echo "======================================"
echo "RESTARTING PM2"
echo "======================================"

pm2 restart "$PM2_APP_NAME"

echo "======================================"
echo "SAVING PM2 STATE"
echo "======================================"

pm2 save

echo "======================================"
echo "FINAL STATUS"
echo "======================================"

echo "Final commit:"
git log -1 --oneline

echo ""

echo "PM2 status:"
pm2 status

echo "======================================"
echo "DEPLOYMENT SUCCESSFUL"
echo "======================================"
'