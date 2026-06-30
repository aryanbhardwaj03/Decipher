"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => null,
});

let lastClick = { x: 0, y: 0 };
if (typeof document !== "undefined") {
  document.addEventListener("mousedown", (e) => {
    lastClick = { x: e.clientX, y: e.clientY };
  });
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as Theme) || "light";
    setTheme(savedTheme);
    
    const applyTheme = (currentTheme: Theme) => {
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (currentTheme === "dark" || (currentTheme === "system" && isSystemDark)) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      }
    };

    applyTheme(savedTheme);

    // Listen for system theme changes if set to system
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (localStorage.getItem("theme") === "system") {
        applyTheme("system");
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    const apply = () => {
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (newTheme === "dark" || (newTheme === "system" && isSystemDark)) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      }
    };

    if (!document.startViewTransition) {
      apply();
    } else {
      document.documentElement.style.setProperty("--theme-x", `${lastClick.x}px`);
      document.documentElement.style.setProperty("--theme-y", `${lastClick.y}px`);
      document.startViewTransition(() => {
        apply();
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
