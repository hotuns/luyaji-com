#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# docker-build.sh
# 构建 Docker 镜像并推送到 Docker Hub
# 用法:
#   ./scripts/docker-build.sh          # 构建并推送所有应用
#   ./scripts/docker-build.sh web      # 只构建并推送 web
#   ./scripts/docker-build.sh admin    # 只构建并推送 admin
# ============================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Docker Hub 用户名
DOCKER_USERNAME="hedongshu"

# 目标平台：linux/amd64（服务器架构）
PLATFORM="linux/amd64"

# 解析参数
TARGET="${1:-all}"

# ============================================================
# 构建 web
# ============================================================
build_web() {
  echo ""
  log_info "========== 构建 web =========="
  
  cd "$ROOT_DIR"
  log_info "编译 web 应用..."
  pnpm --filter web run build

  WEB_DIR="$ROOT_DIR/apps/web"
  if [ -d "$WEB_DIR/.next/standalone" ]; then
    log_info "web: standalone 目录已就绪"
  else
    log_error "web: 未找到 .next/standalone，请确认 next.config.mjs 中设置了 output: 'standalone'"
    exit 1
  fi

  log_info "构建 luyaji-web 镜像 (平台: $PLATFORM)..."
  docker build --platform "$PLATFORM" -t luyaji-web:latest "$WEB_DIR"

  log_info "打标签并推送 luyaji-web..."
  docker tag luyaji-web:latest ${DOCKER_USERNAME}/luyaji-web:latest
  docker push ${DOCKER_USERNAME}/luyaji-web:latest

  log_info "web 构建并推送完成 ✅"
}

# ============================================================
# 构建 admin
# ============================================================
build_admin() {
  echo ""
  log_info "========== 构建 admin =========="
  
  cd "$ROOT_DIR"
  log_info "编译 admin 应用..."
  pnpm --filter admin run build

  ADMIN_DIR="$ROOT_DIR/apps/admin"
  if [ -d "$ADMIN_DIR/.next/standalone" ]; then
    log_info "admin: standalone 目录已就绪"
  else
    log_error "admin: 未找到 .next/standalone，请确认 next.config.mjs 中设置了 output: 'standalone'"
    exit 1
  fi

  log_info "构建 luyaji-admin 镜像 (平台: $PLATFORM)..."
  docker build --platform "$PLATFORM" -t luyaji-admin:latest "$ADMIN_DIR"

  log_info "打标签并推送 luyaji-admin..."
  docker tag luyaji-admin:latest ${DOCKER_USERNAME}/luyaji-admin:latest
  docker push ${DOCKER_USERNAME}/luyaji-admin:latest

  log_info "admin 构建并推送完成 ✅"
}

# ============================================================
# 主逻辑
# ============================================================
case "$TARGET" in
  web)
    build_web
    ;;
  admin)
    build_admin
    ;;
  all)
    build_web
    build_admin
    ;;
  *)
    log_error "未知参数: $TARGET"
    echo "用法: $0 [web|admin|all]"
    exit 1
    ;;
esac

echo ""
log_info "========== 完成 =========="
echo ""
log_info "部署步骤："
echo ""
echo "  1. 在服务器拉取最新镜像:"
echo "     docker pull ${DOCKER_USERNAME}/luyaji-web:latest"
echo "     docker pull ${DOCKER_USERNAME}/luyaji-admin:latest"
echo ""
echo "  2. 重启服务:"
echo "     docker compose pull"
echo "     docker compose up -d"
echo ""
echo "  3. 查看状态:"
echo "     docker compose ps"
echo "     docker compose logs -f"
