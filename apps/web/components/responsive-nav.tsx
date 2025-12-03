"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@workspace/ui/lib/utils";
import { 
  MapPin, Anchor, BookOpen, User, 
  List, ChevronRight, Search, Settings, Share2 
} from "lucide-react";

const navItems = [
  { href: "/", label: "数据概览", mobileLabel: "首页", icon: List },
  { href: "/trips", label: "出击记录", mobileLabel: "出击", icon: MapPin },
  { href: "/gear", label: "装备管理", mobileLabel: "装备", icon: Anchor },
  { href: "/square", label: "装备广场", mobileLabel: "广场", icon: Share2 },
  { href: "/dex", label: "渔获图鉴", mobileLabel: "图鉴", icon: BookOpen },
];

const profileItem = { href: "/profile", label: "个人中心", mobileLabel: "我的", icon: User };

/**
 * 🖥️ Desktop Sidebar + 📱 Mobile Bottom Nav
 * 这些是固定定位的元素
 */
export function ResponsiveNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // 不在认证页面显示导航
  if (pathname.startsWith("/auth")) {
    return null;
  }

  // 不在新建出击页面显示导航
  if (pathname === "/trips/new") {
    return null;
  }

  const isActive = (href: string) => 
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const displayName = session?.user?.name || "钓友";
  const avatarUrl = session?.user?.image;

  return (
    <>
      {/* 🖥️ DESKTOP SIDEBAR - 匹配 Demo */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 fixed h-full z-20 shadow-sm">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Anchor size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">路亚记</h1>
            <p className="text-xs text-slate-400">Web App v1.0</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  active
                    ? "bg-blue-50 text-blue-700 font-medium shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Profile with separator */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              href={profileItem.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive(profileItem.href)
                  ? "bg-blue-50 text-blue-700 font-medium shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <User size={22} strokeWidth={isActive(profileItem.href) ? 2.5 : 2} />
              <span className="text-sm">{profileItem.label}</span>
            </Link>
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                {displayName[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">{displayName}</div>
              <div className="text-xs text-slate-400">Pro Member</div>
            </div>
            <Settings size={16} className="text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
        </div>
      </aside>

      {/* 📱 Mobile Bottom Nav - 匹配 Demo */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 pb-safe md:hidden">
        <div className="flex justify-around items-center h-16">
          {[...navItems, profileItem].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-200",
                  active ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.mobileLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/**
 * 📱 Mobile Header + 🖥️ Desktop Header
 * 这些需要放在 md:ml-64 容器内部
 */
export function AppHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // 不在认证页面显示
  if (pathname.startsWith("/auth")) {
    return null;
  }

  // 不在新建出击页面显示
  if (pathname === "/trips/new") {
    return null;
  }

  const displayName = session?.user?.name || "钓友";
  const avatarUrl = session?.user?.image;

  // 获取当前页面标题
  const getPageTitle = () => {
    if (pathname === "/") return "数据概览";
    if (pathname.startsWith("/trips")) return "出击记录";
    if (pathname.startsWith("/gear")) return "装备管理";
    if (pathname.startsWith("/square")) return "装备广场";
    if (pathname.startsWith("/dex")) return "渔获图鉴";
    if (pathname.startsWith("/profile")) return "个人中心";
    return "路亚记";
  };

  return (
    <>
      {/* 📱 Mobile Header - 匹配 Demo */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex justify-between items-center md:hidden">
        <div className="flex items-center gap-2 text-blue-600">
          <Anchor size={24} />
          <span className="font-bold text-lg tracking-tight">路亚记</span>
        </div>
        <Link href="/profile">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              {displayName[0]}
            </div>
          )}
        </Link>
      </header>

      {/* 🖥️ Desktop Header (Breadcrumbs) - 匹配 Demo，使用 sticky 定位 */}
      <header className="hidden md:flex sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 justify-between items-center">
        <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
          <span className="text-slate-400">App</span>
          <ChevronRight size={14} />
          <span className="text-slate-800 font-bold">{getPageTitle()}</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
            <Search size={20} />
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <span className="text-sm text-slate-500">
            {new Date().toLocaleDateString("zh-CN")}
          </span>
        </div>
      </header>
    </>
  );
}
