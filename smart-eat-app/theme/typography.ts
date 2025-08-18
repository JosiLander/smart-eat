export const typography = {
  // Font sizes - smaller and more refined as requested
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
  },
  
  // Font weights
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

// Typography variants for consistent usage
export const textVariants = {
  // Display text
  display: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.tight,
  },
  
  // Headings
  h1: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.tight,
  },
  h2: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.tight,
  },
  h3: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.normal,
  },
  h4: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.normal,
  },
  
  // Body text
  body: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.normal,
    lineHeight: typography.lineHeights.relaxed,
  },
  bodyLarge: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.normal,
    lineHeight: typography.lineHeights.relaxed,
  },
  bodySmall: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.normal,
    lineHeight: typography.lineHeights.relaxed,
  },
  
  // Caption text
  caption: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.normal,
    lineHeight: typography.lineHeights.normal,
  },
  
  // Button text
  button: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.normal,
  },
  buttonSmall: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.normal,
  },
  
  // Label text
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.normal,
  },
  
  // Navigation text
  nav: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.normal,
  },
};

export type TextVariant = keyof typeof textVariants;
