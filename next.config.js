/** @type {import('next').NextConfig} */
const nextConfig = {
  // 修复：使用正确的 Next.js 配置选项
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  // 允许开发环境的跨域请求
  allowedDevOrigins: ['129.213.97.231', '172.18.3.1'],
  // 为了保持 HTTPS 开发环境
  async rewrites() {
    return []
  },
  // 处理静态文件
  images: {
    remotePatterns: []
  }
}

module.exports = nextConfig