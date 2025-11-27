"use client";

import { ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 8,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
