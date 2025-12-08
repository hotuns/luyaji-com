"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { getLeafletInstance } from "./leaflet-loader";

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

interface TripsMapViewProps {
  spots: SpotMarker[];
}

// 自定义钓点标记图标
const createFishingMarkerIcon = (L: typeof import("leaflet"), tripCount: number) => {
  const size = Math.min(40, 24 + tripCount * 2); // 根据出击次数调整大小
  const bgColor = tripCount >= 5 ? "#16a34a" : tripCount > 0 ? "#3b82f6" : "#6b7280";
  
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
        ">${tripCount}</span>
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
function formatDate(isoString?: string | null): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TripsMapView({ spots }: TripsMapViewProps) {
  const leaflet = useMemo(() => getLeafletInstance(), []);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<SpotMarker | null>(null);

  // 初始化地图
  useEffect(() => {
    if (!leaflet || !containerRef.current || mapRef.current) return;

    // 计算中心点
    let center: [number, number] = [30.2741, 120.1551]; // 默认杭州
    let zoom = 10;

    if (spots.length > 0) {
      const lats = spots.map((t) => t.lat);
      const lngs = spots.map((t) => t.lng);
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
    const map = leaflet.map(containerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
      attributionControl: true,
    });

    // 添加缩放控件
    leaflet.control.zoom({ position: "bottomright" }).addTo(map);

    // 使用高德地图瓦片
    leaflet.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}", {
      subdomains: ["1", "2", "3", "4"],
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.amap.com/">高德地图</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leaflet, spots]);

  // 添加标记
  useEffect(() => {
    if (!leaflet || !mapRef.current) return;

    // 清除旧标记
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // 添加新标记
    spots.forEach((spot) => {
      const marker = leaflet.marker([spot.lat, spot.lng], {
        icon: createFishingMarkerIcon(leaflet, spot.tripCount),
      });

      marker.on("click", () => {
        setSelectedSpot(spot);
      });

      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    // 如果有多个标记，调整视野
    if (spots.length > 1) {
      const group = leaflet.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [leaflet, spots]);

  return (
    <div className="relative h-full w-full z-0">
      <div ref={containerRef} className="h-full w-full" />

      {/* 图例 - 移动端左上角，PC端左下角 */}
      <div className="absolute left-4 top-4 z-[500] rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm md:bottom-8 md:top-auto md:rounded-2xl">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">图例说明</h3>
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span>出击次数 ≥ 5</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span>出击 1-4 次</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-slate-500" />
            <span>尚未出击</span>
          </div>
        </div>
      </div>

      {/* 选中的钓点详情 */}
      {selectedSpot && (
        <div className="absolute bottom-24 left-4 right-4 z-[500] rounded-2xl bg-white p-4 shadow-xl md:bottom-8 md:left-auto md:right-8 md:w-96 md:p-5">
          <button
            onClick={() => setSelectedSpot(null)}
            className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h3 className="pr-8 text-lg font-semibold text-slate-900">
            {selectedSpot.name}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{selectedSpot.locationName}</p>
          {selectedSpot.description && (
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">{selectedSpot.description}</p>
          )}

          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-slate-600">
                {selectedSpot.lastTrip ? formatDate(selectedSpot.lastTrip.startTime) : "尚无出击"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-slate-600">
                {selectedSpot.tripCount} 次出击
              </span>
            </div>
          </div>

          {selectedSpot.lastTrip ? (
            <div className="mt-4 grid gap-2 rounded-2xl bg-blue-50 p-3 text-xs text-blue-700">
              <div className="font-semibold">最近出击</div>
              <div className="text-blue-900">
                {selectedSpot.lastTrip.title || "未命名出击"} · {formatDate(selectedSpot.lastTrip.startTime)}
              </div>
              <div className="flex justify-between text-blue-600">
                <span>渔获：{selectedSpot.lastTrip.totalCatchCount} 条</span>
                <span>鱼种：{selectedSpot.lastTrip.fishSpeciesCount}</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
              暂无出击记录，快去完成第一次打卡吧！
            </div>
          )}

          <div className="mt-4 text-xs text-slate-400">
            坐标：{selectedSpot.lat.toFixed(5)}, {selectedSpot.lng.toFixed(5)}
          </div>
          <Link
            href={`/spots?edit=${selectedSpot.id}`}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-blue-200 hover:text-blue-600"
          >
            管理该钓点
          </Link>
        </div>
      )}
    </div>
  );
}
