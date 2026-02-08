import { useState, useEffect } from "react";

/**
 * Persisted dark mode hook. Reads from localStorage, syncs body class, and saves on toggle.
 * Use this on every page so dark mode persists across navigation.
 */
export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("bg-dark");
      document.body.classList.add("text-white");
    } else {
      document.body.classList.remove("bg-dark");
      document.body.classList.remove("text-white");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    localStorage.setItem("darkMode", String(next));
    setDarkMode(next);
  };

  return [darkMode, toggleDarkMode];
}
