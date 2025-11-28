import { auth } from "@/lib/auth";
import { getTripDetail } from "@/lib/trip-detail";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { CalendarDays, Clock, Fish, MapPinned, NotebookText, Wind, Pencil, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ComponentType } from "react";

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return dateTimeFormatter.format(new Date(value));
}

function formatDuration(start: string, end: string | null) {
  if (!end) return "进行中";
  const duration = new Date(end).getTime() - new Date(start).getTime();
  if (duration <= 0) return "-";
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${minutes} 分钟`;
  if (minutes === 0) return `${hours} 小时`;
  return `${hours} 小时 ${minutes} 分钟`;
}

export default async function TripDetailPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const trip = await getTripDetail(session.user.id, tripId);

  if (!trip) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="relative overflow-hidden rounded-b-[2.5rem] md:rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 px-6 pt-12 pb-16 shadow-xl">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 top-20 h-48 w-48 rounded-full bg-indigo-500/20 blur-2xl" />
        
        <div className="container relative px-6">
          <div className="flex items-center justify-between mb-6">
            <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm">
              <Link href="/trips">
                <ChevronLeft className="size-6" />
                <span className="sr-only">返回</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm">
              <Link href={`/trips/${tripId}/edit`}>
                <Pencil className="size-5" />
                <span className="sr-only">编辑</span>
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-50/80">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <MapPinned className="size-3.5 text-white" />
                </div>
                <span>出击地点</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {trip.title || trip.locationName}
              </h1>
              <p className="text-base text-blue-50/90">{trip.locationName}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white backdrop-blur-sm">
                <CalendarDays className="size-3.5" />
                <span>{formatDateTime(trip.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white backdrop-blur-sm">
                <Clock className="size-3.5" />
                <span>{formatDuration(trip.startTime, trip.endTime)}</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white backdrop-blur-sm">
                <Fish className="size-3.5" />
                <span>
                  {trip.totalCatchCount} 尾 / {trip.fishSpeciesCount} 种
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container -mt-8 space-y-6 px-4">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card className="border-none shadow-md md:rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>使用装备</CardTitle>
                    <CardDescription>还原本次出击使用的整套装备组合</CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm" className="h-8 rounded-full border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
                    <Link href="/gear">管理装备</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {trip.combos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      <NotebookText className="size-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">暂无关联组合，可在「编辑出击」中追加。</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {trip.combos.map((combo) => (
                      <div key={combo.id} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-gray-900">{combo.name}</p>
                            <div className="flex flex-wrap gap-2 text-sm">
                              {combo.rod ? <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">鱼竿 · {combo.rod.name}</Badge> : null}
                              {combo.reel ? <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">轮子 · {combo.reel.name}</Badge> : null}
                            </div>
                          </div>
                          {combo.detailNote ? (
                            <Badge variant="outline" className="border-gray-200 text-gray-500">{combo.detailNote}</Badge>
                          ) : null}
                        </div>
                        <div className="mt-4 grid gap-4 rounded-xl bg-gray-50/80 p-3 text-sm lg:grid-cols-3">
                          <div>
                            <dt className="text-xs font-medium text-gray-500">主线</dt>
                            <dd className="mt-0.5 font-medium text-gray-900">{combo.mainLineText || "-"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">前导</dt>
                            <dd className="mt-0.5 font-medium text-gray-900">{combo.leaderLineText || "-"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">钩型</dt>
                            <dd className="mt-0.5 font-medium text-gray-900">{combo.hookText || "-"}</dd>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md md:rounded-2xl">
              <CardHeader>
                <CardTitle>渔获记录</CardTitle>
                <CardDescription>按照出水顺序回顾每一次收获</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {trip.catches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      <Fish className="size-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">暂无渔获记录。</p>
                  </div>
                ) : (
                  <ol className="space-y-4">
                    {trip.catches.map((item, index) => (
                      <li key={item.id} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                        <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 translate-y-[-20%] rotate-12 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50" />
                        
                        <div className="relative flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                              #{index + 1}
                            </div>
                            <div>
                              <p className="text-lg font-bold text-gray-900">{item.speciesName}</p>
                            </div>
                          </div>
                          <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-sm hover:from-blue-700 hover:to-indigo-700">{item.count} 尾</Badge>
                        </div>
                        
                        <div className="mt-4 grid gap-3 rounded-xl bg-gray-50/80 p-4 text-sm lg:grid-cols-4">
                          <DetailRow label="时间" value={formatDateTime(item.caughtAt)} />
                          <DetailRow label="规格" value={item.sizeText || "-"} />
                          <DetailRow label="重量" value={item.weightText || "-"} />
                          <DetailRow label="所用组合" value={item.combo?.name || "-"} />
                        </div>
                        
                        {(item.lureText || item.note) && (
                          <div className="mt-3 space-y-2 px-1 text-sm">
                            {item.lureText ? (
                              <p className="text-gray-600">
                                <span className="font-medium text-gray-900">饵型：</span>
                                {item.lureText}
                              </p>
                            ) : null}
                            {item.note ? (
                              <p className="text-gray-600">
                                <span className="font-medium text-gray-900">备注：</span>
                                {item.note}
                              </p>
                            ) : null}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-md md:rounded-2xl">
              <CardHeader>
                <CardTitle>概览</CardTitle>
                <CardDescription>本次出击的核心数据</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <SummaryItem label="总渔获" value={`${trip.totalCatchCount} 尾`} icon={Fish} />
                  <SummaryItem label="目标鱼种" value={`${trip.fishSpeciesCount} 种`} icon={NotebookText} />
                  <SummaryItem label="开始时间" value={formatDateTime(trip.startTime)} icon={CalendarDays} />
                  <SummaryItem label="结束时间" value={formatDateTime(trip.endTime)} icon={Clock} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md md:rounded-2xl">
              <CardHeader>
                <CardTitle>天气记录</CardTitle>
                <CardDescription>人工录入的天气信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <DetailRow label="天气类型" value={trip.weatherType || "-"} icon={Wind} />
                  <DetailRow label="体感温度" value={trip.weatherTemperatureText || "-"} />
                  <DetailRow label="风向风速" value={trip.weatherWindText || "-"} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md md:rounded-2xl">
              <CardHeader>
                <CardTitle>作战记录</CardTitle>
                <CardDescription>随手记录的灵感、心得或突发状况</CardDescription>
              </CardHeader>
              <CardContent>
                {trip.note ? (
                  <div className="rounded-xl bg-yellow-50/50 p-4 text-sm leading-6 text-gray-700">
                    {trip.note}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无补充。</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border px-3 py-2 text-sm">
      {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{label}</p>
        <p className="text-foreground">{value}</p>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border px-4 py-3">
      <div className={cn("rounded-xl p-3", "bg-primary/10 text-primary")}>{Icon ? <Icon className="size-5" /> : null}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}
