import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const isMissingTableError = (error: unknown) =>
	error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const type = searchParams.get("type");
	const takeParam = Number(searchParams.get("take"));
	const take = Number.isFinite(takeParam) ? Math.min(Math.max(takeParam, 1), 50) : 10;

	try {
		const templates = await prisma.shareTemplate.findMany({
			where: {
				isActive: true,
				...(type ? { type } : {}),
			},
			orderBy: [
				{ sortOrder: "asc" },
				{ updatedAt: "desc" },
			],
			take,
		});

		return NextResponse.json({ success: true, data: templates });
	} catch (error) {
		if (isMissingTableError(error)) {
			console.warn("[web/share/templates] table missing, returning empty list");
			return NextResponse.json({ success: true, data: [] });
		}
		console.error("获取分享模板失败:", error);
		return NextResponse.json({ success: false, error: "获取分享模板失败" }, { status: 500 });
	}
}
