import { prisma } from "@/lib/prisma";
import { GearTabs } from "./gear-tabs";

export default async function GearPage() {
  const [rods, reels, combos] = await Promise.all([
    prisma.rod.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { nickname: true, phone: true } },
        _count: { select: { combos: true } },
      },
    }),
    prisma.reel.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { nickname: true, phone: true } },
        _count: { select: { combos: true } },
      },
    }),
    prisma.combo.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { nickname: true, phone: true } },
        rod: { select: { name: true } },
        reel: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>装备管理</h1>
        <p style={{ color: "#888" }}>
          鱼竿 {rods.length} · 渔轮 {reels.length} · 组合 {combos.length}
        </p>
      </div>

      <GearTabs
        rods={rods.map((r) => ({
          ...r,
          userName: r.user.nickname || maskPhone(r.user.phone),
        }))}
        reels={reels.map((r) => ({
          ...r,
          userName: r.user.nickname || maskPhone(r.user.phone),
        }))}
        combos={combos.map((c) => ({
          ...c,
          userName: c.user.nickname || maskPhone(c.user.phone),
          rodName: c.rod?.name || "",
          reelName: c.reel?.name || "",
        }))}
      />
    </div>
  );
}

function maskPhone(phone?: string | null) {
  if (!phone) return "未绑定";
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
