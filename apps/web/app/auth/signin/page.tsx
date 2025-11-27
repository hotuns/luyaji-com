"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 验证手机号格式
  const isValidPhone = (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidPhone(phone)) {
      setError("请输入正确的手机号");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("phone", {
        phone,
        code: "", // 当前阶段不需要验证码
        redirect: false,
      });

      if (result?.error) {
        setError("登录失败，请稍后重试");
      } else {
        // 登录成功，跳转首页
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("发生错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎣</div>
          <h1 className="text-2xl font-bold text-gray-900">路亚记</h1>
          <p className="text-gray-500 mt-2">记录每一次出击</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            手机号登录 / 注册
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                手机号
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  +86
                </span>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    // 只允许输入数字
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 11) {
                      setPhone(value);
                    }
                  }}
                  placeholder="请输入手机号"
                  required
                  className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading || phone.length !== 11}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "登录中..." : "立即登录"}
            </Button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            首次登录将自动创建账号
          </p>
        </div>

        {/* 底部提示 */}
        <p className="text-xs text-gray-400 text-center mt-8">
          继续即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
