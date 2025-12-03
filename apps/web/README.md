# 路亚记 (LuyaJi) - Web 应用

> 面向路亚钓鱼爱好者的记录应用，记录出击、管理装备、积累图鉴

## 📖 项目简介

**路亚记** 是一款专为路亚钓鱼爱好者打造的 Web 应用（PWA），帮助钓友记录每一次出击、管理钓具装备、并积累个人渔获图鉴。

### 技术栈

- **框架**: Next.js 15 (App Router + Turbopack)
- **语言**: TypeScript
- **数据库**: MySQL + Prisma ORM
- **认证**: NextAuth v5 (Credentials Provider)
- **UI**: Tailwind CSS + shadcn/ui 组件库
- **地图**: Leaflet + React Leaflet
- **短信服务**: 阿里云 SMS
- **包管理**: pnpm (Monorepo)

---

## 🎯 核心功能

### 1. 用户认证

| 功能 | 说明 |
|------|------|
| 账号登录 | 支持手机号或昵称 + 密码登录 |
| 用户注册 | 创建新账号，密码使用 BCrypt 加密 |
| 会话管理 | 基于 JWT 的无状态会话 |

**相关页面**:
- `/auth/signin` - 登录页面
- `/auth/register` - 注册页面

---

### 2. 首页仪表盘

用户登录后的主页，展示个人钓鱼数据概览：

- **统计卡片**: 出击次数、总渔获数、解锁鱼种数
- **快捷操作**: 新建出击、管理装备
- **最近出击**: 展示最近 3 次出击记录摘要

---

### 3. 出击记录 (Trips)

记录每一次钓鱼出击的详细信息。

| 字段 | 说明 |
|------|------|
| 标题 | 出击标题（可选） |
| 时间 | 开始时间、结束时间 |
| 地点 | 地点名称 + GPS 坐标（经纬度） |
| 天气 | 天气类型、温度、风力描述 |
| 备注 | 总体备注 |
| 装备组合 | 关联使用的装备组合 |
| 渔获 | 记录捕获的鱼类 |

**相关页面**:
- `/trips` - 出击列表
- `/trips/new` - 新建出击
- `/trips/[tripId]` - 出击详情
- `/trips/map` - 地图视图（展示所有出击点位）

**地图功能**:
- 使用 Leaflet 展示所有出击地点
- 自定义标记图标，根据渔获数量调整大小和颜色
- 点击标记查看出击详情

---

### 4. 装备管理 (Gear)

统一管理钓鱼装备，支持三类装备：

#### 4.1 鱼竿 (Rod)
| 字段 | 说明 |
|------|------|
| 名称 | 用户自定义名称（必填） |
| 品牌 | 品牌名称 |
| 长度 | 长度数值 + 单位（米/英尺） |
| 硬度 | UL/L/ML/M/MH/H |
| 饵重范围 | 适用饵重下限/上限（克） |
| 线号 | 适用线号描述 |

#### 4.2 渔轮 (Reel)
| 字段 | 说明 |
|------|------|
| 名称 | 用户自定义名称（必填） |
| 品牌 | 品牌名称 |
| 型号 | 2500, 3000 等 |
| 速比 | 齿轮速比描述 |
| 线容量 | 线容量描述 |

#### 4.3 装备组合 (Combo)
| 字段 | 说明 |
|------|------|
| 名称 | 组合名称 |
| 鱼竿 | 关联的鱼竿 |
| 渔轮 | 关联的渔轮 |
| 主线 | 主线描述 |
| 子线 | 子线描述 |
| 钩类 | 钩类描述 |
| 常用假饵 | 假饵列表 |
| 适用场景 | 场景标签 |

**相关页面**:
- `/gear` - 装备管理面板

---

### 5. 渔获图鉴 (Dex)

类似游戏图鉴系统，记录并展示用户捕获过的鱼种。

