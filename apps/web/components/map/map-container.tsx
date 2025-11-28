"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 修复 Leaflet 默认图标问题
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// 自定义钓点标记图标
const fishingMarkerIcon = L.divIcon({
  html: `
    <div style="
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg style="transform: rotate(45deg); width: 18px; height: 18px; color: white;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-4.94 6-8.5 6-3.56 0-6.06-2.53-7-6Z"/>
        <path d="M18 12v.5"/>
        <path d="M16 17.93a9.77 9.77 0 0 1-5 1.07"/>
        <path d="M2 12h2"/>
        <path d="M4 12a6 6 0 0 1 5-5.93"/>
      </svg>
    </div>
  `,
  className: "fishing-marker",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

interface MapContainerProps {
  center: { lat: number; lng: number };
  zoom?: number;
  marker?: { lat: number; lng: number } | null;
  onClick?: (latlng: { lat: number; lng: number }) => void;
}

export default function MapContainer({
  center,
  zoom = 13,
  marker,
  onClick,
}: MapContainerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // 初始化地图
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // 创建地图实例
    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: zoom,
      zoomControl: false,
      attributionControl: true,
    });

    // 添加缩放控件到右下角
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // 使用高德地图瓦片（中国大陆访问更快）
    L.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}", {
      subdomains: ["1", "2", "3", "4"],
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.amap.com/">高德地图</a>',
    }).addTo(map);

    // 点击事件
    if (onClick) {
      map.on("click", (e) => {
        onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 更新中心点
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setView([center.lat, center.lng], mapRef.current.getZoom(), {
        animate: true,
      });
    }
  }, [center.lat, center.lng]);

  // 更新标记
  useEffect(() => {
    if (!mapRef.current) return;

    // 移除旧标记
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    // 添加新标记
    if (marker) {
      markerRef.current = L.marker([marker.lat, marker.lng], {
        icon: fishingMarkerIcon,
      }).addTo(mapRef.current);

      // 将地图中心移动到标记位置
      mapRef.current.setView([marker.lat, marker.lng], mapRef.current.getZoom(), {
        animate: true,
      });
    }
  }, [marker?.lat, marker?.lng]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full z-0"
      style={{ minHeight: "300px" }}
    />
  );
}
