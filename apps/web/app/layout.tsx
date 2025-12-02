import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata, Viewport } from "next"

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"
import { ResponsiveNav, AppHeader } from "@/components/responsive-nav"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "路亚记 - 记录每一次出击",
  description: "面向路亚钓鱼爱好者的记录应用，记录出击、管理装备、积累图鉴",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "路亚记",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
            <ResponsiveNav />
            
            {/* 📱 MAIN CONTENT WRAPPER - 匹配 Demo 布局 */}
            <div className="flex-1 flex flex-col md:ml-64 relative min-h-screen transition-all duration-300">
              {/* Header - 在内容区域内，sticky 定位 */}
              <AppHeader />
              
              {/* Main Content Area */}
              <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto w-full">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
