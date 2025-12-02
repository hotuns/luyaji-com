export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth 页面使用独立布局，不需要侧边栏和导航
  return <>{children}</>;
}
