import { create } from 'zustand';

function getStored(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode) {
  if (mode === 'system') return getSystemTheme();
  return mode;
}

function applyTheme(mode, color) {
  const html = document.documentElement;
  const effective = resolveTheme(mode);

  if (effective === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }

  html.setAttribute('data-theme', mode);
  html.setAttribute('data-primary', color);
}

export const useThemeStore = create((set, get) => {
  const initialMode = getStored('kims-theme-mode', 'light');
  const initialColor = getStored('kims-theme-primary', 'emerald');

  if (typeof document !== 'undefined') {
    applyTheme(initialMode, initialColor);
  }

  return {
    mode: initialMode,
    primaryColor: initialColor,
    effectiveTheme: resolveTheme(initialMode),

    setMode: (mode) => {
      setStored('kims-theme-mode', mode);
      applyTheme(mode, get().primaryColor);
      set({ mode, effectiveTheme: resolveTheme(mode) });
    },

    setPrimaryColor: (color) => {
      setStored('kims-theme-primary', color);
      applyTheme(get().mode, color);
      set({ primaryColor: color });
    },

    saveTheme: (mode, color) => {
      setStored('kims-theme-mode', mode);
      setStored('kims-theme-primary', color);
      applyTheme(mode, color);
      set({ mode, primaryColor: color, effectiveTheme: resolveTheme(mode) });
    },
  };
});

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const state = useThemeStore.getState();
    if (state.mode === 'system') {
      const effective = getSystemTheme();
      applyTheme('system', state.primaryColor);
      useThemeStore.setState({ effectiveTheme: effective });
    }
  });
}
