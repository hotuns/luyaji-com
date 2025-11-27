"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Tabs, Input, Table, Tag, Card } from "antd";
import { SearchOutlined, ToolOutlined, SettingOutlined, AppstoreOutlined } from "@ant-design/icons";

type RodData = {
  id: string;
  name: string;
  brand: string | null;
  length: number | null;
  lengthUnit: string | null;
  power: string | null;
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
  const [rodSearch, setRodSearch] = useState("");
  const [reelSearch, setReelSearch] = useState("");
  const [comboSearch, setComboSearch] = useState("");

  const filteredRods = useMemo(() => filterByKeywords(rods, rodSearch, ["name", "brand", "userName"]), [rods, rodSearch]);
  const filteredReels = useMemo(() => filterByKeywords(reels, reelSearch, ["name", "brand", "userName", "model"]), [reels, reelSearch]);
  const filteredCombos = useMemo(
    () => filterByKeywords(combos, comboSearch, ["name", "rodName", "reelName", "userName", "mainLineText"]),
    [combos, comboSearch]
  );

  return (
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

const rodColumns = [
  {
    title: "名称",
    dataIndex: "name",
  },
  {
    title: "品牌",
    dataIndex: "brand",
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
    title: "用户",
    dataIndex: "userName",
  },
  {
    title: "组合",
    dataIndex: ["_count", "combos"],
    align: "center" as const,
    render: (value: number) => <Tag>{value}</Tag>,
  },
  {
    title: "可见性",
    dataIndex: "visibility",
    align: "center" as const,
    render: (value: string) => <Tag color={value === "public" ? "green" : "default"}>{value === "public" ? "公开" : "私有"}</Tag>,
  },
];

const reelColumns = [
  {
    title: "名称",
    dataIndex: "name",
  },
  {
    title: "品牌",
    dataIndex: "brand",
    render: (value: string | null) => value || "-",
  },
  {
    title: "型号",
    dataIndex: "model",
    render: (value: string | null) => value || "-",
  },
  {
    title: "速比",
    dataIndex: "gearRatioText",
    render: (value: string | null) => value || "-",
  },
  {
    title: "用户",
    dataIndex: "userName",
  },
  {
    title: "组合",
    dataIndex: ["_count", "combos"],
    align: "center" as const,
    render: (value: number) => <Tag>{value}</Tag>,
  },
  {
    title: "可见性",
    dataIndex: "visibility",
    align: "center" as const,
    render: (value: string) => <Tag color={value === "public" ? "green" : "default"}>{value === "public" ? "公开" : "私有"}</Tag>,
  },
];

const comboColumns = [
  {
    title: "组合名",
    dataIndex: "name",
  },
  {
    title: "鱼竿",
    dataIndex: "rodName",
    render: (value: string) => value || "-",
  },
  {
    title: "渔轮",
    dataIndex: "reelName",
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
  },
  {
    title: "可见性",
    dataIndex: "visibility",
    align: "center" as const,
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
