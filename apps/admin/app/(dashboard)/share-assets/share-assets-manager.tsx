"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import {
	Button,
	DatePicker,
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
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";

type ShareTemplateRecord = {
	id: string;
	type: string;
	name: string;
	title: string | null;
	subtitle: string | null;
	description: string | null;
	badgeLabel: string | null;
	backgroundImageUrl: string | null;
	config: unknown;
	sortOrder: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

type ShareMediaAssetRecord = {
	id: string;
	category: string;
	label: string | null;
	imageUrl: string;
	linkUrl: string | null;
	weight: number;
	isActive: boolean;
	metadata: unknown;
	createdAt: string;
	updatedAt: string;
};

type ShareCtaRecord = {
	id: string;
	key: string;
	title: string;
	description: string | null;
	buttonText: string | null;
	linkUrl: string | null;
	audience: string | null;
	isActive: boolean;
	startAt: string | null;
	endAt: string | null;
	createdAt: string;
	updatedAt: string;
};

const templateTypes = [
	{ label: "出击分享", value: "trip" },
	{ label: "装备分享", value: "combo" },
	{ label: "装备库分享", value: "gear" },
	{ label: "其它", value: "custom" },
];

const audienceOptions = [
	{ label: "所有用户", value: "all" },
	{ label: "未登录用户", value: "guest" },
	{ label: "已登录用户", value: "authenticated" },
];

const formatDate = (value: string) =>
	new Date(value).toLocaleString("zh-CN", { hour12: false });

const parseJsonInput = (value?: string | null) => {
	if (!value || !value.trim()) return null;
	try {
		return JSON.parse(value);
	} catch {
		throw new Error("JSON 配置格式不正确");
	}
};

const stringifyJson = (value: unknown) => {
	if (!value || typeof value === "string") return value ?? "";
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return "";
	}
};

