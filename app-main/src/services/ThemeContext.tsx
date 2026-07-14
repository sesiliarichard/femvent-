import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme as lightTheme, darkTheme } from '../utils/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  paperTheme: typeof lightTheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'app_theme_mode_v1';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      } catch {}
    })();
  }, []);

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  const isDark = useMemo(() => {
    if (mode === 'system') return systemScheme === 'dark';
    return mode === 'dark';
  }, [mode, systemScheme]);

  const paperTheme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);

  const value = useMemo(() => ({ mode, setMode, paperTheme, isDark }), [mode, setMode, paperTheme, isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeMode = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  return ctx;
};


