"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-sm text-center">
        {/* 图标 */}
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* 标题 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">查看您的邮箱</h1>
        <p className="text-gray-500 mb-6">
          我们已向 <span className="font-medium text-gray-700">{email}</span>{" "}
          发送了验证邮件
        </p>

        {/* 提示卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">接下来：</h3>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                1
              </span>
              <span>打开您的邮箱，找到来自「路亚记」的邮件</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                2
              </span>
              <span>点击邮件中的链接，或输入验证码</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                3
              </span>
              <span>完成登录，开始记录您的路亚之旅！</span>
            </li>
          </ol>
        </div>

        {/* 底部提示 */}
        <p className="text-xs text-gray-400 mt-6">
          没有收到邮件？请检查垃圾邮件文件夹
        </p>
        <a href="/auth/signin" className="text-sm text-blue-600 mt-2 inline-block">
          返回重新发送
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
