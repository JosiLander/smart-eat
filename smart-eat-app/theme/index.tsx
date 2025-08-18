import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ColorScheme, getColors } from './colors';
import { typography, textVariants, TextVariant } from './typography';
import { spacing, SpacingKey } from './spacing';

// Theme interface
export interface Theme {
  colors: typeof lightColors;
  typography: typeof typography;
  textVariants: typeof textVariants;
  spacing: typeof spacing;
  isDark: boolean;
  colorScheme: ColorScheme;
}

// Create theme context
const ThemeContext = createContext<Theme | null>(null);

// Theme provider props
interface ThemeProviderProps {
  children: React.ReactNode;
  initialColorScheme?: ColorScheme;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialColorScheme,
}) => {
  const systemColorScheme = useColorScheme() as ColorScheme;
  const [colorScheme, setColorScheme] = useState<ColorScheme>(
    initialColorScheme || systemColorScheme || 'light'
  );

  // Update theme when system theme changes
  useEffect(() => {
    if (!initialColorScheme && systemColorScheme) {
      setColorScheme(systemColorScheme);
    }
  }, [systemColorScheme, initialColorScheme]);

  const theme: Theme = {
    colors: getColors(colorScheme),
    typography,
    textVariants,
    spacing,
    isDark: colorScheme === 'dark',
    colorScheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = (): Theme => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
};

// Hook to toggle theme
export const useThemeToggle = () => {
  const theme = useTheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>(theme.colorScheme);

  const toggleTheme = () => {
    const newScheme = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newScheme);
  };

  const setTheme = (scheme: ColorScheme) => {
    setColorScheme(scheme);
  };

  return {
    colorScheme,
    toggleTheme,
    setTheme,
  };
};

// Export all theme components
export {
  lightColors,
  darkColors,
  getColors,
  typography,
  textVariants,
  spacing,
};

export type { ColorScheme, TextVariant, SpacingKey };
