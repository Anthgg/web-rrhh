import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  turbopack: {
    root: rootDirectory,
    resolveAlias: {
      "sonner": "./src/lib/sonner-compat.ts",
    },
  },
};

export default nextConfig;
