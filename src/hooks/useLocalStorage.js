import { useState } from "react";

function useLocalStorage(key, initialValue) {
  // Get the item from local storage or use the initial value
  const [storedValue, setStoredValue] = useState(() => {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : initialValue;
  });

  const getFromLocalStorage = () => {
    const value = JSON.parse(window.localStorage.getItem(key));
    setStoredValue(value);
  };

  const saveToLocalStorage = (value) => {
    window.localStorage.setItem(key, JSON.stringify(value));
    setStoredValue(value);
  };

  return { storedValue, getFromLocalStorage, saveToLocalStorage };
}

export default useLocalStorage;
