import { prisma } from "@/lib/prisma";
import { MetadataTabs, type MetadataItem } from "./metadata-tabs";
import { PendingBrandPanel } from "./pending-brand-panel";

// 预定义的分类信息
const CATEGORY_INFO: Record<string, { label: string; description: string }> = {
  rod_brand: { label: "鱼竿品牌", description: "应用于用户/模板鱼竿的品牌选择，并支持别名" },
  reel_brand: { label: "渔轮品牌", description: "应用于渔轮品牌选择，常见别名可在此维护" },
  rod_power: { label: "鱼竿硬度", description: "鱼竿硬度/硬度枚举" },
  combo_scene_tag: { label: "组合场景标签", description: "组合/广场中的场景标签，新旧别名统一后统计更准确" },
  length_unit: { label: "长度单位", description: "鱼竿长度单位（米 / 英尺等）" },
  weather_type: { label: "天气类型", description: "出击记录中的天气类型，如晴 / 多云 / 大雨等" },
};

export default async function MetadataPage() {
  const metadataRaw = await prisma.metadata.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
  });

  const metadata: MetadataItem[] = metadataRaw.map((item) => ({
    ...item,
    aliases: Array.isArray(item.aliases)
      ? item.aliases.filter((alias): alias is string => typeof alias === "string")
      : null,
  }));

  // 按分类分组
  const groupedData = metadata.reduce<Record<string, typeof metadata>>(
    (acc, item) => {
      const list = acc[item.category] ?? [];
      list.push(item);
      acc[item.category] = list;
      return acc;
    },
    {}
  );

  // 获取所有分类（包括预定义的和数据库中存在的）
  const allCategories = Array.from(
    new Set([...Object.keys(CATEGORY_INFO), ...Object.keys(groupedData)])
  );

  const categories = allCategories.map((key) => ({
    key,
    label: CATEGORY_INFO[key]?.label || key,
    description: CATEGORY_INFO[key]?.description || "",
    count: groupedData[key]?.length || 0,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>元数据管理</h1>
        <p style={{ color: "#888" }}>
          管理系统中的枚举数据，如品牌、标签、硬度等可选项
        </p>
      </div>

      <PendingBrandPanel metadata={metadata} />

      <MetadataTabs
        categories={categories}
        data={groupedData}
        categoryInfo={CATEGORY_INFO}
      />
    </div>
  );
}
