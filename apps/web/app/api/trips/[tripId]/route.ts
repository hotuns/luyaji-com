import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getTripDetail } from "@/lib/trip-detail";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateTripSchema = z.object({
  title: z.string().max(50).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  locationName: z.string().min(1).max(100).optional(),
  note: z.string().optional(),
  weather: z
    .object({
      type: z.string().optional(),
      temperatureText: z.string().optional(),
      windText: z.string().optional(),
    })
    .optional(),
  usedComboIds: z.array(z.string()).min(1).optional(),
  catches: z
    .array(
      z.object({
        speciesId: z.string(),
        count: z.number().min(1),
        sizeText: z.string().optional(),
        comboId: z.string().optional(),
        lureText: z.string().optional(),
        note: z.string().optional(),
      })
    )
    .optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const detail = await getTripDetail(session.user.id, params.tripId);
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
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const existing = await prisma.trip.findFirst({
      where: { id: params.tripId, userId: session.user.id },
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
    if (payload.locationName !== undefined) updateData.locationName = payload.locationName;
    if (payload.note !== undefined) updateData.note = payload.note;
    if (payload.startTime) updateData.startTime = new Date(payload.startTime);
    if (payload.endTime) updateData.endTime = new Date(payload.endTime);
    if (payload.weather) {
      updateData.weatherType = payload.weather.type;
      updateData.weatherTemperatureText = payload.weather.temperatureText;
      updateData.weatherWindText = payload.weather.windText;
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
              userId: session.user.id!,
              speciesId: c.speciesId,
              speciesName: speciesMap.get(c.speciesId) || "未知",
              count: c.count,
              sizeText: c.sizeText,
              comboId: c.comboId,
              lureText: c.lureText,
              note: c.note,
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
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const existing = await prisma.trip.findFirst({
      where: { id: params.tripId, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "记录不存在" }, { status: 404 });
    }

    await prisma.trip.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除出击记录失败:", error);
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
