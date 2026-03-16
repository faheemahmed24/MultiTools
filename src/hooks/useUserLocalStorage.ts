import { useState, useEffect } from 'react';

export function useUserLocalStorage<T>(userId: string | undefined, key: string, initialValue: T) {
  const userKey = userId ? `${userId}_${key}` : `guest_${key}`;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(userKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(userKey, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [userKey, storedValue]);

  return [storedValue, setStoredValue] as const;
}
