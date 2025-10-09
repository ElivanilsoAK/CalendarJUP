// src/hooks/useErrorHandler.ts
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import { 
  handleError,
  type ErrorHandlerOptions,
  type AppError 
} from '../services/errorService';

export const useErrorHandler = () => {
  // const { currentUser } = useAuth();
  const { error: showErrorToast, warning } = useToastContext();

  const handleAppError = useCallback(async (
    error: any,
    options: ErrorHandlerOptions = {}
  ): Promise<AppError> => {
    const appError = await handleError(error, {
      ...options,
      context: options.context || 'useErrorHandler'
    });

    // Mostrar toast se habilitado
    if (options.showToast !== false) {
      showErrorToast('Erro', appError.message);
    }

    return appError;
  }, [showErrorToast]);

  const handleNetworkError = useCallback(async (
    error: any,
    context?: string
  ): Promise<AppError> => {
    const appError = await handleError(error, { context: context || 'network' });
    showErrorToast('Erro de Conexão', appError.message);
    return appError;
  }, [showErrorToast]);

  const handleValidationError = useCallback((
    message: string,
    context?: string
  ): AppError => {
    const appError = {
      code: 'VALIDATION_ERROR',
      message,
      context: context || 'validation',
      timestamp: new Date()
    };
    warning('Dados Inválidos', appError.message);
    return appError;
  }, [warning]);

  const handlePermissionError = useCallback((
    context?: string
  ): AppError => {
    const appError = {
      code: 'PERMISSION_ERROR',
      message: 'Você não tem permissão para realizar esta ação',
      context: context || 'permission',
      timestamp: new Date()
    };
    warning('Permissão Negada', appError.message);
    return appError;
  }, [warning]);

  return {
    handleError: handleAppError,
    handleNetworkError,
    handleValidationError,
    handlePermissionError
  };
};