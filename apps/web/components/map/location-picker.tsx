"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, X } from "lucide-react";

// 地图容器组件的 Props 类型
interface MapContainerProps {
  center: { lat: number; lng: number };
  zoom?: number;
  marker?: { lat: number; lng: number } | null;
  onClick?: (latlng: { lat: number; lng: number }) => void;
}

// 动态导入地图组件，禁用 SSR
const MapWithNoSSR = dynamic<MapContainerProps>(
  () => import("@/components/map/map-container"),
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

interface LocationPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange: (location: { lat: number; lng: number; address?: string } | null) => void;
  locationName?: string;
  onLocationNameChange?: (name: string) => void;
}

export default function LocationPicker({
  value,
  onChange,
  locationName = "",
  onLocationNameChange,
}: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number } | null>(value || null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 获取当前位置
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("您的浏览器不支持定位功能");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setTempLocation(newLocation);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("定位权限被拒绝，请在浏览器设置中允许定位");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("无法获取位置信息");
            break;
          case error.TIMEOUT:
            setLocationError("定位超时，请重试");
            break;
          default:
            setLocationError("定位失败，请重试");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // 打开地图时，如果有已选位置则使用，否则尝试获取当前位置
  const handleOpenMap = () => {
    setIsOpen(true);
    if (!tempLocation) {
      getCurrentLocation();
    }
  };

  // 确认选择
  const handleConfirm = () => {
    if (tempLocation) {
      onChange(tempLocation);
    }
    setIsOpen(false);
  };

  // 清除选择
  const handleClear = () => {
    setTempLocation(null);
    onChange(null);
  };

  return (
    <div className="space-y-3">
      {/* 地点名称输入 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          地点名称 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={locationName}
          onChange={(e) => onLocationNameChange?.(e.target.value)}
          placeholder="例如：千岛湖大桥北侧"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* 地图选点入口 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          精确位置（可选）
        </label>
        <button
          type="button"
          onClick={handleOpenMap}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:border-blue-300 hover:bg-blue-50/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              {value ? (
                <>
                  <p className="text-sm font-medium text-slate-900">已选择位置</p>
                  <p className="text-xs text-slate-500">
                    {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">点击地图选点</p>
                  <p className="text-xs text-slate-500">选择精确钓点，方便下次导航</p>
                </>
              )}
            </div>
          </div>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </button>
      </div>

      {/* 地图弹窗 - PC端居中显示，移动端全屏 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 md:p-8">
          <div className="flex h-full w-full flex-col bg-white md:h-[80vh] md:max-h-[800px] md:w-full md:max-w-4xl md:rounded-2xl md:shadow-2xl">
          {/* 顶部导航 */}
          <header className="flex h-14 items-center justify-between border-b border-slate-100 px-4 md:px-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-base font-semibold text-slate-900">选择钓点位置</h2>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!tempLocation}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:text-slate-300 md:bg-blue-600 md:text-white md:hover:bg-blue-700 md:disabled:bg-slate-200 md:disabled:text-slate-400"
            >
              确定
            </button>
          </header>

          {/* 地图区域 */}
          <div className="relative flex-1">
            <MapWithNoSSR
              center={tempLocation || { lat: 30.2741, lng: 120.1551 }}
              zoom={tempLocation ? 15 : 10}
              marker={tempLocation}
              onClick={(latlng: { lat: number; lng: number }) => setTempLocation(latlng)}
            />

            {/* 定位按钮 */}
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isLocating}
              className="absolute bottom-24 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:bg-slate-50 disabled:opacity-50 md:bottom-8 md:h-14 md:w-14"
            >
              {isLocating ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
              ) : (
                <Navigation className="h-5 w-5 text-blue-600 md:h-6 md:w-6" />
              )}
            </button>

            {/* 错误提示 */}
            {locationError && (
              <div className="absolute left-4 right-4 top-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 md:left-1/2 md:right-auto md:w-96 md:-translate-x-1/2">
                {locationError}
              </div>
            )}
          </div>

          {/* 底部信息 */}
          <div className="border-t border-slate-100 bg-white px-4 py-4 pb-8 md:pb-4">
            {tempLocation ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">已选择位置</p>
                  <p className="text-xs text-slate-500">
                    纬度 {tempLocation.lat.toFixed(6)}, 经度 {tempLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-slate-500">
                点击地图选择钓点位置，或使用右下角定位按钮获取当前位置
              </p>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
