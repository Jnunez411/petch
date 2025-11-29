import { type ReactNode } from 'react';

interface AlertProps {
  children: ReactNode;
  variant?: 'error' | 'success' | 'info';
  className?: string;
}

export function Alert({ children, variant = 'error', className = '' }: AlertProps) {
  const variantStyles = {
    error: 'bg-red-100 dark:bg-red-900 border-red-400 dark:border-red-700 text-red-700 dark:text-red-300',
    success: 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-700 text-green-700 dark:text-green-300',
    info: 'bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300',
  };

  return (
    <div className={`p-3 border rounded ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}
