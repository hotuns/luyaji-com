"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { Home, MapPin, Backpack, BookOpen, User, LogOut } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

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
    icon: Backpack,
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

export function ResponsiveNav() {
  const pathname = usePathname();

  // 不在认证页面显示导航
  if (pathname.startsWith("/auth")) {
    return null;
  }

  // 不在新建出击页面显示导航 (仅移动端隐藏，桌面端可以显示，或者保持一致)
  // 为了保持一致体验，暂时都隐藏
  if (pathname === "/trips/new") {
    return null;
  }

  return (
    <>
      {/* Desktop Top Navigation */}
      <header className="hidden md:block fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              路亚记
            </Link>
            <nav className="flex items-center gap-1">
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
                      "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive && "fill-current/20")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Desktop User Actions - could add user dropdown here later */}
          <div className="flex items-center gap-4">
             {/* Placeholder for future desktop specific actions */}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 pb-safe z-50">
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
                  "flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200",
                  isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Icon className={cn("w-6 h-6", isActive && "fill-current/20")} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