**功能特点**:
- 展示所有系统内置的鱼种
- 已解锁的鱼种显示详情（首次/最近捕获时间、总捕获数）
- 未解锁的鱼种以锁定状态展示
- 统计解锁进度

**图鉴摘要**:
- 总鱼种数
- 已解锁鱼种数
- 总渔获数量

**相关页面**:
- `/dex` - 渔获图鉴

---

### 6. 个人中心 (Profile)

展示用户个人信息和统计数据。

**功能**:
- 用户头像和昵称编辑
- 手机号展示（脱敏处理）
- 注册时间
- 统计数据：出击次数、总渔获、解锁鱼种
- 装备数量统计：竿/轮/组合
- 最近出击信息
- 退出登录

**相关页面**:
- `/profile` - 个人中心

---

## 🗂️ 数据模型

### 用户相关
- `User` - 用户表
- `Account` - NextAuth 账户关联
- `Session` - 会话管理
- `SmsVerification` - 短信验证码（预留）

### 装备相关
- `Rod` - 鱼竿
- `Reel` - 渔轮
- `Combo` - 装备组合

### 出击与渔获
- `Trip` - 出击记录
- `TripCombo` - 出击与组合关联
- `FishSpecies` - 鱼种数据库（系统级）
- `Catch` - 渔获条目

---

## 📱 响应式设计

应用采用移动优先设计，支持：

- **移动端**: 底部导航栏 (BottomNav)
- **桌面端**: 顶部导航栏 (TopNav)
- **PWA 支持**: 可安装为桌面应用

导航项目：
1. 🏠 首页
2. 📍 出击
3. 🎒 装备
4. 📖 图鉴
5. 👤 我的

---

## 🔌 API 路由

| 路径 | 说明 |
|------|------|
| `/api/auth/*` | 认证相关（NextAuth） |
| `/api/trips/*` | 出击记录 CRUD |
| `/api/rods/*` | 鱼竿管理 |
| `/api/reels/*` | 渔轮管理 |
| `/api/combos/*` | 装备组合管理 |
| `/api/dex/*` | 图鉴数据 |
| `/api/fish-species/*` | 鱼种查询 |
| `/api/profile/*` | 用户资料 |
| `/api/gear-library/*` | 装备库 |

---

## 🚀 开发指南

### 环境变量

创建 `.env` 文件并配置：

```env
DATABASE_URL="mysql://user:password@localhost:3306/luyaji"
AUTH_SECRET="your-auth-secret"
# 阿里云短信（可选）
ALIBABA_CLOUD_ACCESS_KEY_ID=""
ALIBABA_CLOUD_ACCESS_KEY_SECRET=""
```

### 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 生成 Prisma Client
pnpm db:generate

# 推送数据库 Schema
pnpm db:push

# 数据库种子
pnpm db:seed

# Prisma Studio（数据库可视化）
pnpm db:studio

# 构建
pnpm build

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint
```

---

## 📦 项目结构

```
apps/web/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   ├── auth/              # 认证页面
│   ├── dex/               # 图鉴页面
│   ├── gear/              # 装备管理页面
│   ├── profile/           # 个人中心页面
│   ├── trips/             # 出击记录页面
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # 可复用组件
│   ├── map/              # 地图相关组件
│   ├── bottom-nav.tsx    # 移动端底部导航
│   ├── responsive-nav.tsx # 响应式导航
│   └── providers.tsx     # Context Providers
├── lib/                   # 工具库
│   ├── auth.ts           # NextAuth 配置
│   ├── prisma.ts         # Prisma Client
│   ├── dex.ts            # 图鉴数据聚合
│   ├── profile.ts        # 用户资料
│   └── ...
├── prisma/               # Prisma 相关
│   ├── schema.prisma     # 数据模型定义
│   ├── seed.ts           # 种子数据
│   └── migrations/       # 数据库迁移
└── public/               # 静态资源
    └── manifest.json     # PWA 清单
```

---

## 📄 许可证

私有项目，保留所有权利。
