import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";
const preferenceKey = "borrowher-theme";
const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function followSystem() {
      try {
        const saved = localStorage.getItem(preferenceKey);
        if (saved === "light" || saved === "dark") return;
      } catch {
        /* The switch still works when browser storage is unavailable. */
      }
      setTheme(media.matches ? "dark" : "light");
    }
    function syncPreference(event: StorageEvent) {
      if (event.key !== preferenceKey && event.key !== null) return;
      if (event.newValue === "light" || event.newValue === "dark")
        setTheme(event.newValue);
      else setTheme(media.matches ? "dark" : "light");
    }
    media.addEventListener("change", followSystem);
    window.addEventListener("storage", syncPreference);
    return () => {
      media.removeEventListener("change", followSystem);
      window.removeEventListener("storage", syncPreference);
    };
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem(preferenceKey, next);
    } catch {
      /* Keep the in-memory preference. */
    }
  }
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("Theme controls require ThemeProvider");
  return value;
}
