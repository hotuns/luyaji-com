import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ShareTripClient from "./share-trip-client";

interface PageProps {
  params: Promise<{ tripId: string }>;
}

// 动态生成 OG Meta（用于微信分享预览）
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tripId } = await params;

  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId, visibility: "public" },
      include: {
        user: { select: { nickname: true } },
        catches: {
          take: 1,
          select: { photoUrls: true },
        },
      },
    });

    if (!trip) {
      return {
        title: "出击记录不存在 - 路亚记",
      };
    }

    const description = [
      `📍 ${trip.locationName}`,
      trip.totalCatchCount ? `🐟 收获 ${trip.totalCatchCount} 条` : null,
      trip.fishSpeciesCount ? `🎯 ${trip.fishSpeciesCount} 种鱼` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    // 尝试获取渔获照片作为封面
    const catchPhotos = trip.catches[0]?.photoUrls;
    const imageUrl = Array.isArray(catchPhotos) && catchPhotos.length > 0
      ? (catchPhotos[0] as string)
      : undefined;

    const title = trip.title || `${trip.locationName}出击`;

    return {
      title: `${title} - ${trip.user?.nickname || "钓友"}的出击记录 | 路亚记`,
      description: description || `${trip.user?.nickname || "钓友"}分享的路亚出击记录`,
      openGraph: {
        title: title,
        description: description || "路亚出击记录分享",
        type: "article",
        images: imageUrl ? [{ url: imageUrl, width: 800, height: 600 }] : [],
      },
    };
  } catch {
    return {
      title: "出击记录 - 路亚记",
    };
  }
}

export default async function ShareTripPage({ params }: PageProps) {
  const { tripId } = await params;

  // 服务端预检查出击记录是否存在且公开
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, visibility: true },
  });

  if (!trip || trip.visibility !== "public") {
    notFound();
  }

  return <ShareTripClient tripId={tripId} />;
}
