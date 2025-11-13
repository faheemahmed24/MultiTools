import React, { useState, useEffect } from 'react';

// A modified version of useLocalStorage that scopes keys to a specific user ID.
export function useUserLocalStorage<T>(
  userId: string | undefined,
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  
  // Use a 'guest' user ID if no user is logged in
  const effectiveUserId = userId || 'guest';
  const scopedKey = `user-${effectiveUserId}-${key}`;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(scopedKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // Effect to update the state if the user changes (e.g., login/logout)
  useEffect(() => {
    try {
        const item = window.localStorage.getItem(scopedKey);
        setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch (error) {
        console.error(error);
        setStoredValue(initialValue);
    }
  }, [scopedKey, initialValue]);


  // Effect to save the value to local storage whenever it changes
  useEffect(() => {
    try {
      const valueToStore =
        typeof storedValue === 'function'
          ? storedValue(storedValue)
          : storedValue;
      window.localStorage.setItem(scopedKey, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [scopedKey, storedValue]);

  return [storedValue, setStoredValue];
}
