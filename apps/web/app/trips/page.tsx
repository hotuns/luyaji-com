import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TripsDashboard from "./trips-dashboard";

export default async function TripsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // 数据获取移至客户端组件，减少服务端渲染压力
  return <TripsDashboard />;
}
