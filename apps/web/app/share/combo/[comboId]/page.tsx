import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ShareComboClient from "./share-combo-client";

interface PageProps {
  params: Promise<{ comboId: string }>;
}

// 动态生成 OG Meta（用于微信分享预览）
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { comboId } = await params;
  
  try {
    const combo = await prisma.combo.findUnique({
      where: { id: comboId, visibility: "public" },
      include: {
        rod: { select: { name: true } },
        reel: { select: { name: true } },
        user: { select: { nickname: true } },
      },
    });

    if (!combo) {
      return {
        title: "组合不存在 - 路亚记",
      };
    }

    const description = [
      combo.rod?.name && `🎣 ${combo.rod.name}`,
      combo.reel?.name && `⚙️ ${combo.reel.name}`,
      combo.mainLineText && `🧵 主线 ${combo.mainLineText}`,
    ]
      .filter(Boolean)
      .join(" | ");

    const photoUrls = Array.isArray(combo.photoUrls) ? combo.photoUrls as string[] : [];
    const imageUrl = photoUrls[0] || undefined;

    return {
      title: `${combo.name} - ${combo.user?.nickname || "钓友"}的装备组合 | 路亚记`,
      description: description || `${combo.user?.nickname || "钓友"}分享的路亚装备组合`,
      openGraph: {
        title: combo.name,
        description: description || "路亚装备组合分享",
        type: "article",
        images: imageUrl ? [{ url: imageUrl, width: 800, height: 600 }] : [],
      },
    };
  } catch {
    return {
      title: "装备组合 - 路亚记",
    };
  }
}

export default async function ShareComboPage({ params }: PageProps) {
  const { comboId } = await params;

  // 服务端预检查组合是否存在且公开
  const combo = await prisma.combo.findUnique({
    where: { id: comboId },
    select: { id: true, visibility: true },
  });

  if (!combo || combo.visibility !== "public") {
    notFound();
  }

  return <ShareComboClient comboId={comboId} />;
}
