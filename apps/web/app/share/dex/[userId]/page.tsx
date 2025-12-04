import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ShareDexClient from "./share-dex-client";

interface PageProps {
  params: Promise<{ userId: string }>;
}

// 动态生成 OG Meta（用于微信分享预览）
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { nickname: true },
    });

    if (!user) {
      return {
        title: "图鉴不存在 - 路亚记",
      };
    }

    // 获取解锁统计
    const [totalSpecies, unlockedSpecies] = await Promise.all([
      prisma.fishSpecies.count({ where: { isActive: true } }),
      prisma.catch.groupBy({
        by: ["speciesId"],
        where: { userId },
      }),
    ]);

    const nickname = user.nickname || "钓友";
    const unlockedCount = unlockedSpecies.length;
    const completionRate = totalSpecies > 0 ? Math.round((unlockedCount / totalSpecies) * 100) : 0;

    return {
      title: `${nickname}的路亚图鉴 | 路亚记`,
      description: `📚 已解锁 ${unlockedCount}/${totalSpecies} 种鱼 (${completionRate}%)`,
      openGraph: {
        title: `${nickname}的路亚图鉴`,
        description: `已解锁 ${unlockedCount}/${totalSpecies} 种鱼，完成度 ${completionRate}%`,
        type: "profile",
      },
    };
  } catch {
    return {
      title: "路亚图鉴 - 路亚记",
    };
  }
}

export default async function ShareDexPage({ params }: PageProps) {
  const { userId } = await params;

  // 服务端预检查用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    notFound();
  }

  return <ShareDexClient userId={userId} />;
}
