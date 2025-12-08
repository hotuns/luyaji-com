"use client";

import { useState } from "react";
import { Sparkles, Fish } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

import { GearLibraryDashboard } from "./gear-library-dashboard";
import { PublicTripFeed } from "./public-trip-feed";

type SquareView = "gear" | "trips";

const viewMeta: Record<
	SquareView,
	{ title: string; description: string; icon: typeof Sparkles; badge: string }
> = {
	gear: {
		title: "装备灵感与搭配",
		description:
			"浏览优质装备组合与真实配置，快速复制到「我的装备」中使用。",
		icon: Sparkles,
		badge: "装备",
	},
	trips: {
		title: "出击故事与渔获",
		description:
			"查看钓友公开的出击记录、渔获照片与钓点策略，激发下一次作钓灵感。",
		icon: Fish,
		badge: "出击",
	},
};

const TAB_ORDER: SquareView[] = ["trips", "gear"];

export function SquareDashboard() {
	const [view, setView] = useState<SquareView>("trips");
	const meta = viewMeta[view];
	const Icon = meta.icon;

	return (
		<div className="min-h-screen bg-slate-50">
			<div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="space-y-1">
						<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
							钓友广场
						</p>
						<div className="flex items-center gap-2">
							<span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
								<Icon className="w-3.5 h-3.5" />
								{meta.badge}
							</span>
							<h1 className="text-xl md:text-2xl font-bold text-slate-900">
								{meta.title}
							</h1>
						</div>
						<p className="text-sm text-slate-500">{meta.description}</p>
					</div>

						<div className="inline-flex rounded-full bg-slate-100 p-1 w-fit">
							{TAB_ORDER.map((key) => (
							<button
								key={key}
								type="button"
								onClick={() => setView(key)}
								className={cn(
									"px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
									view === key
										? "bg-white text-slate-900 shadow"
										: "text-slate-500 hover:text-slate-900",
								)}
							>
								{viewMeta[key].badge}
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="relative">
				{view === "gear" ? (
					<GearLibraryDashboard embedded />
				) : (
					<PublicTripFeed embedded />
				)}
			</div>
		</div>
	);
}
