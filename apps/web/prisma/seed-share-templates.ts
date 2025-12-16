"use strict";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedTemplate = {
  id: string;
  type: "trip" | "combo" | "dex" | "gear";
  name: string;
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  description: string;
  sortOrder: number;
  isActive?: boolean;
};

const templates: SeedTemplate[] = [
  {
    id: "combo-classic-1",
    type: "combo",
    name: "装备组合·经典",
    title: "我的路亚装备组合",
    subtitle: "招牌搭配分享",
    badgeLabel: "装备库",
    sortOrder: 1,
    description: "🎣 装备组合「{{title}}」\n{{description}}\n\n👉 点击查看详情：{{url}}",
  },
  {
    id: "combo-field-2",
    type: "combo",
    name: "装备组合·现场实战",
    title: "今日出战组合",
    subtitle: "实战体验分享",
    badgeLabel: "实战",
    sortOrder: 2,
    description: "⚔️ 今日出战组合：{{title}}\n{{description}}\n\n更多搭配思路：{{url}}",
  },
  {
    id: "combo-community-3",
    type: "combo",
    name: "装备组合·社群扩散",
    title: "钓友装备库",
    subtitle: "分享给朋友",
    badgeLabel: "推荐",
    sortOrder: 3,
    description: "🧰 {{authorName}} 的路亚装备 - {{title}}\n{{description}}\n\n#路亚记 {{url}}",
  },
  {
    id: "trip-record-1",
    type: "trip",
    name: "出击记录·标准",
    title: "我的出击记录",
    subtitle: "实时战报",
    badgeLabel: "出击",
    sortOrder: 1,
    description: "🐟 出击记录「{{title}}」\n{{description}}\n\n点击围观渔获：{{url}}",
  },
  {
    id: "trip-diary-2",
    type: "trip",
    name: "出击记录·日记",
    title: "作钓故事",
    subtitle: "记录生活",
    badgeLabel: "日记",
    sortOrder: 2,
    description:
      "🎣 {{authorName}} 的作钓日记《{{title}}》\n{{description}}\n\n更多细节都在这儿：{{url}}",
  },
  {
    id: "trip-highlight-3",
    type: "trip",
    name: "出击记录·精彩瞬间",
    title: "高光时刻",
    subtitle: "晒战绩",
    badgeLabel: "高光",
    sortOrder: 3,
    description: "💥 高光瞬间「{{title}}」\n{{description}}\n\n立即围观：{{url}}",
  },
  {
    id: "dex-progress-1",
    type: "dex",
    name: "图鉴·进度",
    title: "路亚图鉴进度",
    subtitle: "完成度",
    badgeLabel: "图鉴",
    sortOrder: 1,
    description: "📚 图鉴进度更新\n{{description}}\n\n一起点亮更多鱼种：{{url}}",
  },
  {
    id: "dex-collection-2",
    type: "dex",
    name: "图鉴·收集者",
    title: "鱼种收集",
    subtitle: "收藏家",
    badgeLabel: "收藏",
    sortOrder: 2,
    description: "🐡 {{authorName}} 的收藏册\n{{description}}\n\n快来看都抓到哪些鱼：{{url}}",
  },
  {
    id: "dex-challenge-3",
    type: "dex",
    name: "图鉴·挑战",
    title: "挑战进度",
    subtitle: "成就",
    badgeLabel: "挑战",
    sortOrder: 3,
    description: "🏆 图鉴挑战再下一城\n{{description}}\n\n下一条鱼等你来：{{url}}",
  },
  {
    id: "gear-showcase-1",
    type: "gear",
    name: "装备库·展示",
    title: "装备库展示",
    subtitle: "公开装备",
    badgeLabel: "装备库",
    sortOrder: 1,
    description: "🧰 我的装备库更新啦：{{title}}\n{{description}}\n\n欢迎围观：{{url}}",
  },
  {
    id: "gear-tour-2",
    type: "gear",
    name: "装备库·导览",
    title: "装备导览",
    subtitle: "欢迎参观",
    badgeLabel: "导览",
    sortOrder: 2,
    description: "✨ {{authorName}} 的装备导览\n{{description}}\n\n点击参观：{{url}}",
  },
  {
    id: "gear-battle-3",
    type: "gear",
    name: "装备库·战斗力",
    title: "战斗力清单",
    subtitle: "出战组合",
    badgeLabel: "战斗力",
    sortOrder: 3,
    description: "⚙️ 我正在用这些装备征战：{{title}}\n{{description}}\n\n作钓细节分享：{{url}}",
  },
];

async function main() {
  console.log("即将导入分享文案，共 %d 条：", templates.length);
  templates.forEach((tpl, index) => {
    console.log(
      `[${index + 1}] (${tpl.type}) ${tpl.name} => ${tpl.description.replace(/\s+/g, " ").slice(0, 80)}...`,
    );
  });

  for (const template of templates) {
    await prisma.shareTemplate.upsert({
      where: { id: template.id },
      update: {
        type: template.type,
        name: template.name,
        title: template.title,
        subtitle: template.subtitle,
        badgeLabel: template.badgeLabel,
        description: template.description,
        sortOrder: template.sortOrder,
        isActive: template.isActive ?? true,
      },
      create: {
        id: template.id,
        type: template.type,
        name: template.name,
        title: template.title,
        subtitle: template.subtitle,
        badgeLabel: template.badgeLabel,
        description: template.description,
        sortOrder: template.sortOrder,
        isActive: template.isActive ?? true,
      },
    });
  }

  console.log("分享文案导入完毕。");
}

main()
  .catch((error) => {
    console.error("导入分享文案失败:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
