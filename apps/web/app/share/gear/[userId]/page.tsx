import { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import ShareGearClient from "./share-gear-client";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;

  try {
    const [user, comboCount, rodCount, reelCount, featuredCombo] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          nickname: true,
          bio: true,
        },
      }),
      prisma.combo.count({ where: { userId, visibility: "public" } }),
      prisma.rod.count({ where: { userId, visibility: "public" } }),
      prisma.reel.count({ where: { userId, visibility: "public" } }),
      prisma.combo.findFirst({
        where: { userId, visibility: "public" },
        orderBy: [
          { likeCount: "desc" },
          { updatedAt: "desc" },
        ],
        select: { name: true, photoUrls: true },
      }),
    ]);

    if (!user) {
      return {
        title: "装备库不存在 - 路亚记",
      };
    }

    const displayName = user.nickname || "钓友";
    const comboName = featuredCombo?.name || "装备库";
    const descriptionParts = [
      comboCount ? `${comboCount} 套组合` : null,
      rodCount ? `${rodCount} 根鱼竿` : null,
      reelCount ? `${reelCount} 个渔轮` : null,
    ].filter(Boolean);

    const heroPhoto =
      Array.isArray(featuredCombo?.photoUrls) && featuredCombo?.photoUrls.length
        ? (featuredCombo?.photoUrls[0] as string)
        : undefined;

    return {
      title: `${displayName}的装备库 | 路亚记`,
      description:
        descriptionParts.length > 0
          ? `公开了 ${descriptionParts.join(" · ")}`
          : user.bio || "路亚装备分享",
      openGraph: {
        title: `${displayName}的装备库`,
        description:
          descriptionParts.length > 0
            ? `公开了 ${descriptionParts.join(" · ")}`
            : undefined,
        type: "profile",
        images: heroPhoto ? [{ url: heroPhoto }] : [],
      },
    };
  } catch {
    return {
      title: "装备库 - 路亚记",
      description: "查看钓友公开的装备库",
    };
  }
}

export default async function ShareGearPage({ params }: PageProps) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    notFound();
  }

  return <ShareGearClient userId={userId} />;
}
