"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";

// 修复 Leaflet 默认图标问题
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface TripMarker {
  id: string;
  title: string | null;
  locationName: string;
  lat: number;
  lng: number;
  startTime: string;
  totalCatchCount: number;
  fishSpeciesCount: number;
}

interface TripsMapViewProps {
  trips: TripMarker[];
}

// 自定义钓点标记图标
const createFishingMarkerIcon = (catchCount: number) => {
  const size = Math.min(40, 28 + catchCount * 2); // 根据渔获数调整大小
  const bgColor = catchCount > 5 ? "#16a34a" : catchCount > 0 ? "#3b82f6" : "#6b7280";
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, ${bgColor} 0%, ${adjustColor(bgColor, -30)} 100%);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-size: ${size * 0.35}px;
          font-weight: bold;
        ">${catchCount}</span>
      </div>
    `,
    className: "fishing-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

// 调整颜色明暗度
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// 格式化日期
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TripsMapView({ trips }: TripsMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripMarker | null>(null);

  // 初始化地图
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // 计算中心点
    let center: [number, number] = [30.2741, 120.1551]; // 默认杭州
    let zoom = 10;

    if (trips.length > 0) {
      const lats = trips.map((t) => t.lat);
      const lngs = trips.map((t) => t.lng);
      center = [
        (Math.min(...lats) + Math.max(...lats)) / 2,
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
      ];
      
      // 根据范围调整缩放级别
      const latRange = Math.max(...lats) - Math.min(...lats);
      const lngRange = Math.max(...lngs) - Math.min(...lngs);
      const range = Math.max(latRange, lngRange);
      if (range < 0.01) zoom = 15;
      else if (range < 0.1) zoom = 12;
      else if (range < 1) zoom = 10;
      else zoom = 8;
    }

    // 创建地图实例
    const map = L.map(containerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
      attributionControl: true,
    });

    // 添加缩放控件
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // 使用高德地图瓦片
    L.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}", {
      subdomains: ["1", "2", "3", "4"],
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.amap.com/">高德地图</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 添加标记
  useEffect(() => {
    if (!mapRef.current) return;

    // 清除旧标记
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // 添加新标记
    trips.forEach((trip) => {
      const marker = L.marker([trip.lat, trip.lng], {
        icon: createFishingMarkerIcon(trip.totalCatchCount),
      });

      marker.on("click", () => {
        setSelectedTrip(trip);
      });

      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    // 如果有多个标记，调整视野
    if (trips.length > 1) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [trips]);

  return (
    <div className="relative h-full w-full z-0">
      <div ref={containerRef} className="h-full w-full" />

      {/* 图例 - 移动端左上角，PC端左下角 */}
      <div className="absolute left-4 top-4 z-[500] rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm md:bottom-8 md:top-auto md:rounded-2xl">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">图例说明</h3>
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span>渔获 &gt; 5 尾</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span>渔获 1-5 尾</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-slate-500" />
            <span>空军</span>
          </div>
        </div>
      </div>

      {/* 选中的出击详情 - 移动端底部全宽，PC端右侧固定宽度 */}
      {selectedTrip && (
        <div className="absolute bottom-24 left-4 right-4 z-[500] rounded-2xl bg-white p-4 shadow-xl md:bottom-8 md:left-auto md:right-8 md:w-96 md:p-5">
          <button
            onClick={() => setSelectedTrip(null)}
            className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h3 className="pr-8 text-lg font-semibold text-slate-900">
            {selectedTrip.title || selectedTrip.locationName}
          </h3>
          {selectedTrip.title && (
            <p className="mt-1 text-sm text-slate-500">{selectedTrip.locationName}</p>
          )}

          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-slate-600">{formatDate(selectedTrip.startTime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-slate-600">
                {selectedTrip.totalCatchCount} 尾 / {selectedTrip.fishSpeciesCount} 种
              </span>
            </div>
          </div>

          <Link
            href={`/trips/${selectedTrip.id}`}
            className="mt-4 block w-full rounded-xl bg-blue-600 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            查看详情
          </Link>
        </div>
      )}
    </div>
  );
}
