// src/components/ui/LoadingOverlay.tsx
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ProgressBar } from './ProgressBar';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  variant?: 'spinner' | 'progress' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
  fullScreen?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message,
  progress,
  variant = 'spinner',
  size = 'md',
  className = '',
  children,
  fullScreen = false
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  const overlayContent = () => {
    switch (variant) {
      case 'progress':
        return (
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size={size} text={message} />
            {progress !== undefined && (
              <div className="w-64">
                <ProgressBar 
                  progress={progress} 
                  showPercentage 
                  size="sm"
                />
              </div>
            )}
          </div>
        );
      
      case 'minimal':
        return (
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            {message && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {message}
              </span>
            )}
          </div>
        );
      
      case 'spinner':
      default:
        return <LoadingSpinner size={size} text={message} />;
    }
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        {overlayContent()}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
        {overlayContent()}
      </div>
    </div>
  );
};

// Componente para loading em botões
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    outline: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-blue-500',
    ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-blue-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.trim();

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <LoadingSpinner size="sm" color="white" className="mr-2" />
      )}
      {loading ? (loadingText || 'Carregando...') : children}
    </button>
  );
};

// Componente para loading em cards
interface LoadingCardProps {
  loading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  loading,
  children,
  message = 'Carregando...',
  className = ''
}) => {
  return (
    <LoadingOverlay
      isLoading={loading}
      message={message}
      variant="spinner"
      className={className}
    >
      {children}
    </LoadingOverlay>
  );
};

export default LoadingOverlay;