export function ShareAssetsManager({
	initialTemplates,
	initialAssets,
	initialCtas,
}: {
	initialTemplates: ShareTemplateRecord[];
	initialAssets: ShareMediaAssetRecord[];
	initialCtas: ShareCtaRecord[];
}) {
	const router = useRouter();
	const [templates, setTemplates] =
		useState<ShareTemplateRecord[]>(initialTemplates);
	const [assets, setAssets] =
		useState<ShareMediaAssetRecord[]>(initialAssets);
	const [ctas, setCtas] = useState<ShareCtaRecord[]>(initialCtas);

	const [templateModal, setTemplateModal] = useState<{
		open: boolean;
		record?: ShareTemplateRecord | null;
	}>({ open: false, record: null });
	const [assetModal, setAssetModal] = useState<{
		open: boolean;
		record?: ShareMediaAssetRecord | null;
	}>({ open: false, record: null });
	const [ctaModal, setCtaModal] = useState<{
		open: boolean;
		record?: ShareCtaRecord | null;
	}>({ open: false, record: null });

	const [templateForm] = Form.useForm();
	const [assetForm] = Form.useForm();
	const [ctaForm] = Form.useForm();

	const refreshFromServer = () => router.refresh();

	const handleTemplateSubmit = async () => {
		try {
			const values = await templateForm.validateFields();
			let configValue: unknown = null;
			try {
				configValue = parseJsonInput(values.configText);
			} catch (err) {
				message.error((err as Error).message);
				return;
			}

			const payload = {
				type: values.type,
				name: values.name,
				title: values.title || null,
				subtitle: values.subtitle || null,
				description: values.description || null,
				badgeLabel: values.badgeLabel || null,
				backgroundImageUrl: values.backgroundImageUrl || null,
				config: configValue,
				sortOrder: values.sortOrder ?? 0,
				isActive: values.isActive ?? true,
			};

			const editing = templateModal.record;
			const res = await fetch(
				editing
					? `/api/share/templates/${editing.id}`
					: "/api/share/templates",
				{
					method: editing ? "PUT" : "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				},
			);
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || "保存失败");
			}
			const normalized: ShareTemplateRecord = {
				...json.data,
				config: json.data.config ?? null,
			};
			setTemplates((prev) => {
				if (editing) {
					return prev.map((item) =>
						item.id === editing.id ? normalized : item,
					);
				}
				return [normalized, ...prev];
			});
			message.success(editing ? "已更新模板" : "已创建模板");
			setTemplateModal({ open: false, record: null });
			templateForm.resetFields();
			refreshFromServer();
		} catch (error) {
			if (error instanceof Error) {
				message.error(error.message);
			}
		}
	};

	const handleTemplateDelete = async (record: ShareTemplateRecord) => {
		try {
			const res = await fetch(`/api/share/templates/${record.id}`, {
				method: "DELETE",
			});
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || "删除失败");
			}
			setTemplates((prev) => prev.filter((item) => item.id !== record.id));
			message.success("已删除模板");
			refreshFromServer();
		} catch (error) {
			message.error(error instanceof Error ? error.message : "删除失败");
		}
	};

	const handleAssetSubmit = async () => {
		try {
			const values = await assetForm.validateFields();
			let metadataValue: unknown = null;
			try {
				metadataValue = parseJsonInput(values.metadataText);
			} catch (err) {
				message.error((err as Error).message);
				return;
			}

			const payload = {
				category: values.category,
				label: values.label || null,
				imageUrl: values.imageUrl,
				linkUrl: values.linkUrl || null,
				weight: values.weight ?? 1,
				isActive: values.isActive ?? true,
				metadata: metadataValue,
			};

			const editing = assetModal.record;
			const res = await fetch(
				editing
					? `/api/share/media-assets/${editing.id}`
					: "/api/share/media-assets",
				{
					method: editing ? "PUT" : "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				},
			);
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || "保存失败");
			}
			const normalized: ShareMediaAssetRecord = {
				...json.data,
				metadata: json.data.metadata ?? null,
			};
			setAssets((prev) => {
				if (editing) {
					return prev.map((item) =>
						item.id === editing.id ? normalized : item,
					);
				}
				return [normalized, ...prev];
			});
			message.success(editing ? "已更新素材" : "已新增素材");
			setAssetModal({ open: false, record: null });
			assetForm.resetFields();
			refreshFromServer();
		} catch (error) {
			message.error(error instanceof Error ? error.message : "保存失败");
		}
	};

	const handleAssetDelete = async (record: ShareMediaAssetRecord) => {
		try {
			const res = await fetch(`/api/share/media-assets/${record.id}`, {
				method: "DELETE",
			});
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || "删除失败");
			}
			setAssets((prev) => prev.filter((item) => item.id !== record.id));
			message.success("已删除素材");
			refreshFromServer();
		} catch (error) {
			message.error(error instanceof Error ? error.message : "删除失败");
		}
	};

	const handleCtaSubmit = async () => {
		try {
			const values = await ctaForm.validateFields();
			const [start, end] = values.schedule || [];
			const payload = {
				key: values.key,
				title: values.title,
				description: values.description || null,
				buttonText: values.buttonText || null,
				linkUrl: values.linkUrl || null,
				audience: values.audience || "all",
				isActive: values.isActive ?? true,
				startAt: start ? start.toISOString() : null,
				endAt: end ? end.toISOString() : null,
			};

			const editing = ctaModal.record;
			const res = await fetch(
				editing ? `/api/share/ctas/${editing.id}` : "/api/share/ctas",
				{
				 method: editing ? "PUT" : "POST",
				 headers: { "Content-Type": "application/json" },
				 body: JSON.stringify(payload),
				},
			);
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || "保存失败");
			}
			const normalized: ShareCtaRecord = {
				...json.data,
				startAt: json.data.startAt ?? null,
				endAt: json.data.endAt ?? null,
			};
			setCtas((prev) => {
				if (editing) {
					return prev.map((item) =>
						item.id === editing.id ? normalized : item,
					);
				}
				return [normalized, ...prev];
			});
			message.success(editing ? "已更新 CTA" : "已新增 CTA");
			setCtaModal({ open: false, record: null });
			ctaForm.resetFields();
			refreshFromServer();
		} catch (error) {
			message.error(error instanceof Error ? error.message : "保存失败");
		}
	};

	const handleCtaDelete = async (record: ShareCtaRecord) => {
		try {
			const res = await fetch(`/api/share/ctas/${record.id}`, {
				method: "DELETE",
			});
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || "删除失败");
			}
			setCtas((prev) => prev.filter((item) => item.id !== record.id));
			message.success("已删除 CTA");
			refreshFromServer();
		} catch (error) {
			message.error(error instanceof Error ? error.message : "删除失败");
		}
	};

	const templateColumns: ColumnsType<ShareTemplateRecord> = [
			{ title: "名称", dataIndex: "name", key: "name" },
			{
				title: "类型",
				dataIndex: "type",
				key: "type",
				render: (value: string) => (
					<Tag color="blue">{value.toUpperCase()}</Tag>
				),
			},
			{ title: "标题", dataIndex: "title", key: "title" },
			{
				title: "状态",
				dataIndex: "isActive",
				key: "isActive",
				render: (value: boolean) => (
					<Tag color={value ? "green" : "red"}>
						{value ? "启用" : "停用"}
					</Tag>
				),
			},
			{
				title: "排序",
				dataIndex: "sortOrder",
				key: "sortOrder",
				width: 80,
			},
			{
				title: "更新时间",
				dataIndex: "updatedAt",
				key: "updatedAt",
				render: (value: string) => formatDate(value),
			},
			{
				title: "操作",
				key: "actions",
				render: (_, record) => (
					<Space size="small">
						<Button
							type="link"
							onClick={() => {
								setTemplateModal({ open: true, record });
								templateForm.setFieldsValue({
									...record,
									configText: stringifyJson(record.config),
								});
							}}
						>
							编辑
						</Button>
						<Popconfirm
							title="删除模板"
							description="确定删除该模板吗？"
							onConfirm={() => handleTemplateDelete(record)}
						>
							<Button type="link" danger>
								删除
							</Button>
						</Popconfirm>
					</Space>
				),
			},
		];

	const assetColumns: ColumnsType<ShareMediaAssetRecord> = [
			{ title: "分类", dataIndex: "category", key: "category" },
			{ title: "名称", dataIndex: "label", key: "label" },
			{
				title: "预览",
				dataIndex: "imageUrl",
				key: "preview",
				render: (value: string) => (
					<img
						src={value}
						alt="preview"
						style={{ width: 64, height: 40, objectFit: "cover", borderRadius: 4 }}
					/>
				),
			},
			{
				title: "权重",
				dataIndex: "weight",
				key: "weight",
				width: 80,
			},
			{
				title: "状态",
				dataIndex: "isActive",
				key: "isActive",
				render: (value: boolean) => (
					<Tag color={value ? "green" : "red"}>
						{value ? "启用" : "停用"}
					</Tag>
				),
			},
			{
				title: "操作",
				key: "actions",
				render: (_, record) => (
					<Space size="small">
						<Button
							type="link"
							onClick={() => {
								setAssetModal({ open: true, record });
								assetForm.setFieldsValue({
									...record,
									metadataText: stringifyJson(record.metadata),
								});
							}}
						>
							编辑
						</Button>
						<Popconfirm
							title="删除素材"
							onConfirm={() => handleAssetDelete(record)}
						>
							<Button type="link" danger>
								删除
							</Button>
						</Popconfirm>
					</Space>
				),
			},
		];

	const ctaColumns: ColumnsType<ShareCtaRecord> = [
			{ title: "Key", dataIndex: "key", key: "key" },
			{ title: "标题", dataIndex: "title", key: "title" },
			{
				title: "受众",
				dataIndex: "audience",
				key: "audience",
				render: (value: string | null) => (
					<Tag color="blue">{value || "all"}</Tag>
				),
			},
			{
				title: "状态",
				dataIndex: "isActive",
				key: "isActive",
				render: (value: boolean) => (
					<Tag color={value ? "green" : "red"}>
						{value ? "启用" : "停用"}
					</Tag>
				),
			},
			{
				title: "生效时间",
				key: "schedule",
				render: (_, record) =>
					record.startAt || record.endAt ? (
						<div className="text-xs text-slate-500">
							{record.startAt ? formatDate(record.startAt) : "立即"}
							{" ~ "}
							{record.endAt ? formatDate(record.endAt) : "长期"}
						</div>
					) : (
						"长期有效"
					),
			},
			{
				title: "操作",
				key: "actions",
				render: (_, record) => (
					<Space size="small">
						<Button
							type="link"
							onClick={() => {
								setCtaModal({ open: true, record });
								ctaForm.setFieldsValue({
									...record,
									schedule:
										record.startAt || record.endAt
											? [
													record.startAt ? dayjs(record.startAt) : null,
													record.endAt ? dayjs(record.endAt) : null,
												]
											: [],
								});
							}}
						>
							编辑
						</Button>
						<Popconfirm
							title="删除 CTA"
							onConfirm={() => handleCtaDelete(record)}
						>
							<Button type="link" danger>
								删除
							</Button>
						</Popconfirm>
					</Space>
				),
			},
		];

	return (
		<>
			<Tabs
				defaultActiveKey="templates"
				items={[
					{
						key: "templates",
						label: `分享模板 (${templates.length})`,
						children: (
							<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
								<div style={{ textAlign: "right" }}>
									<Button
										type="primary"
										icon={<PlusOutlined />}
										onClick={() => {
											setTemplateModal({ open: true, record: null });
											templateForm.resetFields();
										}}
									>
										新增模板
									</Button>
								</div>
								<Table
									rowKey="id"
									dataSource={templates}
									columns={templateColumns}
									pagination={false}
								/>
							</div>
						),
					},
					{
						key: "assets",
						label: `随机素材 (${assets.length})`,
						children: (
							<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
								<div style={{ textAlign: "right" }}>
									<Button
										type="primary"
										icon={<PlusOutlined />}
										onClick={() => {
											setAssetModal({ open: true, record: null });
											assetForm.resetFields();
										}}
									>
										新增素材
									</Button>
								</div>
								<Table
									rowKey="id"
									dataSource={assets}
									columns={assetColumns}
									pagination={false}
								/>
							</div>
						),
					},
					{
						key: "cta",
						label: `CTA 配置 (${ctas.length})`,
						children: (
							<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
								<div style={{ textAlign: "right" }}>
									<Button
										type="primary"
										icon={<PlusOutlined />}
										onClick={() => {
											setCtaModal({ open: true, record: null });
											ctaForm.resetFields();
										}}
									>
										新增 CTA
									</Button>
								</div>
								<Table
									rowKey="id"
									dataSource={ctas}
									columns={ctaColumns}
									pagination={false}
								/>
							</div>
						),
					},
				]}
			/>

			<Modal
				title={templateModal.record ? "编辑分享模板" : "新增分享模板"}
				open={templateModal.open}
				onCancel={() => {
					setTemplateModal({ open: false, record: null });
					templateForm.resetFields();
				}}
				onOk={handleTemplateSubmit}
				destroyOnHidden
				maskClosable={false}
			>
				<Form
					form={templateForm}
					layout="vertical"
					initialValues={{
						type: "trip",
						isActive: true,
						sortOrder: 0,
					}}
				>
					<Form.Item name="type" label="模板类型" rules={[{ required: true, message: "请选择类型" }]}>
						<Select options={templateTypes} />
					</Form.Item>
					<Form.Item name="name" label="名称" rules={[{ required: true, message: "请输入名称" }]}>
						<Input placeholder="如：经典出击版" />
					</Form.Item>
					<Form.Item name="title" label="主标题">
						<Input />
					</Form.Item>
					<Form.Item name="subtitle" label="副标题">
						<Input />
					</Form.Item>
					<Form.Item name="description" label="描述">
						<Input.TextArea rows={3} />
					</Form.Item>
					<Form.Item name="badgeLabel" label="角标文案">
						<Input />
					</Form.Item>
					<Form.Item name="backgroundImageUrl" label="背景图 URL">
						<Input placeholder="https://..." />
					</Form.Item>
					<Form.Item name="configText" label="额外配置 (JSON)">
						<Input.TextArea rows={4} placeholder='{"example":true}' />
					</Form.Item>
					<Form.Item name="sortOrder" label="排序权重">
						<InputNumber style={{ width: "100%" }} />
					</Form.Item>
					<Form.Item
						name="isActive"
						label="是否启用"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
				</Form>
			</Modal>

			<Modal
				title={assetModal.record ? "编辑素材" : "新增素材"}
				open={assetModal.open}
				onCancel={() => {
					setAssetModal({ open: false, record: null });
					assetForm.resetFields();
				}}
				onOk={handleAssetSubmit}
				destroyOnHidden
				maskClosable={false}
			>
				<Form
					form={assetForm}
					layout="vertical"
					initialValues={{ weight: 1, isActive: true }}
				>
					<Form.Item name="category" label="分类" rules={[{ required: true, message: "请输入分类" }]}>
						<Input placeholder="如 share_background" />
					</Form.Item>
					<Form.Item name="label" label="展示名称">
						<Input />
					</Form.Item>
					<Form.Item name="imageUrl" label="图片 URL" rules={[{ required: true, message: "请输入图片地址" }]}>
						<Input placeholder="https://..." />
					</Form.Item>
					<Form.Item name="linkUrl" label="点击跳转">
						<Input placeholder="https://..." />
					</Form.Item>
					<Form.Item name="metadataText" label="附加元数据 (JSON)">
						<Input.TextArea rows={3} />
					</Form.Item>
					<Form.Item name="weight" label="权重">
						<InputNumber min={1} style={{ width: "100%" }} />
					</Form.Item>
					<Form.Item
						name="isActive"
						label="是否启用"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
				</Form>
			</Modal>

			<Modal
				title={ctaModal.record ? "编辑 CTA" : "新增 CTA"}
				open={ctaModal.open}
				onCancel={() => {
					setCtaModal({ open: false, record: null });
					ctaForm.resetFields();
				}}
				onOk={handleCtaSubmit}
				destroyOnHidden
				maskClosable={false}
			>
				<Form
					form={ctaForm}
					layout="vertical"
					initialValues={{ isActive: true, audience: "all" }}
				>
					<Form.Item name="key" label="Key" rules={[{ required: true, message: "请输入唯一 key" }]}>
						<Input placeholder="share_footer" />
					</Form.Item>
					<Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入标题" }]}>
						<Input />
					</Form.Item>
					<Form.Item name="description" label="描述">
						<Input.TextArea rows={3} />
					</Form.Item>
					<Form.Item name="buttonText" label="按钮文字">
						<Input />
					</Form.Item>
					<Form.Item name="linkUrl" label="跳转链接">
						<Input placeholder="https://..." />
					</Form.Item>
					<Form.Item name="audience" label="受众人群">
						<Select options={audienceOptions} />
					</Form.Item>
					<Form.Item name="schedule" label="生效时间范围">
						<DatePicker.RangePicker showTime style={{ width: "100%" }} />
					</Form.Item>
					<Form.Item
						name="isActive"
						label="是否启用"
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
				</Form>
			</Modal>
		</>
	);
}
