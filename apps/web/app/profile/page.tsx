import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getProfileOverview } from "@/lib/profile";

import { Card, CardContent } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { User, Smartphone, Settings, ChevronRight } from "lucide-react";

import { ProfileEditModal } from "./profile-edit-modal";
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
    <div className="pb-24 md:pb-8 max-w-3xl mx-auto">
      {/* Profile Card - 匹配 Demo ProfileView */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm text-center md:text-left flex flex-col md:flex-row items-center gap-6">
          <div className="relative inline-block shrink-0">
            <ProfileEditModal
              nickname={overview.user.nickname}
              avatarUrl={overview.user.avatarUrl}
              displayName={displayName}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{displayName}</h2>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md border border-slate-200">
                Lv. 5 钓鱼佬
              </span>
              <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-md border border-blue-100">
                ID: {overview.user.id.slice(-6).toUpperCase()}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-4">入坑时间: {formatDate(overview.user.createdAt)}</p>
            <p className="text-slate-400 text-sm">个人简介：路亚是一种生活方式。</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 左侧 - 账号设置 */}
        <div className="space-y-4">
          {/* 统计卡片 - Mobile Only */}
          <div className="grid grid-cols-3 gap-3 md:hidden">
            <StatCard label="出击次数" value={overview.stats.tripCount} />
            <StatCard label="总渔获" value={overview.stats.totalCatch} />
            <StatCard label="解锁鱼种" value={overview.stats.speciesCount} />
          </div>

          {/* 账号信息 */}
          <Card className="bg-white border border-slate-100 shadow-sm overflow-hidden rounded-xl">
            <div className="p-4 bg-slate-50 font-semibold text-slate-500 text-sm">账户设置</div>
            <div className="divide-y divide-slate-100">
              <div className="p-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="text-slate-600 flex items-center gap-3">
                  <User size={18} />
                  个人资料
                </span>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
              <div className="p-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="text-slate-600 flex items-center gap-3">
                  <Smartphone size={18} />
                  手机绑定
                </span>
                <span className="text-xs text-slate-400 mr-2">{maskPhone(overview.user.phone)}</span>
              </div>
              <div className="p-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="text-slate-600 flex items-center gap-3">
                  <Settings size={18} />
                  通用设置
                </span>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            </div>
          </Card>
        </div>

        {/* 右侧 - Pro 会员和退出 */}
        <div className="space-y-4">
          {/* Pro 会员卡片 */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-2">Pro 会员</h3>
            <p className="text-sm text-blue-600 mb-4">解锁更多地图点位标记，导出高清数据报表。</p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none shadow-none">
              升级 Pro
            </Button>
          </div>

          {/* 装备与数据概览 */}
          <Card className="bg-white border border-slate-100 shadow-sm">
            <CardContent className="p-0 divide-y divide-slate-100">
              <div className="p-4 pb-3">
                <h2 className="text-base font-semibold text-slate-800">数据概览</h2>
                <p className="text-xs text-slate-400 mt-0.5">装备与出击信息</p>
              </div>
              <div className="px-4 py-2">
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

          {/* 退出登录 */}
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="bg-white border-none shadow-sm p-3 text-center">
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-400 font-medium mt-1">{label}</div>
    </Card>
  );
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right ml-4 truncate max-w-[200px]">{value}</span>
    </div>
  );
}
