import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output when building for Docker (avoids Windows symlink issues when building locally)
  ...(process.env.BUILD_FOR_DOCKER === "1" && { output: "standalone" }),
};

export default nextConfig;
