import { prisma } from "@/lib/prisma";
import { AnnouncementsTable } from "./table";

export default async function AnnouncementsPage() {
  const items = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <AnnouncementsTable initialData={items} />;
}
