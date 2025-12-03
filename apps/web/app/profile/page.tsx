import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import ProfileDashboard from "./profile-dashboard";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // 数据获取移至客户端组件，减少服务端渲染压力
  return <ProfileDashboard />;
}
