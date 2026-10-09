'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeCtx>({ theme: 'light', toggle: () => {}, isDark: false });

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const saved = localStorage.getItem('apex-theme') as Theme | null;
    const initial = saved ?? defaultTheme;
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);

    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, [defaultTheme]);

  const toggle = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('apex-theme', next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

