import { auth } from "@/lib/auth";
import HomeDashboard from "./home-dashboard";
import { LandingPage } from "./landing-page";

export default async function HomePage() {
  const session = await auth();

  // 未登录用户展示欢迎页
  if (!session?.user?.id) {
    return <LandingPage />;
  }

  // 已登录用户展示数据概览
  return <HomeDashboard />;
}
