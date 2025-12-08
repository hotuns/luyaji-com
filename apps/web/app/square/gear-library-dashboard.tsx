"use client";

import { useEffect, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { Search, Heart, User, Copy, Fish, Anchor, Layers } from "lucide-react";
import Image from "next/image";
import { ImagePreviewDialog } from "@/components/image-preview-dialog";

type RodLibraryItem = {
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
	sourceType: "user" | "template" | "copied";
	updatedAt: string;
	ownerName: string;
};

type ReelLibraryItem = {
	id: string;
	name: string;
	brand: string | null;
	model: string | null;
	gearRatioText: string | null;
	lineCapacityText: string | null;
	note: string | null;
	sourceType: "user" | "template" | "copied";
	updatedAt: string;
	ownerName: string;
};

type ComboLibraryItem = {
	id: string;
	name: string;
	mainLineText: string | null;
	leaderLineText: string | null;
	hookText: string | null;
	detailNote: string | null;
	photoUrls: string[] | null;
	likeCount: number;
	sourceType: "user" | "template" | "copied";
	updatedAt: string;
	ownerName: string;
};

type TabKey = "combos" | "rods" | "reels";
type SourceFilter = "all" | "template" | "user";

type GearLibraryDashboardProps = {
	embedded?: boolean;
};

export function GearLibraryDashboard({ embedded = false }: GearLibraryDashboardProps) {
	const [tab, setTab] = useState<TabKey>("combos");
	const [keyword, setKeyword] = useState("");
	const [source, setSource] = useState<SourceFilter>("all");
	const [rodItems, setRodItems] = useState<RodLibraryItem[] | null>(null);
	const [reelItems, setReelItems] = useState<ReelLibraryItem[] | null>(null);
	const [comboItems, setComboItems] = useState<ComboLibraryItem[] | null>(null);
	const [rodTotal, setRodTotal] = useState<number | null>(null);
	const [reelTotal, setReelTotal] = useState<number | null>(null);
	const [comboTotal, setComboTotal] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewImages, setPreviewImages] = useState<string[]>([]);
	const [previewTitle, setPreviewTitle] = useState("图片预览");
	const pageSize = 12; // Increased page size for grid layout

	useEffect(() => {
		void fetchCurrent();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tab, page, source]);

	async function fetchCurrent() {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.set(
				"type",
				tab === "rods" ? "rod" : tab === "reels" ? "reel" : "combo",
			);
			params.set("limit", String(pageSize));
			params.set("page", String(page));
			if (keyword.trim()) params.set("q", keyword.trim());
			if (source !== "all") params.set("source", source);

			const res = await fetch(`/api/gear-library?${params.toString()}`, {
				cache: "no-store",
			});
			const json = await res.json();
			if (!json.success) return;

			if (tab === "rods") {
				setRodItems(json.data as RodLibraryItem[]);
				setRodTotal(typeof json.total === "number" ? json.total : null);
			} else if (tab === "reels") {
				setReelItems(json.data as ReelLibraryItem[]);
				setReelTotal(typeof json.total === "number" ? json.total : null);
			} else {
				setComboItems(json.data as ComboLibraryItem[]);
				setComboTotal(typeof json.total === "number" ? json.total : null);
			}
		} finally {
			setLoading(false);
		}
	}

	async function handleCopy(type: "rod" | "reel", id: string) {
		const label = type === "rod" ? "鱼竿" : "渔轮";

		const ok = confirm(`确定要将这个${label}复制到「我的装备」吗？`);
		if (!ok) return;

		try {
			const res = await fetch(
				`/api/gear-library/copy/${type}/${id}`,
				{ method: "POST" },
			);
			const json = await res.json();

			if (!res.ok || !json.success) {
				alert(json.error || `复制${label}失败，请稍后重试`);
				return;
			}

			alert(`已复制到你的「我的装备」中，可以在装备页面查看并编辑。`);
		} catch {
			alert(`网络异常，复制${label}失败，请稍后重试`);
		}
	}

	const openComboPreview = (images?: string[] | null, title?: string) => {
		if (!images || images.length === 0) return;
		setPreviewImages(images);
		setPreviewTitle(title || "组合图片");
		setPreviewOpen(true);
	};


	const items =
		tab === "rods" ? rodItems : tab === "reels" ? reelItems : comboItems;
	const total =
		tab === "rods" ? rodTotal : tab === "reels" ? reelTotal : comboTotal;
	const totalPages =
		total != null ? Math.max(1, Math.ceil(total / pageSize)) : null;

	return (
		<div className="min-h-screen bg-slate-50/50 pb-24 md:pb-12">
			{/* Hero Section */}
			<div className="bg-white border-b border-slate-100">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
					{!embedded && (
						<div className="text-center max-w-3xl mx-auto space-y-4">
							<h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
								钓友广场
							</h1>
							<p className="text-slate-500 text-lg">
								发现钓友们分享的优质装备组合，交流搭配心得，寻找你的下一套神兵利器。
							</p>
						</div>
					)}

					{/* Search & Filter Bar */}
					<div className="mt-8 max-w-2xl mx-auto">
							<div className="flex flex-col gap-2 p-1.5 bg-white shadow-lg shadow-slate-200/50 rounded-2xl border border-slate-100">
								<div className="flex gap-2">
									<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
								<Input
									placeholder="搜索名称、品牌、备注..."
									value={keyword}
									onChange={(e) => setKeyword(e.target.value)}
									className="pl-9 border-0 bg-transparent focus-visible:ring-0 h-11"
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											setPage(1);
											void fetchCurrent();
										}
									}}
								/>
							</div>
									<Button
										type="button"
										onClick={() => {
											setPage(1);
											void fetchCurrent();
										}}
										className="h-11 px-6 rounded-xl"
									>
										搜索
									</Button>
								</div>
								<div className="flex items-center justify-between px-1 pb-1 text-xs text-slate-500">
									<span>来源筛选：</span>
									<div className="inline-flex rounded-full bg-slate-100 p-0.5">
										<button
											type="button"
											className={cn(
												"px-3 py-1 rounded-full transition text-[11px]",
												source === "all"
													? "bg-white text-slate-900 shadow-sm"
													: "text-slate-500 hover:text-slate-700",
											)}
											onClick={() => {
												setSource("all");
												setPage(1);
											}}
										>
											全部
										</button>
										<button
											type="button"
											className={cn(
												"px-3 py-1 rounded-full transition text-[11px]",
												source === "template"
													? "bg-white text-amber-700 shadow-sm"
													: "text-slate-500 hover:text-slate-700",
											)}
											onClick={() => {
												setSource("template");
												setPage(1);
											}}
										>
											官方模板
										</button>
										<button
											type="button"
											className={cn(
												"px-3 py-1 rounded-full transition text-[11px]",
												source === "user"
													? "bg-white text-blue-700 shadow-sm"
													: "text-slate-500 hover:text-slate-700",
											)}
											onClick={() => {
												setSource("user");
												setPage(1);
											}}
										>
											用户上传
										</button>
									</div>
								</div>
						</div>
					</div>

					{/* Tabs */}
					<div className="mt-8 flex justify-center">
						<div className="inline-flex p-1 bg-slate-100 rounded-xl">
							{[
								{ key: "combos" as const, label: "精选组合", icon: Layers },
								{ key: "rods" as const, label: "鱼竿库", icon: Fish },
								{ key: "reels" as const, label: "渔轮库", icon: Anchor },
							].map((t) => {
								const Icon = t.icon;
								return (
									<button
										key={t.key}
										type="button"
										onClick={() => {
											setTab(t.key);
											setPage(1);
										}}
										className={cn(
											"flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all",
											tab === t.key
												? "bg-white text-blue-600 shadow-sm"
												: "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50",
										)}
									>
										<Icon className="h-4 w-4" />
										{t.label}
									</button>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			{/* Content Section */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{total != null && (
					<div className="mb-6 text-sm text-slate-500">
						共找到 {total} 个
						{tab === "rods" ? "鱼竿" : tab === "reels" ? "渔轮" : "组合"}
					</div>
				)}

				{loading && !items && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{Array.from({ length: 8 }).map((_, i) => (
							<Card key={i} className="overflow-hidden border-0 shadow-sm">
								<Skeleton className="h-48 w-full" />
								<div className="p-4 space-y-3">
									<Skeleton className="h-5 w-3/4" />
									<Skeleton className="h-4 w-1/2" />
									<div className="flex gap-2 pt-2">
										<Skeleton className="h-6 w-16" />
										<Skeleton className="h-6 w-16" />
									</div>
								</div>
							</Card>
						))}
					</div>
				)}

				{!loading && items && items.length === 0 && (
					<div className="py-24 text-center">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
							<Search className="h-8 w-8 text-slate-400" />
						</div>
						<h3 className="text-lg font-medium text-slate-900">暂无相关内容</h3>
						<p className="text-slate-500 mt-1">
							没有找到相关的
							{tab === "rods" ? "鱼竿" : tab === "reels" ? "渔轮" : "组合"}
							，换个关键词试试？
						</p>
					</div>
				)}

				{items && items.length > 0 && (
					<div className="space-y-8">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							{tab === "combos" &&
								(items as ComboLibraryItem[]).map((item) => (
									<Card
										key={item.id}
										role="button"
										tabIndex={0}
										onClick={() => {
											window.location.href = `/square/combos/${item.id}`;
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												window.location.href = `/square/combos/${item.id}`;
											}
										}}
										className="h-full overflow-hidden border-slate-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col cursor-pointer group"
									>
										{/* Image Cover */}
										<div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
											{item.photoUrls && item.photoUrls.length > 0 ? (
												<>
													<Image
														src={item.photoUrls[0] ?? ""}
														alt={item.name}
														fill
														className="object-cover transition-transform duration-500 group-hover:scale-105"
													/>
													<button
														type="button"
														className="absolute inset-0 z-10 bg-transparent"
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															openComboPreview(item.photoUrls, item.name);
														}}
														aria-label="预览组合图片"
													/>
												</>
											) : (
												<div className="w-full h-full flex items-center justify-center text-slate-300">
													<Layers className="h-12 w-12" />
												</div>
											)}
											<div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 pointer-events-none">
												<Heart className="h-3 w-3 fill-current" />
												{item.likeCount}
											</div>
										</div>

										<div className="p-4 flex-1 flex flex-col">
											<div className="mb-3">
												<h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
													{item.name}
												</h3>
												<div className="flex items-center gap-2 mt-1.5">
													<div className="flex items-center gap-1.5">
														<div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
															<User className="h-3 w-3 text-slate-400" />
														</div>
														<span className="text-xs text-slate-500 truncate">
															{item.ownerName}
														</span>
													</div>
													<Badge
														variant="outline"
														className={cn(
															"text-[10px] px-1.5 h-5 font-normal border-dashed",
															item.sourceType === "template"
																? "border-amber-400 text-amber-600 bg-amber-50"
																: "border-slate-200 text-slate-500 bg-slate-50",
														)}
													>
														{item.sourceType === "template" ? "官方模板" : "用户上传"}
													</Badge>
												</div>
											</div>

											<div className="flex flex-wrap gap-1.5 mb-3">
												{item.mainLineText && (
													<Badge
														variant="secondary"
														className="text-[10px] px-1.5 h-5 font-normal bg-slate-100 text-slate-600 hover:bg-slate-200"
													>
														主 {item.mainLineText}
													</Badge>
												)}
												{item.leaderLineText && (
													<Badge
														variant="secondary"
														className="text-[10px] px-1.5 h-5 font-normal bg-slate-100 text-slate-600 hover:bg-slate-200"
													>
														子 {item.leaderLineText}
													</Badge>
												)}
											</div>

											{item.detailNote && (
												<p className="text-xs text-slate-500 line-clamp-2 mt-auto">
													{item.detailNote}
												</p>
											)}
										</div>
									</Card>
								))}

							{tab === "rods" &&
								(items as RodLibraryItem[]).map((item) => (
									<Card
										key={item.id}
										className="p-5 flex flex-col h-full hover:shadow-md transition-shadow"
									>
										<div className="flex justify-between items-start gap-3 mb-3">
											<div>
												<h3 className="font-bold text-slate-900 line-clamp-1">
													{item.name}
												</h3>
												<div className="flex items-center gap-2 mt-0.5">
													{item.brand && (
														<p className="text-xs text-blue-600 font-medium">
															{item.brand}
														</p>
													)}
													<Badge
														variant="outline"
														className={cn(
															"text-[10px] px-1.5 h-5 font-normal border-dashed",
															item.sourceType === "template"
																? "border-amber-400 text-amber-600 bg-amber-50"
																: "border-slate-200 text-slate-500 bg-slate-50",
														)}
													>
														{item.sourceType === "template" ? "官方模板" : "用户上传"}
													</Badge>
												</div>
											</div>
											<Button
												size="icon"
												variant="ghost"
												className="h-8 w-8 text-slate-400 hover:text-blue-600"
												onClick={() => handleCopy("rod", item.id)}
												title="复制到我的鱼竿"
											>
												<Copy className="h-4 w-4" />
											</Button>
										</div>

										<div className="flex flex-wrap gap-2 mb-4">
											{item.power && (
												<Badge variant="outline" className="font-normal">
													{item.power}调
												</Badge>
											)}
											{item.length && (
												<Badge variant="outline" className="font-normal">
													{item.length}
													{item.lengthUnit || "m"}
												</Badge>
											)}
											{item.lureWeightMin !== null &&
												item.lureWeightMax !== null && (
													<Badge variant="outline" className="font-normal">
														{item.lureWeightMin}-{item.lureWeightMax}g
													</Badge>
												)}
										</div>

										<div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
											<div className="flex items-center gap-1.5">
												<User className="h-3 w-3" />
												<span>{item.ownerName}</span>
											</div>
											<span>{new Date(item.updatedAt).toLocaleDateString()}</span>
										</div>
									</Card>
								))}

							{tab === "reels" &&
								(items as ReelLibraryItem[]).map((item) => (
									<Card
										key={item.id}
										className="p-5 flex flex-col h-full hover:shadow-md transition-shadow"
									>
										<div className="flex justify-between items-start gap-3 mb-3">
											<div>
												<h3 className="font-bold text-slate-900 line-clamp-1">
													{item.name}
												</h3>
												<div className="flex items-center gap-2 mt-0.5">
													{item.brand && (
														<p className="text-xs text-blue-600 font-medium">
															{item.brand}
														</p>
													)}
													<Badge
														variant="outline"
														className={cn(
															"text-[10px] px-1.5 h-5 font-normal border-dashed",
															item.sourceType === "template"
																? "border-amber-400 text-amber-600 bg-amber-50"
																: "border-slate-200 text-slate-500 bg-slate-50",
														)}
													>
														{item.sourceType === "template" ? "官方模板" : "用户上传"}
													</Badge>
												</div>
											</div>
											<Button
												size="icon"
												variant="ghost"
												className="h-8 w-8 text-slate-400 hover:text-blue-600"
												onClick={() => handleCopy("reel", item.id)}
												title="复制到我的渔轮"
											>
												<Copy className="h-4 w-4" />
											</Button>
										</div>

										<div className="flex flex-wrap gap-2 mb-4">
											{item.model && (
												<Badge variant="outline" className="font-normal">
													{item.model}
												</Badge>
											)}
											{item.gearRatioText && (
												<Badge variant="outline" className="font-normal">
													速比 {item.gearRatioText}
												</Badge>
											)}
										</div>

										<div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
											<div className="flex items-center gap-1.5">
												<User className="h-3 w-3" />
												<span>{item.ownerName}</span>
											</div>
											<span>{new Date(item.updatedAt).toLocaleDateString()}</span>
										</div>
									</Card>
								))}
						</div>

						{/* Pagination */}
						<div className="flex items-center justify-center gap-4 pt-8">
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={page <= 1 || loading}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								className="w-24"
							>
								上一页
							</Button>
							<span className="text-sm text-slate-500 font-medium">
								{page} / {totalPages || 1}
							</span>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={
									loading ||
									(totalPages != null
										? page >= totalPages
										: items != null && items.length < pageSize)
								}
								onClick={() => setPage((p) => p + 1)}
								className="w-24"
							>
								下一页
							</Button>
						</div>
					</div>
				)}
			</div>
			<ImagePreviewDialog
				open={previewOpen}
				images={previewImages}
				title={previewTitle}
				onOpenChange={setPreviewOpen}
			/>
		</div>
	);
}
