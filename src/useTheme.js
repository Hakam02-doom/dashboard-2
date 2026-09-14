import { useEffect, useState } from "react";

const storageKey = "dashboard-2-theme";
const validPreference = (value) => ["light", "dark"].includes(value) ? value : "system";

function savedPreference() {
  try {
    return validPreference(localStorage.getItem(storageKey));
  } catch {
    return "system";
  }
}

export function useTheme() {
  const [preference, setPreference] = useState(savedPreference);
  const [systemDark, setSystemDark] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);
  const theme = preference === "system" ? (systemDark ? "dark" : "light") : preference;

  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => setSystemDark(event.matches);
    const onStorage = (event) => {
      if (event.key === storageKey || event.key === null) setPreference(savedPreference());
    };
    media.addEventListener("change", onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#151820" : "#eff1f6");
  }, [theme]);

  const chooseTheme = (value) => {
    const next = validPreference(value);
    setPreference(next);
    try {
      if (next === "system") localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, next);
    } catch {
      // The current session still supports switching when browser storage is blocked.
    }
  };

  return { theme, preference, chooseTheme };
}
