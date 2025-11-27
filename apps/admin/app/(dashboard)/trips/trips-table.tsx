"use client";

import { Card, Typography, Input, Button, Table, Tag, Pagination } from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import type { Prisma } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const { Title, Text } = Typography;

type TripWithMeta = Prisma.TripGetPayload<{
  include: {
    user: { select: { nickname: true; phone: true } };
    _count: { select: { catches: true } };
  };
}>;

export function TripsTable({
  trips,
  total,
  page,
  pageSize,
  search,
}: {
  trips: TripWithMeta[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("page", String(nextPage));
      if (search) {
        params.set("search", search);
      }
      router.push(`/trips?${params.toString()}`);
    },
    [router, searchParams, search]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          出击记录
        </Title>
        <Text type="secondary">共 {total} 条记录</Text>
      </div>

      <Card>
        <form style={{ display: "flex", gap: 12 }}>
          <Input
            name="search"
            defaultValue={search}
            allowClear
            placeholder="搜索标题、地点或用户..."
            prefix={<SearchOutlined />}
          />
          <input type="hidden" name="page" value="1" />
          <Button htmlType="submit" type="primary">
            搜索
          </Button>
        </form>
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <EnvironmentOutlined />
          <Text strong>出击列表</Text>
        </div>
        <Table
          rowKey="id"
          size="middle"
          pagination={false}
          dataSource={trips}
          scroll={{ x: true }}
          columns={[
            {
              title: "标题/地点",
              dataIndex: "title",
              render: (_: unknown, record: TripWithMeta) => (
                <div>
                  <div style={{ fontWeight: 500 }}>{record.title || record.locationName}</div>
                  {record.title && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#888" }}>
                      <EnvironmentOutlined />
                      {record.locationName}
                    </div>
                  )}
                </div>
              ),
            },
            {
              title: "用户",
              dataIndex: ["user", "nickname"],
              render: (_: unknown, record: TripWithMeta) => record.user.nickname || maskPhone(record.user.phone),
            },
            {
              title: "渔获",
              dataIndex: ["_count", "catches"],
              align: "center",
              render: (value: number) => (
                <Tag color={value > 0 ? "green" : undefined}>{value}</Tag>
              ),
            },
            {
              title: "天气",
              dataIndex: "weatherType",
              render: (_: unknown, record: TripWithMeta) =>
                [record.weatherType, record.weatherTemperatureText].filter(Boolean).join(" / ") || "-",
            },
            {
              title: "出击时间",
              dataIndex: "startTime",
              render: (value: Date) => (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CalendarOutlined />
                  {formatDate(value)}
                </div>
              ),
            },
            {
              title: "可见性",
              dataIndex: "visibility",
              render: (value: string) => (
                <Tag icon={value === "public" ? <EyeOutlined /> : <EyeInvisibleOutlined />}>
                  {value === "public" ? "公开" : "私有"}
                </Tag>
              ),
            },
          ]}
          locale={{ emptyText: "暂无出击记录" }}
        />
        {total > pageSize && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <Text type="secondary">
              第 {page} / {Math.ceil(total / pageSize)} 页
            </Text>
            <Pagination
              size="small"
              current={page}
              total={total}
              pageSize={pageSize}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

function maskPhone(phone?: string | null) {
  if (!phone) return "未绑定";
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(date));
}
