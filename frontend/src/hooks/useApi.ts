import { useState, useEffect, useCallback } from 'react';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
  reset: () => void;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
    }
  }, [apiCall]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  return {
    ...state,
    refetch,
    reset,
  };
}