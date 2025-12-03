import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  const { id } = await context.params;

  const source = await prisma.rod.findUnique({ where: { id } });

  if (!source || source.visibility !== "public" || source.userId === userId) {
    return NextResponse.json(
      { success: false, error: "装备不存在或不可复制" },
      { status: 404 },
    );
  }

  const created = await prisma.rod.create({
    data: {
      userId,
      name: source.name,
      brand: source.brand,
      length: source.length,
      lengthUnit: source.lengthUnit,
      power: source.power,
      lureWeightMin: source.lureWeightMin,
      lureWeightMax: source.lureWeightMax,
      lineWeightText: source.lineWeightText,
      note: source.note,
      visibility: "private",
      sourceType: "copied",
    },
  });

  return NextResponse.json({ success: true, data: created });
}
