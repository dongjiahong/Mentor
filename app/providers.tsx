'use client'

import { ReactNode } from 'react'
import { useTheme } from '@/hooks'
import { Layout } from '@/components/layout/Layout'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Layout onThemeToggle={toggleTheme} isDarkMode={isDarkMode}>
        {children}
      </Layout>
    </div>
  )
}