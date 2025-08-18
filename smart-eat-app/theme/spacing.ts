export const spacing = {
  // Base spacing unit (4px)
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 56,
  '6xl': 64,
  
  // Component-specific spacing
  component: {
    padding: 16,
    paddingSmall: 12,
    paddingLarge: 24,
    margin: 16,
    marginSmall: 8,
    marginLarge: 24,
  },
  
  // Screen-specific spacing
  screen: {
    padding: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  
  // List spacing
  list: {
    itemSpacing: 12,
    sectionSpacing: 24,
  },
  
  // Button spacing
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingSmall: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    paddingLarge: {
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
  },
  
  // Form spacing
  form: {
    fieldSpacing: 16,
    groupSpacing: 24,
    sectionSpacing: 32,
  },
  
  // Navigation spacing
  navigation: {
    headerPadding: 16,
    tabBarPadding: 8,
  },
};

export type SpacingKey = keyof typeof spacing;
