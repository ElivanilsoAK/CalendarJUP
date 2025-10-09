// src/components/analytics/MetricCard.tsx
import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-500/20',
    icon: 'text-blue-500',
    trend: {
      positive: 'text-blue-600 dark:text-blue-400',
      negative: 'text-blue-400 dark:text-blue-600'
    }
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-500/20',
    icon: 'text-green-500',
    trend: {
      positive: 'text-green-600 dark:text-green-400',
      negative: 'text-green-400 dark:text-green-600'
    }
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-500/20',
    icon: 'text-purple-500',
    trend: {
      positive: 'text-purple-600 dark:text-purple-400',
      negative: 'text-purple-400 dark:text-purple-600'
    }
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-500/20',
    icon: 'text-orange-500',
    trend: {
      positive: 'text-orange-600 dark:text-orange-400',
      negative: 'text-orange-400 dark:text-orange-600'
    }
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-500/20',
    icon: 'text-red-500',
    trend: {
      positive: 'text-red-600 dark:text-red-400',
      negative: 'text-red-400 dark:text-red-600'
    }
  },
  gray: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    icon: 'text-gray-500',
    trend: {
      positive: 'text-gray-600 dark:text-gray-400',
      negative: 'text-gray-400 dark:text-gray-600'
    }
  }
};

const sizeClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  size = 'md',
  loading = false
}) => {
  const colors = colorClasses[color];
  const sizeClass = sizeClasses[size];

  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value > 0) {
      return <TrendingUp size={16} className="text-green-500" />;
    } else if (trend.value < 0) {
      return <TrendingDown size={16} className="text-red-500" />;
    } else {
      return <Minus size={16} className="text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    if (trend.value > 0) {
      return 'text-green-600 dark:text-green-400';
    } else if (trend.value < 0) {
      return 'text-red-600 dark:text-red-400';
    } else {
      return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm ${sizeClass} animate-pulse`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${colors.bg} rounded-xl`}></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            {subtitle && <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mt-1"></div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm ${sizeClass} hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 ${colors.bg} rounded-xl`}>
          <Icon className={`${colors.icon}`} size={size === 'lg' ? 28 : 24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-${size === 'lg' ? '3xl' : '2xl'} font-bold text-gray-800 dark:text-gray-100`}>
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
            {trend && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={`text-sm font-medium ${getTrendColor()}`}>
                  {Math.abs(trend.value).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && trend.label && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{trend.label}</p>
          )}
        </div>
      </div>
    </div>
  );
};
