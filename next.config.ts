import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  agentRules: false,
  outputFileTracingExcludes: { "/*": ["./.rush-data/**"] },
}

export default nextConfig
