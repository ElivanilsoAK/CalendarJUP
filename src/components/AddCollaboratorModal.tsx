import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';

interface AddCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCollaborator: (email: string, role: 'admin' | 'member') => Promise<void>;
}

const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({
  isOpen,
  onClose,
  onAddCollaborator,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onAddCollaborator(email.trim(), role);
      setEmail('');
      setRole('member');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar colaborador');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <UserPlus className="mr-3" />
              Adicionar Colaborador
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email do Colaborador
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="colaborador@empresa.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Função
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="member">Membro</option>
                <option value="admin">Administrador</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Administradores podem gerenciar outros membros e calendários
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adicionando...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Adicionar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCollaboratorModal;
