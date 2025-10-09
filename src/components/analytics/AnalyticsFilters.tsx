// src/components/analytics/AnalyticsFilters.tsx
import React, { useState } from 'react';
import { Calendar, Users, Download, Filter, X } from 'lucide-react';
import { Button } from '../ui/Button';
import type { AnalyticsFilters as Filters } from '../../services/analyticsService';

interface AnalyticsFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  collaborators: Array<{ id: string; name: string }>;
  onExport?: () => void;
  loading?: boolean;
}

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  filters,
  onFiltersChange,
  collaborators,
  onExport,
  loading = false
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newFilters = {
      ...localFilters,
      [field]: value ? new Date(value) : undefined
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleUserToggle = (userId: string) => {
    const currentUsers = localFilters.userIds || [];
    const newUsers = currentUsers.includes(userId)
      ? currentUsers.filter(id => id !== userId)
      : [...currentUsers, userId];
    
    const newFilters = {
      ...localFilters,
      userIds: newUsers.length > 0 ? newUsers : undefined
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleGroupByChange = (groupBy: Filters['groupBy']) => {
    const newFilters = {
      ...localFilters,
      groupBy
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const newFilters: Filters = {};
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = () => {
    return !!(
      localFilters.startDate ||
      localFilters.endDate ||
      (localFilters.userIds && localFilters.userIds.length > 0) ||
      localFilters.groupBy
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Filter size={20} />
          Filtros e Opções
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X size={16} />
              Limpar
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Ocultar' : 'Avançado'}
          </Button>
          {onExport && (
            <Button
              variant="default"
              size="sm"
              onClick={onExport}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Exportar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Período */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            <Calendar size={16} className="inline mr-2" />
            Data Inicial
          </label>
          <input
            type="date"
            value={localFilters.startDate ? localFilters.startDate.toISOString().split('T')[0] : ''}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            <Calendar size={16} className="inline mr-2" />
            Data Final
          </label>
          <input
            type="date"
            value={localFilters.endDate ? localFilters.endDate.toISOString().split('T')[0] : ''}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Agrupamento */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Agrupar por
          </label>
          <select
            value={localFilters.groupBy || 'month'}
            onChange={(e) => handleGroupByChange(e.target.value as Filters['groupBy'])}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="month">Mês</option>
            <option value="week">Semana</option>
            <option value="day">Dia</option>
            <option value="year">Ano</option>
          </select>
        </div>

        {/* Incluir Férias */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Incluir Férias
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.includeVacations || false}
              onChange={(e) => {
                const newFilters = {
                  ...localFilters,
                  includeVacations: e.target.checked
                };
                setLocalFilters(newFilters);
                onFiltersChange(newFilters);
              }}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Sim</span>
          </label>
        </div>
      </div>

      {/* Filtros Avançados */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Users size={16} />
            Filtrar por Colaboradores
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collaborators.map((collaborator) => (
              <label key={collaborator.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.userIds?.includes(collaborator.id) || false}
                  onChange={() => handleUserToggle(collaborator.id)}
                  className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {collaborator.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Resumo dos Filtros Ativos */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {localFilters.startDate && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                Desde: {localFilters.startDate.toLocaleDateString('pt-BR')}
              </span>
            )}
            {localFilters.endDate && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                Até: {localFilters.endDate.toLocaleDateString('pt-BR')}
              </span>
            )}
            {localFilters.userIds && localFilters.userIds.length > 0 && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                {localFilters.userIds.length} colaborador(es)
              </span>
            )}
            {localFilters.groupBy && (
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                Agrupar: {localFilters.groupBy}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
