"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Tabs,
  Input,
  Table,
  Tag,
  Card,
  Form,
  InputNumber,
  Select,
  Button,
  message,
  Modal,
} from "antd";
import { SearchOutlined, ToolOutlined, SettingOutlined, AppstoreOutlined, PlusOutlined } from "@ant-design/icons";

type RodData = {
  id: string;
  name: string;
  brand: string | null;
  length: number | null;
  lengthUnit: string | null;
  power: string | null;
  price: number | null;
  visibility: string;
  userName: string;
  createdAt: Date;
  _count: { combos: number };
};

type ReelData = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  gearRatioText: string | null;
  price: number | null;
  visibility: string;
  userName: string;
  createdAt: Date;
  _count: { combos: number };
};

type ComboData = {
  id: string;
  name: string;
  rodName: string;
  reelName: string;
  mainLineText: string | null;
  visibility: string;
  userName: string;
  createdAt: Date;
};

export function GearTabs({
  rods,
  reels,
  combos,
}: {
  rods: RodData[];
  reels: ReelData[];
  combos: ComboData[];
}) {
  const router = useRouter();
  const [rodSearch, setRodSearch] = useState("");
  const [reelSearch, setReelSearch] = useState("");
  const [comboSearch, setComboSearch] = useState("");

  const filteredRods = useMemo(() => filterByKeywords(rods, rodSearch, ["name", "brand", "userName"]), [rods, rodSearch]);
  const filteredReels = useMemo(() => filterByKeywords(reels, reelSearch, ["name", "brand", "userName", "model"]), [reels, reelSearch]);
  const filteredCombos = useMemo(
    () => filterByKeywords(combos, comboSearch, ["name", "rodName", "reelName", "userName", "mainLineText"]),
    [combos, comboSearch]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          快速录入模板
        </Button>
      </div>

      <TemplateCreateModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onCreated={() => {
          router.refresh();
          setIsModalOpen(false);
        }}
      />

      <Tabs
      defaultActiveKey="rods"
      items={[
        {
          key: "rods",
          label: `鱼竿 (${rods.length})`,
          icon: <ToolOutlined />,
          children: (
            <GearSection
              placeholder="搜索鱼竿..."
              search={rodSearch}
              onSearchChange={setRodSearch}
              table={
                <Table
                  rowKey="id"
                  pagination={false}
                  dataSource={filteredRods}
                  columns={rodColumns}
                  locale={{ emptyText: "暂无数据" }}
                />
              }
            />
          ),
        },
        {
          key: "reels",
          label: `渔轮 (${reels.length})`,
          icon: <SettingOutlined />,
          children: (
            <GearSection
              placeholder="搜索渔轮..."
              search={reelSearch}
              onSearchChange={setReelSearch}
              table={
                <Table
                  rowKey="id"
                  pagination={false}
                  dataSource={filteredReels}
                  columns={reelColumns}
                  locale={{ emptyText: "暂无数据" }}
                />
              }
            />
          ),
        },
        {
          key: "combos",
          label: `组合 (${combos.length})`,
          icon: <AppstoreOutlined />,
          children: (
            <GearSection
              placeholder="搜索组合..."
              search={comboSearch}
              onSearchChange={setComboSearch}
              table={
                <Table
                  rowKey="id"
                  pagination={false}
                  dataSource={filteredCombos}
                  columns={comboColumns}
                  locale={{ emptyText: "暂无数据" }}
                />
              }
            />
          ),
        },
      ]}
    />
    </div>
  );
}

function GearSection({
  placeholder,
  search,
  onSearchChange,
  table,
}: {
  placeholder: string;
  search: string;
  onSearchChange: (value: string) => void;
  table: ReactNode;
}) {
  return (
    <Card style={{ marginTop: 16 }}>
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        prefix={<SearchOutlined />}
        placeholder={placeholder}
        allowClear
        style={{ marginBottom: 16 }}
      />
      {table}
    </Card>
  );
}

