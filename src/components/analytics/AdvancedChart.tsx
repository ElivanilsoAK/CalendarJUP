// src/components/analytics/AdvancedChart.tsx
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ChartDataPoint {
  month: string;
  count: number;
  previousCount?: number;
  change?: number;
}

interface AdvancedChartProps {
  data: ChartDataPoint[];
  title: string;
  type: 'line' | 'bar' | 'area';
  color?: string;
  showTrend?: boolean;
  height?: number;
}

export const AdvancedChart: React.FC<AdvancedChartProps> = ({
  data,
  title,
  type,
  color = '#3b82f6',
  showTrend = true,
  height = 300
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count));
  const minValue = Math.min(...data.map(d => d.count));
  const range = maxValue - minValue;
  const padding = 40;

  const getTrendIcon = (change?: number) => {
    if (!change) return <Minus size={12} className="text-gray-400" />;
    if (change > 0) return <TrendingUp size={12} className="text-green-500" />;
    return <TrendingDown size={12} className="text-red-500" />;
  };

  const getTrendColor = (change?: number) => {
    if (!change) return 'text-gray-400';
    if (change > 0) return 'text-green-500';
    return 'text-red-500';
  };

  const renderBarChart = () => {
    const barWidth = (600 - padding * 2) / data.length - 10;
    
    return (
      <svg width="100%" height={height} viewBox={`0 0 600 ${height}`}>
        {data.map((point, index) => {
          const x = padding + index * (barWidth + 10);
          const barHeight = range > 0 ? ((point.count - minValue) / range) * (height - padding * 2) : 0;
          const y = height - padding - barHeight;
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="4"
                className="hover:opacity-80 transition-opacity"
              />
              <text
                x={x + barWidth / 2}
                y={height - padding + 15}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-400"
              >
                {point.month}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs fill-gray-800 dark:fill-gray-200 font-medium"
              >
                {point.count}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderLineChart = () => {
    const points = data.map((point, index) => {
      const x = padding + (index * (600 - padding * 2)) / (data.length - 1);
      const y = height - padding - ((point.count - minValue) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height={height} viewBox={`0 0 600 ${height}`}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((point, index) => {
          const x = padding + (index * (600 - padding * 2)) / (data.length - 1);
          const y = height - padding - ((point.count - minValue) / range) * (height - padding * 2);
          
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill={color}
                className="hover:r-6 transition-all"
              />
              <text
                x={x}
                y={height - padding + 15}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-400"
              >
                {point.month}
              </text>
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                className="text-xs fill-gray-800 dark:fill-gray-200 font-medium"
              >
                {point.count}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderAreaChart = () => {
    const points = data.map((point, index) => {
      const x = padding + (index * (600 - padding * 2)) / (data.length - 1);
      const y = height - padding - ((point.count - minValue) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const areaPath = `M ${padding},${height - padding} L ${points} L ${padding + (data.length - 1) * (600 - padding * 2) / (data.length - 1)},${height - padding} Z`;

    return (
      <svg width="100%" height={height} viewBox={`0 0 600 ${height}`}>
        <defs>
          <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#gradient-${title})`} />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((point, index) => {
          const x = padding + (index * (600 - padding * 2)) / (data.length - 1);
          const y = height - padding - ((point.count - minValue) / range) * (height - padding * 2);
          
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill={color}
                className="hover:r-6 transition-all"
              />
              <text
                x={x}
                y={height - padding + 15}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-400"
              >
                {point.month}
              </text>
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                className="text-xs fill-gray-800 dark:fill-gray-200 font-medium"
              >
                {point.count}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'area':
        return renderAreaChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h3>
        {showTrend && data.length > 1 && (
          <div className="flex items-center gap-2">
            {getTrendIcon(data[data.length - 1]?.change)}
            <span className={`text-sm font-medium ${getTrendColor(data[data.length - 1]?.change)}`}>
              {data[data.length - 1]?.change ? `${Math.abs(data[data.length - 1].change || 0)}%` : '0%'}
            </span>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        {renderChart()}
      </div>
    </div>
  );
};
