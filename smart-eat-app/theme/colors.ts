export const lightColors = {
  // Primary colors
  primary: '#007AFF',
  primaryDark: '#0056CC',
  primaryLight: '#4DA3FF',
  
  // Secondary colors
  secondary: '#34C759',
  secondaryDark: '#28A745',
  secondaryLight: '#5CDB7B',
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundTertiary: '#F1F3F4',
  
  // Surface colors
  surface: '#FFFFFF',
  surfaceSecondary: '#F8F9FA',
  surfaceTertiary: '#F1F3F4',
  
  // Text colors
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',
  
  // Status colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  
  // Border colors
  border: '#E5E5E7',
  borderSecondary: '#F1F3F4',
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
};

export const darkColors = {
  // Primary colors
  primary: '#0A84FF',
  primaryDark: '#0056CC',
  primaryLight: '#4DA3FF',
  
  // Secondary colors
  secondary: '#30D158',
  secondaryDark: '#28A745',
  secondaryLight: '#5CDB7B',
  
  // Background colors
  background: '#000000',
  backgroundSecondary: '#1C1C1E',
  backgroundTertiary: '#2C2C2E',
  
  // Surface colors
  surface: '#1C1C1E',
  surfaceSecondary: '#2C2C2E',
  surfaceTertiary: '#3A3A3C',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textTertiary: '#EBEBF599',
  textInverse: '#000000',
  
  // Status colors
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#0A84FF',
  
  // Border colors
  border: '#38383A',
  borderSecondary: '#48484A',
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowDark: 'rgba(0, 0, 0, 0.5)',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export type ColorScheme = 'light' | 'dark';

export const getColors = (scheme: ColorScheme) => {
  return scheme === 'dark' ? darkColors : lightColors;
};
