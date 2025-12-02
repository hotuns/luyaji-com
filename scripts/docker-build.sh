#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# docker-build.sh
# 构建 Docker 镜像并导出为 tar 文件，方便离线部署
# ============================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/dist-packages"

mkdir -p "$OUT_DIR"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================================
# 1. 构建应用
# ============================================================
echo ""
log_info "========== 构建应用 =========="

cd "$ROOT_DIR"

log_info "构建 web..."
pnpm turbo build --filter=web

log_info "构建 admin..."
pnpm turbo build --filter=admin

# ============================================================
# 2. 准备 Docker 构建上下文
# ============================================================
echo ""
log_info "========== 准备 Docker 构建上下文 =========="

# web
WEB_DIR="$ROOT_DIR/apps/web"
if [ -d "$WEB_DIR/.next/standalone" ]; then
  log_info "web: standalone 目录已就绪"
else
  log_error "web: 未找到 .next/standalone，请确认 next.config.mjs 中设置了 output: 'standalone'"
  exit 1
fi

# admin
ADMIN_DIR="$ROOT_DIR/apps/admin"
if [ -d "$ADMIN_DIR/.next/standalone" ]; then
  log_info "admin: standalone 目录已就绪"
else
  log_error "admin: 未找到 .next/standalone，请确认 next.config.mjs 中设置了 output: 'standalone'"
  exit 1
fi

# ============================================================
# 3. 构建 Docker 镜像
# ============================================================
echo ""
log_info "========== 构建 Docker 镜像 =========="

log_info "构建 luyaji-web 镜像..."
docker build -t luyaji-web:latest "$WEB_DIR"

log_info "构建 luyaji-admin 镜像..."
docker build -t luyaji-admin:latest "$ADMIN_DIR"

# ============================================================
# 4. 导出镜像为 tar 文件
# ============================================================
echo ""
log_info "========== 导出镜像 =========="

log_info "导出 luyaji-web..."
docker save luyaji-web:latest | gzip > "$OUT_DIR/luyaji-web.tar.gz"

log_info "导出 luyaji-admin..."
docker save luyaji-admin:latest | gzip > "$OUT_DIR/luyaji-admin.tar.gz"

# ============================================================
# 完成
# ============================================================
echo ""
log_info "========== 构建完成 =========="
ls -lh "$OUT_DIR"/*.tar.gz

echo ""
log_info "部署步骤："
echo ""
echo "  1. 上传到服务器:"
echo "     scp $OUT_DIR/luyaji-web.tar.gz hotuns@101.132.193.179:/home/hotuns/luyaji/"
echo "     scp $OUT_DIR/luyaji-admin.tar.gz hotuns@101.132.193.179:/home/hotuns/luyaji/"
echo "     scp $ROOT_DIR/docker-compose.yml hotuns@101.132.193.179:/home/hotuns/luyaji/"
echo ""
echo "  2. 在服务器加载镜像:"
echo "     sudo docker load -i /home/hotuns/luyaji/luyaji-web.tar.gz"
echo "     sudo docker load -i /home/hotuns/luyaji/luyaji-admin.tar.gz"
echo ""
echo "  3. 创建 .env 文件并启动:"
echo "     cp .env.production.example .env"
echo "     # 编辑 .env 填入真实配置"
echo "     docker compose up -d"
echo ""
echo "  4. 查看状态:"
echo "     docker compose ps"
echo "     docker compose logs -f"
