import { Metadata } from "next";
import { ReportDashboard } from "./report-dashboard";

export const metadata: Metadata = {
  title: "钓鱼报告 - 路亚记",
  description: "查看你的钓鱼统计报告",
};

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        <ReportDashboard />
      </div>
    </main>
  );
}
