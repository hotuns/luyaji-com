import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const MAX_LIMIT = 30;

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const keyword = searchParams.get("q")?.trim() || undefined;
		const limitParam = Number(searchParams.get("limit"));
		const pageParam = Number(searchParams.get("page"));

		const take = Number.isFinite(limitParam)
			? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
			: 12;
		const page =
			Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
		const skip = (page - 1) * take;

		const where: Prisma.TripWhereInput = {
			visibility: "public",
		};

		if (keyword) {
			where.OR = [
				{ title: { contains: keyword } },
				{ note: { contains: keyword } },
				{
					spot: {
						is: {
							name: { contains: keyword },
						},
					},
				},
				{
					spot: {
						is: {
							locationName: { contains: keyword },
						},
					},
				},
			];
		}

		const [total, trips] = await prisma.$transaction([
			prisma.trip.count({ where }),
			prisma.trip.findMany({
				where,
				orderBy: [
					{ startTime: "desc" },
					{ createdAt: "desc" },
				],
				take,
				skip,
				include: {
					spot: {
						select: {
							id: true,
							name: true,
							locationName: true,
							visibility: true,
						},
					},
					user: {
						select: {
							id: true,
							nickname: true,
							avatarUrl: true,
						},
					},
					tripCombos: {
						select: {
							combo: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
					catches: {
						select: {
							id: true,
							speciesName: true,
							photoUrls: true,
						},
						orderBy: { createdAt: "desc" },
						take: 8,
					},
				},
			}),
		]);

		const data = trips.map((trip) => {
			const spotVisible =
				!trip.spot || trip.spot.visibility === "public";
			const fallbackSpotName = trip.spot?.name || "未关联钓点";
			const fallbackLocationName =
				trip.spot?.locationName || fallbackSpotName;
			const safeSpotName = spotVisible ? fallbackSpotName : "神秘钓点";
			const safeLocationName = spotVisible
				? fallbackLocationName
				: "钓点保密";

			const coverPhoto =
				trip.catches
					.map((c) => c.photoUrls)
					.find(
						(urls): urls is string[] =>
							Array.isArray(urls) && urls.length > 0,
					)?.[0] ?? null;

			const speciesPreview: string[] = [];
			for (const c of trip.catches) {
				if (c.speciesName && !speciesPreview.includes(c.speciesName)) {
					speciesPreview.push(c.speciesName);
				}
				if (speciesPreview.length >= 3) break;
			}

			return {
				id: trip.id,
				title: trip.title,
				startTime: trip.startTime.toISOString(),
				endTime: trip.endTime?.toISOString() ?? null,
				totalCatchCount: trip.totalCatchCount ?? 0,
				fishSpeciesCount: trip.fishSpeciesCount ?? 0,
				weatherType: trip.weatherType,
				weatherTemperatureText: trip.weatherTemperatureText,
				weatherWindText: trip.weatherWindText,
				locationName: safeLocationName,
				spotName: safeSpotName,
				spotVisibility: trip.spot?.visibility ?? null,
				spotIsMasked: !spotVisible,
				coverPhoto,
				speciesPreview,
				comboCount: trip.tripCombos.length,
				combos: trip.tripCombos
					.map((tc) => tc.combo)
					.filter((combo): combo is { id: string; name: string } => !!combo),
				owner: {
					id: trip.user?.id ?? "",
					nickname: trip.user?.nickname || "匿名钓友",
					avatarUrl: trip.user?.avatarUrl ?? null,
				},
				createdAt: trip.createdAt.toISOString(),
				updatedAt: trip.updatedAt.toISOString(),
			};
		});

		return NextResponse.json({
			success: true,
			total,
			data,
			meta: {
				page,
				pageSize: take,
				pageCount: Math.max(1, Math.ceil(total / take)),
			},
		});
	} catch (error) {
		console.error("获取公开出击记录失败:", error);
		return NextResponse.json(
			{ success: false, error: "获取公开出击记录失败" },
			{ status: 500 },
		);
	}
}
