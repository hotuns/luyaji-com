import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { GearDashboardWrapper } from "./gear-dashboard";

export default async function GearPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // 数据获取移至客户端组件，减少服务端渲染压力
  return (
    <div className="space-y-6">
      {/* Header - 匹配 Demo GearView */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">装备库</h2>
      </div>
      
      <GearDashboardWrapper />
    </div>
  );
}
