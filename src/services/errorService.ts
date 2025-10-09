// src/services/errorService.ts
import { logEvent } from '../firebase/analytics';
import { analytics } from '../firebase/config';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  context?: string;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  logToAnalytics?: boolean;
  fallbackMessage?: string;
  context?: string;
}

/**
 * Códigos de erro padronizados
 */
export const ERROR_CODES = {
  // Autenticação
  AUTH_USER_NOT_FOUND: 'auth/user-not-found',
  AUTH_WRONG_PASSWORD: 'auth/wrong-password',
  AUTH_EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  AUTH_WEAK_PASSWORD: 'auth/weak-password',
  AUTH_INVALID_EMAIL: 'auth/invalid-email',
  AUTH_USER_DISABLED: 'auth/user-disabled',
  AUTH_TOO_MANY_REQUESTS: 'auth/too-many-requests',
  
  // Firestore
  FIRESTORE_PERMISSION_DENIED: 'permission-denied',
  FIRESTORE_NOT_FOUND: 'not-found',
  FIRESTORE_ALREADY_EXISTS: 'already-exists',
  FIRESTORE_UNAVAILABLE: 'unavailable',
  FIRESTORE_DEADLINE_EXCEEDED: 'deadline-exceeded',
  
  // Storage
  STORAGE_OBJECT_NOT_FOUND: 'storage/object-not-found',
  STORAGE_UNAUTHORIZED: 'storage/unauthorized',
  STORAGE_CANCELED: 'storage/canceled',
  STORAGE_UNKNOWN: 'storage/unknown',
  
  // Aplicação
  NETWORK_ERROR: 'network-error',
  VALIDATION_ERROR: 'validation-error',
  UNKNOWN_ERROR: 'unknown-error',
  FILE_TOO_LARGE: 'file-too-large',
  INVALID_FILE_TYPE: 'invalid-file-type',
  ORGANIZATION_NOT_FOUND: 'organization-not-found',
  USER_NOT_AUTHORIZED: 'user-not-authorized',
  VACATION_CONFLICT: 'vacation-conflict',
  CALENDAR_GENERATION_FAILED: 'calendar-generation-failed',
} as const;

/**
 * Mensagens de erro amigáveis para o usuário
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Autenticação
  [ERROR_CODES.AUTH_USER_NOT_FOUND]: 'Usuário não encontrado. Verifique seu email.',
  [ERROR_CODES.AUTH_WRONG_PASSWORD]: 'Senha incorreta. Tente novamente.',
  [ERROR_CODES.AUTH_EMAIL_ALREADY_IN_USE]: 'Este email já está em uso.',
  [ERROR_CODES.AUTH_WEAK_PASSWORD]: 'A senha deve ter pelo menos 6 caracteres.',
  [ERROR_CODES.AUTH_INVALID_EMAIL]: 'Email inválido. Verifique o formato.',
  [ERROR_CODES.AUTH_USER_DISABLED]: 'Esta conta foi desabilitada.',
  [ERROR_CODES.AUTH_TOO_MANY_REQUESTS]: 'Muitas tentativas. Tente novamente mais tarde.',
  
  // Firestore
  [ERROR_CODES.FIRESTORE_PERMISSION_DENIED]: 'Você não tem permissão para realizar esta ação.',
  [ERROR_CODES.FIRESTORE_NOT_FOUND]: 'Dados não encontrados.',
  [ERROR_CODES.FIRESTORE_ALREADY_EXISTS]: 'Este item já existe.',
  [ERROR_CODES.FIRESTORE_UNAVAILABLE]: 'Serviço temporariamente indisponível.',
  [ERROR_CODES.FIRESTORE_DEADLINE_EXCEEDED]: 'Operação demorou muito para ser concluída.',
  
  // Storage
  [ERROR_CODES.STORAGE_OBJECT_NOT_FOUND]: 'Arquivo não encontrado.',
  [ERROR_CODES.STORAGE_UNAUTHORIZED]: 'Não autorizado a acessar este arquivo.',
  [ERROR_CODES.STORAGE_CANCELED]: 'Upload cancelado.',
  [ERROR_CODES.STORAGE_UNKNOWN]: 'Erro desconhecido no upload.',
  
  // Aplicação
  [ERROR_CODES.NETWORK_ERROR]: 'Erro de conexão. Verifique sua internet.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Dados inválidos. Verifique os campos.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'Ocorreu um erro inesperado. Tente novamente.',
  [ERROR_CODES.FILE_TOO_LARGE]: 'Arquivo muito grande. Máximo 5MB.',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'Tipo de arquivo não suportado.',
  [ERROR_CODES.ORGANIZATION_NOT_FOUND]: 'Organização não encontrada.',
  [ERROR_CODES.USER_NOT_AUTHORIZED]: 'Você não tem permissão para esta ação.',
  [ERROR_CODES.VACATION_CONFLICT]: 'Conflito de datas nas férias.',
  [ERROR_CODES.CALENDAR_GENERATION_FAILED]: 'Falha ao gerar calendário.',
};

/**
 * Extrai informações do erro Firebase
 */
