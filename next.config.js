/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3']
  },
  // 允许开发环境的跨域请求
  allowedDevOrigins: ['129.213.97.231'],
  // 为了保持 HTTPS 开发环境
  async rewrites() {
    return []
  },
  // 处理静态文件
  images: {
    remotePatterns: []
  },
  // 开发服务器配置
  server: {
    host: '0.0.0.0',
    port: 5173
  }
}

module.exports = nextConfig