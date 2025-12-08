"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Button,
  Card,
  Divider,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import { ReloadOutlined } from "@ant-design/icons"

import type { MetadataItem } from "./metadata-tabs"

type PendingBrand = {
  type: "rod" | "reel"
  rawBrand: string
  displayBrand: string
  count: number
}

type Props = {
  metadata: MetadataItem[]
}

type Mode = "existing" | "create"

const aliasPlaceholder = "多个别名用逗号或空格分隔"

const TYPE_OPTIONS = [
  { label: "全部", value: "all" },
  { label: "鱼竿", value: "rod" },
  { label: "渔轮", value: "reel" },
]

const CATEGORY_BY_TYPE: Record<"rod" | "reel", string> = {
  rod: "rod_brand",
  reel: "reel_brand",
}

const TYPE_TAG: Record<"rod" | "reel", { label: string; color: string }> = {
  rod: { label: "鱼竿", color: "blue" },
  reel: { label: "渔轮", color: "green" },
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function splitAliases(input: string) {
  return input
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function PendingBrandPanel({ metadata }: Props) {
  const [pending, setPending] = useState<PendingBrand[]>([])
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<"all" | "rod" | "reel">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<Mode>("existing")
  const [modalRecord, setModalRecord] = useState<PendingBrand | null>(null)
  const [selectedMetadataId, setSelectedMetadataId] = useState<string>()
  const [newLabel, setNewLabel] = useState("")
  const [newValue, setNewValue] = useState("")
  const [newAliases, setNewAliases] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [metadataItems, setMetadataItems] = useState(metadata)

  const metadataOptions = useMemo(() => {
    const rod = metadataItems.filter((item) => item.category === CATEGORY_BY_TYPE.rod)
    const reel = metadataItems.filter((item) => item.category === CATEGORY_BY_TYPE.reel)
    const buildOptions = (list: MetadataItem[]) =>
      list.map((item) => ({
        label: `${item.label} (${item.value})`,
        value: item.id,
      }))
    return {
      rod: buildOptions(rod),
      reel: buildOptions(reel),
    }
  }, [metadataItems])

  const currentOptions =
    modalRecord?.type === "reel" ? metadataOptions.reel : metadataOptions.rod

  const columns: ColumnsType<PendingBrand> = [
    {
      title: "品牌名称",
      dataIndex: "displayBrand",
      render: (_value, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 600 }}>{record.displayBrand}</span>
          {record.rawBrand.trim() !== record.displayBrand && (
            <span style={{ fontSize: 12, color: "#999" }}>原始：{record.rawBrand}</span>
          )}
        </Space>
      ),
    },
    {
      title: "来源",
      dataIndex: "type",
      width: 120,
      render: (type: PendingBrand["type"]) => (
        <Tag color={TYPE_TAG[type].color}>{TYPE_TAG[type].label}</Tag>
      ),
    },
    {
      title: "待归档数量",
      dataIndex: "count",
      width: 140,
      render: (count: number) => <span style={{ fontWeight: 600 }}>{count}</span>,
      sorter: (a, b) => a.count - b.count,
      defaultSortOrder: "descend",
    },
    {
      title: "操作",
      width: 160,
      render: (_value, record) => (
        <Button type="link" onClick={() => openModal(record)}>
          归档
        </Button>
      ),
    },
  ]

  const fetchData = async (type: "all" | "rod" | "reel" = filterType) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/metadata/pending-brands?type=${type}`, {
        cache: "no-store",
      })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || "获取失败")
      }
      setPending(json.data ?? [])
    } catch (error) {
      console.error(error)
      message.error(error instanceof Error ? error.message : "获取失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(filterType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType])

  const openModal = (record: PendingBrand) => {
    setModalRecord(record)
    setModalMode("existing")
    setSelectedMetadataId(undefined)
    setNewLabel(record.displayBrand)
    setNewValue(slugify(record.displayBrand))
    setNewAliases("")
    setModalOpen(true)
  }

  const resetModal = () => {
    setModalOpen(false)
    setModalRecord(null)
    setSelectedMetadataId(undefined)
  }

  const handleAssign = async () => {
    if (!modalRecord) return
    try {
      setSubmitting(true)
      let targetMetadataId = selectedMetadataId

      if (modalMode === "create") {
        if (!newLabel.trim() || !newValue.trim()) {
          message.error("请填写新元数据的 Label 和 Value")
          setSubmitting(false)
          return
        }
        const payload = {
          category: CATEGORY_BY_TYPE[modalRecord.type],
          label: newLabel.trim(),
          value: newValue.trim(),
          aliases: newAliases ? splitAliases(newAliases) : undefined,
          sortOrder: 0,
          isActive: true,
        }
        const res = await fetch("/api/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!json.success) {
          throw new Error(json.error || "创建元数据失败")
        }
        const newItem: MetadataItem = json.data
        setMetadataItems((prev) => [...prev, newItem])
        targetMetadataId = newItem.id
        message.success("元数据已创建")
      } else if (!targetMetadataId) {
        message.error("请选择一个已有的元数据")
        setSubmitting(false)
        return
      }

      const assignRes = await fetch("/api/metadata/pending-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: modalRecord.type,
          brand: modalRecord.rawBrand,
          metadataId: targetMetadataId,
        }),
      })
      const assignJson = await assignRes.json()
      if (!assignJson.success) {
        throw new Error(assignJson.error || "归档失败")
      }

      message.success(assignJson.message || "归档完成")
      resetModal()
      fetchData(filterType)
    } catch (error) {
      console.error(error)
      message.error(error instanceof Error ? error.message : "操作失败")
    } finally {
      setSubmitting(false)
    }
  }

  const hasData = pending.length > 0

  return (
    <Card
      title="待归档品牌"
      extra={
        <Space>
          <Select
            size="small"
            value={filterType}
            onChange={(value) => setFilterType(value)}
            options={TYPE_OPTIONS}
            style={{ width: 120 }}
          />
          <Button icon={<ReloadOutlined />} size="small" onClick={() => fetchData(filterType)}>
            刷新
          </Button>
        </Space>
      }
      style={{ marginBottom: 24 }}
    >
      {hasData ? (
        <Table
          rowKey={(record) => `${record.type}-${record.rawBrand}`}
          columns={columns}
          loading={loading}
          dataSource={pending}
          pagination={{ pageSize: 8 }}
          size="middle"
        />
      ) : (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#999" }}>
          {loading ? "加载中..." : "当前没有需要归档的品牌"}
        </div>
      )}

      <Modal
        title="归档品牌"
        open={modalOpen}
        onCancel={resetModal}
        onOk={handleAssign}
        confirmLoading={submitting}
        okText={modalMode === "create" ? "创建并归档" : "绑定元数据"}
      >
        {modalRecord && (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div>
              <div style={{ fontSize: 12, color: "#888" }}>待归档品牌</div>
              <div style={{ fontWeight: 600, fontSize: 18 }}>{modalRecord.displayBrand}</div>
            </div>

            <Radio.Group value={modalMode} onChange={(e) => setModalMode(e.target.value)}>
              <Radio.Button value="existing">绑定已有元数据</Radio.Button>
              <Radio.Button value="create">新建并绑定</Radio.Button>
            </Radio.Group>

            {modalMode === "existing" ? (
              <Select
                showSearch
                allowClear
                placeholder="请选择已有品牌"
                style={{ width: "100%" }}
                options={currentOptions}
                value={selectedMetadataId}
                onChange={(value) => setSelectedMetadataId(value)}
                optionFilterProp="label"
              />
            ) : (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Label（展示名称）"
                />
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Value（唯一值，建议小写英文）"
                />
                <Input.TextArea
                  rows={3}
                  value={newAliases}
                  onChange={(e) => setNewAliases(e.target.value)}
                  placeholder={aliasPlaceholder}
                />
              </Space>
            )}

            <Divider style={{ margin: "8px 0" }} />
            <div style={{ fontSize: 12, color: "#999" }}>
              系统会将所有品牌名完全等于「{modalRecord.displayBrand}」且尚未绑定元数据的记录，统一引用到所选的
              {TYPE_TAG[modalRecord.type].label}品牌。
            </div>
          </Space>
        )}
      </Modal>
    </Card>
  )
}
