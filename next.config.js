/** @type {import('next').NextConfig} */
const nextConfig = {
  // 禁用 ESLint 检查
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 禁用 TypeScript 类型检查
  typescript: {
    ignoreBuildErrors: true,
  },
  // 修复：使用正确的 Next.js 配置选项
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  // 允许开发环境的跨域请求
  allowedDevOrigins: ['129.213.97.231', '172.18.3.1', 'mentor.08082025.xyz'],
  // 为了保持 HTTPS 开发环境
  async rewrites() {
    return []
  },
  // 处理静态文件
  images: {
    remotePatterns: []
  },
  // Webpack 配置，避免客户端打包服务端模块
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 客户端构建时忽略这些 Node.js 模块
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
        os: false,
        util: false,
        events: false,
      };
      
      // 忽略数据库和服务端相关的模块
      config.externals = config.externals || [];
      config.externals.push('better-sqlite3');
    }
    return config;
  },
}

module.exports = nextConfig
