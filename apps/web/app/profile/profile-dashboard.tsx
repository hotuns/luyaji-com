"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { User, Smartphone, Settings, ChevronRight, BarChart3, MapPin, Map, Anchor, Share2 } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";

import { ProfileEditModal } from "./profile-edit-modal";
import { SignOutButton } from "./sign-out-button";

interface ProfileData {
  user: {
    id: string;
    phone: string | null;
    nickname: string | null;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: string;
  };
  stats: {
    tripCount: number;
    totalCatch: number;
    speciesCount: number;
    rodCount: number;
    reelCount: number;
    comboCount: number;
  };
  recentTrip: {
    id: string;
    title: string | null;
    spotName: string;
    spotLocationName: string | null;
  } | null;
}

function maskPhone(phone?: string | null) {
  if (!phone) return "未绑定手机号";
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr));
}

export default function ProfileDashboard() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneEditing, setPhoneEditing] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result.data);
          setPhoneInput(result.data.user.phone || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="pb-24 md:pb-8 max-w-3xl mx-auto">
        {/* 骨架屏 */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-1 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-200 animate-pulse" />
            <div className="space-y-3 flex-1">
              <div className="h-7 w-32 bg-slate-200 rounded animate-pulse mx-auto md:mx-0" />
              <div className="flex gap-2 justify-center md:justify-start">
                <div className="h-5 w-20 bg-slate-100 rounded animate-pulse" />
                <div className="h-5 w-24 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="h-4 w-40 bg-slate-100 rounded animate-pulse mx-auto md:mx-0" />
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white h-48 animate-pulse" />
          <Card className="bg-white h-48 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pb-24 md:pb-8 max-w-3xl mx-auto text-center py-12">
        <p className="text-slate-500">加载失败，请刷新重试</p>
      </div>
    );
  }

  const displayName =
    data.user.nickname ||
    (data.user.phone ? `钓友${data.user.phone.slice(-4)}` : "钓友");

  const bio = data.user.bio || "路亚是一种生活方式。";

  async function handleSavePhone() {
    setPhoneError(null);
    const value = phoneInput.trim();
    if (!value) {
      setPhoneError("请输入手机号");
      return;
    }
    if (!/^1\d{10}$/.test(value)) {
      setPhoneError("请输入有效的11位手机号码");
      return;
    }

    try {
      setPhoneSaving(true);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: value }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "保存失败");
      }
      setData(json.data);
      setPhoneEditing(false);
    } catch (e) {
      setPhoneError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setPhoneSaving(false);
    }
  }

  const quickLinks = [
    {
      href: "/trips",
      label: "出击记录",
      desc: "查看 / 新建",
      icon: MapPin,
      iconClass: "bg-sky-100 text-sky-600",
    },
    {
      href: "/trips/map",
      label: "地图视角",
      desc: "查找钓点",
      icon: Map,
      iconClass: "bg-emerald-100 text-emerald-600",
    },
    {
      href: "/spots",
      label: "钓点管理",
      desc: "维护钓点",
      icon: MapPin,
      iconClass: "bg-amber-100 text-amber-600",
    },
    {
      href: "/gear",
      label: "装备库",
      desc: "整理组合",
      icon: Anchor,
      iconClass: "bg-indigo-100 text-indigo-600",
    },
    {
      href: "/square",
      label: "钓友广场",
      desc: "热门出击",
      icon: Share2,
      iconClass: "bg-rose-100 text-rose-600",
    },
  ];

  return (
    <div className="pb-24 md:pb-8 max-w-3xl mx-auto">
      {/* Profile Card */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm text-center md:text-left flex flex-col md:flex-row items-center gap-6">
          <div className="relative inline-block shrink-0">
            <ProfileEditModal
              nickname={data.user.nickname}
              avatarUrl={data.user.avatarUrl}
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
                ID: {data.user.id.slice(-6).toUpperCase()}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-4">入坑时间: {formatDate(data.user.createdAt)}</p>
            <p className="text-slate-400 text-sm">个人简介：{bio}</p>
          </div>
        </div>
      </div>

      {/* Mobile quick shortcuts */}
      <div className="md:hidden mb-8">
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group active:scale-[0.98] transition"
              >
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${link.iconClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{link.label}</p>
                    <p className="text-xs text-slate-500">{link.desc}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 左侧 - 账号设置 */}
        <div className="space-y-4">
          {/* 统计卡片 - Mobile Only */}
          <div className="grid grid-cols-3 gap-3 md:hidden">
            <StatCard label="出击次数" value={data.stats.tripCount} />
            <StatCard label="总渔获" value={data.stats.totalCatch} />
            <StatCard label="解锁鱼种" value={data.stats.speciesCount} />
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
              <Dialog open={phoneEditing} onOpenChange={setPhoneEditing}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="w-full text-left p-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <span className="text-slate-600 flex items-center gap-3">
                      <Smartphone size={18} />
                      手机绑定
                    </span>
                    <span className="text-xs mr-2 flex items-center gap-2">
                      <span
                        className={
                          data.user.phone ? "text-slate-400" : "text-amber-600 font-medium"
                        }
                      >
                        {maskPhone(data.user.phone)}
                      </span>
                      {!data.user.phone && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          建议尽快绑定
                        </span>
                      )}
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>绑定 / 修改手机号</DialogTitle>
                    <DialogDescription>
                      当前手机号：{data.user.phone ? maskPhone(data.user.phone) : "未绑定"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">新的手机号</label>
                      <Input
                        inputMode="numeric"
                        maxLength={11}
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="请输入11位手机号码"
                      />
                    </div>
                    {phoneError && (
                      <p className="text-xs text-red-500">{phoneError}</p>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setPhoneEditing(false)}
                        disabled={phoneSaving}
                      >
                        取消
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSavePhone}
                        disabled={phoneSaving}
                      >
                        {phoneSaving ? "保存中..." : "保存"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
                <AccountRow label="装备数量" value={`竿 ${data.stats.rodCount} · 轮 ${data.stats.reelCount} · 组合 ${data.stats.comboCount}`} />
                <AccountRow
                  label="最近出击"
                  value={
                    data.recentTrip
                      ? `${data.recentTrip.title || data.recentTrip.spotName}`
                      : "暂无记录"
                  }
                />
              </div>
              <Link 
                href="/stats/report"
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <BarChart3 size={16} className="text-purple-500" />
                  查看钓鱼报告
                </span>
                <ChevronRight size={16} className="text-slate-300" />
              </Link>
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
