import { type ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col items-center gap-8 min-h-0 p-8">
        {children}
      </div>
    </main>
  );
}
