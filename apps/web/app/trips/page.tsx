import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import TripsDashboard from "./trips-dashboard";

export const metadata: Metadata = {
  title: "出击记录 | 路亚记",
  description: "查看你的路亚出击历史和渔获统计",
};

export default async function TripsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // 数据获取移至客户端组件，减少服务端渲染压力
  return <TripsDashboard />;
}
