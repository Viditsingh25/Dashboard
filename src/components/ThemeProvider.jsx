import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

export default function ThemeProvider({ children }) {
  const primaryColor = useThemeStore((s) => s.primaryColor);

  useEffect(() => {
    document.documentElement.setAttribute('data-primary', primaryColor);
  }, [primaryColor]);

  return children;
}
