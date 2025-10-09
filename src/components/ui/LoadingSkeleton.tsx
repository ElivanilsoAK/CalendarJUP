// src/components/ui/LoadingSkeleton.tsx
import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  lines = 1,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = `
    bg-gray-200 dark:bg-gray-700
    ${animation === 'pulse' ? 'animate-pulse' : 'animate-pulse'}
    ${className}
  `.trim();

  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'text':
        return 'rounded h-4';
      case 'card':
        return 'rounded-lg';
      case 'rectangular':
      default:
        return 'rounded';
    }
  };

  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1rem' : undefined)
  };

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()}`}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : '100%' // Last line shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()}`}
      style={style}
    />
  );
};

// Componentes específicos para casos comuns
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm ${className}`}>
    <div className="flex items-center gap-4 mb-4">
      <LoadingSkeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <LoadingSkeleton variant="text" width="60%" className="mb-2" />
        <LoadingSkeleton variant="text" width="40%" />
      </div>
    </div>
    <LoadingSkeleton variant="text" lines={3} />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden ${className}`}>
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      <LoadingSkeleton variant="text" width="30%" height={24} />
    </div>
    <div className="p-6">
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <LoadingSkeleton 
                key={colIndex} 
                variant="text" 
                width={colIndex === 0 ? '25%' : '20%'} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({ 
  items = 5, 
  className = '' 
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
        <LoadingSkeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <LoadingSkeleton variant="text" width="70%" className="mb-2" />
          <LoadingSkeleton variant="text" width="50%" />
        </div>
        <LoadingSkeleton variant="rectangular" width={80} height={32} />
      </div>
    ))}
  </div>
);

export default LoadingSkeleton;
