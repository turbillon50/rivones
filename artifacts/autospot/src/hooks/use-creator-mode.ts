import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "autospot-creator-mode";

export function useCreatorMode() {
  const [isCreator, setIsCreator] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setIsCreator((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  return { isCreator, toggle };
}
