"use client";

import {
  AppstoreOutlined,
  InboxOutlined,
  LogoutOutlined,
  RadarChartOutlined,
  SettingOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Layout, Menu, theme, Typography } from "antd";
import type { MenuProps } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const { Header, Sider, Content } = Layout;

const NAV_ITEMS = [
  { key: "/dashboard", label: "仪表盘", icon: <AppstoreOutlined /> },
  { key: "/users", label: "用户管理", icon: <TeamOutlined /> },
  { key: "/trips", label: "出击记录", icon: <UnorderedListOutlined /> },
  { key: "/fish-species", label: "鱼种管理", icon: <RadarChartOutlined /> },
  { key: "/gear", label: "装备管理", icon: <InboxOutlined /> },
  { key: "/settings", label: "系统设置", icon: <SettingOutlined /> },
];

export function AdminShell({
  user,
  children,
}: {
  user?: { name?: string | null; email?: string | null } | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const {
    token: { colorBgContainer, boxShadowSecondary },
  } = theme.useToken();

  const selectedKey = useMemo(() => {
    const found = NAV_ITEMS.find((item) => pathname.startsWith(item.key));
    return found ? [found.key] : [NAV_ITEMS[0].key];
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/signin");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const dropdownItems: MenuProps["items"] = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: isLoggingOut ? "正在退出..." : "退出登录",
      onClick: handleLogout,
      disabled: isLoggingOut,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider breakpoint="lg" collapsedWidth={56} theme="light" width={220} style={{ borderRight: "1px solid #f0f0f0" }}>
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "#1677ff",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
            }}
          >
            钓
          </div>
          <Typography.Title level={5} style={{ margin: 0 }}>
            路亚记后台
          </Typography.Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKey}
          items={NAV_ITEMS}
          onClick={({ key }) => router.push(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: colorBgContainer,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "0 24px",
            boxShadow: boxShadowSecondary,
            zIndex: 5,
          }}
        >
          <Dropdown menu={{ items: dropdownItems }} trigger={["click"]}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <Avatar style={{ backgroundColor: "#1677ff" }}>{(user?.name || "管理员").slice(0, 1)}</Avatar>
              <div>
                <Typography.Text strong>{user?.name || "管理员"}</Typography.Text>
                <Typography.Paragraph style={{ margin: 0 }} type="secondary">
                  {user?.email || "后台账号"}
                </Typography.Paragraph>
              </div>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24 }}>
          <div
            style={{
              minHeight: "calc(100vh - 160px)",
              background: colorBgContainer,
              borderRadius: 12,
              padding: 24,
              boxShadow: boxShadowSecondary,
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
