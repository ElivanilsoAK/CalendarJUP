// src/components/VacationModal.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import { useFormValidation } from '../hooks/useValidation';
import ValidatedInput from './forms/ValidatedInput';
import ValidatedTextarea from './forms/ValidatedTextarea';
import { 
  requestVacation, 
  getUserVacations, 
  approveVacation, 
  rejectVacation, 
  cancelVacation,
  type Vacation 
} from '../services/vacationService';
import { 
  notifyVacationRequest, 
  notifyVacationApproved, 
  notifyVacationRejected,
  getAdminIds
} from '../services/notificationService';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Plus, X, Check, XCircle, Clock } from 'lucide-react';

interface VacationModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborator: {
    id: string;
    name: string;
  } | null;
}

const VacationModal: React.FC<VacationModalProps> = ({ isOpen, onClose, collaborator }) => {
  const { currentUser, currentUserOrg } = useAuth();
  const { success, error } = useToastContext();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Validação do formulário de férias
  const vacationValidation = useFormValidation('vacation', {
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    if (isOpen && collaborator && currentUserOrg) {
      loadVacations();
    }
  }, [isOpen, collaborator, currentUserOrg]);

  const loadVacations = async () => {
    if (!currentUserOrg || !collaborator) return;
    
    setLoading(true);
    try {
      const vacationsData = await getUserVacations(currentUserOrg.orgId, collaborator.id);
      setVacations(vacationsData);
    } catch (err) {
      console.error('Erro ao carregar férias:', err);
      error('Erro ao carregar férias', 'Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVacation = async () => {
    if (!currentUserOrg || !collaborator || !currentUser) return;
    
    // Validar formulário
    const validation = vacationValidation.validate();
    if (!validation.isValid) {
      return;
    }

    setSubmitting(true);
    try {
      await requestVacation(currentUserOrg.orgId, {
        userId: collaborator.id,
        userName: collaborator.name,
        startDate: vacationValidation.values.startDate,
        endDate: vacationValidation.values.endDate,
        reason: vacationValidation.values.reason || undefined
      });
      
      vacationValidation.resetAll();
      setShowRequestForm(false);
      await loadVacations();
      success('Solicitação enviada', 'Solicitação de férias enviada com sucesso!');
      
      // Notificar admins sobre nova solicitação
      if (currentUserOrg) {
        try {
          const adminIds = await getAdminIds(currentUserOrg.orgId);
          if (adminIds.length > 0) {
            await notifyVacationRequest(
              currentUserOrg.orgId,
              adminIds,
              collaborator.name,
              vacationValidation.values.startDate,
              vacationValidation.values.endDate
            );
          }
        } catch (err) {
          // Erro na notificação não deve impedir o fluxo principal
          console.warn('Erro ao enviar notificação:', err);
        }
      }
    } catch (err) {
      error('Erro ao solicitar férias', 'Tente novamente mais tarde.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (vacationId: string) => {
    if (!currentUserOrg || !currentUser) return;
    
    if (!window.confirm('Tem certeza que deseja aprovar esta solicitação de férias?')) {
      return;
    }

    try {
      await approveVacation(currentUserOrg.orgId, vacationId, currentUser.uid);
      await loadVacations();
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
      await loadVacations();
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
      await loadVacations();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <Calendar className="mr-3" />
              Férias - {collaborator?.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Botão para solicitar férias */}
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Solicitações de Férias
                </h4>
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"
                >
                  <Plus size={18} />
                  <span>Solicitar Férias</span>
                </button>
              </div>

              {/* Formulário de nova solicitação */}
              {showRequestForm && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Nova Solicitação de Férias
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <ValidatedInput
                      label="Data de Início"
                      type="date"
                      value={vacationValidation.values.startDate}
                      onChange={(e) => vacationValidation.setFieldValue('startDate', e.target.value)}
                      onBlur={() => vacationValidation.setFieldTouched('startDate')}
                      error={vacationValidation.errors.startDate}
                      touched={vacationValidation.touched.startDate}
                      required
                    />
                    <ValidatedInput
                      label="Data de Fim"
                      type="date"
                      value={vacationValidation.values.endDate}
                      onChange={(e) => vacationValidation.setFieldValue('endDate', e.target.value)}
                      onBlur={() => vacationValidation.setFieldTouched('endDate')}
                      error={vacationValidation.errors.endDate}
                      touched={vacationValidation.touched.endDate}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <ValidatedTextarea
                      label="Motivo (opcional)"
                      value={vacationValidation.values.reason}
                      onChange={(e) => vacationValidation.setFieldValue('reason', e.target.value)}
                      onBlur={() => vacationValidation.setFieldTouched('reason')}
                      error={vacationValidation.errors.reason}
                      touched={vacationValidation.touched.reason}
                      rows={3}
                      placeholder="Descreva o motivo das férias..."
                      maxLength={500}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmitVacation}
                      disabled={submitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                    >
                      {submitting ? 'Enviando...' : 'Enviar Solicitação'}
                    </button>
                    <button
                      onClick={() => {
                        setShowRequestForm(false);
                        vacationValidation.resetAll();
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de férias */}
              <div className="space-y-3">
                {vacations.length > 0 ? (
                  vacations.map((vacation) => (
                    <div key={vacation.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-500" />
                          <span className="font-medium text-gray-800 dark:text-gray-200">
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
                                className="text-green-600 hover:text-green-800 dark:text-green-400"
                                title="Aprovar"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => handleReject(vacation.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400"
                                title="Rejeitar"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          {vacation.status === 'pending' && (
                            <button
                              onClick={() => handleCancel(vacation.id)}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400"
                              title="Cancelar"
                            >
                              <X size={16} />
                            </button>
                          )}
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

export default VacationModal;
