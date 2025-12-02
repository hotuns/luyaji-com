#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# package-build.sh
# 用于打包 web 和 admin 的构建产物，方便部署到服务器
# 使用 pnpm deploy 生成独立的、包含所有依赖的部署目录
# ============================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

WEB_DIR="$ROOT_DIR/apps/web"
ADMIN_DIR="$ROOT_DIR/apps/admin"

# 输出目录
OUT_DIR="$ROOT_DIR/dist-packages"
DEPLOY_DIR="$ROOT_DIR/.deploy-tmp"

mkdir -p "$OUT_DIR"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

package_app() {
  local APP_NAME="$1"
  local APP_DIR="$2"
  local TAR_NAME="$OUT_DIR/${APP_NAME}-build.tar.gz"
  local APP_DEPLOY_DIR="$DEPLOY_DIR/$APP_NAME"

  echo ""
  log_info "========== 打包 $APP_NAME =========="

  if [ ! -d "$APP_DIR" ]; then
    log_warn "目录不存在，跳过: $APP_DIR"
    return 0
  fi

  # 检查是否已构建
  if [ ! -d "$APP_DIR/.next" ]; then
    log_error "未找到 .next 目录: $APP_DIR/.next"
    log_error "请先执行构建: pnpm turbo build --filter=$APP_NAME"
    return 1
  fi

  # 清理旧的部署目录
  rm -rf "$APP_DEPLOY_DIR"
  mkdir -p "$APP_DEPLOY_DIR"

  log_info "使用 pnpm deploy 生成独立部署目录..."
  
  # 使用 pnpm deploy 生成包含所有依赖的独立目录
  # --legacy: pnpm v10+ 需要此标志来支持非注入式工作区
  (cd "$ROOT_DIR" && pnpm deploy --filter="$APP_NAME" --prod --legacy "$APP_DEPLOY_DIR")

  log_info "复制构建产物..."
  
  # 复制 .next 构建产物
  cp -r "$APP_DIR/.next" "$APP_DEPLOY_DIR/.next"
  
  # 复制 public（如果存在）
  [ -d "$APP_DIR/public" ] && cp -r "$APP_DIR/public" "$APP_DEPLOY_DIR/public"
  
  # 复制 prisma（如果存在）
  [ -d "$APP_DIR/prisma" ] && cp -r "$APP_DIR/prisma" "$APP_DEPLOY_DIR/prisma"
  
  # 复制配置文件
  [ -f "$APP_DIR/next.config.mjs" ] && cp "$APP_DIR/next.config.mjs" "$APP_DEPLOY_DIR/"
  [ -f "$APP_DIR/next.config.js" ] && cp "$APP_DIR/next.config.js" "$APP_DEPLOY_DIR/"
  
  # 复制 .env（如果存在）
  [ -f "$APP_DIR/.env" ] && cp "$APP_DIR/.env" "$APP_DEPLOY_DIR/"
  [ -f "$APP_DIR/.env.production" ] && cp "$APP_DIR/.env.production" "$APP_DEPLOY_DIR/"

  # 删除旧的包
  rm -f "$TAR_NAME"

  log_info "正在压缩..."
  
  # 打包
  (
    cd "$APP_DEPLOY_DIR"
    tar -czf "$TAR_NAME" \
      --exclude='*.map' \
      --exclude='.next/cache' \
      --exclude='node_modules/.cache' \
      .
  )

  # 清理临时目录
  rm -rf "$APP_DEPLOY_DIR"

  local SIZE
  SIZE=$(du -h "$TAR_NAME" | cut -f1)
  log_info "已生成: $TAR_NAME ($SIZE)"
}

# ============================================================
# 主流程
# ============================================================

echo ""
log_info "开始打包部署文件..."
log_info "根目录: $ROOT_DIR"
log_info "输出目录: $OUT_DIR"

# 打包 web
package_app "web" "$WEB_DIR"

# 打包 admin
package_app "admin" "$ADMIN_DIR"

echo ""
log_info "========== 打包完成 =========="
log_info "产物目录: $OUT_DIR"
ls -lh "$OUT_DIR"/*.tar.gz 2>/dev/null || true

echo ""
log_info "部署步骤："
echo ""
echo "  1. 上传到服务器:"
echo "     scp $OUT_DIR/web-build.tar.gz ubuntu@你的服务器IP:~/"
echo "     scp $OUT_DIR/admin-build.tar.gz ubuntu@你的服务器IP:~/"
echo ""
echo "  2. 在服务器解压:"
echo "     mkdir -p ~/luyaji-web && cd ~/luyaji-web && tar xzf ~/web-build.tar.gz"
echo "     mkdir -p ~/luyaji-admin && cd ~/luyaji-admin && tar xzf ~/admin-build.tar.gz"
echo ""
echo "  3. 启动服务（无需 pnpm install）:"
echo "     cd ~/luyaji-web && PORT=3001 NODE_ENV=production pm2 start npm --name web -- start"
echo "     cd ~/luyaji-admin && PORT=3002 NODE_ENV=production pm2 start npm --name admin -- start"
