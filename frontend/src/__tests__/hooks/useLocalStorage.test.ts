import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// LocalStorage のモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// StorageEvent のモック
const createStorageEvent = (key: string, newValue: string | null) => {
  const event = new Event('storage') as StorageEvent;
  Object.defineProperty(event, 'key', { value: key });
  Object.defineProperty(event, 'newValue', { value: newValue });
  return event;
};

describe('useLocalStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn(); // エラーログを抑制
  });

  it('should return initial value when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    expect(result.current[0]).toBe('initial-value');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should return stored value from localStorage', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('stored-value'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    expect(result.current[0]).toBe('stored-value');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should return initial value when localStorage throws error', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    expect(result.current[0]).toBe('initial-value');
    expect(console.error).toHaveBeenCalledWith(
      'Error reading localStorage key "test-key":',
      expect.any(Error)
    );
  });

  it('should update state and localStorage when setValue is called', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'));
  });

  it('should handle function updates', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('initial-value'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    act(() => {
      result.current[1]((prev) => prev + '-updated');
    });

    expect(result.current[0]).toBe('initial-value-updated');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify('initial-value-updated')
    );
  });

  it('should handle localStorage setItem errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage setItem error');
    });

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    act(() => {
      result.current[1]('new-value');
    });

    // State は更新されるが、localStorage への保存は失敗
    expect(result.current[0]).toBe('new-value');
    expect(console.error).toHaveBeenCalledWith(
      'Error setting localStorage key "test-key":',
      expect.any(Error)
    );
  });

  it('should handle complex objects', () => {
    const initialObject = { id: 1, name: 'test' };
    const newObject = { id: 2, name: 'updated' };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(initialObject));

    const { result } = renderHook(() => useLocalStorage('test-key', {}));

    expect(result.current[0]).toEqual(initialObject);

    act(() => {
      result.current[1](newObject);
    });

    expect(result.current[0]).toEqual(newObject);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(newObject));
  });

  it('should listen to storage events from other tabs', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('initial-value'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    expect(result.current[0]).toBe('initial-value');

    // 他のタブからの storage イベントをシミュレート
    act(() => {
      const event = createStorageEvent('test-key', JSON.stringify('updated-from-other-tab'));
      window.dispatchEvent(event);
    });

    expect(result.current[0]).toBe('updated-from-other-tab');
  });

  it('should ignore storage events for different keys', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('initial-value'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    expect(result.current[0]).toBe('initial-value');

    // 異なるキーの storage イベントをシミュレート
    act(() => {
      const event = createStorageEvent('different-key', JSON.stringify('should-not-update'));
      window.dispatchEvent(event);
    });

    expect(result.current[0]).toBe('initial-value');
  });

  it('should ignore storage events with null newValue', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('initial-value'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    expect(result.current[0]).toBe('initial-value');

    // newValue が null の storage イベントをシミュレート
    act(() => {
      const event = createStorageEvent('test-key', null);
      window.dispatchEvent(event);
    });

    expect(result.current[0]).toBe('initial-value');
  });

  it('should handle parsing errors in storage events', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('initial-value'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    expect(result.current[0]).toBe('initial-value');

    // 無効な JSON の storage イベントをシミュレート
    act(() => {
      const event = createStorageEvent('test-key', 'invalid-json');
      window.dispatchEvent(event);
    });

    expect(result.current[0]).toBe('initial-value');
    expect(console.error).toHaveBeenCalledWith(
      'Error parsing localStorage value for key "test-key":',
      expect.any(Error)
    );
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});