import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ComboEditClient } from "./combo-edit-client";

export default async function ComboEditPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const combo = await prisma.combo.findUnique({
    where: { id: params.id, userId: session.user.id },
    include: {
      rod: true,
      reel: true,
    },
  });

  if (!combo) {
    redirect("/gear");
  }

  const rods = await prisma.rod.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const reels = await prisma.reel.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  // 转换为 Summary 类型
  const comboSummary = {
    ...combo,
    rod: combo.rod,
    reel: combo.reel,
    visibility: combo.visibility as "private" | "public",
    photoUrls: combo.photoUrls as string[],
    sceneTags: combo.sceneTags as string[],
  };

  const rodSummaries = rods.map((r) => ({ 
    ...r, 
    visibility: r.visibility as "private" | "public",
    combosCount: 0 
  }));
  const reelSummaries = reels.map((r) => ({ 
    ...r, 
    visibility: r.visibility as "private" | "public",
    combosCount: 0 
  }));

  return (
    <ComboEditClient 
      initialData={comboSummary} 
      rods={rodSummaries} 
      reels={reelSummaries} 
    />
  );
}
