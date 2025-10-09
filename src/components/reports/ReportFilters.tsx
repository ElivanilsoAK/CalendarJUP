// src/components/reports/ReportFilters.tsx
import React, { useState } from 'react';
import { Calendar, Users, Filter, Download, Save, Plus, X } from 'lucide-react';
import { Button } from '../ui/Button';
import ValidatedInput from '../forms/ValidatedInput';
import ValidatedSelect from '../forms/ValidatedSelect';
import { getReportTemplates } from '../../services/reportService';
import type { ReportFilter } from '../../services/reportService';
import { format } from 'date-fns';

interface ReportFiltersProps {
  filters: ReportFilter;
  onFiltersChange: (filters: ReportFilter) => void;
  onExport?: () => void;
  onSaveTemplate?: (name: string, description: string) => void;
  collaborators: Array<{ id: string; name: string; department?: string }>;
  loading?: boolean;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  onFiltersChange,
  onExport,
  onSaveTemplate,
  collaborators,
  loading = false
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const departments = Array.from(
    new Set(collaborators.map(c => c.department).filter(Boolean))
  );

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newFilters = {
      ...filters,
      [field]: value ? new Date(value) : undefined
    };
    onFiltersChange(newFilters);
  };

  const handleMultiSelectChange = (
    field: 'userIds' | 'status' | 'departments',
    value: string
  ) => {
    const currentValues = filters[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({
      ...filters,
      [field]: newValues.length > 0 ? newValues : undefined
    });
  };

  const handleSelectChange = (field: keyof ReportFilter, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    const templates = getReportTemplates();
    const template = templates.find(t => t.id === templateId);
    if (template) {
      onFiltersChange(template.filters);
    }
  };

  const handleSaveTemplate = () => {
    if (templateName.trim() && onSaveTemplate) {
      onSaveTemplate(templateName.trim(), templateDescription.trim());
      setTemplateName('');
      setTemplateDescription('');
      setShowSaveTemplate(false);
    }
  };

  const clearFilters = () => {
    onFiltersChange({
      groupBy: 'month',
      sortBy: 'date',
      sortOrder: 'asc'
    });
  };

  const hasActiveFilters = () => {
    return !!(
      filters.startDate ||
      filters.endDate ||
      (filters.userIds && filters.userIds.length > 0) ||
      (filters.status && filters.status.length > 0) ||
      (filters.departments && filters.departments.length > 0) ||
      filters.includeVacations
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Filter size={20} />
          Filtros e Configurações
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
          {onSaveTemplate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveTemplate(true)}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              Salvar Template
            </Button>
          )}
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

      {/* Templates Rápidos */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Templates Rápidos
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {getReportTemplates().map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              className="p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h4 className="font-medium text-gray-800 dark:text-gray-200">
                {template.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {template.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros Básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ValidatedInput
          label="Data Inicial"
          type="date"
          value={filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : ''}
          onChange={(e) => handleDateChange('startDate', e.target.value)}
          placeholder="Selecione a data inicial"
        />

        <ValidatedInput
          label="Data Final"
          type="date"
          value={filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : ''}
          onChange={(e) => handleDateChange('endDate', e.target.value)}
          placeholder="Selecione a data final"
        />

        <ValidatedSelect
          label="Agrupar por"
          options={[
            { value: 'day', label: 'Dia' },
            { value: 'week', label: 'Semana' },
            { value: 'month', label: 'Mês' },
            { value: 'quarter', label: 'Trimestre' },
            { value: 'year', label: 'Ano' }
          ]}
          value={filters.groupBy || 'month'}
          onChange={(e) => handleSelectChange('groupBy', e.target.value)}
        />

        <ValidatedSelect
          label="Ordenar por"
          options={[
            { value: 'date', label: 'Data' },
            { value: 'user', label: 'Usuário' },
            { value: 'department', label: 'Departamento' },
            { value: 'status', label: 'Status' }
          ]}
          value={filters.sortBy || 'date'}
          onChange={(e) => handleSelectChange('sortBy', e.target.value)}
        />
      </div>

      {/* Filtros Avançados */}
      {showAdvanced && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-100 mb-4">
            Filtros Avançados
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Filtro por Usuários */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <Users size={16} className="inline mr-2" />
                Colaboradores
              </label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {collaborators.map((collaborator) => (
                  <label key={collaborator.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.userIds?.includes(collaborator.id) || false}
                      onChange={() => handleMultiSelectChange('userIds', collaborator.id)}
                      className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {collaborator.name}
                      {collaborator.department && (
                        <span className="text-gray-500 ml-1">
                          ({collaborator.department})
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro por Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Status
              </label>
              <div className="space-y-2">
                {['pending', 'approved', 'rejected', 'completed', 'active', 'inactive'].map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(status) || false}
                      onChange={() => handleMultiSelectChange('status', status)}
                      className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {status === 'pending' ? 'Pendente' :
                       status === 'approved' ? 'Aprovado' :
                       status === 'rejected' ? 'Rejeitado' :
                       status === 'completed' ? 'Concluído' :
                       status === 'active' ? 'Ativo' :
                       status === 'inactive' ? 'Inativo' : status}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro por Departamentos */}
            {departments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Departamentos
                </label>
                <div className="space-y-2">
                  {departments.map((department) => (
                    <label key={department} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.departments?.includes(department) || false}
                        onChange={() => handleMultiSelectChange('departments', department)}
                        className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {department}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Opções Adicionais */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.includeVacations || false}
                  onChange={(e) => handleSelectChange('includeVacations', e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Incluir dados de férias
                </span>
              </label>
              
              <ValidatedSelect
                label="Ordem"
                options={[
                  { value: 'asc', label: 'Crescente' },
                  { value: 'desc', label: 'Decrescente' }
                ]}
                value={filters.sortOrder || 'asc'}
                onChange={(e) => handleSelectChange('sortOrder', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal para Salvar Template */}
      {showSaveTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Salvar Template de Relatório
            </h3>
            
            <div className="space-y-4">
              <ValidatedInput
                label="Nome do Template"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Relatório Mensal de Plantões"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Descreva o propósito deste template..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSaveTemplate(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
              >
                Salvar Template
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resumo dos Filtros Ativos */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {filters.startDate && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                Desde: {format(filters.startDate, 'dd/MM/yyyy')}
              </span>
            )}
            {filters.endDate && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                Até: {format(filters.endDate, 'dd/MM/yyyy')}
              </span>
            )}
            {filters.userIds && filters.userIds.length > 0 && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                {filters.userIds.length} colaborador(es)
              </span>
            )}
            {filters.status && filters.status.length > 0 && (
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                {filters.status.length} status
              </span>
            )}
            {filters.departments && filters.departments.length > 0 && (
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm">
                {filters.departments.length} departamento(s)
              </span>
            )}
            {filters.includeVacations && (
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm">
                Inclui férias
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
