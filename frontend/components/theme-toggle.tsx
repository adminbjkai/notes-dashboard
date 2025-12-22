"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
        "text-gray-600 dark:text-gray-400",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "transition-colors"
      )}
      title={`Current: ${theme}. Click to cycle.`}
    >
      {theme === "light" && <Sun className="h-4 w-4" />}
      {theme === "dark" && <Moon className="h-4 w-4" />}
      {theme === "system" && <Monitor className="h-4 w-4" />}
      <span className="capitalize">{theme}</span>
    </button>
  );
}
