import { useState, useEffect } from 'react';

export function useUserLocalStorage<T>(userId: string | undefined, key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const userKey = userId ? `${userId}:${key}` : key;

  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(userKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${userKey}":`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Update stored value if userId changes
  useEffect(() => {
    setStoredValue(readValue());
  }, [userId, key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(userKey, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${userKey}":`, error);
    }
  };

  return [storedValue, setValue];
}