"use client";

import Link from "next/link";
import {
  Fish,
  Map,
  BookOpen,
  Wrench,
  Users,
  ChevronRight,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";

const features = [
  {
    icon: Map,
    title: "钓行记录",
    description: "记录每一次出钓，标记钓点、天气、收获",
  },
  {
    icon: Fish,
    title: "渔获图鉴",
    description: "收集你钓到的每一种鱼，构建个人图鉴",
  },
  {
    icon: Wrench,
    title: "装备管理",
    description: "管理你的竿、轮，追踪装备价值",
  },
  {
    icon: Users,
    title: "装备广场",
    description: "浏览钓友们分享的装备组合，获取灵感",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
              <Fish className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white md:text-5xl lg:text-6xl">
            路亚记
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 dark:text-gray-400 md:text-xl">
            记录钓行、收集渔获、管理装备
            <br className="hidden sm:block" />
            让每一次出钓都有迹可循
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/auth/signin">
                登录 / 注册
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link href="/square">
                <BookOpen className="mr-2 h-4 w-4" />
                浏览装备广场
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-semibold text-gray-900 dark:text-white md:text-3xl">
            为路亚爱好者打造
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-200 bg-white/80 p-6 backdrop-blur transition-all hover:border-blue-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/80 dark:hover:border-blue-700"
              >
                <div className="mb-4 inline-flex rounded-xl bg-blue-100 p-3 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-900/30 dark:text-blue-400 dark:group-hover:bg-blue-600">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-3xl bg-gradient-to-r from-blue-600 to-teal-500 p-8 text-center text-white shadow-2xl md:p-12">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">
            开始记录你的钓鱼之旅
          </h2>
          <p className="mb-8 text-blue-100">
            注册只需几秒，完全免费使用
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <Link href="/auth/signin">
              立即开始
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-4 py-8 dark:border-gray-800">
        <div className="mx-auto max-w-5xl text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} 路亚记. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
