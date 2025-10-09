// src/components/VacationManagementModal.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import { 
  getAllVacations,
  approveVacation, 
  rejectVacation, 
  cancelVacation,
  type Vacation 
} from '../services/vacationService';
import { 
  notifyVacationApproved, 
  notifyVacationRejected 
} from '../services/notificationService';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, X, Check, XCircle, Clock, Users } from 'lucide-react';

interface VacationManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VacationManagementModal: React.FC<VacationManagementModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, currentUserOrg } = useAuth();
  const { success, error } = useToastContext();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (isOpen && currentUserOrg) {
      loadAllVacations();
    }
  }, [isOpen, currentUserOrg]);

  const loadAllVacations = async () => {
    if (!currentUserOrg) return;
    
    setLoading(true);
    try {
      const vacationsData = await getAllVacations(currentUserOrg.orgId);
      setVacations(vacationsData);
    } catch (err) {
      console.error('Erro ao carregar férias:', err);
      error('Erro ao carregar férias', 'Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vacationId: string) => {
    if (!currentUserOrg || !currentUser) return;
    
    if (!window.confirm('Tem certeza que deseja aprovar esta solicitação de férias?')) {
      return;
    }

    try {
      await approveVacation(currentUserOrg.orgId, vacationId, currentUser.uid);
      await loadAllVacations();
      success('Férias aprovadas', 'Férias aprovadas com sucesso!');
      
      // Notificar o usuário sobre aprovação
      const vacation = vacations.find(v => v.id === vacationId);
      if (vacation) {
        await notifyVacationApproved(
          currentUserOrg.orgId,
          vacation.userId,
          vacation.startDate,
          vacation.endDate
        );
      }
    } catch (err) {
      console.error('Erro ao aprovar férias:', err);
      error('Erro ao aprovar férias', 'Tente novamente mais tarde.');
    }
  };

  const handleReject = async (vacationId: string) => {
    if (!currentUserOrg || !currentUser) return;
    
    const reason = prompt('Motivo da rejeição (opcional):');
    if (reason === null) return; // Usuário cancelou

    if (!window.confirm('Tem certeza que deseja rejeitar esta solicitação de férias?')) {
      return;
    }

    try {
      await rejectVacation(currentUserOrg.orgId, vacationId, currentUser.uid, reason || undefined);
      await loadAllVacations();
      success('Férias rejeitadas', 'Solicitação de férias rejeitada.');
      
      // Notificar o usuário sobre rejeição
      const vacation = vacations.find(v => v.id === vacationId);
      if (vacation) {
        await notifyVacationRejected(
          currentUserOrg.orgId,
          vacation.userId,
          vacation.startDate,
          vacation.endDate,
          reason || undefined
        );
      }
    } catch (err) {
      console.error('Erro ao rejeitar férias:', err);
      error('Erro ao rejeitar férias', 'Tente novamente mais tarde.');
    }
  };

  const handleCancel = async (vacationId: string) => {
    if (!currentUserOrg) return;
    
    if (!window.confirm('Tem certeza que deseja cancelar esta solicitação de férias?')) {
      return;
    }

    try {
      await cancelVacation(currentUserOrg.orgId, vacationId);
      await loadAllVacations();
      success('Solicitação cancelada', 'Solicitação de férias cancelada.');
    } catch (err) {
      console.error('Erro ao cancelar férias:', err);
      error('Erro ao cancelar férias', 'Tente novamente mais tarde.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'rejected': return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      case 'pending': return 'Pendente';
      default: return 'Desconhecido';
    }
  };

  const filteredVacations = vacations.filter(vacation => {
    if (filter === 'all') return true;
    return vacation.status === filter;
  });

  const pendingCount = vacations.filter(v => v.status === 'pending').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <Users className="mr-3" />
              Gerenciar Férias da Organização
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Filtros */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === 'all' 
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              Todas ({vacations.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === 'pending' 
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              Pendentes ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === 'approved' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              Aprovadas
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === 'rejected' 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              Rejeitadas
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVacations.length > 0 ? (
                filteredVacations.map((vacation) => (
                  <div key={vacation.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-500" />
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {vacation.userName}
                        </span>
                        <span className="text-gray-500">-</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {format(parseISO(vacation.startDate), 'dd/MM/yyyy', { locale: ptBR })} - {format(parseISO(vacation.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(vacation.status)}`}>
                          {getStatusIcon(vacation.status)}
                          {getStatusText(vacation.status)}
                        </span>
                      </div>
                    </div>
                    
                    {vacation.reason && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Motivo:</strong> {vacation.reason}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        Solicitado em: {format(vacation.requestedAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                      <div className="flex gap-2">
                        {vacation.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(vacation.id)}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 flex items-center gap-1"
                              title="Aprovar"
                            >
                              <Check size={16} />
                              <span>Aprovar</span>
                            </button>
                            <button
                              onClick={() => handleReject(vacation.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 flex items-center gap-1"
                              title="Rejeitar"
                            >
                              <XCircle size={16} />
                              <span>Rejeitar</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleCancel(vacation.id)}
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 flex items-center gap-1"
                          title="Cancelar"
                        >
                          <X size={16} />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhuma solicitação de férias encontrada</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VacationManagementModal;
