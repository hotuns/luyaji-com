"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Anchor, User, Lock } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

export default function SignInPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("请输入账号/手机号和密码");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("登录失败，请稍后重试");
      } else {
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-600 to-blue-500 rounded-b-[100%] scale-x-150 shadow-2xl z-0" />
      <div className="absolute top-20 right-20 text-blue-400 opacity-20 hidden md:block">
        <Anchor size={200} />
      </div>
      
      <div className="z-10 w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Anchor size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">路亚记</h1>
          <p className="text-slate-500 mt-2">记录每一次抛投的期待</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">
              手机号 / 昵称
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 placeholder:text-slate-400"
                placeholder="请输入账号"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">
              密码
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 placeholder:text-slate-400"
                placeholder="******"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm text-center p-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !identifier.trim() || !password}
            className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
          >
            {isLoading ? "登录中..." : "立即登录"}
          </Button>
        </form>
        
        <p className="text-center text-xs text-slate-400 mt-6">
          还没有账号?{" "}
          <Link href="/auth/register" className="text-blue-600 cursor-pointer hover:underline font-medium">
            立即注册
          </Link>
        </p>
      </div>
      
      <p className="absolute bottom-6 text-slate-400 text-xs">© 2024 路亚记 All rights reserved.</p>
    </div>
  );
}
