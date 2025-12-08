import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteOssFiles } from "@/lib/oss";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { resolveSceneMetadata } from "../helpers";

// 预处理：将 null 转换为 undefined
const nullToUndefined = <T>(val: T | null | undefined): T | undefined => 
  val === null ? undefined : val;

const updateComboSchema = z.object({
  name: z.preprocess(nullToUndefined, z.string().min(1).max(50).optional()),
  rodId: z.preprocess(nullToUndefined, z.string().optional()),
  reelId: z.preprocess(nullToUndefined, z.string().optional()),
  mainLineText: z.preprocess(nullToUndefined, z.string().optional()),
  leaderLineText: z.preprocess(nullToUndefined, z.string().optional()),
  hookText: z.preprocess(nullToUndefined, z.string().optional()),
  lures: z.preprocess(nullToUndefined, z.array(z.any()).optional()),
  sceneTags: z.preprocess(nullToUndefined, z.array(z.string()).optional()),
  sceneMetadataIds: z.preprocess(nullToUndefined, z.array(z.string()).optional()),
  detailNote: z.preprocess(nullToUndefined, z.string().optional()),
  visibility: z.preprocess(nullToUndefined, z.enum(["private", "public"]).optional()),
  photoUrls: z.preprocess(nullToUndefined, z.array(z.string()).optional()),
});

// 公共：获取单个组合详情（含竿/轮/线/钩信息）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ comboId: string }> },
) {
  try {
    const { comboId } = await params;

    const combo = await prisma.combo.findFirst({
      where: {
        id: comboId,
        visibility: "public",
      },
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
      return NextResponse.json(
        { success: false, error: "组合不存在或未公开" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: combo.id,
        name: combo.name,
        visibility: combo.visibility,
        detailNote: combo.detailNote,
        mainLineText: combo.mainLineText,
        leaderLineText: combo.leaderLineText,
        hookText: combo.hookText,
        lures: combo.lures,
        sceneTags: combo.sceneTags,
        photoUrls: combo.photoUrls,
        likeCount: combo.likeCount,
        createdAt: combo.createdAt,
        updatedAt: combo.updatedAt,
        rod: {
          id: combo.rod.id,
          name: combo.rod.name,
          brand: combo.rod.brand,
          length: combo.rod.length,
          lengthUnit: combo.rod.lengthUnit,
          power: combo.rod.power,
          lureWeightMin: combo.rod.lureWeightMin,
          lureWeightMax: combo.rod.lureWeightMax,
          lineWeightText: combo.rod.lineWeightText,
          note: combo.rod.note,
        },
        reel: {
          id: combo.reel.id,
          name: combo.reel.name,
          brand: combo.reel.brand,
          model: combo.reel.model,
          gearRatioText: combo.reel.gearRatioText,
          lineCapacityText: combo.reel.lineCapacityText,
          note: combo.reel.note,
        },
      },
    });
  } catch (error) {
    console.error("获取组合详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取失败" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ comboId: string }> }
) {
  try {
    const { comboId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const json = await request.json();
    const payload = updateComboSchema.parse(json);

    const existing = await prisma.combo.findFirst({
      where: { id: comboId, userId: session.user.id },
      include: {
        sceneMetadata: {
          include: {
            metadata: { select: { id: true, label: true, value: true } },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "组合不存在" }, { status: 404 });
    }

    const shouldUpdateMetadata = payload.sceneMetadataIds !== undefined;
    const shouldUpdateCustomTags = payload.sceneTags !== undefined;
    const sanitizedCustomTags =
      payload.sceneTags
        ?.map((tag) => tag.trim())
        .filter((tag) => tag.length > 0) ?? [];

    let metadataResult: Awaited<ReturnType<typeof resolveSceneMetadata>> | null =
      null;
    if (shouldUpdateMetadata) {
      metadataResult = await resolveSceneMetadata(payload.sceneMetadataIds);
      if (metadataResult instanceof NextResponse) {
        return metadataResult;
      }
    }

    const existingMetadataLabels =
      existing.sceneMetadata
        ?.map((item) => item.metadata?.label ?? item.metadata?.value ?? null)
        .filter((item): item is string => Boolean(item)) ?? [];
    const existingSceneTags = Array.isArray(existing.sceneTags)
      ? (existing.sceneTags as unknown[])
          .map((tag) => (typeof tag === "string" ? tag : null))
          .filter((tag): tag is string => Boolean(tag))
      : [];
    const existingCustomTags = existingSceneTags.filter(
      (tag) => !existingMetadataLabels.includes(tag)
    );

    const metadataLabelsForSceneTags = shouldUpdateMetadata
      ? metadataResult?.labels ?? []
      : existingMetadataLabels;
    const customTagsForSceneTags = shouldUpdateCustomTags
      ? sanitizedCustomTags
      : existingCustomTags;

    const updateData: Prisma.ComboUncheckedUpdateInput = {};

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.rodId !== undefined) updateData.rodId = payload.rodId;
    if (payload.reelId !== undefined) updateData.reelId = payload.reelId;
    if (payload.mainLineText !== undefined) updateData.mainLineText = payload.mainLineText;
    if (payload.leaderLineText !== undefined) updateData.leaderLineText = payload.leaderLineText;
    if (payload.hookText !== undefined) updateData.hookText = payload.hookText;
    if (payload.lures !== undefined) updateData.lures = payload.lures;
    if (payload.detailNote !== undefined) updateData.detailNote = payload.detailNote;
    if (payload.visibility !== undefined) updateData.visibility = payload.visibility;
    if (payload.photoUrls !== undefined) updateData.photoUrls = payload.photoUrls;

    if (shouldUpdateMetadata || shouldUpdateCustomTags) {
      const mergedTags = Array.from(
        new Set([...metadataLabelsForSceneTags, ...customTagsForSceneTags])
      );
      updateData.sceneTags = mergedTags;
    }

    const updatedCombo = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.combo.update({
          where: { id: existing.id },
          data: updateData,
        });
      }

      if (shouldUpdateMetadata && metadataResult) {
        await tx.comboSceneMetadata.deleteMany({
          where: { comboId: existing.id },
        });
        if (metadataResult.relations.length > 0) {
          await tx.comboSceneMetadata.createMany({
            data: metadataResult.relations.map((relation) => ({
              comboId: existing.id,
              metadataId: relation.metadataId,
            })),
          });
        }
      }

      return tx.combo.findUnique({
        where: { id: existing.id },
        include: {
          rod: { select: { id: true, name: true } },
          reel: { select: { id: true, name: true } },
          sceneMetadata: {
            include: {
              metadata: { select: { id: true, label: true, value: true } },
            },
          },
        },
      });
    });

    return NextResponse.json({ success: true, data: updatedCombo });
  } catch (error) {
    console.error("更新组合失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message ?? "数据验证失败" },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ comboId: string }> }
) {
  try {
    const { comboId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const existing = await prisma.combo.findFirst({
      where: { id: comboId, userId: session.user.id },
      select: { id: true, photoUrls: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "组合不存在" }, { status: 404 });
    }

    const tripCount = await prisma.tripCombo.count({
      where: { comboId: existing.id, trip: { userId: session.user.id } },
    });

    if (tripCount > 0) {
      return NextResponse.json(
        { success: false, error: "该组合已有出击记录，无法删除" },
        { status: 400 }
      );
    }

    // 删除 OSS 图片
    if (existing.photoUrls && Array.isArray(existing.photoUrls)) {
      await deleteOssFiles(existing.photoUrls as string[]);
    }

    await prisma.combo.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除组合失败:", error);
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
