/** @type {import('next').NextConfig} */
const nextConfig = {
  // 修复：将 serverComponentsExternalPackages 移到根级别
  serverExternalPackages: ['better-sqlite3'],
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