"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
	MapPin,
	Fish,
	Navigation,
	Clock,
	Share2,
	Search,
} from "lucide-react";
import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@workspace/ui/components/avatar";

type PublicTripSummary = {
	id: string;
	title: string | null;
	startTime: string;
	endTime: string | null;
	totalCatchCount: number;
	fishSpeciesCount: number;
	weatherType: string | null;
	weatherTemperatureText: string | null;
	weatherWindText: string | null;
	locationName: string;
	spotName: string;
	spotVisibility: string | null;
	spotIsMasked: boolean;
	coverPhoto: string | null;
	speciesPreview: string[];
	comboCount: number;
	combos: { id: string; name: string }[];
	owner: {
		id: string;
		nickname: string;
		avatarUrl: string | null;
	};
	createdAt: string;
	updatedAt: string;
};

type PublicTripFeedProps = {
	embedded?: boolean;
};

const pageSize = 9;
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
	month: "short",
	day: "numeric",
	weekday: "short",
});

export function PublicTripFeed({ embedded = false }: PublicTripFeedProps) {
	const [trips, setTrips] = useState<PublicTripSummary[] | null>(null);
	const [keyword, setKeyword] = useState("");
	const [appliedKeyword, setAppliedKeyword] = useState("");
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		void fetchTrips();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [appliedKeyword, page]);

	async function fetchTrips() {
		setLoading(true);
		setError(null);

		try {
			const params = new URLSearchParams();
			params.set("limit", String(pageSize));
			params.set("page", String(page));
			if (appliedKeyword) params.set("q", appliedKeyword);

			const res = await fetch(`/api/square/public-trips?${params.toString()}`, {
				cache: "no-store",
			});
			const json = await res.json();

			if (!res.ok || !json.success) {
				setError(json.error || "获取公开出击失败，请稍后重试");
				setTrips([]);
				return;
			}

			setTrips(json.data as PublicTripSummary[]);
			setTotal(typeof json.total === "number" ? json.total : null);
		} catch (err) {
			console.error("获取公开出击失败:", err);
			setError("网络异常，请稍后重试");
			setTrips([]);
		} finally {
			setLoading(false);
		}
	}

	const totalPages =
		total != null ? Math.max(1, Math.ceil(total / pageSize)) : null;

	function handleSearch() {
		setPage(1);
		setAppliedKeyword(keyword.trim());
	}

	return (
		<div className="min-h-screen bg-slate-50/50 pb-24 md:pb-12">
			<div className="bg-white border-b border-slate-100">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 space-y-6">
					{!embedded && (
						<div className="text-center space-y-3">
							<p className="text-sm font-semibold tracking-wide text-blue-500 uppercase">
								出击广场
							</p>
							<h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
								欣赏钓友的公开出击记录
							</h1>
							<p className="text-slate-500 text-lg">
								浏览真实的作钓故事、渔获成绩与装备分享，为下一次计划寻找灵感。
							</p>
						</div>
					)}

					<div className="max-w-3xl mx-auto">
						<div className="flex flex-col md:flex-row gap-2 rounded-2xl border border-slate-200 shadow-sm p-2 bg-white">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
								<Input
									value={keyword}
									onChange={(e) => setKeyword(e.target.value)}
									placeholder="搜索出击标题、钓点、备注..."
									className="pl-9 h-11 border-0 bg-transparent focus-visible:ring-0"
									onKeyDown={(e) => {
										if (e.key === "Enter") handleSearch();
									}}
								/>
							</div>
							<Button
								type="button"
								onClick={handleSearch}
								className="h-11 px-6 rounded-xl"
							>
								搜索
							</Button>
						</div>
						{appliedKeyword && (
							<div className="text-xs text-slate-500 mt-2 text-center">
								正在查看包含 “{appliedKeyword}” 的公开出击
								<Button
									variant="ghost"
									size="sm"
									className="ml-2 h-6 px-2 text-xs"
									onClick={() => {
										setKeyword("");
										setAppliedKeyword("");
									}}
								>
									清除
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
						{error}
					</div>
				)}

				{loading && (!trips || trips.length === 0) ? (
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
						{Array.from({ length: pageSize }).map((_, index) => (
							<Card
								key={index}
								className="p-0 overflow-hidden border border-slate-100"
							>
								<Skeleton className="aspect-[4/3] w-full" />
								<div className="p-4 space-y-3">
									<Skeleton className="h-4 w-3/5" />
									<Skeleton className="h-3 w-4/5" />
									<div className="flex gap-2">
										<Skeleton className="h-6 w-16" />
										<Skeleton className="h-6 w-16" />
									</div>
									<Skeleton className="h-10 w-full" />
								</div>
							</Card>
						))}
					</div>
				) : trips && trips.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
						{trips.map((trip) => (
							<TripCard key={trip.id} trip={trip} />
						))}
					</div>
				) : (
					<div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4">
						<div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
							<Fish className="w-8 h-8" />
						</div>
						<h3 className="text-lg font-semibold text-slate-900">
							还没有公开出击
						</h3>
						<p className="text-sm text-slate-500">
							尝试修改搜索条件，或者邀请钓友来公开分享他们的精彩瞬间。
						</p>
					</div>
				)}

				{totalPages && totalPages > 1 && (
					<div className="flex justify-center items-center gap-3">
						<Button
							variant="outline"
							className="rounded-full"
							disabled={page <= 1 || loading}
							onClick={() => setPage((prev) => Math.max(1, prev - 1))}
						>
							上一页
						</Button>
						<div className="text-sm text-slate-500">
							第{" "}
							<span className="font-semibold text-slate-900">
								{page}
							</span>{" "}
							/ {totalPages} 页
						</div>
						<Button
							variant="outline"
							className="rounded-full"
							disabled={page >= totalPages || loading}
							onClick={() =>
								setPage((prev) =>
									totalPages ? Math.min(totalPages, prev + 1) : prev + 1,
								)
							}
						>
							下一页
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

function TripCard({ trip }: { trip: PublicTripSummary }) {
	const startDate = new Date(trip.startTime);
	const durationLabel = formatDuration(trip.startTime, trip.endTime);
	const fallbackTitle = trip.title || `${trip.spotName}出击`;
	const ownerInitial =
		trip.owner.nickname?.trim()?.[0] || trip.owner.id.slice(0, 1) || "钓";

	return (
		<Card className="overflow-hidden border border-slate-100 shadow-sm flex flex-col">
			<div className="relative aspect-[4/3] bg-slate-900/10">
				{trip.coverPhoto ? (
					<Image
						src={trip.coverPhoto}
						alt={fallbackTitle}
						fill
						className="object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-700 to-slate-800 text-white/60">
						<Fish className="w-12 h-12" />
					</div>
				)}
				<div className="absolute top-3 left-3 flex flex-wrap gap-2">
					<Badge className="bg-black/70 text-white border-white/20">
						{dateFormatter.format(startDate)}
					</Badge>
					{trip.spotIsMasked && (
						<Badge variant="secondary" className="bg-amber-500/80 border-none">
							钓点保密
						</Badge>
					)}
				</div>
			</div>
			<div className="p-5 flex flex-col gap-4 flex-1">
				<div className="space-y-1">
					<div className="text-xs uppercase tracking-wide text-slate-400 flex items-center gap-1">
						<MapPin className="w-3 h-3" />
						<span>{trip.locationName}</span>
					</div>
					<h3 className="text-lg font-semibold text-slate-900 leading-tight">
						{fallbackTitle}
					</h3>
				</div>

				<div className="flex flex-wrap gap-3 text-sm text-slate-600">
					<div className="flex items-center gap-1.5">
						<Fish className="w-4 h-4 text-blue-500" />
						<span>{trip.totalCatchCount} 条渔获</span>
					</div>
					<div className="flex items-center gap-1.5">
						<Navigation className="w-4 h-4 text-emerald-500" />
						<span>{trip.fishSpeciesCount} 种鱼</span>
					</div>
					<div className="flex items-center gap-1.5">
						<Clock className="w-4 h-4 text-amber-500" />
						<span>{durationLabel}</span>
					</div>
				</div>

				{trip.speciesPreview.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{trip.speciesPreview.map((name) => (
							<Badge
								key={name}
								variant="outline"
								className="text-[11px] font-normal"
							>
								{name}
							</Badge>
						))}
					</div>
				)}

				<div className="mt-auto flex items-center justify-between gap-3 pt-2">
					<div className="flex items-center gap-3">
						<Avatar className="h-10 w-10 border border-slate-100">
							{trip.owner.avatarUrl ? (
								<AvatarImage src={trip.owner.avatarUrl} alt={trip.owner.nickname} />
							) : (
								<AvatarFallback className="bg-slate-100 text-slate-600">
									{ownerInitial}
								</AvatarFallback>
							)}
						</Avatar>
						<div>
							<p className="text-sm font-medium text-slate-900">
								{trip.owner.nickname}
							</p>
							<p className="text-xs text-slate-500">
								{trip.comboCount > 0
									? `携带 ${trip.comboCount} 套组合`
									: "尚未关联装备组合"}
							</p>
						</div>
					</div>
					<Button
						variant="secondary"
						size="sm"
						className="rounded-full px-4"
						asChild
					>
						<Link href={`/share/trip/${trip.id}`} target="_blank" rel="noreferrer">
							<Share2 className="w-4 h-4 mr-1" />
							查看
						</Link>
					</Button>
				</div>
			</div>
		</Card>
	);
}

function formatDuration(start: string, end: string | null) {
	if (!end) return "进行中";
	const startTime = new Date(start).getTime();
	const endTime = new Date(end).getTime();
	const diff = Math.max(0, endTime - startTime);
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	if (hours <= 0 && minutes <= 0) return "不足 1 分钟";
	if (hours <= 0) return `${minutes} 分钟`;
	return `${hours} 小时 ${minutes} 分钟`;
}
