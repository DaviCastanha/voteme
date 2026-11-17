import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // só em `npm run dev`: deixa abrir pelo celular na mesma Wi-Fi (http://192.168.x.x:3000)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
