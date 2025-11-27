"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { AppstoreTwoTone } from "@ant-design/icons";

export default function AdminSignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(error ? "登录失败，请检查用户名和密码" : "");

  const handleSubmit = async (values: { username: string; password: string }) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await signIn("admin", {
        username: values.username,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage("用户名或密码错误");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMessage("登录失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        padding: "24px",
      }}
    >
      <Card style={{ width: "100%", maxWidth: 420, boxShadow: "0 20px 50px rgba(15,23,42,0.4)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 16px",
              borderRadius: 20,
              background: "#1677ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 28,
            }}
          >
            <AppstoreTwoTone />
          </div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            路亚记后台
          </Typography.Title>
          <Typography.Text type="secondary">管理员登录</Typography.Text>
        </div>

        {errorMessage && (
          <Alert
            type="error"
            showIcon
            message={errorMessage}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}>
            <Input size="large" placeholder="请输入用户名" autoComplete="username" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password size="large" placeholder="请输入密码" autoComplete="current-password" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isLoading}
          >
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
