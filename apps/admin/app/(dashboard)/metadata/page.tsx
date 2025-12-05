import { prisma } from "@/lib/prisma";
import { MetadataTabs } from "./metadata-tabs";

// 预定义的分类信息
const CATEGORY_INFO: Record<string, { label: string; description: string }> = {
  rod_brand: { label: "鱼竿品牌", description: "用于鱼竿表单的品牌下拉选择" },
  reel_brand: { label: "渔轮品牌", description: "用于渔轮表单的品牌下拉选择" },
  scene_tag: { label: "场景标签", description: "用于组合的场景分类" },
  rod_power: { label: "鱼竿调性", description: "鱼竿硬度/调性选项" },
};

export default async function MetadataPage() {
  const metadata = await prisma.metadata.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
  });

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
          管理系统中的枚举数据，如品牌、标签、调性等可选项
        </p>
      </div>

      <MetadataTabs
        categories={categories}
        data={groupedData}
        categoryInfo={CATEGORY_INFO}
      />
    </div>
  );
}
