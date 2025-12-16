 "use client";
 
 import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Layers,
  Fish,
  Wrench,
  Sparkles,
  Star,
  Tag,
  Download,
  Shield,
  CircleDollarSign,
  Compass,
} from "lucide-react";

import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";

type BrandStat = { label: string; count: number };

interface ShareGearResponse {
  user: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: string;
  };
  summary: {
    combosCount: number;
    rodsCount: number;
    reelsCount: number;
    totalValue: number;
    rodsValue: number;
    reelsValue: number;
    totalPhotos: number;
    tagCount: number;
    lastUpdatedAt: string | null;
    heroImage: string | null;
    heroComboName: string | null;
  };
  combos: {
    id: string;
    name: string;
    detailNote: string | null;
    likeCount: number;
    mainLineText?: string | null;
    leaderLineText?: string | null;
    hookText?: string | null;
    sceneTags: string[];
    updatedAt: string;
    rod: {
      id: string;
      name: string;
      brand: string | null;
      length: number | null;
      lengthUnit: string | null;
      power: string | null;
      price: number | null;
    } | null;
    reel: {
      id: string;
      name: string;
      brand: string | null;
      model: string | null;
      gearRatioText: string | null;
      price: number | null;
    } | null;
    photoUrls: string[];
  }[];
  rods: {
    id: string;
    name: string;
    brand: string | null;
    length: number | null;
    lengthUnit: string | null;
    power: string | null;
    lureWeightMin: number | null;
    lureWeightMax: number | null;
    lineWeightText: string | null;
    price: number | null;
    note: string | null;
    combosCount: number;
    updatedAt: string;
  }[];
  reels: {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    gearRatioText: string | null;
    lineCapacityText: string | null;
    price: number | null;
    note: string | null;
    combosCount: number;
    updatedAt: string;
  }[];
  highlights: {
    rodBrands: BrandStat[];
    reelBrands: BrandStat[];
    sceneTags: string[];
    featuredCombos: {
      id: string;
      name: string;
      likeCount: number;
      photoUrl: string | null;
    }[];
  };
}

type ShareCombo = ShareGearResponse["combos"][number];
type ShareRod = ShareGearResponse["rods"][number];
type ShareReel = ShareGearResponse["reels"][number];

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
});

const numberFormatter = new Intl.NumberFormat("zh-CN");

const formatCurrency = (value: number | null | undefined) =>
  value && value > 0 ? `¥${numberFormatter.format(Math.round(value))}` : "未填写";

