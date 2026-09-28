import React, { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'site';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md',
  variant = 'default',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`relative flex w-full max-h-[90vh] flex-col overflow-hidden ${sizeStyles[size]} ${variant === 'site' ? 'border border-stone-200 bg-stone-50 dark:border-slate-800 dark:bg-slate-950' : 'rounded-lg bg-white shadow-xl dark:bg-gray-800'}`}>
          {/* Header */}
          <div className={`flex items-center justify-between gap-4 border-b px-6 py-4 ${variant === 'site' ? 'border-stone-200 dark:border-slate-800' : 'border-gray-200 dark:border-gray-700'}`}>
            <h2 className={variant === 'site' ? 'font-medium text-2xl leading-tight tracking-tight text-slate-950 dark:text-white' : 'text-xl font-semibold text-gray-900 dark:text-gray-100'}>{title}</h2>
            <button
              onClick={onClose}
              className={variant === 'site' ? 'shrink-0 text-slate-500 hover:text-slate-950 focus:outline-none dark:text-slate-400 dark:hover:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none'}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Body */}
          <div className="px-6 py-4 overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
