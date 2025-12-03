"use client";

import { Card, Typography, Input, Button, Table, Avatar, Tag, Pagination, Popconfirm, message, Space } from "antd";
import { SearchOutlined, TeamOutlined, UserOutlined, StopOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
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

  const toggleAdmin = async (userId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !current }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "操作失败");
      }
      message.success(!current ? "已设为管理员" : "已取消管理员权限");
      router.refresh();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "操作失败");
    }
  };

  const toggleBan = async (userId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !current }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "操作失败");
      }
      message.success(!current ? "已封禁该用户" : "已解除封禁");
      router.refresh();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "操作失败");
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "删除失败");
      }
      message.success("用户已删除");
      router.refresh();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "删除失败");
    }
  };

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
            {
              title: "角色",
              dataIndex: "isAdmin",
              align: "center",
              render: (isAdmin: boolean) =>
                isAdmin ? <Tag color="blue">管理员</Tag> : <Tag>普通用户</Tag>,
            },
            {
              title: "状态",
              dataIndex: "isBanned",
              align: "center",
              render: (isBanned: boolean) =>
                isBanned ? <Tag color="red">已封禁</Tag> : <Tag color="green">正常</Tag>,
            },
            {
              title: "操作",
              key: "actions",
              fixed: "right",
              width: 280,
              render: (_: unknown, record: UserWithCounts) => (
                <Space size="small">
                  <Popconfirm
                    title={record.isAdmin ? "取消管理员权限" : "设为管理员"}
                    description={
                      record.isAdmin
                        ? "确认取消该用户的管理员权限吗？"
                        : "确认将该用户设为管理员吗？"
                    }
                    onConfirm={() => toggleAdmin(record.id, record.isAdmin)}
                  >
                    <Button
                      size="small"
                      icon={<SafetyCertificateOutlined />}
                      type={record.isAdmin ? "default" : "primary"}
                    >
                      {record.isAdmin ? "取消管理员" : "设为管理员"}
                    </Button>
                  </Popconfirm>
                  <Popconfirm
                    title={record.isBanned ? "解除封禁" : "封禁用户"}
                    description={
                      record.isBanned
                        ? "确认解除该用户的封禁吗？"
                        : "确认封禁该用户吗？被封禁后将无法登录和使用服务。"
                    }
                    onConfirm={() => toggleBan(record.id, record.isBanned)}
                  >
                    <Button
                      size="small"
                      danger={!record.isBanned}
                      icon={<StopOutlined />}
                    >
                      {record.isBanned ? "解除封禁" : "封禁"}
                    </Button>
                  </Popconfirm>
                  <Popconfirm
                    title="删除用户"
                    description="确认删除该用户及其所有数据吗？此操作不可恢复。"
                    okText="确认删除"
                    okType="danger"
                    cancelText="取消"
                    onConfirm={() => deleteUser(record.id)}
                  >
                    <Button size="small" danger>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              ),
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
