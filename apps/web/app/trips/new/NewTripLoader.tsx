"use client";

import dynamic from "next/dynamic";

// 在客户端中动态导入真实的客户端页面组件，并禁用 SSR
const DynamicNewTrip = dynamic(() => import("./NewTripClient"), { ssr: false });

export default function NewTripLoader() {
  return <DynamicNewTrip />;
}
