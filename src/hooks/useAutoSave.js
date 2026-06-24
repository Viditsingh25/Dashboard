import { useEffect, useRef } from "react";

const DRAFT_PREFIX = "kims-draft-";

export default function useAutoSave(key, value, delay = 1000) {
  const savedRef = useRef(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== savedRef.current) {
        try {
          localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify(value));
          savedRef.current = value;
        } catch {
          // localStorage full or unavailable
        }
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [key, value, delay]);

  return {
    savedDraft: null,
    loadDraft: () => {
      try {
        const raw = localStorage.getItem(DRAFT_PREFIX + key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    clearDraft: () => {
      try {
        localStorage.removeItem(DRAFT_PREFIX + key);
      } catch {
        // ignore
      }
    },
  };
}
