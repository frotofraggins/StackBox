'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type Ctx = { theme: Theme; resolved: 'light' | 'dark'; setTheme: (t: Theme) => void };

const ThemeCtx = createContext<Ctx>({
  theme: 'system',
  resolved: 'light',
  setTheme: () => {}
});

export const useTheme = () => useContext(ThemeCtx);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem('theme') as Theme) || 'system';
  });
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    
    const getResolved = (t: Theme): 'light' | 'dark' => {
      return t === 'system' ? (mq.matches ? 'dark' : 'light') : t;
    };
    
    const apply = (t: Theme) => {
      const r = getResolved(t);
      setResolved(r);
      document.documentElement.classList.toggle('dark', r === 'dark');
    };
    
    apply(theme);
    setMounted(true);
    
    const onChange = () => {
      if (theme === 'system') {
        apply('system');
      }
    };
    
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', t);
    }
  };

  return (
    <ThemeCtx.Provider value={{ theme, resolved, setTheme }}>
      {/* Avoid FOUC - hide content until theme is applied */}
      <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </ThemeCtx.Provider>
  );
}
