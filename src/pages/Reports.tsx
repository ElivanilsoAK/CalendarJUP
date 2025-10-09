// src/pages/Reports.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useLoading } from '../hooks/useLoading';
import { 
  generateReport, 
  exportReportToCSV, 
  type ReportFilter,
  type ReportData,
  type ReportSummary,
  type GroupedReportData
} from '../services/reportService';
import { ReportFilters } from '../components/reports/ReportFilters';
import { ReportTable } from '../components/reports/ReportTable';
import { ReportCharts } from '../components/reports/ReportCharts';
import { SkeletonCard } from '../components/ui/LoadingSkeleton';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { 
  FileText, 
  BarChart3, 
  Table, 
  Settings,
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

const Reports: React.FC = () => {
  const { currentUserOrg } = useAuth();
  const { handleError } = useErrorHandler();
  const reportLoading = useLoading();
  const exportLoading = useLoading();

  // Estados dos dados
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [groupedData, setGroupedData] = useState<GroupedReportData[]>([]);
  const [collaborators, setCollaborators] = useState<Array<{ id: string; name: string; department?: string }>>([]);

  // Estados da interface
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    groupBy: 'day',
    sortBy: 'date',
    sortOrder: 'asc',
    includeVacations: true
  });

  const [viewMode, setViewMode] = useState<'table' | 'charts' | 'both'>('both');
  const [showFilters, setShowFilters] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserOrg) return;
      
      try {
        // Buscar colaboradores
        const collaboratorsData = await fetchCollaborators();
        setCollaborators(collaboratorsData);
        
        // Gerar relatório inicial
        await generateReportData();
      } catch (error) {
        await handleError(error, { 
          context: 'reports_fetchData',
          showToast: true 
        });
      }
    };

    fetchData();
  }, [currentUserOrg]);

  useEffect(() => {
    if (currentUserOrg && filters) {
      generateReportData();
    }
  }, [filters, currentUserOrg]);

  const fetchCollaborators = async (): Promise<Array<{ id: string; name: string; department?: string }>> => {
    if (!currentUserOrg) return [];
    
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const membersRef = collection(db, 'organizations', currentUserOrg.orgId, 'members');
      const snapshot = await getDocs(membersRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.data().email,
        department: doc.data().department
      }));
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
      return [];
    }
  };

  const generateReportData = async () => {
    if (!currentUserOrg) return;
    
    reportLoading.startLoading('Gerando relatório...');
    try {
      const result = await generateReport(currentUserOrg.orgId, filters);
      
      setReportData(result.data);
      setReportSummary(result.summary);
      setGroupedData(result.grouped);
      } catch (error) {
      await handleError(error, { 
        context: 'reports_generate',
        showToast: true 
      });
      reportLoading.setError('Erro ao gerar relatório');
      } finally {
      reportLoading.stopLoading();
    }
  };

  const handleFiltersChange = (newFilters: ReportFilter) => {
    setFilters(newFilters);
  };

  const handleExport = async () => {
    if (!reportData.length || !reportSummary) return;
    
    exportLoading.startLoading('Exportando relatório...');
    try {
      const csvContent = exportReportToCSV(reportData, reportSummary);
      
      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      await handleError(error, { 
        context: 'reports_export',
        showToast: true 
      });
      exportLoading.setError('Erro ao exportar relatório');
    } finally {
      exportLoading.stopLoading();
    }
  };

  const handleSaveTemplate = async (name: string, description: string) => {
    // TODO: Implementar salvamento de templates no Firebase
    console.log('Salvando template:', { name, description, filters });
  };

  const quickFilters = [
    {
      name: 'Este Mês',
      filters: {
        ...filters,
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date()),
        groupBy: 'day' as const
      }
    },
    {
      name: 'Este Ano',
      filters: {
        ...filters,
        startDate: startOfYear(new Date()),
        endDate: endOfYear(new Date()),
        groupBy: 'month' as const
      }
    },
    {
      name: 'Últimos 30 Dias',
      filters: {
        ...filters,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        groupBy: 'day' as const
      }
    }
  ];

  if (!currentUserOrg) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Nenhuma organização encontrada
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Você precisa estar em uma organização para acessar os relatórios.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Relatórios Avançados
      </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Análise detalhada de plantões, férias e atividades
          </p>
          </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Settings size={16} />
            {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
          </Button>
          
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex items-center gap-2"
            >
              <Table size={16} />
              Tabela
            </Button>
            <Button
              variant={viewMode === 'charts' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('charts')}
              className="flex items-center gap-2"
            >
              <BarChart3 size={16} />
              Gráficos
            </Button>
            <Button
              variant={viewMode === 'both' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('both')}
              className="flex items-center gap-2"
            >
              <FileText size={16} />
              Ambos
            </Button>
          </div>
        </div>
          </div>

      {/* Quick Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Filtros Rápidos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickFilters.map((quickFilter, index) => (
            <button
              key={index}
              onClick={() => setFilters(quickFilter.filters)}
              className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {quickFilter.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros Avançados */}
      {showFilters && (
        <ReportFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onExport={handleExport}
          onSaveTemplate={handleSaveTemplate}
          collaborators={collaborators}
          loading={reportLoading.isLoading || exportLoading.isLoading}
        />
      )}

      {/* Loading State */}
      {reportLoading.isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Error State */}
      {reportLoading.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200">
                Erro ao carregar relatório
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {reportLoading.error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!reportLoading.isLoading && !reportLoading.error && (
        <>
          {/* Summary Stats */}
          {reportSummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total de Registros</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {reportSummary.totalRecords}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Plantões</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {reportSummary.totalShifts}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Férias</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {reportSummary.totalVacations}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Usuários Únicos</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {reportSummary.uniqueUsers}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="space-y-6">
            {viewMode === 'table' && (
              <ReportTable
                data={reportData}
                summary={reportSummary!}
                onExport={handleExport}
                loading={exportLoading.isLoading}
              />
            )}
            
            {viewMode === 'charts' && (
              <ReportCharts
                groupedData={groupedData}
                summary={reportSummary!}
              />
            )}
            
            {viewMode === 'both' && (
              <div className="space-y-6">
                <ReportCharts
                  groupedData={groupedData}
                  summary={reportSummary!}
                />
                <ReportTable
                  data={reportData}
                  summary={reportSummary!}
                  onExport={handleExport}
                  loading={exportLoading.isLoading}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Export Loading Overlay */}
      <LoadingOverlay
        isLoading={exportLoading.isLoading}
        message={exportLoading.message}
        variant="spinner"
        fullScreen
      />
    </div>
  );
};

export default Reports;