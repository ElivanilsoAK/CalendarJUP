// src/components/reports/ReportTable.tsx
import React, { useState, useMemo } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Download, 
  Eye, 
  EyeOff,
  Calendar,
  User,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ReportData, ReportSummary } from '../../services/reportService';
import { Button } from '../ui/Button';

interface ReportTableProps {
  data: ReportData[];
  summary: ReportSummary;
  loading?: boolean;
  onExport?: () => void;
  showColumns?: {
    type?: boolean;
    date?: boolean;
    user?: boolean;
    department?: boolean;
    status?: boolean;
    details?: boolean;
  };
}

export const ReportTable: React.FC<ReportTableProps> = ({
  data,
  summary,
  loading = false,
  onExport,
  showColumns = {
    type: true,
    date: true,
    user: true,
    department: true,
    status: true,
    details: false
  }
}) => {
  const [sortField, setSortField] = useState<keyof ReportData>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [visibleColumns, setVisibleColumns] = useState(showColumns);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Ordenar dados
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Tratamento especial para datas
      if (sortField === 'date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Tratamento especial para strings
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [data, sortField, sortOrder]);

  const handleSort = (field: keyof ReportData) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'shift':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'vacation':
        return <Clock className="w-4 h-4 text-green-500" />;
      case 'user':
        return <User className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'shift':
        return 'Plantão';
      case 'vacation':
        return 'Férias';
      case 'user':
        return 'Usuário';
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      case 'pending':
        return 'Pendente';
      case 'completed':
        return 'Concluído';
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Dados do Relatório
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {summary.totalRecords} registros encontrados
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleColumns({
                ...visibleColumns,
                details: !visibleColumns.details
              })}
              className="flex items-center gap-2"
            >
              {visibleColumns.details ? <EyeOff size={16} /> : <Eye size={16} />}
              {visibleColumns.details ? 'Ocultar' : 'Mostrar'} Detalhes
            </Button>
            
            {onExport && (
              <Button
                variant="default"
                size="sm"
                onClick={onExport}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Exportar CSV
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {summary.totalRecords}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Total de Registros
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.totalShifts}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              Plantões
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {summary.totalVacations}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">
              Férias
            </div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {summary.uniqueUsers}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">
              Usuários Únicos
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {visibleColumns.type && (
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-2">
                    Tipo
                    {sortField === 'type' && (
                      sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
              )}
              
              {visibleColumns.date && (
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    Data
                    {sortField === 'date' && (
                      sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
              )}
              
              {visibleColumns.user && (
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('userName')}
                >
                  <div className="flex items-center gap-2">
                    Usuário
                    {sortField === 'userName' && (
                      sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
              )}
              
              {visibleColumns.department && (
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('department')}
                >
                  <div className="flex items-center gap-2">
                    Departamento
                    {sortField === 'department' && (
                      sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
              )}
              
              {visibleColumns.status && (
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {sortField === 'status' && (
                      sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
              )}
              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((item) => (
              <React.Fragment key={item.id}>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {visibleColumns.type && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                    </td>
                  )}
                  
                  {visibleColumns.date && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {format(parseISO(item.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </td>
                  )}
                  
                  {visibleColumns.user && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {item.userName}
                        </span>
                      </div>
                    </td>
                  )}
                  
                  {visibleColumns.department && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {item.department ? (
                          <>
                            <Building size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {item.department}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                  )}
                  
                  {visibleColumns.status && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                    </td>
                  )}
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRowExpansion(item.id)}
                    >
                      {expandedRows.has(item.id) ? 'Ocultar' : 'Ver'} Detalhes
                    </Button>
                  </td>
                </tr>
                
                {/* Expanded Row Details */}
                {expandedRows.has(item.id) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">
                          Detalhes do Registro
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(item.details).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </label>
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {typeof value === 'object' && value !== null
                                  ? JSON.stringify(value, null, 2)
                                  : value?.toString() || '-'
                                }
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Nenhum dado encontrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Ajuste os filtros para encontrar dados.
          </p>
        </div>
      )}
    </div>
  );
};
