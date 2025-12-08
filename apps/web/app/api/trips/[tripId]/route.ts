import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteOssFiles } from "@/lib/oss";
import { Prisma } from "@prisma/client";
import { getTripDetail } from "@/lib/trip-detail";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getMetadataRecord } from "@/lib/server/metadata-utils";

// 预处理：将 null 转换为 undefined
const nullToUndefined = <T>(val: T | null | undefined): T | undefined => 
  val === null ? undefined : val;

const updateTripSchema = z.object({
  title: z.preprocess(nullToUndefined, z.string().max(50).optional()),
  startTime: z.preprocess(nullToUndefined, z.string().optional()),
  endTime: z.preprocess(nullToUndefined, z.string().nullable().optional()),
  note: z.preprocess(nullToUndefined, z.string().optional()),
  spotId: z.preprocess(
    nullToUndefined,
    z.union([z.string().uuid(), z.null()]).optional()
  ),
  visibility: z.preprocess(nullToUndefined, z.enum(["private", "public"]).optional()),
  weather: z.preprocess(
    nullToUndefined,
    z.object({
      type: z.preprocess(nullToUndefined, z.string().optional()),
      metadataId: z.preprocess(
        nullToUndefined,
        z.union([z.string().uuid(), z.null()]).optional()
      ),
      temperatureText: z.preprocess(nullToUndefined, z.string().optional()),
      windText: z.preprocess(nullToUndefined, z.string().optional()),
    }).optional()
  ),
  usedComboIds: z.preprocess(nullToUndefined, z.array(z.string()).min(1).optional()),
  catches: z.preprocess(
    nullToUndefined,
    z.array(
      z.object({
        speciesId: z.string(),
        count: z.number().min(1),
        sizeText: z.preprocess(nullToUndefined, z.string().optional()),
        comboId: z.preprocess(nullToUndefined, z.string().optional()),
        lureText: z.preprocess(nullToUndefined, z.string().optional()),
        note: z.preprocess(nullToUndefined, z.string().optional()),
        caughtAt: z.preprocess(nullToUndefined, z.string().optional()),
        photoUrls: z.preprocess(nullToUndefined, z.array(z.string()).optional()),
      })
    ).optional()
  ),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const detail = await getTripDetail(session.user.id, tripId);
    if (!detail) {
      return NextResponse.json({ success: false, error: "记录不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    console.error("获取出击详情失败:", error);
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }
    
    const userId = session.user.id;

    const existing = await prisma.trip.findFirst({
      where: { id: tripId, userId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "记录不存在" }, { status: 404 });
    }

    const json = await request.json();
    const payload = updateTripSchema.parse(json);

    let comboIds: string[] | undefined;
    if (payload.usedComboIds) {
      const combos = await prisma.combo.findMany({
        where: { id: { in: payload.usedComboIds }, userId: session.user.id },
        select: { id: true },
      });

      if (combos.length !== payload.usedComboIds.length) {
        return NextResponse.json({ success: false, error: "存在无效的组合" }, { status: 400 });
      }

      comboIds = payload.usedComboIds;
    }

    const updateData: Prisma.TripUpdateInput = {};

    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.note !== undefined) updateData.note = payload.note;
    if (payload.visibility !== undefined) updateData.visibility = payload.visibility;
    if (payload.startTime) updateData.startTime = new Date(payload.startTime);
    if (payload.endTime !== undefined) {
      updateData.endTime = payload.endTime ? new Date(payload.endTime) : null;
    }
    if (payload.spotId !== undefined) {
      if (payload.spotId === null) {
        updateData.spot = { disconnect: true };
      } else {
        const spot = await prisma.fishingSpot.findFirst({
          where: { id: payload.spotId, userId },
        });
        if (!spot) {
          return NextResponse.json(
            { success: false, error: "钓点已失效，请刷新后重试" },
            { status: 400 }
          );
        }
        updateData.spot = { connect: { id: spot.id } };
      }
    }
    if (payload.weather) {
      let weatherTypeValue = payload.weather.type;
      if (payload.weather.metadataId) {
        const record = await getMetadataRecord(
          payload.weather.metadataId,
          "weather_type"
        );
        if (!record) {
          return NextResponse.json(
            { success: false, error: "所选天气类型已失效，请刷新后重试" },
            { status: 400 }
          );
        }
        updateData.weatherMetadata = { connect: { id: record.id } };
        weatherTypeValue = record.label || record.value || undefined;
      } else if (payload.weather.metadataId === null) {
        updateData.weatherMetadata = { disconnect: true };
      }

      if (weatherTypeValue !== undefined) {
        updateData.weatherType = weatherTypeValue;
      }
      if (payload.weather.temperatureText !== undefined) {
        updateData.weatherTemperatureText = payload.weather.temperatureText;
      }
      if (payload.weather.windText !== undefined) {
        updateData.weatherWindText = payload.weather.windText;
      }
    }

    // 如果更新了渔获，需要重新计算统计数据
    if (payload.catches) {
      updateData.totalCatchCount = payload.catches.reduce((sum, c) => sum + c.count, 0);
      updateData.fishSpeciesCount = new Set(payload.catches.map((c) => c.speciesId)).size;
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.trip.update({ where: { id: existing.id }, data: updateData });
      }

      if (comboIds) {
        await tx.tripCombo.deleteMany({ where: { tripId: existing.id } });
        await tx.tripCombo.createMany({
          data: comboIds.map((comboId) => ({ tripId: existing.id, comboId })),
        });
      }

      if (payload.catches) {
        // 获取鱼种名称映射
        const speciesIds = payload.catches.map((c) => c.speciesId);
        const speciesList = await tx.fishSpecies.findMany({
          where: { id: { in: speciesIds } },
        });
        const speciesMap = new Map(speciesList.map((s) => [s.id, s.name]));

        // 删除旧渔获
        await tx.catch.deleteMany({ where: { tripId: existing.id } });
        
        // 创建新渔获
        if (payload.catches.length > 0) {
          await tx.catch.createMany({
            data: payload.catches.map((c) => ({
              tripId: existing.id,
              userId: userId,
              speciesId: c.speciesId,
              speciesName: speciesMap.get(c.speciesId) || "未知",
              count: c.count,
              sizeText: c.sizeText,
              caughtAt: c.caughtAt ? new Date(c.caughtAt) : null,
              comboId: c.comboId,
              lureText: c.lureText,
              note: c.note,
              photoUrls: c.photoUrls,
            })),
          });
        }
      }
    });

    const detail = await getTripDetail(session.user.id, existing.id);
    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    console.error("更新出击详情失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message ?? "数据校验失败" },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const existing = await prisma.trip.findFirst({
      where: { id: tripId, userId: session.user.id },
      include: {
        catches: { select: { photoUrls: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "记录不存在" }, { status: 404 });
    }

    // 收集所有渔获的图片 URL 并删除
    const allPhotoUrls: string[] = [];
    for (const c of existing.catches) {
      if (c.photoUrls && Array.isArray(c.photoUrls)) {
        allPhotoUrls.push(...(c.photoUrls as string[]));
      }
    }
    if (allPhotoUrls.length > 0) {
      await deleteOssFiles(allPhotoUrls);
    }

    await prisma.trip.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除出击记录失败:", error);
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
