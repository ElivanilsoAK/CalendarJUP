// src/components/reports/ReportCharts.tsx
import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Users,
  Clock,
  Activity,
  PieChart as PieChartIcon
} from 'lucide-react';
import type { GroupedReportData, ReportSummary } from '../../services/reportService';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportChartsProps {
  groupedData: GroupedReportData[];
  summary: ReportSummary;
  type?: 'bar' | 'pie' | 'trend' | 'all';
}

export const ReportCharts: React.FC<ReportChartsProps> = ({
  groupedData,
  summary,
  type = 'all'
}) => {
  // Dados para gráfico de barras
  const barChartData = groupedData.map(group => ({
    period: group.period,
    shifts: group.summary.shifts,
    vacations: group.summary.vacations,
    users: group.summary.users
  }));

  // Dados para gráfico de pizza
  const pieChartData = [
    { name: 'Plantões', value: summary.totalShifts, color: '#3b82f6' },
    { name: 'Férias', value: summary.totalVacations, color: '#10b981' },
    { name: 'Usuários', value: summary.uniqueUsers, color: '#8b5cf6' }
  ];

  // Dados para gráfico de tendência
  const trendData = groupedData.map((group, index) => ({
    period: group.period,
    total: group.summary.shifts + group.summary.vacations,
    index
  }));

  const maxValue = Math.max(...barChartData.map(d => Math.max(d.shifts, d.vacations, d.users)));
  const pieTotal = pieChartData.reduce((sum, item) => sum + item.value, 0);
  const trendMax = Math.max(...trendData.map(d => d.total));

  const BarChart = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Distribuição por Período
        </h3>
      </div>
      
      <div className="space-y-4">
        {barChartData.map((data, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {data.period}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {data.shifts + data.vacations + data.users} total
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Plantões</span>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 ml-auto">
                  {data.shifts}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(data.shifts / maxValue) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Férias</span>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 ml-auto">
                  {data.vacations}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(data.vacations / maxValue) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Usuários</span>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 ml-auto">
                  {data.users}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(data.users / maxValue) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PieChart = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <PieChartIcon className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Distribuição Geral
        </h3>
      </div>
      
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {pieChartData.map((segment, index) => {
              const percentage = (segment.value / pieTotal) * 100;
              const circumference = 2 * Math.PI * 40;
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = index === 0 ? 0 : 
                -pieChartData.slice(0, index).reduce((sum, item) => 
                  sum + (item.value / pieTotal) * circumference, 0);
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {pieTotal}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {pieChartData.map((segment, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: segment.color }}
              ></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {segment.name}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {segment.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {((segment.value / pieTotal) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TrendChart = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Tendência Temporal
        </h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-end gap-2 h-32">
          {trendData.map((data, index) => {
            const height = (data.total / trendMax) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-t h-24 flex items-end">
                  <div 
                    className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t transition-all duration-300"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600 dark:text-gray-400">
                    {data.total}
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  {data.period.length > 10 ? data.period.substring(0, 10) + '...' : data.period}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {summary.totalShifts}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Plantões
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {summary.totalVacations}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Férias
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {summary.uniqueUsers}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Usuários
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SummaryCards = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Resumo Executivo
        </h3>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summary.totalRecords}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Registros
          </div>
        </div>
        
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {summary.uniqueUsers}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            Usuários
          </div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {summary.totalVacations}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">
            Férias
          </div>
        </div>
        
        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <BarChart3 className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {summary.totalShifts}
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">
            Plantões
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">
              Período do Relatório
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {summary.dateRange.start && summary.dateRange.end 
                ? `${format(parseISO(summary.dateRange.start), 'dd/MM/yyyy', { locale: ptBR })} - ${format(parseISO(summary.dateRange.end), 'dd/MM/yyyy', { locale: ptBR })}`
                : 'Período não especificado'
              }
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">
              Agrupamento
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {summary.period === 'all' ? 'Todos os dados' : `Por ${summary.period}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (type === 'bar') {
    return <BarChart />;
  }
  
  if (type === 'pie') {
    return <PieChart />;
  }
  
  if (type === 'trend') {
    return <TrendChart />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <SummaryCards />
        <BarChart />
      </div>
      <div className="space-y-6">
        <PieChart />
        <TrendChart />
      </div>
    </div>
  );
};
