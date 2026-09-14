import { useEffect, useState } from "react";

const storageKey = "uplift-dashboard-2-appearance";
const validPreference = (value) => ["light", "dark", "system"].includes(value);

function readPreference() {
  try {
    const saved = localStorage.getItem(storageKey);
    return validPreference(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

export function useAppearance() {
  const [preference, setPreference] = useState(readPreference);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const dark = preference === "dark" || (preference === "system" && systemDark);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystem = (event) => setSystemDark(event.matches);
    const syncPreference = (event) => {
      if (event.key === storageKey || event.key === null) {
        setPreference(validPreference(event.newValue) ? event.newValue : "system");
      }
    };
    media.addEventListener("change", updateSystem);
    window.addEventListener("storage", syncPreference);
    return () => {
      media.removeEventListener("change", updateSystem);
      window.removeEventListener("storage", syncPreference);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content", dark ? "#191c27" : "#edf0f8",
    );
  }, [dark]);

  function changePreference(next) {
    if (!validPreference(next)) return;
    setPreference(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // The current session can still change appearance when storage is unavailable.
    }
  }

  return { preference, dark, setPreference: changePreference };
}
