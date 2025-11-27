import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getProfileOverview } from "@/lib/profile";

import { Button } from "@workspace/ui/components/button";

import { ProfileForm } from "./profile-form";
import { SignOutButton } from "./sign-out-button";

function maskPhone(phone?: string | null) {
  if (!phone) return "未绑定手机号";
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const overview = await getProfileOverview(session.user.id);
  const displayName =
    overview.user.nickname ||
    session.user.name ||
    (overview.user.phone ? `钓友${overview.user.phone.slice(-4)}` : "钓友");

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 pt-10 pb-16">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {overview.user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={overview.user.avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl">🎣</span>
            )}
          </div>
          <div>
            <p className="text-lg font-semibold">{displayName}</p>
            <p className="text-sm text-blue-100">{maskPhone(overview.user.phone)}</p>
            <p className="text-xs text-blue-200 mt-1">
              加入时间 · {formatDate(overview.user.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-8">
          <StatCard label="出击次数" value={overview.stats.tripCount} />
          <StatCard label="总渔获" value={overview.stats.totalCatch} />
          <StatCard label="解锁鱼种" value={overview.stats.speciesCount} />
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-6">
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">个人资料</h2>
              <p className="text-sm text-gray-500">更新昵称与头像，个性化你的钓鱼名片</p>
            </div>
          </div>
          <ProfileForm
            initialNickname={overview.user.nickname}
            initialAvatarUrl={overview.user.avatarUrl}
          />
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">快捷入口</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickLink href="/trips" title="出击记录" description={`${overview.stats.tripCount} 次`} />
            <QuickLink href="/gear" title="装备管理" description={`${overview.stats.gearCount} 件装备`} />
            <QuickLink href="/dex" title="渔获图鉴" description={`${overview.stats.speciesCount} 种鱼`} />
            <QuickLink href="/trips/new" title="立即出击" description="快速记录" />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">账号信息</h2>
            <p className="text-sm text-gray-500">管理手机号与安全设置</p>
          </div>
          <div className="divide-y divide-gray-100 text-sm text-gray-700">
            <AccountRow label="手机号" value={maskPhone(overview.user.phone)} />
            <AccountRow label="装备数量" value={`竿 ${overview.stats.rodCount} · 轮 ${overview.stats.reelCount} · 组合 ${overview.stats.comboCount}`} />
            <AccountRow
              label="最近出击"
              value={
                overview.recentTrip
                  ? `${overview.recentTrip.title || overview.recentTrip.locationName} · ${new Date(
                      overview.recentTrip.startTime
                    ).toLocaleDateString("zh-CN")} · ${overview.recentTrip.totalCatchCount} 条`
                  : "暂无记录"
              }
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">安全</h2>
            <p className="text-sm text-gray-500">退出当前账号</p>
          </div>
          <SignOutButton />
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-blue-100 tracking-wide">{label}</div>
    </div>
  );
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Button variant="outline" className="h-auto py-4 flex flex-col items-start gap-1" asChild>
      <Link href={href}>
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <span className="text-xs text-gray-500">{description}</span>
      </Link>
    </Button>
  );
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right ml-4">{value}</span>
    </div>
  );
}
