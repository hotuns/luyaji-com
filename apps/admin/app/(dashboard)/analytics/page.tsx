"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Col,
  Row,
  Statistic,
  Select,
  Button,
  Table,
  Progress,
  Skeleton,
  Typography,
  Space,
  Tag,
} from "antd";
import {
  EyeOutlined,
  UserOutlined,
  UserAddOutlined,
  RiseOutlined,
  ReloadOutlined,
  DesktopOutlined,
  MobileOutlined,
  TabletOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  RocketOutlined,
  FundOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface AnalyticsData {
  overview: {
    totalPV: number;
    totalUV: number;
    totalUsers: number;
    newUsers: number;
    todayPV: number;
    todayUV: number;
    todayActiveUsers: number;
    retentionRate: number;
  };
  business: {
    totalTrips: number;
    totalCatches: number;
    totalCombos: number;
  };
  charts: {
    daily: { date: string; pv: number; uv: number }[];
    devices: { name: string; value: number }[];
    browsers: { name: string; value: number }[];
    topPages: { path: string; views: number }[];
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error("获取统计数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  const getRangeLabel = () => {
    switch (range) {
      case "7d":
        return "7天内";
      case "30d":
        return "30天内";
      case "90d":
        return "90天内";
      default:
        return "";
    }
  };

  const deviceIcons: Record<string, React.ReactNode> = {
    desktop: <DesktopOutlined />,
    mobile: <MobileOutlined />,
    tablet: <TabletOutlined />,
    unknown: <GlobalOutlined />,
  };

  const totalDeviceViews = data?.charts.devices.reduce((a, b) => a + b.value, 0) || 1;
  const totalBrowserViews = data?.charts.browsers.reduce((a, b) => a + b.value, 0) || 1;

  if (loading) {
    return (
      <div style={{ padding: "24px" }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Skeleton active paragraph={{ rows: 1 }} />
          <Row gutter={[16, 16]}>
            {[1, 2, 3, 4].map((i) => (
              <Col key={i} xs={12} md={6}>
                <Card>
                  <Skeleton active paragraph={{ rows: 1 }} />
                </Card>
              </Col>
            ))}
          </Row>
          <Row gutter={[16, 16]}>
            {[1, 2, 3, 4].map((i) => (
              <Col key={i} xs={12} md={6}>
                <Card>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              </Col>
            ))}
          </Row>
        </Space>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Text type="secondary">加载失败，请刷新重试</Text>
      </div>
    );
  }

  const topPagesColumns = [
    {
      title: "排名",
      dataIndex: "index",
      key: "index",
      width: 60,
      render: (_: unknown, __: unknown, index: number) => (
        <Tag color={index < 3 ? "blue" : "default"}>{index + 1}</Tag>
      ),
    },
    {
      title: "页面",
      dataIndex: "path",
      key: "path",
      render: (path: string) => (
        <Text code style={{ fontSize: 12 }}>
          {path}
        </Text>
      ),
    },
    {
      title: "访问量",
      dataIndex: "views",
      key: "views",
      width: 80,
      render: (views: number) => <Text strong>{views}</Text>,
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* 页面头部 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              数据分析
            </Title>
            <Text type="secondary">网站访问和用户行为统计</Text>
          </div>
          <Space>
            <Select
              value={range}
              onChange={setRange}
              style={{ width: 140 }}
              options={[
                { value: "7d", label: "最近 7 天" },
                { value: "30d", label: "最近 30 天" },
                { value: "90d", label: "最近 90 天" },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              刷新
            </Button>
          </Space>
        </div>

        {/* 今日概览 */}
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="今日 PV"
                value={data.overview.todayPV}
                prefix={<EyeOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="今日 UV"
                value={data.overview.todayUV}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="今日活跃用户"
                value={data.overview.todayActiveUsers}
                prefix={<FundOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="7日留存率"
                value={data.overview.retentionRate}
                suffix="%"
                prefix={<RiseOutlined />}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
        </Row>

        {/* 累计数据 */}
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title={`累计 PV (${getRangeLabel()})`}
                value={data.overview.totalPV}
                prefix={<EyeOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title={`累计 UV (${getRangeLabel()})`}
                value={data.overview.totalUV}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={data.overview.totalUsers}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title={`新增用户 (${getRangeLabel()})`}
                value={data.overview.newUsers}
                prefix={<UserAddOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 业务数据 */}
        <Card title="业务数据" extra={<Text type="secondary">用户内容产出统计</Text>}>
          <Row gutter={[24, 24]}>
            <Col xs={8}>
              <div style={{ textAlign: "center", padding: "16px" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: "#e6f7ff",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <EnvironmentOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                </div>
                <Statistic title="新增出击" value={data.business.totalTrips} />
              </div>
            </Col>
            <Col xs={8}>
              <div style={{ textAlign: "center", padding: "16px" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: "#f6ffed",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <RocketOutlined style={{ fontSize: 24, color: "#52c41a" }} />
                </div>
                <Statistic title="新增渔获" value={data.business.totalCatches} />
              </div>
            </Col>
            <Col xs={8}>
              <div style={{ textAlign: "center", padding: "16px" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: "#fffbe6",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <FundOutlined style={{ fontSize: 24, color: "#faad14" }} />
                </div>
                <Statistic title="新增组合" value={data.business.totalCombos} />
              </div>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]}>
          {/* PV/UV 趋势 */}
          <Col xs={24} md={12}>
            <Card title="访问趋势" extra={<Text type="secondary">每日 PV/UV 变化</Text>}>
              {data.charts.daily.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <Text type="secondary">暂无数据</Text>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.charts.daily.slice(-7).map((day) => {
                    const maxPV = Math.max(...data.charts.daily.map((d) => d.pv)) || 1;
                    const percent = (day.pv / maxPV) * 100;
                    return (
                      <div
                        key={day.date}
                        style={{ display: "flex", alignItems: "center", gap: 12 }}
                      >
                        <Text
                          type="secondary"
                          style={{ width: 60, fontSize: 12, flexShrink: 0 }}
                        >
                          {new Date(day.date).toLocaleDateString("zh-CN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                        <div style={{ flex: 1 }}>
                          <Progress
                            percent={percent}
                            showInfo={false}
                            strokeColor="#1890ff"
                            size="small"
                          />
                        </div>
                        <Text style={{ width: 60, textAlign: "right", fontSize: 12 }}>
                          {day.pv} / {day.uv}
                        </Text>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </Col>

          {/* 热门页面 */}
          <Col xs={24} md={12}>
            <Card title="热门页面" extra={<Text type="secondary">访问量 Top 10</Text>}>
              {data.charts.topPages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <Text type="secondary">暂无数据</Text>
                </div>
              ) : (
                <Table
                  dataSource={data.charts.topPages}
                  columns={topPagesColumns}
                  rowKey="path"
                  pagination={false}
                  size="small"
                />
              )}
            </Card>
          </Col>

          {/* 设备分布 */}
          <Col xs={24} md={12}>
            <Card title="设备分布" extra={<Text type="secondary">用户访问设备类型</Text>}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {data.charts.devices.map((device) => {
                  const percent = (device.value / totalDeviceViews) * 100;
                  return (
                    <div key={device.name}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <Space>
                          {deviceIcons[device.name] || deviceIcons.unknown}
                          <Text style={{ textTransform: "capitalize" }}>{device.name}</Text>
                        </Space>
                        <Text type="secondary">{percent.toFixed(1)}%</Text>
                      </div>
                      <Progress percent={percent} showInfo={false} strokeColor="#1890ff" />
                    </div>
                  );
                })}
              </div>
            </Card>
          </Col>

          {/* 浏览器分布 */}
          <Col xs={24} md={12}>
            <Card title="浏览器分布" extra={<Text type="secondary">用户使用的浏览器</Text>}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {data.charts.browsers.slice(0, 6).map((browser) => {
                  const percent = (browser.value / totalBrowserViews) * 100;
                  return (
                    <div key={browser.name}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <Text>{browser.name}</Text>
                        <Text type="secondary">{percent.toFixed(1)}%</Text>
                      </div>
                      <Progress percent={percent} showInfo={false} strokeColor="#52c41a" />
                    </div>
                  );
                })}
              </div>
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
}
