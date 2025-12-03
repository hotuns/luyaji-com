import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { StatsDashboard } from "./stats-dashboard";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const params = await searchParams;

  const speciesId = typeof params.speciesId === "string" ? params.speciesId : undefined;

  return <StatsDashboard initialSpeciesId={speciesId} />;
}
