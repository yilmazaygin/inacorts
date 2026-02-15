import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  size = 'md',
}) => {
  // Dark mode aware color schemes with better mobile readability
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };

  // Mobile-optimized sizing: smaller text, better padding for centering
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs leading-tight',
    md: 'px-2.5 py-1 text-xs sm:text-sm leading-tight',
  };

  return (
    <span className={`inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {children}
    </span>
  );
};
