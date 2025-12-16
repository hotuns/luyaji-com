import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ShortLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  // 查找短链接
  const shortLink = await prisma.shortLink.findUnique({
    where: { code },
  });

  if (!shortLink) {
    redirect("/");
  }

  // 更新点击次数（异步，不阻塞跳转）
  prisma.shortLink.update({
    where: { id: shortLink.id },
    data: { clickCount: { increment: 1 } },
  }).catch(console.error);

  // 根据类型跳转到对应页面
  const targetUrl = (() => {
    switch (shortLink.targetType) {
      case "trip":
        return `/share/trip/${shortLink.targetId}`;
      case "combo":
        return `/share/combo/${shortLink.targetId}`;
      case "dex":
        return `/share/dex/${shortLink.targetId}`;
      case "gear":
        return `/share/gear/${shortLink.targetId}`;
      default:
        return "/";
    }
  })();

  redirect(targetUrl);
}
