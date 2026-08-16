import { useState, useEffect } from "react";

export type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "fondtracker_theme";

export function getStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return "dark"; // Default is dark
}

export function applyTheme(theme: Theme, persist = true) {
  try {
    if (persist) {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("theme-light");
      document.documentElement.classList.remove("theme-dark");
      document.body.classList.add("theme-light");
      document.body.classList.remove("theme-dark");
    } else {
      document.documentElement.classList.add("theme-dark");
      document.documentElement.classList.remove("theme-light");
      document.body.classList.add("theme-dark");
      document.body.classList.remove("theme-light");
    }
  } catch {}
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setThemeState(nextTheme);
    applyTheme(nextTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  return { theme, isDark: theme === "dark", isLight: theme === "light", toggleTheme, setTheme };
}
