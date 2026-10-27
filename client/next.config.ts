import type { NextConfig } from "next";

// `npm run build:demo` sets NEXT_PUBLIC_DEMO=true and exports a static site for GitHub Pages.
const isDemo = process.env.NEXT_PUBLIC_DEMO === "true";

const nextConfig: NextConfig = isDemo
  ? {
      output: "export",
      basePath: "/scalable-app-assignment",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
