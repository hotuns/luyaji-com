"use client";

import Link from "next/link";
import { Card, Col, List, Row, Statistic, Typography, Avatar } from "antd";
import {
  UserOutlined,
  EnvironmentOutlined,
  GoldOutlined,
  DatabaseOutlined,
  ToolOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import type { Prisma } from "@prisma/client";
import type { ReactNode } from "react";

type UserWithCounts = Prisma.UserGetPayload<{
  select: {
    id: true;
    nickname: true;
    phone: true;
    createdAt: true;
    _count: { select: { trips: true; catches: true } };
  };
}>;

type TripWithMeta = Prisma.TripGetPayload<{
  select: {
    id: true;
    title: true;
    startTime: true;
    user: { select: { nickname: true; phone: true } };
    _count: { select: { catches: true } };
    spot: { select: { name: true; locationName: true } };
  };
}>;

export function DashboardOverview({
  stats,
  recentUsers,
  recentTrips,
}: {
  stats: {
    userCount: number;
    tripCount: number;
    catchCount: number;
    speciesCount: number;
    rodCount: number;
    reelCount: number;
    comboCount: number;
  };
  recentUsers: UserWithCounts[];
  recentTrips: TripWithMeta[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          仪表盘
        </Typography.Title>
        <Typography.Text type="secondary">系统数据概览</Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={6}>
          <StatCard
            title="用户总数"
            value={stats.userCount}
            icon={<UserOutlined />}
            color="#1677ff"
            href="/users"
          />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <StatCard
            title="出击记录"
            value={stats.tripCount}
            icon={<EnvironmentOutlined />}
            color="#52c41a"
            href="/trips"
          />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <StatCard
            title="渔获总数"
            value={stats.catchCount}
            icon={<GoldOutlined />}
            color="#fa8c16"
          />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <StatCard
            title="鱼种数量"
            value={stats.speciesCount}
            icon={<DatabaseOutlined />}
            color="#722ed1"
            href="/fish-species"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <StatCard
            title="鱼竿数量"
            value={stats.rodCount}
            icon={<ToolOutlined />}
            color="#13c2c2"
            href="/gear?tab=rods"
          />
        </Col>
        <Col xs={24} md={8}>
          <StatCard
            title="渔轮数量"
            value={stats.reelCount}
            icon={<ShoppingOutlined />}
            color="#eb2f96"
            href="/gear?tab=reels"
          />
        </Col>
        <Col xs={24} md={8}>
          <StatCard
            title="组合数量"
            value={stats.comboCount}
            icon={<AppstoreOutlined />}
            color="#2f54eb"
            href="/gear?tab=combos"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="最近注册用户"
            extra={<Link href="/users">查看全部</Link>}
            bordered
            styles={{ body: { padding: 0 } }}
          >
            <List
              dataSource={recentUsers}
              locale={{ emptyText: "暂无用户" }}
              renderItem={(user) => (
                <List.Item key={user.id} style={{ paddingInline: 16 }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: "#e6f4ff", color: "#1677ff" }}>
                        {(user.nickname || "用户").charAt(0)}
                      </Avatar>
                    }
                    title={user.nickname || "未设置昵称"}
                    description={maskPhone(user.phone)}
                  />
                  <div style={{ textAlign: "right" }}>
                    <Typography.Text>{user._count.trips} 次出击</Typography.Text>
                    <br />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {formatDate(user.createdAt)}
                    </Typography.Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="最近出击记录"
            extra={<Link href="/trips">查看全部</Link>}
            bordered
            styles={{ body: { padding: 0 } }}
          >
            <List
              dataSource={recentTrips}
              locale={{ emptyText: "暂无记录" }}
              renderItem={(trip) => (
                <List.Item key={trip.id} style={{ paddingInline: 16 }}>
                  <List.Item.Meta
                    title={trip.title || trip.spot?.name || trip.spot?.locationName || "未设置钓点"}
                    description={trip.user.nickname || maskPhone(trip.user.phone)}
                  />
                  <div style={{ textAlign: "right" }}>
                    <Typography.Text>{trip._count.catches} 条渔获</Typography.Text>
                    <br />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {formatDate(trip.startTime)}
                    </Typography.Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  href,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  color: string;
  href?: string;
}) {
  const card = (
    <Card hoverable={!!href}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Avatar size={48} style={{ backgroundColor: `${color}1A`, color, fontSize: 22 }} icon={icon} />
        <div>
          <Statistic value={value} valueStyle={{ fontSize: 26, marginBottom: 0 }} />
          <Typography.Text type="secondary">{title}</Typography.Text>
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        {card}
      </Link>
    );
  }

  return card;
}

function maskPhone(phone?: string | null) {
  if (!phone) return "未绑定";
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(date));
}
