"use client";

import { Card, Typography, Input, Button, Table, Avatar, Tag, Pagination } from "antd";
import { SearchOutlined, TeamOutlined } from "@ant-design/icons";
import type { Prisma } from "@prisma/client";
import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const { Title, Text } = Typography;

type UserWithCounts = Prisma.UserGetPayload<{
  include: {
    _count: {
      select: { trips: true; catches: true; combos: true };
    };
  };
}>;

export function UsersTable({
  users,
  total,
  page,
  pageSize,
  search,
}: {
  users: UserWithCounts[];
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
      router.push(`/users?${params.toString()}`);
    },
    [router, searchParams, search]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          用户管理
        </Title>
        <Text type="secondary">共 {total} 位用户</Text>
      </div>

      <Card>
        <form style={{ display: "flex", gap: 12 }}>
          <Input
            name="search"
            defaultValue={search}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索手机号或昵称..."
          />
          <input type="hidden" name="page" value="1" />
          <Button htmlType="submit" type="primary">
            搜索
          </Button>
        </form>
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <TeamOutlined />
          <Text strong>用户列表</Text>
        </div>
        <Table
          rowKey="id"
          size="middle"
          dataSource={users}
          pagination={false}
          scroll={{ x: true }}
          columns={[
            {
              title: "用户",
              dataIndex: "nickname",
              render: (_: unknown, record: UserWithCounts) => (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar style={{ backgroundColor: "#e6f4ff", color: "#1677ff" }}>
                    {(record.nickname || "用户").charAt(0)}
                  </Avatar>
                  <span>{record.nickname || "未设置昵称"}</span>
                </div>
              ),
            },
            {
              title: "手机号",
              dataIndex: "phone",
              render: (phone: string | null) => phone || "未绑定",
            },
            {
              title: "出击",
              dataIndex: ["_count", "trips"],
              align: "center",
              render: (value: number) => <Tag>{value}</Tag>,
            },
            {
              title: "渔获",
              dataIndex: ["_count", "catches"],
              align: "center",
              render: (value: number) => <Tag>{value}</Tag>,
            },
            {
              title: "组合",
              dataIndex: ["_count", "combos"],
              align: "center",
              render: (value: number) => <Tag>{value}</Tag>,
            },
            {
              title: "注册时间",
              dataIndex: "createdAt",
              render: (value: Date) => formatDate(value),
            },
          ]}
          locale={{ emptyText: "暂无用户数据" }}
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(date));
}
