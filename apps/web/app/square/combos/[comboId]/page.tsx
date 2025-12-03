"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import {
	ArrowLeft,
	Heart,
	Share2,
	Fish,
	Anchor,
	Layers,
	MapPin,
	Calendar,
	User,
	Info,
} from "lucide-react";

type ComboDetail = {
	id: string;
	name: string;
	visibility: string;
	detailNote: string | null;
	mainLineText: string | null;
	leaderLineText: string | null;
	hookText: string | null;
	lures: { name?: string; note?: string }[] | null;
	sceneTags: string[] | null;
	photoUrls: string[] | null;
	likeCount: number;
	createdAt: string;
	updatedAt: string;
	ownerName?: string; // Assuming API returns this now or we add it
	rod: {
		id: string;
		name: string;
		brand: string | null;
		length: number | null;
		lengthUnit: string | null;
		power: string | null;
		lureWeightMin: number | null;
		lureWeightMax: number | null;
		lineWeightText: string | null;
		note: string | null;
	};
	reel: {
		id: string;
		name: string;
		brand: string | null;
		model: string | null;
		gearRatioText: string | null;
		lineCapacityText: string | null;
		note: string | null;
	};
};

export default function ComboDetailPage() {
	const params = useParams<{ comboId: string }>();
	const router = useRouter();
	const comboId = params.comboId;

	const [data, setData] = useState<ComboDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [likeCount, setLikeCount] = useState<number | null>(null);
	const [liked, setLiked] = useState(false);
	const [likeLoading, setLikeLoading] = useState(false);
	const [activeImageIndex, setActiveImageIndex] = useState(0);

	useEffect(() => {
		if (!comboId) return;

		async function fetchDetail() {
			try {
				setLoading(true);
				const res = await fetch(`/api/combos/${comboId}`);
				const json = await res.json();
				if (!json.success) {
					setError(json.error || "加载失败");
					return;
				}
				const combo = json.data as ComboDetail;
				setData(combo);
				setLikeCount(combo.likeCount ?? 0);
			} catch (e) {
				setError("加载失败，请稍后再试");
			} finally {
				setLoading(false);
			}
		}

		void fetchDetail();
	}, [comboId]);

	async function toggleLike() {
		if (!data || likeLoading) return;
		setLikeLoading(true);
		try {
			const method = liked ? "DELETE" : "POST";
			const res = await fetch(`/api/combos/${data.id}/like`, { method });
			const json = await res.json();
			if (!json.success) return;
			setLiked(!liked);
			setLikeCount(json.data?.likeCount ?? likeCount);
		} finally {
			setLikeLoading(false);
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-50 p-4 md:p-8">
				<div className="max-w-5xl mx-auto space-y-6">
					<div className="flex items-center gap-4 mb-8">
						<Skeleton className="h-10 w-10 rounded-full" />
						<Skeleton className="h-8 w-64" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="md:col-span-2 space-y-6">
							<Skeleton className="h-96 w-full rounded-2xl" />
							<Skeleton className="h-48 w-full rounded-2xl" />
						</div>
						<div className="space-y-6">
							<Skeleton className="h-64 w-full rounded-2xl" />
							<Skeleton className="h-64 w-full rounded-2xl" />
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
				<div className="text-center space-y-4">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100">
						<Info className="h-8 w-8 text-slate-400" />
					</div>
					<h2 className="text-xl font-semibold text-slate-900">
						{error || "组合不存在或未公开"}
					</h2>
					<Button onClick={() => router.back()}>返回上一页</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 pb-24 md:pb-12">
			{/* Header */}
			<div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
				<div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => router.back()}
							className="hover:bg-slate-100 -ml-2"
						>
							<ArrowLeft className="h-5 w-5 text-slate-600" />
						</Button>
						<h1 className="font-semibold text-slate-900 truncate max-w-[200px] md:max-w-md">
							{data.name}
						</h1>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" className="text-slate-500">
							<Share2 className="h-5 w-5" />
						</Button>
					</div>
				</div>
			</div>

			<div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
					{/* Left Column: Images & Main Info */}
					<div className="lg:col-span-2 space-y-6">
						{/* Image Gallery */}
						<div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
							{data.photoUrls && data.photoUrls.length > 0 ? (
								<div className="space-y-2">
									<div className="aspect-[4/3] md:aspect-[16/9] bg-slate-100 relative">
										<img
											src={data.photoUrls[activeImageIndex]}
											alt={data.name}
											className="w-full h-full object-contain"
										/>
									</div>
									{data.photoUrls.length > 1 && (
										<div className="flex gap-2 p-2 overflow-x-auto">
											{data.photoUrls.map((url, idx) => (
												<button
													key={url}
													onClick={() => setActiveImageIndex(idx)}
													className={cn(
														"relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
														activeImageIndex === idx
															? "border-blue-600 ring-2 ring-blue-100"
															: "border-transparent opacity-70 hover:opacity-100",
													)}
												>
													<img
														src={url}
														alt=""
														className="w-full h-full object-cover"
													/>
												</button>
											))}
										</div>
									)}
								</div>
							) : (
								<div className="aspect-[16/9] flex flex-col items-center justify-center bg-slate-50 text-slate-400">
									<Layers className="h-16 w-16 mb-2 opacity-50" />
									<span className="text-sm">暂无图片</span>
								</div>
							)}
						</div>

						{/* Description & Tags */}
						<Card className="p-6 space-y-6 border-slate-100 shadow-sm">
							<div className="flex items-start justify-between">
								<div>
									<h2 className="text-xl font-bold text-slate-900">组合详情</h2>
									<div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
										<div className="flex items-center gap-1.5">
											<User className="h-4 w-4" />
											<span>{data.ownerName || "钓友"}</span>
										</div>
										<div className="flex items-center gap-1.5">
											<Calendar className="h-4 w-4" />
											<span>
												{new Date(data.createdAt).toLocaleDateString()}
											</span>
										</div>
									</div>
								</div>
								<div className="flex flex-col items-end gap-1">
									<div className="flex items-center gap-1 text-red-500 font-medium">
										<Heart className="h-4 w-4 fill-current" />
										<span>{likeCount}</span>
									</div>
									<span className="text-xs text-slate-400">人觉得很赞</span>
								</div>
							</div>

							{data.sceneTags && data.sceneTags.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{data.sceneTags.map((tag) => (
										<Badge
											key={tag}
											variant="secondary"
											className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1"
										>
											<MapPin className="h-3 w-3 mr-1" />
											{tag}
										</Badge>
									))}
								</div>
							)}

							{data.detailNote && (
								<div className="prose prose-slate prose-sm max-w-none bg-slate-50 p-4 rounded-xl">
									<p className="whitespace-pre-wrap text-slate-600 leading-relaxed">
										{data.detailNote}
									</p>
								</div>
							)}
						</Card>
					</div>

					{/* Right Column: Gear Specs */}
					<div className="space-y-6">
						{/* Rod Card */}
						<Card className="overflow-hidden border-slate-100 shadow-sm">
							<div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 flex items-center gap-2 text-white">
								<Fish className="h-4 w-4" />
								<span className="font-medium">鱼竿配置</span>
							</div>
							<div className="p-5 space-y-4">
								<div>
									<div className="text-xs text-slate-500 mb-1">品牌/名称</div>
									<div className="font-semibold text-slate-900 text-lg">
										{data.rod.name}
									</div>
									{data.rod.brand && (
										<div className="text-blue-600 text-sm font-medium">
											{data.rod.brand}
										</div>
									)}
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div className="bg-slate-50 p-2.5 rounded-lg">
										<div className="text-[10px] text-slate-400 uppercase tracking-wider">
											硬度 Power
										</div>
										<div className="font-medium text-slate-700">
											{data.rod.power || "-"}
										</div>
									</div>
									<div className="bg-slate-50 p-2.5 rounded-lg">
										<div className="text-[10px] text-slate-400 uppercase tracking-wider">
											长度 Length
										</div>
										<div className="font-medium text-slate-700">
											{data.rod.length
												? `${data.rod.length}${data.rod.lengthUnit || "m"}`
												: "-"}
										</div>
									</div>
									<div className="col-span-2 bg-slate-50 p-2.5 rounded-lg">
										<div className="text-[10px] text-slate-400 uppercase tracking-wider">
											饵重 Lure Weight
										</div>
										<div className="font-medium text-slate-700">
											{data.rod.lureWeightMin !== null &&
											data.rod.lureWeightMax !== null
												? `${data.rod.lureWeightMin}-${data.rod.lureWeightMax}g`
												: "-"}
										</div>
									</div>
								</div>
							</div>
						</Card>

						{/* Reel Card */}
						<Card className="overflow-hidden border-slate-100 shadow-sm">
							<div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 flex items-center gap-2 text-white">
								<Anchor className="h-4 w-4" />
								<span className="font-medium">渔轮配置</span>
							</div>
							<div className="p-5 space-y-4">
								<div>
									<div className="text-xs text-slate-500 mb-1">品牌/名称</div>
									<div className="font-semibold text-slate-900 text-lg">
										{data.reel.name}
									</div>
									{data.reel.brand && (
										<div className="text-blue-600 text-sm font-medium">
											{data.reel.brand}
										</div>
									)}
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div className="bg-slate-50 p-2.5 rounded-lg">
										<div className="text-[10px] text-slate-400 uppercase tracking-wider">
											型号 Model
										</div>
										<div className="font-medium text-slate-700">
											{data.reel.model || "-"}
										</div>
									</div>
									<div className="bg-slate-50 p-2.5 rounded-lg">
										<div className="text-[10px] text-slate-400 uppercase tracking-wider">
											速比 Gear Ratio
										</div>
										<div className="font-medium text-slate-700">
											{data.reel.gearRatioText || "-"}
										</div>
									</div>
								</div>
							</div>
						</Card>

						{/* Line & Lure Card */}
						<Card className="overflow-hidden border-slate-100 shadow-sm">
							<div className="bg-slate-100 px-4 py-3 flex items-center gap-2 text-slate-700 border-b border-slate-200">
								<Layers className="h-4 w-4" />
								<span className="font-medium">线组与配件</span>
							</div>
							<div className="p-5 space-y-4">
								<div className="space-y-3">
									<div className="flex items-center justify-between py-2 border-b border-slate-50">
										<span className="text-sm text-slate-500">主线</span>
										<Badge variant="outline" className="font-normal">
											{data.mainLineText || "未填写"}
										</Badge>
									</div>
									<div className="flex items-center justify-between py-2 border-b border-slate-50">
										<span className="text-sm text-slate-500">子线</span>
										<Badge variant="outline" className="font-normal">
											{data.leaderLineText || "未填写"}
										</Badge>
									</div>
									<div className="flex items-center justify-between py-2 border-b border-slate-50">
										<span className="text-sm text-slate-500">钩型</span>
										<Badge variant="outline" className="font-normal">
											{data.hookText || "未填写"}
										</Badge>
									</div>
								</div>

								{data.lures && data.lures.length > 0 && (
									<div className="pt-2">
										<div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
											常用假饵
										</div>
										<div className="space-y-2">
											{data.lures.map((lure, idx) => (
												<div
													key={idx}
													className="bg-slate-50 p-2 rounded text-sm text-slate-700 flex items-center gap-2"
												>
													<div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
													<span>
														{lure.name}
														{lure.note && (
															<span className="text-slate-400 ml-1">
																- {lure.note}
															</span>
														)}
													</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</Card>
					</div>
				</div>
			</div>

			{/* Floating Action Button (Mobile) */}
			<div className="fixed bottom-6 right-6 md:hidden z-50">
				<Button
					size="lg"
					className={cn(
						"rounded-full shadow-xl h-14 w-14 p-0 transition-all duration-300",
						liked ? "bg-red-500 hover:bg-red-600" : "bg-slate-900 hover:bg-slate-800",
					)}
					onClick={toggleLike}
					disabled={likeLoading}
				>
					<Heart
						className={cn(
							"h-6 w-6 transition-transform",
							liked ? "fill-white scale-110" : "scale-100",
						)}
					/>
				</Button>
			</div>

			{/* Desktop Action Bar */}
			<div className="hidden md:block fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40">
				<div className="max-w-5xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button
							size="lg"
							className={cn(
								"gap-2 transition-all duration-300 min-w-[120px]",
								liked
									? "bg-red-50 text-red-600 hover:bg-red-100 border-red-200 border"
									: "bg-slate-900 text-white hover:bg-slate-800",
							)}
							onClick={toggleLike}
							disabled={likeLoading}
						>
							<Heart
								className={cn(
									"h-5 w-5 transition-transform",
									liked ? "fill-current" : "",
								)}
							/>
							{liked ? "已点赞" : "点赞支持"}
						</Button>
						<span className="text-sm text-slate-500">
							{likeCount} 人觉得这个组合很赞
						</span>
					</div>
					<div className="flex gap-3">
						{/* Future actions: Comment, Collect, etc. */}
					</div>
				</div>
			</div>
		</div>
	);
}
