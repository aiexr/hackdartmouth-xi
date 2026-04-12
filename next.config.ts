import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  optimizePackageImports: ["lucide-react"],
  turbopack: {
    root: process.cwd(),
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