export default function ShareGearClient({ userId }: { userId: string }) {
  const [data, setData] = useState<ShareGearResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmbed, setIsEmbed] = useState(false);
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const highlightCombos = data?.combos ?? [];
  const comboHighlights = useMemo(() => {
    if (!highlightCombos.length) return null;
    return highlightCombos.slice(0, 3).map((combo) => ({
      id: combo.id,
      title: combo.name,
      desc: combo.sceneTags.slice(0, 2).join(" · ") || "实战组合",
    }));
  }, [highlightCombos]);

  useEffect(() => {
    async function fetchGearShare() {
      try {
        const res = await fetch(`/api/share/gear/${userId}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error || "获取失败");
          return;
        }
        setData(json.data);
      } catch (e) {
        console.error("获取装备分享数据失败:", e);
        setError("网络异常，请稍后重试");
      } finally {
        setLoading(false);
      }
    }
    fetchGearShare();
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsEmbed(window.self !== window.top);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (!loading && !error && data) {
      body.setAttribute("data-share-ready", "true");
      return () => body.removeAttribute("data-share-ready");
    }
    return undefined;
  }, [loading, error, data]);

  if (loading) return <GearShareSkeleton />;
  if (error || !data) return <ErrorState error={error || "暂时无法查看该装备库"} />;

  const { user, summary, combos, rods, reels, highlights } = data;
  const coverPhoto = summary.heroImage ?? highlights.featuredCombos.find((c) => c.photoUrl)?.photoUrl ?? null;
  const primaryTitle = `${user.nickname}的装备库`;
  const joinDate = dateFormatter.format(new Date(user.createdAt));
  const summaryStats = [
    { label: "组合数量", value: `${summary.combosCount} 套`, icon: Layers },
    { label: "鱼竿", value: `${summary.rodsCount} 根`, icon: Wrench },
    { label: "渔轮", value: `${summary.reelsCount} 个`, icon: Fish },
    { label: "已上传照片", value: summary.totalPhotos > 0 ? `${summary.totalPhotos} 张` : "等待补充", icon: Sparkles },
    { label: "估算价值", value: summary.totalValue > 0 ? formatCurrency(summary.totalValue) : "未填写", icon: CircleDollarSign },
    { label: "标签丰富度", value: summary.tagCount ? `${summary.tagCount} 个场景标签` : "暂未设置", icon: Tag },
  ];
  const braggingLine =
    summary.totalValue > 0
      ? `我的装备总价值约 ${formatCurrency(summary.totalValue)}，`
      : "装备库里的每一件都是用心挑选，";

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans">
      <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto" />
        {!isAuthenticated && !isEmbed && (
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full shadow-lg bg-white/90 backdrop-blur text-slate-800 pointer-events-auto"
            asChild
          >
            <Link href="/auth/register">
              <Download className="w-4 h-4 mr-1.5" />
              体验路亚记
            </Link>
          </Button>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 space-y-6">
        <div className="relative rounded-[32px] overflow-hidden shadow-2xl border border-white/10 bg-slate-900 min-h-[320px]">
          {coverPhoto ? (
            <img src={coverPhoto} alt={primaryTitle} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" />

          <div className="relative z-10 p-6 sm:p-10 text-white flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl border-2 border-white/20 overflow-hidden bg-white/5 flex items-center justify-center text-2xl font-semibold">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
                  ) : (
                    user.nickname.slice(0, 1)
                  )}
                </div>
                <div>
                  <p className="text-sm text-white/70">{joinDate} 加入</p>
                  <h1 className="text-3xl sm:text-4xl font-bold">{primaryTitle}</h1>
                  <p className="text-sm text-white/70 line-clamp-2">
                    {user.bio
                      ? `${user.bio}`
                      : `${braggingLine}欢迎来参观！`}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Badge className="bg-white/15 text-white border border-white/20 rounded-full px-4 py-1 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  公开装备
                </Badge>
                {summary.lastUpdatedAt && (
                  <Badge className="bg-white/15 text-white border border-white/20 rounded-full px-4 py-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    更新于 {dateFormatter.format(new Date(summary.lastUpdatedAt))}
                  </Badge>
                )}
              </div>
            </div>

            {comboHighlights && (
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 grid sm:grid-cols-3 gap-3 text-sm">
                {comboHighlights.map((combo) => (
                  <div key={combo.id} className="rounded-xl border border-white/20 p-3">
                    <p className="text-white font-semibold truncate">{combo.title}</p>
                    <p className="text-white/70 text-xs truncate">{combo.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {summaryStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-slate-100 shadow-sm bg-white/90">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className="text-lg font-semibold text-slate-900">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Star className="w-4 h-4" />
                品牌偏好
              </div>
              <div className="space-y-3">
                <BrandList title="鱼竿" brands={highlights.rodBrands} />
                <BrandList title="渔轮" brands={highlights.reelBrands} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Tag className="w-4 h-4" />
                场景标签
              </div>
              {highlights.sceneTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {highlights.sceneTags.map((tagLabel) => (
                    <Badge key={tagLabel} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                      {tagLabel}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">TA 还没有为组合设置标签</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Compass className="w-4 h-4" />
                代表组合
              </div>
              {highlights.featuredCombos.length > 0 ? (
                <div className="space-y-2">
                  {highlights.featuredCombos.map((combo) => (
                    <div
                      key={combo.id}
                      className="rounded-xl border border-slate-100 p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{combo.name}</p>
                        <p className="text-xs text-slate-500">
                          {combo.likeCount ? `${combo.likeCount} 人点赞` : "欢迎来交流"}
                        </p>
                      </div>
                      {combo.photoUrl ? (
                        <img
                          src={combo.photoUrl}
                          alt={combo.name}
                          className="w-14 h-14 rounded-lg object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-lg">
                          ⚙️
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">等待 TA 分享更多代表组合</p>
              )}
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">COMBOS</p>
              <h2 className="text-xl font-semibold text-slate-900">招牌组合</h2>
              <p className="text-sm text-slate-500">分享他/她最常用的搭配方案（{combos.length} 套）</p>
            </div>
          </div>
          {combos.length === 0 ? (
            <EmptyNotice
              icon="⚙️"
              title="还没有公开组合"
              description="等他公开后，你就能快速参考 TA 的组合搭配。"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {combos.map((combo) => (
                <ShareComboCard key={combo.id} combo={combo} />
              ))}
            </div>
          )}
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <GearList title="鱼竿列表" type="rod" emptyDescription="TA 还没有公开鱼竿。" items={rods} />
          <GearList title="渔轮列表" type="reel" emptyDescription="TA 还没有公开渔轮。" items={reels} />
        </section>
      </div>

      {!isEmbed && (
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <div className="bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10">
            <div>
              <p className="font-bold text-sm">路亚记 Luyaji</p>
              <p className="text-xs text-slate-300">记录装备、出击与社交的路亚数字藏馆</p>
            </div>
            <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 rounded-full font-medium" asChild>
              <Link href="/auth/register">立即体验</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function BrandList({ title, brands }: { title: string; brands: BrandStat[] }) {
  if (brands.length === 0) {
    return <p className="text-xs text-slate-500">{title}暂无数据</p>;
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">{title}</p>
      {brands.map((brand, index) => (
        <div key={brand.label} className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">#{index + 1}</span>
            <span className="font-medium text-slate-900">{brand.label}</span>
          </div>
          <span className="text-xs text-slate-500">{brand.count} 件</span>
        </div>
      ))}
    </div>
  );
}

function ShareComboCard({ combo }: { combo: ShareCombo }) {
  const cover = combo.photoUrls[0];
  const meta = [
    combo.rod?.brand || combo.rod?.name,
    combo.reel?.brand || combo.reel?.name,
    combo.mainLineText ? `主线 ${combo.mainLineText}` : null,
    combo.leaderLineText ? `子线 ${combo.leaderLineText}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="border-slate-100 shadow-sm overflow-hidden">
      <div className="h-48 w-full overflow-hidden bg-slate-100">
        {cover ? (
          <img src={cover} alt={combo.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-slate-400">⚙️</div>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">
              {new Date(combo.updatedAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
            </p>
            <h3 className="text-lg font-semibold text-slate-900">{combo.name}</h3>
          </div>
          {combo.likeCount > 0 && (
            <Badge variant="secondary" className="rounded-full text-xs">
              👍 {combo.likeCount}
            </Badge>
          )}
        </div>
        {meta && <p className="text-sm text-slate-600">{meta}</p>}
        {combo.sceneTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {combo.sceneTags.slice(0, 4).map((tagLabel) => (
              <Badge key={tagLabel} variant="outline" className="rounded-full px-2.5 py-1 text-xs">
                {tagLabel}
              </Badge>
            ))}
          </div>
        )}
        {combo.detailNote && (
          <p className="text-sm text-slate-500 line-clamp-3 border-t border-dashed border-slate-200 pt-3">
            {combo.detailNote}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function GearList({
  title,
  type,
  items,
  emptyDescription,
}: {
  title: string;
  type: "rod" | "reel";
  items: ShareRod[] | ShareReel[];
  emptyDescription: string;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">
            公布 {items.length} {type === "rod" ? "根" : "台"}
          </p>
        </div>
        <Badge variant="outline" className="rounded-full text-xs">
          {items.length} {type === "rod" ? "根" : "台"}
        </Badge>
      </div>

      {items.length === 0 ? (
        <EmptyNotice icon={type === "rod" ? "🎋" : "🎣"} title="暂无公开" description={emptyDescription} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="border-slate-100 shadow-none bg-slate-50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.brand || "自定义品牌"}</p>
                  </div>
                  {item.combosCount ? (
                    <Badge variant="secondary" className="rounded-full text-[10px] px-2">
                      组合 {item.combosCount}
                    </Badge>
                  ) : null}
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  {type === "rod" ? (
                    <>
                      {"length" in item && item.length ? (
                        <p>
                          长度 {item.length}
                          {item.lengthUnit || "m"}
                        </p>
                      ) : null}
                      {"power" in item && item.power ? <p>调性 {item.power}</p> : null}
                      {"lureWeightMin" in item && (item.lureWeightMin || item.lureWeightMax) ? (
                        <p>
                          饵重 {item.lureWeightMin ?? "?"}-{item.lureWeightMax ?? "?"}g
                        </p>
                      ) : null}
                      {"lineWeightText" in item && item.lineWeightText ? (
                        <p>线号 {item.lineWeightText}</p>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {"model" in item && item.model ? <p>型号 {item.model}</p> : null}
                      {"gearRatioText" in item && item.gearRatioText ? <p>速比 {item.gearRatioText}</p> : null}
                      {"lineCapacityText" in item && item.lineCapacityText ? (
                        <p>线容量 {item.lineCapacityText}</p>
                      ) : null}
                    </>
                  )}
                  {"price" in item && item.price ? <p>入手价 {formatCurrency(item.price)}</p> : null}
                  {"updatedAt" in item ? (
                    <p className="text-[11px] text-slate-400">
                      更新于 {new Date(item.updatedAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyNotice({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white text-center py-12 px-6 space-y-2">
      <div className="text-3xl">{icon}</div>
      <p className="text-lg font-medium text-slate-900">{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-20 h-20 bg-white rounded-full shadow-inner flex items-center justify-center text-3xl">⚠️</div>
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">无法加载装备库</h3>
        <p className="text-sm text-slate-500">{error}</p>
      </div>
      <Button asChild variant="outline" className="rounded-full">
        <Link href="/">返回首页</Link>
      </Button>
    </div>
  );
}

function GearShareSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <Skeleton className="h-72 rounded-[32px]" />
      <div className="grid md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </div>
  );
}
