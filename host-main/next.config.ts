import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // Enable React compiler
  reactCompiler: true,
  // Instruct Turbopack where the project root is so it can resolve packages correctly
  // (This is added to work around Turbopack's workspace root inference on some setups)
  // @ts-ignore - turbopack is not yet typed on NextConfig
  turbopack: {
    root: path.resolve(__dirname),
  },
} as unknown as NextConfig;

export default nextConfig;
