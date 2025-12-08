"use client";

import {
  AppstoreOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  InboxOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RadarChartOutlined,
  SettingOutlined,
  NotificationOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Breadcrumb,
  Button,
  Dropdown,
  Layout,
  Menu,
  theme,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";

const { Header, Sider, Content } = Layout;

const NAV_ITEMS = [
  { key: "/dashboard", label: "仪表盘", icon: <AppstoreOutlined /> },
  { key: "/analytics", label: "数据分析", icon: <BarChartOutlined /> },
  { key: "/users", label: "用户管理", icon: <TeamOutlined /> },
  { key: "/trips", label: "出击记录", icon: <UnorderedListOutlined /> },
  { key: "/fish-species", label: "鱼种管理", icon: <RadarChartOutlined /> },
  { key: "/gear", label: "装备管理", icon: <InboxOutlined /> },
  { key: "/share-assets", label: "分享素材", icon: <ShareAltOutlined /> },
  { key: "/metadata", label: "元数据管理", icon: <DatabaseOutlined /> },
  { key: "/announcements", label: "公告管理", icon: <NotificationOutlined /> },
  { key: "/settings", label: "系统设置", icon: <SettingOutlined /> },
];

const BREADCRUMB_NAME_MAP: Record<string, string> = {
  "/dashboard": "仪表盘",
  "/analytics": "数据分析",
  "/users": "用户管理",
  "/trips": "出击记录",
  "/fish-species": "鱼种管理",
  "/gear": "装备管理",
  "/share-assets": "分享素材",
  "/metadata": "元数据管理",
  "/announcements": "公告管理",
  "/settings": "系统设置",
};

export function AdminShell({
  user,
  children,
}: {
  user?: { name?: string | null; email?: string | null } | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const {
    token: { colorBgContainer, colorBgLayout, borderRadiusLG },
  } = theme.useToken();

  const selectedKey = useMemo(() => {
    const found = NAV_ITEMS.find((item) => pathname.startsWith(item.key));
    return found ? [found.key] : NAV_ITEMS[0] ? [NAV_ITEMS[0].key] : [];
  }, [pathname]);

  const breadcrumbItems = useMemo(() => {
    const pathSnippets = pathname.split("/").filter((i) => i);
    const items = pathSnippets.map((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join("/")}`;
      const title = BREADCRUMB_NAME_MAP[url] || (index === pathSnippets.length - 1 && pathSnippets.length > 1 ? "详情" : url);
      return {
        key: url,
        title: index === pathSnippets.length - 1 ? title : <Link href={url}>{title}</Link>,
      };
    });
    return [{ key: "/", title: <Link href="/dashboard">首页</Link> }, ...items];
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
      key: "profile",
      icon: <UserOutlined />,
      label: "个人中心",
      disabled: true,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: isLoggingOut ? "正在退出..." : "退出登录",
      onClick: handleLogout,
      disabled: isLoggingOut,
      danger: true,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          if (broken) setCollapsed(true);
        }}
        theme="light"
        width={240}
        style={{
          borderRight: "1px solid rgba(5, 5, 5, 0.06)",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: 64,
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: "1px solid rgba(5, 5, 5, 0.06)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #1677ff 0%, #0050b3 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            钓
          </div>
          {!collapsed && (
            <Typography.Title
              level={5}
              style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              路亚记后台
            </Typography.Title>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKey}
          items={NAV_ITEMS}
          onClick={({ key }) => router.push(key)}
          style={{ borderRight: 0, padding: "8px 0" }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: "all 0.2s" }}>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 99,
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: "16px",
                width: 32,
                height: 32,
              }}
            />
            <Breadcrumb items={breadcrumbItems} />
          </div>
          
          <Dropdown menu={{ items: dropdownItems }} trigger={["click"]}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 6,
                transition: "background-color 0.2s",
              }}
              className="hover:bg-gray-50"
            >
              <Avatar
                style={{
                  backgroundColor: "#1677ff",
                  verticalAlign: "middle",
                }}
                size="small"
              >
                {(user?.name || "A").slice(0, 1).toUpperCase()}
              </Avatar>
              <span style={{ fontSize: 14, color: "rgba(0, 0, 0, 0.88)" }}>
                {user?.name || "管理员"}
              </span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: "24px 24px 0",
            minHeight: 280,
            background: colorBgLayout,
          }}
        >
          <div
            style={{
              padding: 24,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              minHeight: "calc(100vh - 112px)", // Header 64 + Margin 24 + Margin 24
            }}
          >
            {children}
          </div>
        </Content>
        <Layout.Footer style={{ textAlign: "center", color: "rgba(0, 0, 0, 0.45)" }}>
          Luyaji Admin ©{new Date().getFullYear()} Created by Hotuns
        </Layout.Footer>
      </Layout>
    </Layout>
  );
}
