import { Moon, Sun } from "lucide-react";
import { useTheme } from "../app/ThemeContext";
import { IconSwap } from "./IconSwap";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const action = `Switch to ${theme === "light" ? "dark" : "light"} mode`;
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={action}
      title={action}
      aria-pressed={theme === "dark"}
      onClick={toggleTheme}
    >
      <IconSwap
        swapped={theme === "dark"}
        first={<Sun size={17} />}
        second={<Moon size={17} />}
      />
      <span className="theme-toggle-label">
        {theme === "light" ? "Light" : "Dark"}
      </span>
    </button>
  );
}
