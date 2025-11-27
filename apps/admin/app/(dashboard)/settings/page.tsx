"use client";

import { Card, Typography, Descriptions } from "antd";
import { SettingOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function SettingsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          系统设置
        </Title>
        <Text type="secondary">管理系统配置</Text>
      </div>

      <Card title="基础设置" extra={<SettingOutlined />}>
        <Text type="secondary">暂无可配置项</Text>
      </Card>

      <Card title="系统信息">
        <Descriptions column={1} size="small" labelStyle={{ width: 120 }}>
          <Descriptions.Item label="应用名称">路亚记后台管理</Descriptions.Item>
          <Descriptions.Item label="版本号">1.0.0</Descriptions.Item>
          <Descriptions.Item label="运行环境">{process.env.NODE_ENV}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
