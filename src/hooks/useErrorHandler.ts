// src/hooks/useErrorHandler.ts
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import { 
  handleError, 
  handleNetworkError, 
  handleValidationError,
  handlePermissionError,
  getErrorMessage,
  type ErrorHandlerOptions,
  type AppError 
} from '../services/errorService';

export const useErrorHandler = () => {
  const { currentUser } = useAuth();
  const { error: showErrorToast, warning, success } = useToastContext();

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
    const appError = handleNetworkError(error, context);
    showErrorToast('Erro de Conexão', appError.message);
    return appError;
  }, [showErrorToast]);

  const handleValidationError = useCallback((
    message: string,
    context?: string
  ): AppError => {
    const appError = handleValidationError(message, context);
    warning('Dados Inválidos', appError.message);
    return appError;
  }, [warning]);

  const handlePermissionError = useCallback(async (
    error: any,
    context?: string
  ): Promise<AppError> => {
    const appError = handlePermissionError(error, context);
    showErrorToast('Sem Permissão', appError.message);
    return appError;
  }, [showErrorToast]);

  const getErrorMessageSafe = useCallback((
    error: any,
    fallback?: string
  ): string => {
    return getErrorMessage(error, fallback);
  }, []);

  // Wrapper para operações assíncronas
  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: ErrorHandlerOptions = {}
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await fn(...args);
      } catch (error) {
        await handleAppError(error, options);
        return null;
      }
    };
  }, [handleAppError]);

  // Wrapper para operações síncronas
  const withSyncErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    options: ErrorHandlerOptions = {}
  ) => {
    return (...args: T): R | null => {
      try {
        return fn(...args);
      } catch (error) {
        handleAppError(error, options);
        return null;
      }
    };
  }, [handleAppError]);

  return {
    handleError: handleAppError,
    handleNetworkError,
    handleValidationError,
    handlePermissionError,
    getErrorMessage: getErrorMessageSafe,
    withErrorHandling,
    withSyncErrorHandling,
    currentUserId: currentUser?.uid
  };
};
