import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getProfileOverview } from "@/lib/profile";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { User, Phone, Calendar } from "lucide-react";

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
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-6 pt-10 pb-20 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-inner">
            {overview.user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={overview.user.avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-white/80" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{displayName}</h1>
            <div className="flex items-center gap-2 text-blue-100 text-sm mt-1">
              <Phone className="w-3.5 h-3.5" />
              <span>{maskPhone(overview.user.phone)}</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200 text-xs mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>加入时间 · {formatDate(overview.user.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8 relative z-10">
          <StatCard label="出击次数" value={overview.stats.tripCount} />
          <StatCard label="总渔获" value={overview.stats.totalCatch} />
          <StatCard label="解锁鱼种" value={overview.stats.speciesCount} />
        </div>
      </div>

      <div className="px-4 -mt-10 space-y-4 relative z-20">
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">个人资料</h2>
                <p className="text-xs text-gray-500 mt-0.5">更新昵称与头像，个性化你的钓鱼名片</p>
              </div>
            </div>
            <ProfileForm
              initialNickname={overview.user.nickname}
              initialAvatarUrl={overview.user.avatarUrl}
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardContent className="p-0 divide-y divide-gray-100">
            <div className="p-4 pb-3">
              <h2 className="text-base font-semibold text-gray-900">账号信息</h2>
              <p className="text-xs text-gray-500 mt-0.5">管理手机号与安全设置</p>
            </div>
            <div className="px-4 py-2">
              <AccountRow label="手机号" value={maskPhone(overview.user.phone)} />
              <AccountRow label="装备数量" value={`竿 ${overview.stats.rodCount} · 轮 ${overview.stats.reelCount} · 组合 ${overview.stats.comboCount}`} />
              <AccountRow
                label="最近出击"
                value={
                  overview.recentTrip
                    ? `${overview.recentTrip.title || overview.recentTrip.locationName}`
                    : "暂无记录"
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-900">安全</h2>
              <p className="text-xs text-gray-500 mt-0.5">退出当前账号</p>
            </div>
            <SignOutButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-md border border-white/10 shadow-sm">
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-blue-100 font-medium mt-1">{label}</div>
    </div>
  );
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right ml-4 truncate max-w-[200px]">{value}</span>
    </div>
  );
}
