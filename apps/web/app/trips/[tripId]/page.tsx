import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TripDetailClient from "./trip-detail-client";

export default async function TripDetailPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // 这里不再服务端拉取详情数据，只做鉴权
  // 详情数据由客户端组件通过 /api/trips/[tripId] 获取
  return <TripDetailClient />;
}
