"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Mail, ArrowRight, CheckCircle2, MousePointerClick } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 opacity-10" />
      <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative w-full max-w-sm px-4 text-center">
        {/* 图标 */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/20">
          <Mail className="h-10 w-10 text-white" />
        </div>

        {/* 标题 */}
        <h1 className="mb-3 text-2xl font-bold text-gray-900">查看您的邮箱</h1>
        <p className="mb-8 text-gray-500">
          我们已向 <span className="font-medium text-gray-900">{email}</span>{" "}
          发送了验证邮件
        </p>

        {/* 提示卡片 */}
        <div className="overflow-hidden rounded-3xl bg-white/80 p-8 text-left shadow-2xl backdrop-blur-xl ring-1 ring-gray-200/50">
          <h3 className="mb-4 font-semibold text-gray-900">接下来：</h3>
          <ol className="space-y-4">
            <li className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Mail className="h-4 w-4" />
              </div>
              <div className="pt-1">
                <p className="text-sm font-medium text-gray-900">打开邮箱</p>
                <p className="text-xs text-gray-500">找到来自「路亚记」的邮件</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <MousePointerClick className="h-4 w-4" />
              </div>
              <div className="pt-1">
                <p className="text-sm font-medium text-gray-900">点击链接</p>
                <p className="text-xs text-gray-500">点击邮件中的链接或输入验证码</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="pt-1">
                <p className="text-sm font-medium text-gray-900">完成登录</p>
                <p className="text-xs text-gray-500">开始记录您的路亚之旅！</p>
              </div>
            </li>
          </ol>
        </div>

        {/* 底部提示 */}
        <p className="mt-8 text-xs text-gray-400">
          没有收到邮件？请检查垃圾邮件文件夹
        </p>
        <a href="/auth/signin" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
          返回重新发送
          <ArrowRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
