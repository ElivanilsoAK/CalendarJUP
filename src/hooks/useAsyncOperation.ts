// src/hooks/useAsyncOperation.ts
import { useState, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';

interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface AsyncOperationOptions {
  showToast?: boolean;
  context?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export const useAsyncOperation = <T = any>(
  options: AsyncOperationOptions = {}
) => {
  const { handleError } = useErrorHandler();
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (
    operation: () => Promise<T>
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await operation();
      setState({ data: result, loading: false, error: null });
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      const appError = await handleError(error, {
        showToast: options.showToast !== false,
        context: options.context
      });
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: appError as any 
      }));
      
      if (options.onError) {
        options.onError(appError as any);
      }
      
      return null;
    }
  }, [handleError, options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
    isIdle: !state.loading && !state.error && !state.data,
    isSuccess: !state.loading && !state.error && !!state.data,
    isError: !state.loading && !!state.error
  };
};
