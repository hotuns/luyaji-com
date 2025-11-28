import dynamic from "next/dynamic";

// 将客户端页面动态导入，禁止 SSR，避免服务端在构建时执行浏览器 API
import NewTripLoader from "./NewTripLoader";

export default function Page() {
  return <NewTripLoader />;
}
