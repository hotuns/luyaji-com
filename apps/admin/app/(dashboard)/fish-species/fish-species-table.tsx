"use client";

import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Switch,
  Popconfirm,
  message,
  Avatar,
} from "antd";
import type { FormInstance } from "antd/es/form";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CiOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import type { Prisma } from "@prisma/client";
import { useMemo, useState } from "react";

type FishSpecies = Prisma.FishSpeciesGetPayload<{
  include: { _count: { select: { catches: true } } };
}>;

type SpeciesFormValues = {
  name: string;
  latinName?: string;
  aliasNames?: string;
  habitatType?: string;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
};

export function FishSpeciesTable({
  initialSpecies,
}: {
  initialSpecies: FishSpecies[];
}) {
  const [species, setSpecies] = useState(initialSpecies);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSpecies, setEditingSpecies] = useState<FishSpecies | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [createForm] = Form.useForm<SpeciesFormValues>();
  const [editForm] = Form.useForm<SpeciesFormValues>();

  const filteredSpecies = useMemo(() => {
    if (!search.trim()) return species;
    const keyword = search.toLowerCase();
    return species.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.latinName?.toLowerCase().includes(keyword) ||
        normalizeAliases(item.aliasNames).some((alias) => alias.toLowerCase().includes(keyword))
    );
  }, [search, species]);

  const buildPayload = (values: SpeciesFormValues) => ({
    name: values.name,
    latinName: values.latinName || null,
    aliasNames: values.aliasNames
      ? values.aliasNames
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter(Boolean)
      : null,
    habitatType: values.habitatType || "fresh",
    imageUrl: values.imageUrl || null,
    description: values.description || null,
    isActive: values.isActive,
  });

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setLoadingId("create");
      const response = await fetch("/api/fish-species", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(values)),
      });
      const result = await response.json();
      if (result.success) {
        setSpecies((prev) => [...prev, { ...result.data, _count: { catches: 0 } }]);
        setIsCreateOpen(false);
        createForm.resetFields();
        message.success("新增成功");
      } else {
        message.error(result.message || "新增失败");
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleEdit = async () => {
    if (!editingSpecies) return;
    try {
      const values = await editForm.validateFields();
      setLoadingId(editingSpecies.id);
      const response = await fetch(`/api/fish-species/${editingSpecies.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(values)),
      });
      const result = await response.json();
      if (result.success) {
        setSpecies((prev) =>
          prev.map((item) => (item.id === editingSpecies.id ? { ...item, ...result.data } : item))
        );
        message.success("更新成功");
        setEditingSpecies(null);
      } else {
        message.error(result.message || "更新失败");
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setLoadingId(id);
    try {
      const response = await fetch(`/api/fish-species/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (result.success) {
        setSpecies((prev) => prev.filter((item) => item.id !== id));
        message.success("已删除");
      } else {
        message.error(result.message || "删除失败");
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleActive = async (record: FishSpecies) => {
    setLoadingId(record.id);
    try {
      const response = await fetch(`/api/fish-species/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !record.isActive }),
      });
      const result = await response.json();
      if (result.success) {
        setSpecies((prev) => prev.map((item) => (item.id === record.id ? { ...item, ...result.data } : item)));
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索鱼种名称..."
            prefix={<SearchOutlined />}
            allowClear
            style={{ flex: 1, minWidth: 220 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
            新增鱼种
          </Button>
        </div>
      </Card>

      <Card title={`鱼种列表 (${filteredSpecies.length})`}>
        <Table
          rowKey="id"
          dataSource={filteredSpecies}
          pagination={false}
          scroll={{ x: true }}
          columns={[
            {
              title: "鱼种",
              dataIndex: "name",
              sorter: (a: FishSpecies, b: FishSpecies) => a.name.localeCompare(b.name),
              render: (_: unknown, record: FishSpecies) => (
                <Space>
                  {record.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={record.imageUrl}
                      alt={record.name}
                      style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }}
                    />
                  ) : (
                    <Avatar icon={<CiOutlined />} style={{ backgroundColor: "#e6f4ff", color: "#1677ff" }} />
                  )}
                  <span style={{ fontWeight: 500 }}>{record.name}</span>
                </Space>
              ),
            },
            {
              title: "学名",
              dataIndex: "latinName",
              sorter: (a: FishSpecies, b: FishSpecies) => (a.latinName || "").localeCompare(b.latinName || ""),
              render: (value: string | null) => value || "-",
            },
            {
              title: "别名",
              dataIndex: "aliasNames",
              render: (_: unknown, record: FishSpecies) => {
                const aliasList = normalizeAliases(record.aliasNames);
                return aliasList.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {aliasList.slice(0, 3).map((alias) => (
                      <Tag key={alias}>{alias}</Tag>
                    ))}
                    {aliasList.length > 3 && <Tag>+{aliasList.length - 3}</Tag>}
                  </div>
                ) : (
                  "-"
                );
              },
            },
            {
              title: "栖息地",
              dataIndex: "habitatType",
              filters: [
                { text: "淡水", value: "fresh" },
                { text: "咸水", value: "salt" },
                { text: "两栖", value: "both" },
              ],
              onFilter: (value: unknown, record: FishSpecies) => record.habitatType === value,
              render: (value: string | null) => getHabitatLabel(value),
            },
            {
              title: "捕获次数",
              dataIndex: ["_count", "catches"],
              align: "center",
              sorter: (a: FishSpecies, b: FishSpecies) => a._count.catches - b._count.catches,
              render: (value: number) => <Tag color="default">{value}</Tag>,
            },
            {
              title: "状态",
              dataIndex: "isActive",
              align: "center",
              filters: [
                { text: "启用", value: true },
                { text: "禁用", value: false },
              ],
              onFilter: (value: unknown, record: FishSpecies) => record.isActive === value,
              render: (_: boolean, record: FishSpecies) => (
                <Switch
                  checkedChildren={<EyeOutlined />}
                  unCheckedChildren={<EyeInvisibleOutlined />}
                  checked={record.isActive}
                  loading={loadingId === record.id}
                  onChange={() => handleToggleActive(record)}
                />
              ),
            },
            {
              title: "操作",
              dataIndex: "actions",
              align: "right",
              render: (_: unknown, record: FishSpecies) => (
                <Space size={8}>
                  <Button
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => {
                      setEditingSpecies(record);
                      editForm.setFieldsValue({
                        name: record.name,
                        latinName: record.latinName || undefined,
                        aliasNames: normalizeAliases(record.aliasNames).join(", "),
                        habitatType: record.habitatType || undefined,
                        imageUrl: record.imageUrl || undefined,
                        description: record.description || undefined,
                        isActive: record.isActive,
                      });
                    }}
                  >
                    编辑
                  </Button>
                  <Popconfirm title="确认删除该鱼种？" onConfirm={() => handleDelete(record.id)}>
                    <Button danger icon={<DeleteOutlined />} size="small" loading={loadingId === record.id}>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          locale={{ emptyText: "暂无鱼种数据" }}
        />
      </Card>

      <Modal
        title="新增鱼种"
        open={isCreateOpen}
        okText="保存"
        confirmLoading={loadingId === "create"}
        onOk={handleCreate}
        onCancel={() => setIsCreateOpen(false)}
      >
        <SpeciesForm form={createForm} />
      </Modal>

      <Modal
        title="编辑鱼种"
        open={!!editingSpecies}
        okText="保存"
        confirmLoading={loadingId === editingSpecies?.id}
        onOk={handleEdit}
        onCancel={() => setEditingSpecies(null)}
      >
        <SpeciesForm form={editForm} />
      </Modal>
    </Space>
  );
}

function SpeciesForm({ form }: { form: FormInstance<SpeciesFormValues> }) {
  return (
    <Form layout="vertical" form={form} initialValues={{ habitatType: "fresh", isActive: true }}>
      <Form.Item name="name" label="中文名" rules={[{ required: true, message: "请输入中文名" }]}>
        <Input placeholder="例如：鲈鱼" />
      </Form.Item>
      <Form.Item name="latinName" label="学名">
        <Input placeholder="例如：Lateolabrax japonicus" />
      </Form.Item>
      <Form.Item name="aliasNames" label="别名（逗号分隔）">
        <Input placeholder="例如：七星鲈, 花鲈" />
      </Form.Item>
      <Form.Item name="habitatType" label="栖息地">
        <Select
          options={[
            { label: "淡水", value: "fresh" },
            { label: "海水", value: "salt" },
            { label: "半咸水", value: "brackish" },
          ]}
        />
      </Form.Item>
      <Form.Item name="imageUrl" label="图片 URL">
        <Input placeholder="https://..." />
      </Form.Item>
      <Form.Item name="description" label="简介">
        <Input.TextArea rows={3} placeholder="鱼种简介..." />
      </Form.Item>
      <Form.Item name="isActive" label="是否显示" valuePropName="checked">
        <Switch checkedChildren={<EyeOutlined />} unCheckedChildren={<EyeInvisibleOutlined />} />
      </Form.Item>
    </Form>
  );
}

function getHabitatLabel(type: string | null) {
  switch (type) {
    case "fresh":
      return "淡水";
    case "salt":
      return "海水";
    case "brackish":
      return "半咸水";
    default:
      return "-";
  }
}

function normalizeAliases(value: FishSpecies["aliasNames"]) {
  if (!Array.isArray(value)) return [] as string[];
  return value.filter((item): item is string => typeof item === "string");
}
