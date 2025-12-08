import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ComboEditClient } from "./combo-edit-client";

export default async function ComboEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const combo = await prisma.combo.findUnique({
    where: { id: id, userId: session.user.id },
    include: {
      rod: true,
      reel: true,
      sceneMetadata: {
        include: {
          metadata: { select: { id: true, label: true, value: true } },
        },
      },
    },
  });

  if (!combo) {
    redirect("/gear");
  }

  const rods = await prisma.rod.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const reels = await prisma.reel.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  // 转换为 Summary 类型
  const sceneMetadataIds =
    combo.sceneMetadata?.map((item) => item.metadataId).filter(Boolean) ?? [];
  const metadataLabels =
    combo.sceneMetadata
      ?.map((item) => item.metadata?.label ?? item.metadata?.value ?? null)
      .filter((item): item is string => Boolean(item)) ?? [];
  const fallbackSceneTags = Array.isArray(combo.sceneTags)
    ? (combo.sceneTags as unknown[])
        .map((tag) => (typeof tag === "string" ? tag : null))
        .filter((tag): tag is string => Boolean(tag))
    : [];
  const metadataLabelSet = new Set(metadataLabels);
  const customSceneTags = fallbackSceneTags.filter(
    (tag) => !metadataLabelSet.has(tag)
  );
  const displaySceneTags =
    metadataLabels.length > 0 || customSceneTags.length > 0
      ? [...metadataLabels, ...customSceneTags]
      : fallbackSceneTags;

  const comboSummary = {
    ...combo,
    rod: combo.rod,
    reel: combo.reel,
    visibility: combo.visibility as "private" | "public",
    photoUrls: Array.isArray(combo.photoUrls) ? (combo.photoUrls as string[]) : undefined,
    sceneTags: displaySceneTags,
    sceneMetadataIds,
    customSceneTags,
  };

  const rodSummaries = rods.map((r) => ({ 
    ...r, 
    visibility: r.visibility as "private" | "public",
    combosCount: 0 
  }));
  const reelSummaries = reels.map((r) => ({ 
    ...r, 
    visibility: r.visibility as "private" | "public",
    combosCount: 0 
  }));

  return (
    <ComboEditClient 
      initialData={comboSummary} 
      rods={rodSummaries} 
      reels={reelSummaries} 
    />
  );
}
