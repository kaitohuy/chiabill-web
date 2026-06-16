import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreset = 'emerald' | 'ocean' | 'sunset' | 'royal' | 'cherry';

interface ThemeColorSet {
  primary: string;
  hover: string;
  light: string;
}

export const THEME_PRESETS: Record<ThemePreset, ThemeColorSet> = {
  emerald: {
    primary: '#10B981',
    hover: '#059669',
    light: 'rgba(16, 185, 129, 0.12)',
  },
  ocean: {
    primary: '#0EA5E9',
    hover: '#0284C7',
    light: 'rgba(14, 165, 233, 0.12)',
  },
  sunset: {
    primary: '#F97316',
    hover: '#EA580C',
    light: 'rgba(249, 115, 22, 0.12)',
  },
  royal: {
    primary: '#8B5CF6',
    hover: '#7C3AED',
    light: 'rgba(139, 92, 246, 0.12)',
  },
  cherry: {
    primary: '#F43F5E',
    hover: '#E11D48',
    light: 'rgba(244, 63, 94, 0.12)',
  },
};

interface ThemeContextType {
  activePreset: ThemePreset;
  isDark: boolean;
  setThemePreset: (preset: ThemePreset) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePreset, setActivePreset] = useState<ThemePreset>(() => {
    const saved = localStorage.getItem('selected_theme');
    return (saved as ThemePreset) || 'emerald';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return false; // Default to light theme
  });

  // Apply CSS color variables on change
  useEffect(() => {
    const colors = THEME_PRESETS[activePreset];
    const root = document.documentElement;
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--primary-hover-color', colors.hover);
    root.style.setProperty('--primary-light-color', colors.light);
    localStorage.setItem('selected_theme', activePreset);
  }, [activePreset]);

  // Apply dark mode class on change
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('dark_mode', String(isDark));
  }, [isDark]);

  const setThemePreset = (preset: ThemePreset) => {
    setActivePreset(preset);
  };

  const toggleDarkMode = () => {
    setIsDark(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ activePreset, isDark, setThemePreset, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
