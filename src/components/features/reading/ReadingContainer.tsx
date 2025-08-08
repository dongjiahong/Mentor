import { cn } from '@/lib/utils';

interface ReadingContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ReadingContainer({
  children,
  className
}: ReadingContainerProps) {
  return (
    <div className={cn("max-w-5xl mx-auto p-4 space-y-6", className)}>
      {children}
    </div>
  );
}