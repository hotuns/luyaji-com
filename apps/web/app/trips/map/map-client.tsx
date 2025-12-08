"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FishingSpotFormDialog } from "@/components/fishing-spot-form-dialog";

// 动态导入地图组件，禁用 SSR
const TripsMapView = dynamic(
  () => import("@/components/map/trips-map-view"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto" />
          <p className="text-sm text-slate-500">加载地图中...</p>
        </div>
      </div>
    ),
  }
);

interface SpotMarker {
  id: string;
  name: string;
  locationName: string;
  lat: number;
  lng: number;
  description?: string | null;
  visibility: string;
  tripCount: number;
  lastTrip: {
    title: string | null;
    startTime: string;
    totalCatchCount: number;
    fishSpeciesCount: number;
  } | null;
}

interface MapClientProps {
  spots: SpotMarker[];
}

export default function MapClient({ spots }: MapClientProps) {
  const router = useRouter();
  const [showSpotDialog, setShowSpotDialog] = useState(false);

  const handleSpotCreated = () => {
    setShowSpotDialog(false);
    router.refresh();
  };

  if (spots.length === 0) {
    return (
      <>
        <div className="flex h-full flex-col items-center justify-center bg-slate-50 p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <svg
              className="h-8 w-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            还没有记录钓点
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            在新建钓点后，可在出击时复用并同步到地图
          </p>
          <button
            type="button"
            onClick={() => setShowSpotDialog(true)}
            className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
          >
            新建钓点
          </button>
        </div>
        <FishingSpotFormDialog
          open={showSpotDialog}
          onOpenChange={setShowSpotDialog}
          onCreated={handleSpotCreated}
        />
      </>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-3 md:right-6">
        <button
          type="button"
          onClick={() => setShowSpotDialog(true)}
          className="flex h-10 items-center justify-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-medium text-white shadow-md hover:bg-blue-700"
        >
          新建钓点
        </button>
      </div>
      <TripsMapView spots={spots} />
      <FishingSpotFormDialog
        open={showSpotDialog}
        onOpenChange={setShowSpotDialog}
        onCreated={handleSpotCreated}
      />
    </div>
  );
}
