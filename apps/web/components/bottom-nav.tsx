"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { Home, MapPin, Anchor, BookOpen, User, Share2 } from "lucide-react";

const navItems = [
  {
    href: "/",
    label: "首页",
    icon: Home,
  },
  {
    href: "/trips",
    label: "出击",
    icon: MapPin,
  },
  {
    href: "/gear",
    label: "装备",
    icon: Anchor,
  },
  {
    href: "/square",
    label: "广场",
    icon: Share2,
  },
  {
    href: "/dex",
    label: "图鉴",
    icon: BookOpen,
  },
  {
    href: "/profile",
    label: "我的",
    icon: User,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  // 不在认证页面显示底部导航
  if (pathname.startsWith("/auth")) {
    return null;
  }

  // 不在新建出击页面显示底部导航
  if (pathname === "/trips/new") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors duration-200",
                isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
