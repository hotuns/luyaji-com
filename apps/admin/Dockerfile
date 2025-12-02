# 基于 Node.js 20 Bookworm，使用 OpenSSL 3，与 Prisma 默认目标匹配
FROM node:20-bookworm AS runner

WORKDIR /app

# 设置生产环境
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 复制 standalone 输出（monorepo 结构）
COPY .next/standalone ./

# 复制静态文件到正确位置
COPY .next/static ./apps/admin/.next/static

# 复制 public（如果存在）
COPY public ./apps/admin/public

# 暴露端口
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 工作目录切换到 app 位置
WORKDIR /app/apps/admin

# 启动应用
CMD ["node", "server.js"]
