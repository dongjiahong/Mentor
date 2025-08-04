import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

export function Layout({ children, onThemeToggle, isDarkMode }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header onThemeToggle={onThemeToggle} isDarkMode={isDarkMode} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}