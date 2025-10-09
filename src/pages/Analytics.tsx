import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useLoading } from '../hooks/useLoading';
import { calculateAdvancedMetrics, exportAnalyticsToCSV, type AnalyticsFilters, type AnalyticsMetrics } from '../services/analyticsService';
import { AdvancedChart } from '../components/analytics/AdvancedChart';
import { MetricCard } from '../components/analytics/MetricCard';
import { AnalyticsFilters as FiltersComponent } from '../components/analytics/AnalyticsFilters';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SkeletonCard } from '../components/ui/LoadingSkeleton';
import { Users, Calendar, Clock, TrendingUp, Download, BarChart3, PieChart, Activity } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ShiftData {
  id: string;
  date: string;
  plantonista: {
    id: string;
    name: string;
  };
  calendarId: string;
}


const Analytics = () => {
  const { theme } = useTheme();
  const { currentUser, currentUserOrg, userOrgs } = useAuth();
  const { handleError } = useErrorHandler();
  const dataLoading = useLoading();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showAllShifts, setShowAllShifts] = useState(false);
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [collaborators, setCollaborators] = useState<Array<{ id: string; name: string }>>([]);

  // Get user role to determine permissions
  const userRole = userOrgs.find(org => org.orgId === currentUserOrg?.orgId)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserOrg) return;
      
      dataLoading.startLoading('Carregando analytics...');
      try {
        const [analyticsMetrics, collaboratorsData] = await Promise.all([
          calculateAdvancedMetrics(currentUserOrg.orgId, filters),
          fetchCollaborators()
        ]);
        
        setMetrics(analyticsMetrics);
        setCollaborators(collaboratorsData);
      } catch (error) {
        await handleError(error, { 
          context: 'analytics_fetchData',
          showToast: true 
        });
        dataLoading.setError('Erro ao carregar analytics');
      } finally {
        dataLoading.stopLoading();
      }
    };

    fetchData();
  }, [currentUserOrg, filters, dataLoading]);

  const fetchCollaborators = async () => {
    // Mock data - em produção, buscar da API
    return [
      { id: '1', name: currentUser?.displayName || 'Usuário Atual' },
      // Adicionar outros colaboradores conforme necessário
    ];
  };

  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
  };

  const handleExport = () => {
    if (!metrics) return;
    
    const csvContent = exportAnalyticsToCSV(metrics);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-10"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="text-center py-12">
          <Activity size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Nenhum dado disponível
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Não há dados de analytics para exibir no momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Analytics Avançado</h1>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-gray-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização: {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <FiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        collaborators={collaborators}
        onExport={handleExport}
        loading={dataLoading.isLoading}
      />

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dataLoading.isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <MetricCard
              title="Total de Plantões"
              value={metrics.shifts.total}
              icon={Calendar}
              color="blue"
              trend={{
                value: metrics.shifts.monthlyTrend,
                label: "vs mês anterior"
              }}
            />
            
            <MetricCard
              title="Colaboradores Ativos"
              value={metrics.shifts.userDistribution.length}
              icon={Users}
              color="green"
            />
            
            <MetricCard
              title="Taxa de Utilização"
              value={`${metrics.productivity.utilizationRate}%`}
              icon={Activity}
              color="purple"
              subtitle={`${metrics.productivity.coverageGaps} dias sem cobertura`}
            />
            
            <MetricCard
              title="Taxa de Aprovação"
              value={`${metrics.vacations.approvalRate.toFixed(1)}%`}
              icon={TrendingUp}
              color="orange"
              subtitle={`${metrics.vacations.approved}/${metrics.vacations.total} férias`}
            />
          </>
        )}
      </div>

      {/* Gráficos Avançados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <AdvancedChart
          data={metrics.trends.monthlyShifts}
          title="Tendência Mensal de Plantões"
          type="area"
          color="#3b82f6"
          showTrend={true}
        />
        
        <AdvancedChart
          data={metrics.trends.monthlyVacations}
          title="Solicitações de Férias por Mês"
          type="bar"
          color="#10b981"
        />
      </div>

      {/* Distribuição de Produtividade */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-8">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
          <BarChart3 className="mr-3" />
          Produtividade por Colaborador
        </h3>
        
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  Colaborador
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  Plantões
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  Férias (dias)
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  Eficiência
                </th>
                </tr>
              </thead>
              <tbody>
              {metrics.productivity.shiftsPerUser.map((user, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                          </div>
                      <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {user.shifts}
                    </span>
                  </td>
                        <td className="py-3 px-4">
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {user.vacations}
                          </span>
                        </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${user.efficiency}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {user.efficiency}%
                      </span>
                    </div>
                  </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

export default Analytics;
