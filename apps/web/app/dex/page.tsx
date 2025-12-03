import { redirect } from "next/navigation";
import { Metadata } from "next";

import { auth } from "@/lib/auth";
import { DexDashboard } from "./dex-dashboard";

export const metadata: Metadata = {
  title: "图鉴 | 路亚记",
  description: "查看你的路亚渔获图鉴",
};

export default async function DexPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // 数据获取移至客户端组件，减少服务端渲染压力
  return <DexDashboard />;
}
