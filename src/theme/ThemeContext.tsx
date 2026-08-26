import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getSetting, saveSetting } from '../db/database';
import { darkPalette, lightPalette, Palette } from './palettes';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_MODE_KEY = 'themeMode';

interface ThemeContextValue {
  colors: Palette;
  mode: ThemeMode;
  effectiveMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    getSetting(THEME_MODE_KEY)
      .then((value) => {
        if (value === 'light' || value === 'dark' || value === 'system') {
          setModeState(value);
        }
      })
      .catch(console.warn);
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    saveSetting(THEME_MODE_KEY, next).catch((error) => console.warn('Failed to save theme mode', error));
  };

  const effectiveMode: 'light' | 'dark' = mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;
  const colors = effectiveMode === 'light' ? lightPalette : darkPalette;

  const value = useMemo(() => ({ colors, mode, effectiveMode, setMode }), [colors, mode, effectiveMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
