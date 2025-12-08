apps/web/prisma/schema.prisma (lines 16-97) 定义了以手机号/短信登录为核心的用户体系（User、Account、Session、SmsVerification），账号与各业务实体（装备、出击、渔获等）存在一对多关联，保证后续查询时都能通过 userId 快速定位。
apps/web/prisma/schema.prisma (lines 101-197) 是装备域模型：Rod/ Reel 保存品牌、规格、可见性等信息，Combo 把竿轮与附属信息整合成使用组合，并通过 sourceType、visibility 区分自建、模板和公开程度；ComboLike 记录点赞。
apps/web/prisma/schema.prisma (lines 201-242) 描述出击记录 Trip 以及 Trip 与 Combo 的多对多关联（TripCombo），Trip 上冗余了地点、天气、渔获统计等字段，方便做时间/地点维度的筛选。
apps/web/prisma/schema.prisma (lines 244-293) 涵盖渔获域：FishSpecies 是系统级鱼种字典，Catch 记录某次出击的具体渔获，冗余保存 speciesName、lureText 等信息以便快照和统计。
apps/web/prisma/schema.prisma (lines 297-387) 还包含公告、短链接、埋点 (PageView)、活跃度 (UserActivity)、每日统计 (DailyStat) 等辅助业务表，支撑后台分析与分享。
apps/web/prisma/schema.prisma (lines 391-405) 定义了 Metadata 通用元数据表，可按 category 存放品牌、场景标签等枚举，利用 value/label/extra 和排序控制统一字典；未来所有需要标准化的枚举（如 rod_brand、reel_brand）都可以通过该表来驱动 UI 和校验逻辑。
总的来说，项目采用 Next.js + Prisma 的多应用（web/admin）结构，核心数据模型围绕用户、装备、出击、渔获构建，Metadata 提供统一的枚举/选项来源，方便后续将自由文本逐步转成结构化引用。

## Metadata 接入计划（Step 1：梳理字段）

| 业务域 | 现有字段 | 计划引入的 Metadata 分类 | 备注 |
| --- | --- | --- | --- |
| Rod | `brand` | `rod_brand` | 新增 `brandMetadataId` 外键，保留 `brand` 文本用于历史数据/展示 |
| Rod | `power`, `lengthUnit` | `rod_power`, `length_unit` | 统一枚举，用于表单选择与校验 |
| Reel | `brand` | `reel_brand` | 新增 `brandMetadataId` 外键，兼容自定义品牌 |
| Combo | `sceneTags` | `combo_scene_tag` | 将 Json 数组改为 metadata id 列表，方便检索与聚合（旧 `scene_tag` 分类已废弃） |
| Trip | `weatherType` | `weather_type` | 编写 metadata 以标准化天气枚举 |
| Catch | `lureText`（可选） | `lure_type` | 后续可扩展，用于常见假饵分类 |

后续步骤：
1. 更新 Prisma schema：为上述字段新增 `…MetadataId`（或数组）、完善索引，保留原文本字段作为冗余。
2. 扩充 `seedMetadata`：为常见品牌/天气/场景写入初始数据、保留 alias 信息。
3. 前端 & API 表单改为使用 metadata id；提交时若找不到选项则发起新 metadata 创建流程。
4. 撰写迁移脚本：遍历已有记录，按归一化规则（去大小写/空格）匹配 metadata；无法匹配时自动创建 pending metadata，待后台审核。

## Step 2：Schema / Seed 调整与迁移策略

- Prisma Schema（apps/web/prisma/schema.prisma）
  - `Rod`：新增 `brandMetadataId`、`powerMetadataId`、`lengthUnitMetadataId` 以及对应 relation/index，支持填写 metadata id。
  - `Reel`：新增 `brandMetadataId`。
  - `Trip`：新增 `weatherMetadataId`。
  - `Combo`：新增 `sceneMetadata` 关系，并建立 `ComboSceneMetadata` 表用于 `comboId` ↔ `metadataId` 的多对多映射，后续可逐步废弃旧 `sceneTags` Json。
  - `Metadata`：新增 `aliases Json?`，用于维护品牌昵称/中文别名，方便匹配历史数据。
- Metadata Seed（apps/web/prisma/seed.ts）
  - 重构为 `withCategory` 辅助函数，集中维护 rod/reel 品牌、场景标签、硬度、长度单位、天气枚举，所有项支持可选 `aliases`。
  - 场景标签仅保留 `combo_scene_tag` 分类，并新增 `length_unit`、`weather_type`。

### 迁移脚本草案

1. **拉取 metadata**：启动脚本时读取所有 `metadata`，并基于 `value` 与 `aliases` 构建字典（统一小写/去空格）。
2. **Rod / Reel**
   - 遍历各自表，将 `brand` 文本归一化后在字典中查找。
   - 若命中则更新 `brandMetadataId`；未命中时创建新的 metadata（`isActive=false` 或 `sortOrder=999`），并写回 `brandMetadataId`。
   - `Rod` 额外匹配 `power`、`lengthUnit`。
3. **Trip**
   - 根据 `weatherType` 匹配 `weather_type` metadata，并写回 `weatherMetadataId`。
4. **Combo 场景标签**
   - 将 `sceneTags`（string[]）展开，逐条匹配 `combo_scene_tag` metadata。
   - 使用 `upsert` 写入 `ComboSceneMetadata`（避免重复），`scene_tag` 分类及旧条目已移除。
5. **报告**：脚本输出未能匹配的文本，方便管理员补录 metadata 或修复拼写。

执行顺序建议：先跑一次 dry-run（仅打印拟更新的数量/异常项），确认无误后再真正写入数据库。

> 实现：`apps/web/prisma/migrate-metadata.ts`，通过 `pnpm metadata:migrate`（dry-run）或 `pnpm metadata:migrate -- --apply`（写入数据库）执行。脚本会：
> - 构建 `metadata` 字典（含 aliases），将 Rod/Reel/Trip 的品牌/硬度/长度单位/天气引用到对应 metadata。
> - 把 Combo 的 `sceneTags` 映射到 `ComboSceneMetadata` 关联表。
> - 输出未匹配的文案，以便补充 metadata 或再次迁移。

### 清理旧 `scene_tag` 数据

- 脚本：`apps/web/prisma/cleanup-legacy-scene-tags.ts`
- 用法：`pnpm metadata:cleanup`（dry-run 查看遗留记录）或 `pnpm metadata:cleanup -- --apply`（直接删除 `metadata` 表中 `category = scene_tag` 的条目）。
- 执行前可用 `SELECT * FROM metadata WHERE category='scene_tag'` 备份；脚本仅删除旧分类，不会改动 Combo 表的 `sceneTags` Json 字段。
