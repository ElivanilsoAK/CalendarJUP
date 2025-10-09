// src/hooks/useLoading.ts
import { useState, useCallback, useRef, useEffect } from 'react';

interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
  error?: string;
}

interface UseLoadingOptions {
  initialLoading?: boolean;
  timeout?: number; // Auto-stop loading after timeout (ms)
  onTimeout?: () => void;
}

export const useLoading = (options: UseLoadingOptions = {}) => {
  const { initialLoading = false, timeout, onTimeout } = options;
  
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: initialLoading
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback((message?: string) => {
    setLoadingState({
      isLoading: true,
      progress: 0,
      message,
      error: undefined
    });

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout if provided
    if (timeout) {
      timeoutRef.current = setTimeout(() => {
        setLoadingState(prev => ({ ...prev, isLoading: false }));
        onTimeout?.();
      }, timeout);
    }
  }, [timeout, onTimeout]);

  const stopLoading = useCallback((error?: string) => {
    setLoadingState({
      isLoading: false,
      progress: 100,
      error
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const setProgress = useCallback((progress: number, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(Math.max(progress, 0), 100),
      message
    }));
  }, []);

  const setMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      message
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setLoadingState(prev => ({
      ...prev,
      error,
      isLoading: false
    }));
  }, []);

  const reset = useCallback(() => {
    setLoadingState({
      isLoading: false,
      progress: undefined,
      message: undefined,
      error: undefined
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...loadingState,
    startLoading,
    stopLoading,
    setProgress,
    setMessage,
    setError,
    reset
  };
};

// Hook para operações assíncronas com loading automático
export const useAsyncLoading = <T extends any[], R>(
  asyncFunction: (...args: T) => Promise<R>,
  options: UseLoadingOptions = {}
) => {
  const loading = useLoading(options);

  const execute = useCallback(async (...args: T): Promise<R | undefined> => {
    try {
      loading.startLoading();
      const result = await asyncFunction(...args);
      loading.stopLoading();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      loading.setError(errorMessage);
      throw error;
    }
  }, [asyncFunction, loading]);

  return {
    ...loading,
    execute
  };
};

// Hook para múltiplos estados de loading
export const useMultipleLoading = (keys: string[]) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    keys.forEach(key => {
      initial[key] = false;
    });
    return initial;
  });

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  const startLoading = useCallback((key: string) => {
    setLoading(key, true);
  }, [setLoading]);

  const stopLoading = useCallback((key: string) => {
    setLoading(key, false);
  }, [setLoading]);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  const resetAll = useCallback(() => {
    const reset: Record<string, boolean> = {};
    keys.forEach(key => {
      reset[key] = false;
    });
    setLoadingStates(reset);
  }, [keys]);

  return {
    loadingStates,
    setLoading,
    startLoading,
    stopLoading,
    isLoading,
    isAnyLoading,
    resetAll
  };
};

// Hook para loading com progresso simulado
export const useProgressLoading = (options: UseLoadingOptions = {}) => {
  const loading = useLoading(options);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startProgressLoading = useCallback((message?: string, duration: number = 2000) => {
    loading.startLoading(message);
    
    let progress = 0;
    const increment = 100 / (duration / 100);
    
    progressIntervalRef.current = setInterval(() => {
      progress += increment;
      if (progress >= 100) {
        progress = 100;
        loading.setProgress(progress);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      } else {
        loading.setProgress(progress);
      }
    }, 100);
  }, [loading]);

  const stopProgressLoading = useCallback((error?: string) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    loading.stopLoading(error);
  }, [loading]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return {
    ...loading,
    startProgressLoading,
    stopProgressLoading
  };
};
