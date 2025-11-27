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
import { CalendarDays, Clock, Fish, MapPinned, NotebookText, Wind } from "lucide-react";
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

export default async function TripDetailPage({ params }: { params: { tripId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const trip = await getTripDetail(session.user.id, params.tripId);

  if (!trip) {
    notFound();
  }

  return (
    <div className="space-y-8 pb-16">
      <section className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-blue-50/80">
              <MapPinned className="size-4" />
              <span>出击地点</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {trip.title || trip.locationName}
            </h1>
            <p className="text-sm text-blue-50/90">{trip.locationName}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              <span>{formatDateTime(trip.startTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-4" />
              <span>{formatDuration(trip.startTime, trip.endTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Fish className="size-4" />
              <span>
                {trip.totalCatchCount} 尾 / {trip.fishSpeciesCount} 种
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>使用装备</CardTitle>
              <CardDescription>还原本次出击使用的整套装备组合</CardDescription>
              <CardAction>
                <Button asChild variant="outline" size="sm">
                  <Link href="/gear">管理装备</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              {trip.combos.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  暂无关联组合，可在「编辑出击」中追加。
                </div>
              ) : (
                <div className="grid gap-4">
                  {trip.combos.map((combo) => (
                    <div key={combo.id} className="rounded-2xl border p-4 transition hover:border-primary/60">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-base font-medium">{combo.name}</p>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            {combo.rod ? <Badge variant="outline">鱼竿 · {combo.rod.name}</Badge> : null}
                            {combo.reel ? <Badge variant="outline">轮子 · {combo.reel.name}</Badge> : null}
                          </div>
                        </div>
                        {combo.detailNote ? (
                          <Badge variant="secondary">{combo.detailNote}</Badge>
                        ) : null}
                      </div>
                      <dl className="mt-4 grid gap-3 text-sm text-muted-foreground lg:grid-cols-3">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground/70">主线</dt>
                          <dd className="text-sm text-foreground">{combo.mainLineText || "-"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground/70">前导</dt>
                          <dd className="text-sm text-foreground">{combo.leaderLineText || "-"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground/70">钩型</dt>
                          <dd className="text-sm text-foreground">{combo.hookText || "-"}</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>渔获记录</CardTitle>
              <CardDescription>按照出水顺序回顾每一次收获</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {trip.catches.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  暂无渔获记录。
                </div>
              ) : (
                <ol className="space-y-4">
                  {trip.catches.map((item, index) => (
                    <li key={item.id} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">#{index + 1}</p>
                          <p className="text-lg font-semibold">{item.speciesName}</p>
                        </div>
                        <Badge variant="secondary">{item.count} 尾</Badge>
                      </div>
                      <dl className="mt-4 grid gap-3 text-sm lg:grid-cols-4">
                        <DetailRow label="时间" value={formatDateTime(item.caughtAt)} />
                        <DetailRow label="规格" value={item.sizeText || "-"} />
                        <DetailRow label="重量" value={item.weightText || "-"} />
                        <DetailRow label="所用组合" value={item.combo?.name || "-"} />
                      </dl>
                      {(item.lureText || item.note) && (
                        <div className="mt-4 space-y-2 text-sm">
                          {item.lureText ? (
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">饵型：</span>
                              {item.lureText}
                            </p>
                          ) : null}
                          {item.note ? (
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">备注：</span>
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
          <Card>
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

          <Card>
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

          <Card>
            <CardHeader>
              <CardTitle>作战记录</CardTitle>
              <CardDescription>随手记录的灵感、心得或突发状况</CardDescription>
            </CardHeader>
            <CardContent>
              {trip.note ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{trip.note}</p>
              ) : (
                <p className="text-sm text-muted-foreground">暂无补充。</p>
              )}
            </CardContent>
          </Card>
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
