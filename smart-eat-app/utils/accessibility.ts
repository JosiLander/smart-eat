import { AccessibilityProps } from 'react-native';

// Accessibility roles
export const accessibilityRoles = {
  button: 'button' as const,
  link: 'link' as const,
  image: 'image' as const,
  text: 'text' as const,
  header: 'header' as const,
  search: 'search' as const,
  tab: 'tab' as const,
  list: 'list' as const,
  listitem: 'listitem' as const,
  switch: 'switch' as const,
  checkbox: 'checkbox' as const,
  radio: 'radio' as const,
  slider: 'slider' as const,
  progressbar: 'progressbar' as const,
  spinbutton: 'spinbutton' as const,
  combobox: 'combobox' as const,
  textbox: 'textbox' as const,
  scrollbar: 'scrollbar' as const,
  toolbar: 'toolbar' as const,
  navigation: 'navigation' as const,
  main: 'main' as const,
  article: 'article' as const,
  banner: 'banner' as const,
  complementary: 'complementary' as const,
  contentinfo: 'contentinfo' as const,
  form: 'form' as const,
  region: 'region' as const,
  searchbox: 'searchbox' as const,
  status: 'status' as const,
} as const;

// Accessibility states
export const accessibilityStates = {
  selected: 'selected' as const,
  disabled: 'disabled' as const,
  checked: 'checked' as const,
  unchecked: 'unchecked' as const,
  busy: 'busy' as const,
  expanded: 'expanded' as const,
  collapsed: 'collapsed' as const,
} as const;

// Helper function to create accessibility props
export const createAccessibilityProps = (
  label: string,
  role?: keyof typeof accessibilityRoles,
  hint?: string,
  state?: keyof typeof accessibilityStates | (keyof typeof accessibilityStates)[],
  value?: string
): AccessibilityProps => {
  const props: AccessibilityProps = {
    accessible: true,
    accessibilityLabel: label,
  };

  if (role) {
    props.accessibilityRole = accessibilityRoles[role];
  }

  if (hint) {
    props.accessibilityHint = hint;
  }

  if (state) {
    props.accessibilityState = Array.isArray(state)
      ? state.reduce((acc, s) => ({ ...acc, [s]: true }), {})
      : { [state]: true };
  }

  if (value) {
    props.accessibilityValue = { text: value };
  }

  return props;
};

// Common accessibility patterns
export const accessibilityPatterns = {
  // Button accessibility
  button: (label: string, hint?: string) =>
    createAccessibilityProps(label, 'button', hint),

  // List item accessibility
  listItem: (label: string, hint?: string) =>
    createAccessibilityProps(label, 'listitem', hint),

  // Image accessibility
  image: (label: string, hint?: string) =>
    createAccessibilityProps(label, 'image', hint),

  // Header accessibility
  header: (label: string, level: 1 | 2 | 3 | 4 | 5 | 6 = 1) =>
    createAccessibilityProps(label, 'header', undefined, undefined, `h${level}`),

  // Link accessibility
  link: (label: string, hint?: string) =>
    createAccessibilityProps(label, 'link', hint),

  // Switch accessibility
  switch: (label: string, checked: boolean, hint?: string) =>
    createAccessibilityProps(label, 'switch', hint, checked ? 'checked' : 'unchecked'),

  // Checkbox accessibility
  checkbox: (label: string, checked: boolean, hint?: string) =>
    createAccessibilityProps(label, 'checkbox', hint, checked ? 'checked' : 'unchecked'),

  // Text input accessibility
  textInput: (label: string, hint?: string, value?: string) =>
    createAccessibilityProps(label, 'textbox', hint, undefined, value),

  // Search input accessibility
  searchInput: (label: string, hint?: string, value?: string) =>
    createAccessibilityProps(label, 'searchbox', hint, undefined, value),
};

// Color contrast utilities
export const colorContrast = {
  // Calculate relative luminance
  getRelativeLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio
  getContrastRatio: (l1: number, l2: number): number => {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  // Check if contrast meets WCAG AA standards
  meetsWCAGAA: (contrastRatio: number, isLargeText: boolean = false): boolean => {
    return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
  },

  // Check if contrast meets WCAG AAA standards
  meetsWCAGAAA: (contrastRatio: number, isLargeText: boolean = false): boolean => {
    return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7;
  },
};

// Focus management utilities
export const focusManagement = {
  // Generate unique accessibility identifier
  generateId: (prefix: string = 'element'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Create focus order array
  createFocusOrder: (ids: string[]): string[] => {
    return ids.filter(id => id && id.length > 0);
  },
};

// Screen reader announcements
export const screenReaderAnnouncements = {
  // Announce to screen reader
  announce: (message: string): void => {
    // This would typically use a screen reader service
    // For now, we'll use console.log as a placeholder
    console.log(`Screen Reader Announcement: ${message}`);
  },

  // Announce page changes
  announcePageChange: (pageTitle: string): void => {
    screenReaderAnnouncements.announce(`Navigated to ${pageTitle}`);
  },

  // Announce loading states
  announceLoading: (message: string = 'Loading'): void => {
    screenReaderAnnouncements.announce(`${message}...`);
  },

  // Announce completion
  announceCompletion: (message: string): void => {
    screenReaderAnnouncements.announce(`${message} completed`);
  },

  // Announce errors
  announceError: (message: string): void => {
    screenReaderAnnouncements.announce(`Error: ${message}`);
  },
};
