import { renderHook, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import { useApi } from '../../hooks/useApi';

// モック関数
const createMockApiCall = (shouldFail = false, delay = 0) => {
  return jest.fn(() => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new Error('API Error'));
        } else {
          resolve({ id: '1', name: 'Test Data' });
        }
      }, delay);
    });
  });
};

describe('useApi', () => {
  it('should initialize with loading state', () => {
    const mockApiCall = createMockApiCall();
    const { result } = renderHook(() => useApi(mockApiCall));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch data successfully', async () => {
    const mockApiCall = createMockApiCall();
    const { result } = renderHook(() => useApi(mockApiCall));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: '1', name: 'Test Data' });
    expect(result.current.error).toBeNull();
    expect(mockApiCall).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors', async () => {
    console.error = jest.fn(); // エラーログを抑制
    const mockApiCall = createMockApiCall(true);
    const { result } = renderHook(() => useApi(mockApiCall));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('API Error');
    expect(mockApiCall).toHaveBeenCalledTimes(1);
  });

  it('should refetch data when refetch is called', async () => {
    const mockApiCall = createMockApiCall();
    const { result } = renderHook(() => useApi(mockApiCall));

    // 初回データフェッチを待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiCall).toHaveBeenCalledTimes(1);

    // refetch を実行
    await act(async () => {
      await result.current.refetch();
    });

    expect(mockApiCall).toHaveBeenCalledTimes(2);
  });

  it('should reset state when reset is called', async () => {
    const mockApiCall = createMockApiCall();
    const { result } = renderHook(() => useApi(mockApiCall));

    // 初回データフェッチを待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: '1', name: 'Test Data' });

    // reset を実行
    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should refetch when dependencies change', async () => {
    const mockApiCall = createMockApiCall();
    let dependency = 'initial';

    const { result, rerender } = renderHook(
      ({ dep }) => useApi(mockApiCall, [dep]),
      { initialProps: { dep: dependency } }
    );

    // 初回データフェッチを待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiCall).toHaveBeenCalledTimes(1);

    // 依存関係を変更
    dependency = 'changed';
    rerender({ dep: dependency });

    // 再フェッチされることを確認
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledTimes(2);
    });
  });

  it('should not refetch when dependencies do not change', async () => {
    const mockApiCall = createMockApiCall();
    const dependency = 'constant';

    const { result, rerender } = renderHook(
      ({ dep }) => useApi(mockApiCall, [dep]),
      { initialProps: { dep: dependency } }
    );

    // 初回データフェッチを待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiCall).toHaveBeenCalledTimes(1);

    // 同じ依存関係で再レンダー
    rerender({ dep: dependency });

    // 再フェッチされないことを確認
    expect(mockApiCall).toHaveBeenCalledTimes(1);
  });

  it('should handle non-Error exceptions', async () => {
    const mockApiCall = jest.fn(() => Promise.reject('String error'));
    const { result } = renderHook(() => useApi(mockApiCall));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('An error occurred');
  });

  it('should set loading to true during refetch', async () => {
    const mockApiCall = createMockApiCall(false, 100); // 100ms の遅延
    const { result } = renderHook(() => useApi(mockApiCall));

    // 初回データフェッチを待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // refetch を開始
    act(() => {
      result.current.refetch();
    });

    // loading が true になることを確認
    expect(result.current.loading).toBe(true);

    // refetch の完了を待つ
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});