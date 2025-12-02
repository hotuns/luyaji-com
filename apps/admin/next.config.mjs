/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "the-weapplyj.oss-cn-beijing.aliyuncs.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