function TemplateCreateModal({
  open,
  onCancel,
  onCreated,
}: {
  open: boolean;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [rodForm] = Form.useForm();
  const [reelForm] = Form.useForm();
  const [rodLoading, setRodLoading] = useState(false);
  const [reelLoading, setReelLoading] = useState(false);

  const submitTemplate = async (values: Record<string, unknown>, type: "rods" | "reels") => {
    const payload = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value === undefined ? null : value])
    );

    const response = await fetch(`/api/templates/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || "创建失败");
    }
    message.success(type === "rods" ? "鱼竿模板已创建" : "渔轮模板已创建");
    onCreated();
  };

  const handleRodFinish = async (values: Record<string, unknown>) => {
    try {
      setRodLoading(true);
      await submitTemplate(values, "rods");
      rodForm.resetFields();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "创建失败");
    } finally {
      setRodLoading(false);
    }
  };

  const handleReelFinish = async (values: Record<string, unknown>) => {
    try {
      setReelLoading(true);
      await submitTemplate(values, "reels");
      reelForm.resetFields();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "创建失败");
    } finally {
      setReelLoading(false);
    }
  };

  return (
    <Modal
      title="快速录入模板"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <p style={{ color: "#64748b", marginBottom: 16 }}>
        模板会在前台装备库中展示，用户可快速复制使用。
      </p>
      <Tabs
        items={[
          {
            key: "rod-template",
            label: "鱼竿模板",
            children: (
              <Form
                layout="vertical"
                form={rodForm}
                initialValues={{ lengthUnit: "m" }}
                onFinish={handleRodFinish}
              >
                <Form.Item
                  label="名称"
                  name="name"
                  rules={[{ required: true, message: "请输入鱼竿名称" }]}
                >
                  <Input placeholder="例如：Shimano Expride" />
                </Form.Item>
                <Form.Item label="品牌" name="brand">
                  <Input placeholder="Shimano" />
                </Form.Item>
                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  <Form.Item label="长度" name="length">
                    <InputNumber min={0} step={0.01} style={{ width: "100%" }} placeholder="1.98" />
                  </Form.Item>
                  <Form.Item label="长度单位" name="lengthUnit">
                    <Select
                      options={[
                        { label: "米 (m)", value: "m" },
                        { label: "英尺 (ft)", value: "ft" },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item label="硬度" name="power">
                    <Input placeholder="ML / M / MH" />
                  </Form.Item>
                </div>
                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  <Form.Item label="饵重下限 (g)" name="lureWeightMin">
                    <InputNumber min={0} step={1} style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item label="饵重上限 (g)" name="lureWeightMax">
                    <InputNumber min={0} step={1} style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item label="价格 (¥)" name="price">
                    <InputNumber min={0} step={1} style={{ width: "100%" }} />
                  </Form.Item>
                </div>
                <Form.Item label="适用线号" name="lineWeightText">
                  <Input placeholder="4-10lb" />
                </Form.Item>
                <Form.Item label="备注" name="note">
                  <Input.TextArea rows={3} placeholder="额外说明、推荐场景等" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={rodLoading} block>
                  保存鱼竿模板
                </Button>
              </Form>
            ),
          },
          {
            key: "reel-template",
            label: "渔轮模板",
            children: (
              <Form layout="vertical" form={reelForm} onFinish={handleReelFinish}>
                <Form.Item
                  label="名称"
                  name="name"
                  rules={[{ required: true, message: "请输入渔轮名称" }]}
                >
                  <Input placeholder="例如：Vanford 2500" />
                </Form.Item>
                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                  <Form.Item label="品牌" name="brand">
                    <Input placeholder="Shimano" />
                  </Form.Item>
                  <Form.Item label="型号" name="model">
                    <Input placeholder="2500" />
                  </Form.Item>
                </div>
                <Form.Item label="速比" name="gearRatioText">
                  <Input placeholder="6.2:1" />
                </Form.Item>
                <Form.Item label="线容量" name="lineCapacityText">
                  <Input placeholder="PE #1.2-150m" />
                </Form.Item>
                <Form.Item label="价格 (¥)" name="price">
                  <InputNumber min={0} step={1} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="备注" name="note">
                  <Input.TextArea rows={3} placeholder="适用场景、推荐搭配等" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={reelLoading} block>
                  保存渔轮模板
                </Button>
              </Form>
            ),
          },
        ]}
      />
    </Modal>
  );
}

const rodColumns = [
  {
    title: "名称",
    dataIndex: "name",
    sorter: (a: RodData, b: RodData) => a.name.localeCompare(b.name),
  },
  {
    title: "品牌",
    dataIndex: "brand",
    sorter: (a: RodData, b: RodData) => (a.brand || "").localeCompare(b.brand || ""),
    render: (value: string | null) => value || "-",
  },
  {
    title: "规格",
    render: (_: unknown, record: RodData) =>
      [record.length ? `${record.length}${record.lengthUnit || ""}` : "-", record.power]
        .filter(Boolean)
        .join(" / ") || "-",
  },
  {
    title: "价格",
    dataIndex: "price",
    align: "right" as const,
    sorter: (a: RodData, b: RodData) => (a.price || 0) - (b.price || 0),
    render: (value: number | null) => value ? `¥${value.toLocaleString()}` : "-",
  },
  {
    title: "用户",
    dataIndex: "userName",
    sorter: (a: RodData, b: RodData) => a.userName.localeCompare(b.userName),
  },
  {
    title: "组合",
    dataIndex: ["_count", "combos"],
    align: "center" as const,
    sorter: (a: RodData, b: RodData) => a._count.combos - b._count.combos,
    render: (value: number) => <Tag>{value}</Tag>,
  },
  {
    title: "可见性",
    dataIndex: "visibility",
    align: "center" as const,
    filters: [
      { text: "公开", value: "public" },
      { text: "私有", value: "private" },
    ],
    onFilter: (value: unknown, record: RodData) => record.visibility === value,
    render: (value: string) => <Tag color={value === "public" ? "green" : "default"}>{value === "public" ? "公开" : "私有"}</Tag>,
  },
];

const reelColumns = [
  {
    title: "名称",
    dataIndex: "name",
    sorter: (a: ReelData, b: ReelData) => a.name.localeCompare(b.name),
  },
  {
    title: "品牌",
    dataIndex: "brand",
    sorter: (a: ReelData, b: ReelData) => (a.brand || "").localeCompare(b.brand || ""),
    render: (value: string | null) => value || "-",
  },
  {
    title: "型号",
    dataIndex: "model",
    sorter: (a: ReelData, b: ReelData) => (a.model || "").localeCompare(b.model || ""),
    render: (value: string | null) => value || "-",
  },
  {
    title: "速比",
    dataIndex: "gearRatioText",
    render: (value: string | null) => value || "-",
  },
  {
    title: "价格",
    dataIndex: "price",
    align: "right" as const,
    sorter: (a: ReelData, b: ReelData) => (a.price || 0) - (b.price || 0),
    render: (value: number | null) => value ? `¥${value.toLocaleString()}` : "-",
  },
  {
    title: "用户",
    dataIndex: "userName",
    sorter: (a: ReelData, b: ReelData) => a.userName.localeCompare(b.userName),
  },
  {
    title: "组合",
    dataIndex: ["_count", "combos"],
    align: "center" as const,
    sorter: (a: ReelData, b: ReelData) => a._count.combos - b._count.combos,
    render: (value: number) => <Tag>{value}</Tag>,
  },
  {
    title: "可见性",
    dataIndex: "visibility",
    align: "center" as const,
    filters: [
      { text: "公开", value: "public" },
      { text: "私有", value: "private" },
    ],
    onFilter: (value: unknown, record: ReelData) => record.visibility === value,
    render: (value: string) => <Tag color={value === "public" ? "green" : "default"}>{value === "public" ? "公开" : "私有"}</Tag>,
  },
];

const comboColumns = [
  {
    title: "组合名",
    dataIndex: "name",
    sorter: (a: ComboData, b: ComboData) => a.name.localeCompare(b.name),
  },
  {
    title: "鱼竿",
    dataIndex: "rodName",
    sorter: (a: ComboData, b: ComboData) => (a.rodName || "").localeCompare(b.rodName || ""),
    render: (value: string) => value || "-",
  },
  {
    title: "渔轮",
    dataIndex: "reelName",
    sorter: (a: ComboData, b: ComboData) => (a.reelName || "").localeCompare(b.reelName || ""),
    render: (value: string) => value || "-",
  },
  {
    title: "主线",
    dataIndex: "mainLineText",
    render: (value: string | null) => value || "-",
  },
  {
    title: "用户",
    dataIndex: "userName",
    sorter: (a: ComboData, b: ComboData) => a.userName.localeCompare(b.userName),
  },
  {
    title: "可见性",
    dataIndex: "visibility",
    align: "center" as const,
    filters: [
      { text: "公开", value: "public" },
      { text: "私有", value: "private" },
    ],
    onFilter: (value: unknown, record: ComboData) => record.visibility === value,
    render: (value: string) => <Tag color={value === "public" ? "green" : "default"}>{value === "public" ? "公开" : "私有"}</Tag>,
  },
];

function filterByKeywords<T extends Record<string, unknown>>(data: T[], keyword: string, fields: Array<keyof T>) {
  if (!keyword.trim()) return data;
  const lower = keyword.toLowerCase();
  return data.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      return typeof value === "string" && value.toLowerCase().includes(lower);
    })
  );
}