export const extractFirebaseError = (error: any): { code: string; message: string } => {
  if (error?.code) {
    return {
      code: error.code,
      message: ERROR_MESSAGES[error.code] || error.message || 'Erro desconhecido'
    };
  }
  
  if (error?.message) {
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error.message
    };
  }
  
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: 'Erro desconhecido'
  };
};

/**
 * Cria um objeto de erro padronizado
 */
export const createAppError = (
  error: any,
  context?: string,
  userId?: string
): AppError => {
  const { code, message } = extractFirebaseError(error);
  
  return {
    code,
    message,
    details: error,
    timestamp: new Date(),
    userId,
    context
  };
};

/**
 * Handler principal de erros
 */
export const handleError = async (
  error: any,
  options: ErrorHandlerOptions = {}
): Promise<AppError> => {
  const {
    logToConsole = true,
    logToAnalytics = true,
    context
  } = options;

  const appError = createAppError(error, context);

  // Log no console se habilitado
  if (logToConsole) {
    console.error(`[${appError.context || 'App'}] ${appError.code}:`, {
      message: appError.message,
      details: appError.details,
      timestamp: appError.timestamp
    });
  }

  // Log no Analytics se habilitado
  if (logToAnalytics) {
    try {
      await logEvent(analytics, 'error_occurred', {
        error_code: appError.code,
        error_message: appError.message,
        context: appError.context,
        user_id: appError.userId
      });
    } catch (analyticsError) {
      console.warn('Failed to log error to analytics:', analyticsError);
    }
  }

  return appError;
};

/**
 * Handler específico para erros de rede
 */
export const handleNetworkError = (error: any, context?: string): AppError => {
  const isNetworkError = !navigator.onLine || 
    error?.code === 'unavailable' || 
    error?.message?.includes('network') ||
    error?.message?.includes('fetch');

  if (isNetworkError) {
    return createAppError({
      code: ERROR_CODES.NETWORK_ERROR,
      message: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR]
    }, context);
  }

  return createAppError(error, context);
};

/**
 * Handler específico para erros de validação
 */
export const handleValidationError = (message: string, context?: string): AppError => {
  return createAppError({
    code: ERROR_CODES.VALIDATION_ERROR,
    message
  }, context);
};

/**
 * Handler específico para erros de permissão
 */
export const handlePermissionError = (error: any, context?: string): AppError => {
  const appError = createAppError(error, context);
  
  if (appError.code === ERROR_CODES.FIRESTORE_PERMISSION_DENIED) {
    appError.message = ERROR_MESSAGES[ERROR_CODES.USER_NOT_AUTHORIZED];
  }
  
  return appError;
};

/**
 * Wrapper para funções assíncronas com tratamento de erro
 */
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: ErrorHandlerOptions = {}
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      await handleError(error, options);
      return null;
    }
  };
};

/**
 * Wrapper para funções síncronas com tratamento de erro
 */
export const withSyncErrorHandling = <T extends any[], R>(
  fn: (...args: T) => R,
  options: ErrorHandlerOptions = {}
) => {
  return (...args: T): R | null => {
    try {
      return fn(...args);
    } catch (error) {
      handleError(error, options);
      return null;
    }
  };
};

/**
 * Verifica se um erro é recuperável
 */
export const isRecoverableError = (error: AppError): boolean => {
  const recoverableCodes = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.FIRESTORE_UNAVAILABLE,
    ERROR_CODES.FIRESTORE_DEADLINE_EXCEEDED,
    ERROR_CODES.AUTH_TOO_MANY_REQUESTS
  ];
  
  return recoverableCodes.includes(error.code as any);
};

/**
 * Retorna uma mensagem de erro amigável
 */
export const getErrorMessage = (error: any, fallback?: string): string => {
  const { message } = extractFirebaseError(error);
  return message || fallback || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
};
