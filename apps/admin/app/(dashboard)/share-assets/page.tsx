import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ShareAssetsManager } from "./share-assets-manager";

const normalizeJson = (value: Prisma.JsonValue | null) => {
  return value === null ? null : value;
};

const isMissingShareTableError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

async function fetchShareData() {
  try {
    const [templates, mediaAssets, ctas] = await Promise.all([
      prisma.shareTemplate.findMany({
        orderBy: [
          { sortOrder: "asc" },
          { updatedAt: "desc" },
        ],
      }),
      prisma.shareMediaAsset.findMany({
        orderBy: [
          { category: "asc" },
          { weight: "desc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.shareCta.findMany({
        orderBy: [{ createdAt: "desc" }],
      }),
    ]);

    return { templates, mediaAssets, ctas };
  } catch (error) {
    if (isMissingShareTableError(error)) {
      console.warn("[share-assets] share tables not found, returning empty data.");
      return { templates: [], mediaAssets: [], ctas: [] };
    }
    throw error;
  }
}

export default async function ShareAssetsPage() {
  const { templates, mediaAssets, ctas } = await fetchShareData();

  const templateData = templates.map((item) => ({
    ...item,
    config: normalizeJson(item.config),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  const assetData = mediaAssets.map((item) => ({
    ...item,
    metadata: normalizeJson(item.metadata),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  const ctaData = ctas.map((item) => ({
    ...item,
    startAt: item.startAt ? item.startAt.toISOString() : null,
    endAt: item.endAt ? item.endAt.toISOString() : null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>分享素材管理</h1>
        <p style={{ color: "#666" }}>配置分享页的文案、模板以及随机视觉素材，运营可在此快速迭代内容。</p>
      </div>

      <ShareAssetsManager
        initialTemplates={templateData}
        initialAssets={assetData}
        initialCtas={ctaData}
      />
    </div>
  );
}
