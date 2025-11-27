"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { Home, MapPin, Backpack, BookOpen, User } from "lucide-react";

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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 pb-safe z-50">
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
  );
}
