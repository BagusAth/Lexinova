import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // Layar sambutan sudah dihapus (aplikasi khusus untuk Bagus); tautan lama diarahkan ke beranda.
  async redirects() {
    return [{ source: "/selamat-datang", destination: "/", permanent: true }];
  },
  async headers() {
    return [
      {
        // Service worker harus selalu diambil versi terbaru.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
