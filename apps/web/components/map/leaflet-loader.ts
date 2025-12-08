"use client";

let leafletInstance: typeof import("leaflet") | null = null;

export function getLeafletInstance() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!leafletInstance) {
    const L = require("leaflet") as typeof import("leaflet");

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });

    leafletInstance = L;
  }

  return leafletInstance;
}
