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
    spot: { select: { name: true; locationName: true } };
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
              sorter: (a: TripWithMeta, b: TripWithMeta) => 
                (a.title || a.spot?.name || a.spot?.locationName || "").localeCompare(
                  b.title || b.spot?.name || b.spot?.locationName || ""
                ),
              render: (_: unknown, record: TripWithMeta) => (
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {record.title || record.spot?.name || record.spot?.locationName || "未设置钓点"}
                  </div>
                  {record.title && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#888" }}>
                      <EnvironmentOutlined />
                      {record.spot?.name || record.spot?.locationName || "未设置钓点"}
                    </div>
                  )}
                </div>
              ),
            },
            {
              title: "用户",
              dataIndex: ["user", "nickname"],
              sorter: (a: TripWithMeta, b: TripWithMeta) => 
                (a.user.nickname || "").localeCompare(b.user.nickname || ""),
              render: (_: unknown, record: TripWithMeta) => record.user.nickname || maskPhone(record.user.phone),
            },
            {
              title: "渔获",
              dataIndex: ["_count", "catches"],
              align: "center",
              sorter: (a: TripWithMeta, b: TripWithMeta) => a._count.catches - b._count.catches,
              render: (value: number) => (
                <Tag color={value > 0 ? "green" : undefined}>{value}</Tag>
              ),
            },
            {
              title: "天气",
              dataIndex: "weatherType",
              filters: [
                { text: "晴", value: "晴" },
                { text: "多云", value: "多云" },
                { text: "阴", value: "阴" },
                { text: "小雨", value: "小雨" },
                { text: "中雨", value: "中雨" },
                { text: "大雨", value: "大雨" },
              ],
              onFilter: (value: unknown, record: TripWithMeta) => record.weatherType === value,
              render: (_: unknown, record: TripWithMeta) =>
                [record.weatherType, record.weatherTemperatureText].filter(Boolean).join(" / ") || "-",
            },
            {
              title: "出击时间",
              dataIndex: "startTime",
              sorter: (a: TripWithMeta, b: TripWithMeta) => 
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
              defaultSortOrder: "descend",
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
              filters: [
                { text: "公开", value: "public" },
                { text: "私有", value: "private" },
              ],
              onFilter: (value: unknown, record: TripWithMeta) => record.visibility === value,
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
