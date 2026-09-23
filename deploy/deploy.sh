#!/usr/bin/env bash
# ============================================================
# 建筑构造交互教材 — 腾讯云一键部署脚本
#
# 在【服务器上】以 root 执行（Ubuntu/Debian）：
#   sudo DOMAIN=example.com bash deploy/deploy.sh
#
# 前提：
#   - 服务器已装 git、Node ≥ 20（用于构建）、rsync
#   - 若已在本地构建好 dist/ 并上传，可设 SKIP_BUILD=1 跳过构建
#
# 环境变量：
#   DOMAIN      域名（默认 example.com）
#   WEB_ROOT    站点根目录（默认 /var/www/building-node）
#   APP_DIR     源码目录（默认 /opt/building-node）
#   REPO        Git 仓库地址（默认本项目仓库）
#   SKIP_BUILD  置 1 时跳过 git pull + npm 构建，直接部署已有 dist/
# ============================================================
set -euo pipefail

DOMAIN="${DOMAIN:-example.com}"
WEB_ROOT="${WEB_ROOT:-/var/www/building-node}"
APP_DIR="${APP_DIR:-/opt/building-node}"
REPO="${REPO:-https://github.com/yibaoqianlefei/tcugz.git}"
SKIP_BUILD="${SKIP_BUILD:-0}"

echo "==> [1/5] 安装 nginx（如未安装）"
if ! command -v nginx >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y nginx rsync git
fi

if [ "$SKIP_BUILD" = "1" ]; then
  echo "==> [2/5] 跳过构建（SKIP_BUILD=1），使用已有 dist/"
  [ -d "$APP_DIR/dist" ] || { echo "错误：$APP_DIR/dist 不存在"; exit 1; }
else
  echo "==> [2/5] 拉取源码"
  if [ ! -d "$APP_DIR/.git" ]; then
    git clone "$REPO" "$APP_DIR"
  fi
  cd "$APP_DIR"
  git pull --ff-only

  echo "==> [3/5] 安装依赖并构建（base 默认 /，产物在 dist/）"
  npm ci
  npm run build
fi

echo "==> [4/5] 部署到站点根目录 $WEB_ROOT"
mkdir -p "$WEB_ROOT"
rsync -a --delete "$APP_DIR/dist/" "$WEB_ROOT/"

echo "==> [5/5] 写入 nginx 配置并重载"
sed "s/example.com/$DOMAIN/g" "$APP_DIR/deploy/nginx.conf" \
  > /etc/nginx/sites-available/building-node
ln -sf /etc/nginx/sites-available/building-node \
      /etc/nginx/sites-enabled/building-node

nginx -t
systemctl reload nginx

echo ""
echo "✅ 部署完成：http://$DOMAIN"
echo "   后续配 HTTPS：下载腾讯云 SSL 证书 → 取消 deploy/nginx.conf 里 HTTPS 块注释 → 重跑本脚本"
