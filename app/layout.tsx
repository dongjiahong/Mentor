import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { InitializationService } from '@/services/initialization/InitializationService'

const inter = Inter({ subsets: ['latin'] })

// 初始化系统配置
if (typeof window === 'undefined') {
  // 仅在服务端运行
  InitializationService.initialize().catch(console.error);
}

export const metadata = {
  title: 'Mentor',
  description: '英语学习导师应用',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}