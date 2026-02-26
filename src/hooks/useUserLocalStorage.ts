import { useState, useEffect } from "react";

export default function useUserLocalStorage<T>(
  key: string,
  initialValue: T
) {
  const readValue = (): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("LocalStorage read error:", error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error("LocalStorage write error:", error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}
