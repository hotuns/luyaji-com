"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

type MetadataItem = {
  id: string;
  category: string;
  value: string;
  label: string;
  extra: unknown;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CategoryInfo = {
  key: string;
  label: string;
  description: string;
  count: number;
};

type Props = {
  categories: CategoryInfo[];
  data: Record<string, MetadataItem[]>;
  categoryInfo: Record<string, { label: string; description: string }>;
};

export function MetadataTabs({ categories, data, categoryInfo }: Props) {
  const [activeTab, setActiveTab] = useState(categories[0]?.key || "rod_brand");
  const [items, setItems] = useState(data);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MetadataItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const currentItems = items[activeTab] || [];

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      category: activeTab,
      sortOrder: currentItems.length + 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (record: MetadataItem) => {
    setEditingItem(record);
    form.setFieldsValue({
      category: record.category,
      value: record.value,
      label: record.label,
      sortOrder: record.sortOrder,
      isActive: record.isActive,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/metadata/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setItems((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab]?.filter((item) => item.id !== id) || [],
      }));
      message.success("删除成功");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const url = editingItem
        ? `/api/metadata/${editingItem.id}`
        : "/api/metadata";
      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();

      if (!json.success) throw new Error(json.error);

      if (editingItem) {
        // 更新
        setItems((prev) => ({
          ...prev,
          [activeTab]:
            prev[activeTab]?.map((item) =>
              item.id === editingItem.id ? json.data : item
            ) || [],
        }));
        message.success("更新成功");
      } else {
        // 新增
        const category = values.category;
        setItems((prev) => ({
          ...prev,
          [category]: [...(prev[category] || []), json.data],
        }));
        if (category !== activeTab) {
          setActiveTab(category);
        }
        message.success("添加成功");
      }

      setModalOpen(false);
      form.resetFields();
    } catch (error) {
      if (error instanceof Error && error.message) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (record: MetadataItem) => {
    try {
      const res = await fetch(`/api/metadata/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !record.isActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setItems((prev) => ({
        ...prev,
        [activeTab]:
          prev[activeTab]?.map((item) =>
            item.id === record.id ? { ...item, isActive: !record.isActive } : item
          ) || [],
      }));
    } catch (error) {
      message.error(error instanceof Error ? error.message : "操作失败");
    }
  };

  const columns: ColumnsType<MetadataItem> = [
    {
      title: "排序",
      dataIndex: "sortOrder",
      width: 70,
      align: "center",
    },
    {
      title: "存储值",
      dataIndex: "value",
      width: 150,
      render: (v) => <code style={{ fontSize: 12 }}>{v}</code>,
    },
    {
      title: "显示文本",
      dataIndex: "label",
      width: 200,
    },
    {
      title: "状态",
      dataIndex: "isActive",
      width: 80,
      align: "center",
      render: (v, record) => (
        <Switch
          checked={v}
          size="small"
          onChange={() => handleToggleActive(record)}
        />
      ),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      width: 160,
      render: (v) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除？"
            description="删除后不可恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = categories.map((cat) => ({
    key: cat.key,
    label: (
      <span>
        {cat.label}{" "}
        <Tag style={{ marginLeft: 4 }}>{items[cat.key]?.length || 0}</Tag>
      </span>
    ),
  }));

  // 添加「新增分类」选项
  const categoryOptions = [
    ...categories.map((c) => ({ value: c.key, label: c.label })),
    { value: "__new__", label: "➕ 新建分类..." },
  ];

  return (
    <Card>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        tabBarExtraContent={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加选项
          </Button>
        }
      />

      <div style={{ marginBottom: 12, color: "#888", fontSize: 13 }}>
        {categoryInfo[activeTab]?.description || `分类: ${activeTab}`}
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={currentItems}
        pagination={false}
        size="small"
        locale={{ emptyText: "暂无数据，点击上方按钮添加" }}
      />

      <Modal
        title={editingItem ? "编辑选项" : "添加选项"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: "请选择分类" }]}
          >
            <Select
              options={categoryOptions}
              disabled={!!editingItem}
              placeholder="选择分类"
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.category !== curr.category}
          >
            {({ getFieldValue }) =>
              getFieldValue("category") === "__new__" && (
                <Form.Item
                  name="newCategory"
                  label="新分类标识"
                  rules={[
                    { required: true, message: "请输入分类标识" },
                    { pattern: /^[a-z_]+$/, message: "只允许小写字母和下划线" },
                  ]}
                >
                  <Input placeholder="例如: lure_type" />
                </Form.Item>
              )
            }
          </Form.Item>

          <Form.Item
            name="value"
            label="存储值"
            rules={[
              { required: true, message: "请输入存储值" },
              { pattern: /^[a-z0-9_-]+$/, message: "只允许小写字母、数字、下划线和连字符" },
            ]}
            tooltip="程序内部使用的标识符，如 shimano"
          >
            <Input placeholder="例如: shimano" disabled={!!editingItem} />
          </Form.Item>

          <Form.Item
            name="label"
            label="显示文本"
            rules={[{ required: true, message: "请输入显示文本" }]}
            tooltip="用户界面展示的文本，如「禧玛诺 Shimano」"
          >
            <Input placeholder="例如: 禧玛诺 Shimano" />
          </Form.Item>

          <Form.Item name="sortOrder" label="排序权重" tooltip="数字越小越靠前">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="isActive" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
