"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type FontSize = "small" | "medium" | "large";

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextType>({
  fontSize: "medium",
  setFontSize: () => null,
});

const getPxValue = (size: FontSize) => {
  switch (size) {
    case "small": return "14px";
    case "large": return "18px";
    case "medium":
    default: return "16px";
  }
};

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>("medium");

  useEffect(() => {
    const savedSize = (localStorage.getItem("font-size") as FontSize) || "medium";
    setFontSize(savedSize);
    document.documentElement.style.fontSize = getPxValue(savedSize);
  }, []);

  const handleSetFontSize = (newSize: FontSize) => {
    setFontSize(newSize);
    localStorage.setItem("font-size", newSize);
    document.documentElement.style.fontSize = getPxValue(newSize);
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize: handleSetFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export const useFontSize = () => useContext(FontSizeContext);
