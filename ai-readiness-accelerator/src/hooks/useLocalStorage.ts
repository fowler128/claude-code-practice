/**
 * Generic hook for persisting state to localStorage with JSON serialization.
 *
 * Handles:
 * - JSON serialization/parsing with error handling
 * - SSR safety (checks for window object)
 * - Storage events for cross-tab synchronization
 * - Graceful error recovery
 *
 * @module useLocalStorage
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Checks if localStorage is available in the current environment.
 * Handles SSR and private browsing modes gracefully.
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    const testKey = '__localStorage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Custom hook for managing state that persists to localStorage.
 *
 * @typeParam T - The type of the stored value
 * @param key - The localStorage key to use for storage
 * @param initialValue - The initial value if no stored value exists
 * @returns A tuple of [storedValue, setValue, removeValue]
 *
 * @example
 * ```tsx
 * // Simple usage
 * const [name, setName, removeName] = useLocalStorage('user-name', '');
 *
 * // With complex objects
 * const [settings, setSettings, removeSettings] = useLocalStorage<UserSettings>(
 *   'user-settings',
 *   { theme: 'light', notifications: true }
 * );
 *
 * // Update value
 * setSettings({ ...settings, theme: 'dark' });
 *
 * // Remove from storage
 * removeSettings();
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isLocalStorageAvailable()) {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(
        `Error reading localStorage key "${key}":`,
        error instanceof Error ? error.message : error
      );
      return initialValue;
    }
  });

  /**
   * Sets the value in both state and localStorage.
   * Accepts either a direct value or a function that receives the previous value.
   */
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Handle functional updates
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (isLocalStorageAvailable()) {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(
          `Error setting localStorage key "${key}":`,
          error instanceof Error ? error.message : error
        );
      }
    },
    [key, storedValue]
  );

  /**
   * Removes the value from localStorage and resets to initial value.
   */
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);

      if (isLocalStorageAvailable()) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(
        `Error removing localStorage key "${key}":`,
        error instanceof Error ? error.message : error
      );
    }
  }, [key, initialValue]);

  /**
   * Listen for storage events to sync across tabs.
   * This ensures that changes in one tab are reflected in others.
   */
  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key) {
        return;
      }

      try {
        if (event.newValue === null) {
          setStoredValue(initialValue);
        } else {
          setStoredValue(JSON.parse(event.newValue) as T);
        }
      } catch (error) {
        console.warn(
          `Error parsing storage event for key "${key}":`,
          error instanceof Error ? error.message : error
        );
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
