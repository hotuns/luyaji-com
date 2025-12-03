"use client";

import { useState } from "react";
import { Button, Card, Form, Input, Modal, Space, Switch, Table, Tag, message, DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import type { Prisma } from "@prisma/client";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";

type Announcement = Prisma.AnnouncementGetPayload<{}>;

type FormValues = {
  title: string;
  content: string;
  isActive: boolean;
  startsAt?: Dayjs | null;
  endsAt?: Dayjs | null;
  showAsBanner?: boolean;
};

export function AnnouncementsTable({ initialData }: { initialData: Announcement[] }) {
  const [items, setItems] = useState(initialData);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [createForm] = Form.useForm<FormValues>();
  const [editForm] = Form.useForm<FormValues>();

  const openCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({ isActive: true });
    setIsCreateOpen(true);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const payload = {
        ...values,
        startsAt: values.startsAt ? values.startsAt.toISOString() : null,
        endsAt: values.endsAt ? values.endsAt.toISOString() : null,
      };
      setLoadingId("create");
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "创建失败");
      setItems((prev) => [json.data, ...prev]);
      setIsCreateOpen(false);
      message.success("已发布公告");
    } catch (e) {
      if (e instanceof Error) message.error(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      const values = await editForm.validateFields();
      const payload = {
        ...values,
        startsAt: values.startsAt ? values.startsAt.toISOString() : null,
        endsAt: values.endsAt ? values.endsAt.toISOString() : null,
      };
      setLoadingId(editing.id);
      const res = await fetch(`/api/announcements/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "更新失败");
      setItems((prev) => prev.map((a) => (a.id === editing.id ? json.data : a)));
      setEditing(null);
      message.success("更新成功");
    } catch (e) {
      if (e instanceof Error) message.error(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  const toggleActive = async (record: Announcement) => {
    try {
      setLoadingId(record.id);
      const res = await fetch(`/api/announcements/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !record.isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "更新失败");
      setItems((prev) => prev.map((a) => (a.id === record.id ? json.data : a)));
    } catch (e) {
      if (e instanceof Error) message.error(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>公告管理</h1>
        <p style={{ color: "#888" }}>发布和维护展示给用户的系统公告</p>
      </div>

      <Card>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建公告
        </Button>
      </Card>

      <Card title={`公告列表 (${items.length})`}>
        <Table
          rowKey="id"
          dataSource={items}
          pagination={false}
          columns={[
            {
              title: "标题",
              dataIndex: "title",
              render: (value: string) => <span style={{ fontWeight: 500 }}>{value}</span>,
            },
            {
              title: "内容预览",
              dataIndex: "content",
              ellipsis: true,
              render: (value: string) => value.slice(0, 40) + (value.length > 40 ? "..." : ""),
            },
            {
              title: "状态",
              dataIndex: "isActive",
              align: "center",
              render: (isActive: boolean) => (
                <Tag color={isActive ? "green" : "default"}>{isActive ? "展示中" : "已下线"}</Tag>
              ),
            },
            {
              title: "展示方式",
              dataIndex: "showAsBanner",
              align: "center",
              render: (_: boolean, record: Announcement) => {
                const now = new Date();
                const startsAt = record.startsAt ? new Date(record.startsAt as any) : null;
                const endsAt = record.endsAt ? new Date(record.endsAt as any) : null;
                let timeStatus: string = "";
                if (startsAt && startsAt > now) {
                  timeStatus = "（未开始）";
                } else if (endsAt && endsAt < now) {
                  timeStatus = "（已结束）";
                } else {
                  timeStatus = "（生效中）";
                }

                return (
                  <Space direction="vertical" size={2}>
                    <Tag color={record.showAsBanner ? "gold" : "default"}>
                      {record.showAsBanner ? "顶部横幅" : "普通"}
                    </Tag>
                    {(record.startsAt || record.endsAt) && (
                      <span style={{ fontSize: 11, color: "#999" }}>{timeStatus}</span>
                    )}
                  </Space>
                );
              },
            },
            {
              title: "发布时间",
              dataIndex: "publishedAt",
              render: (value: Date | null) => (value ? formatDate(value) : "-") ,
            },
            {
              title: "创建时间",
              dataIndex: "createdAt",
              render: (value: Date) => formatDate(value),
            },
            {
              title: "操作",
              key: "actions",
              width: 200,
              render: (_: unknown, record: Announcement) => (
                <Space size="small">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditing(record);
                      editForm.setFieldsValue({
                        title: record.title,
                        content: record.content,
                        isActive: record.isActive,
                        startsAt: record.startsAt ? (dayjs(record.startsAt as any) as any) : null,
                        endsAt: record.endsAt ? (dayjs(record.endsAt as any) as any) : null,
                        showAsBanner: record.showAsBanner,
                      });
                    }}
                  >
                    编辑
                  </Button>
                  <Switch
                    checked={record.isActive}
                    loading={loadingId === record.id}
                    onChange={() => toggleActive(record)}
                    checkedChildren="展示"
                    unCheckedChildren="隐藏"
                  />
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="新建公告"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        confirmLoading={loadingId === "create"}
        onOk={handleCreate}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入标题" }]}>
            <Input maxLength={50} placeholder="如：版本更新通知" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: "请输入内容" }]}
          >
            <Input.TextArea rows={4} maxLength={500} placeholder="公告正文，将展示在用户端" />
          </Form.Item>
          <Form.Item name="isActive" label="立即展示" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="生效时间范围（可选）">
            <Space>
              <Form.Item name="startsAt" noStyle>
                <DatePicker showTime placeholder="开始时间" />
              </Form.Item>
              <span>至</span>
              <Form.Item name="endsAt" noStyle>
                <DatePicker showTime placeholder="结束时间" />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="showAsBanner" label="首页顶部横幅" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑公告"
        open={!!editing}
        onCancel={() => setEditing(null)}
        confirmLoading={!!editing && loadingId === editing.id}
        onOk={handleUpdate}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入标题" }]}>
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: "请输入内容" }]}
          >
            <Input.TextArea rows={4} maxLength={500} />
          </Form.Item>
          <Form.Item name="isActive" label="是否展示" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="生效时间范围（可选）">
            <Space>
              <Form.Item name="startsAt" noStyle>
                <DatePicker showTime placeholder="开始时间" />
              </Form.Item>
              <span>至</span>
              <Form.Item name="endsAt" noStyle>
                <DatePicker showTime placeholder="结束时间" />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="showAsBanner" label="首页顶部横幅" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
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

// 避免直接引入 dayjs 默认实例到顶层类型
// 仅在需要时懒加载
const dayjs = require("dayjs") as typeof import("dayjs");
