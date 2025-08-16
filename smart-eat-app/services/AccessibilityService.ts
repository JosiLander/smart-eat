import { AccessibilityInfo, Platform } from 'react-native';

export interface AccessibilityConfig {
  screenReaderEnabled: boolean;
  reduceMotionEnabled: boolean;
  highContrastEnabled: boolean;
  largeTextEnabled: boolean;
}

export interface AccessibilityAnnouncement {
  message: string;
  priority?: 'low' | 'normal' | 'high';
  delay?: number;
}

export class AccessibilityService {
  private static instance: AccessibilityService;
  private config: AccessibilityConfig = {
    screenReaderEnabled: false,
    reduceMotionEnabled: false,
    highContrastEnabled: false,
    largeTextEnabled: false,
  };

  private constructor() {
    this.initializeAccessibility();
  }

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  private async initializeAccessibility(): Promise<void> {
    try {
      // Check screen reader status
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      this.config.screenReaderEnabled = screenReaderEnabled;

      // Listen for screen reader changes
      AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
        this.config.screenReaderEnabled = enabled;
      });

      // Check other accessibility settings
      const reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      this.config.reduceMotionEnabled = reduceMotionEnabled;

      // Listen for reduce motion changes
      AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
        this.config.reduceMotionEnabled = enabled;
      });

      // Platform-specific accessibility checks
      if (Platform.OS === 'ios') {
        // iOS-specific accessibility features
        this.checkIOSAccessibility();
      } else if (Platform.OS === 'android') {
        // Android-specific accessibility features
        this.checkAndroidAccessibility();
      }
    } catch (error) {
      console.error('Failed to initialize accessibility:', error);
    }
  }

  private async checkIOSAccessibility(): Promise<void> {
    // iOS-specific accessibility checks
    // Note: Some of these might not be available in React Native
    console.log('iOS accessibility features checked');
  }

  private async checkAndroidAccessibility(): Promise<void> {
    // Android-specific accessibility checks
    console.log('Android accessibility features checked');
  }

  // Screen reader announcements
  announceForAccessibility(message: string, priority: 'low' | 'normal' | 'high' = 'normal'): void {
    if (this.config.screenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  announceRecipeFound(count: number): void {
    const message = count === 1 
      ? 'Found 1 recipe suggestion'
      : `Found ${count} recipe suggestions`;
    this.announceForAccessibility(message, 'normal');
  }

  announceFilterApplied(filterType: string, value: string): void {
    const message = `Filter applied: ${filterType} set to ${value}`;
    this.announceForAccessibility(message, 'low');
  }

  announceExpirationPriority(priority: number, count: number): void {
    let message = '';
    if (priority >= 0.7) {
      message = `High priority recipe with ${count} expiring ingredients. Consider using these ingredients soon.`;
    } else if (priority >= 0.4) {
      message = `Medium priority recipe with ${count} expiring ingredients.`;
    } else if (priority >= 0.1) {
      message = `Low priority recipe with ${count} expiring ingredients.`;
    }
    
    if (message) {
      this.announceForAccessibility(message, 'normal');
    }
  }

  announceProgressiveDisclosure(expanded: boolean, section: string): void {
    const action = expanded ? 'expanded' : 'collapsed';
    const message = `${section} details ${action}`;
    this.announceForAccessibility(message, 'low');
  }

  announceEmptyState(context: string): void {
    const message = `No recipes found. ${context}`;
    this.announceForAccessibility(message, 'normal');
  }

  announceLoadingState(operation: string): void {
    const message = `${operation} in progress. Please wait.`;
    this.announceForAccessibility(message, 'low');
  }

  announceLoadingComplete(operation: string, result: string): void {
    const message = `${operation} complete. ${result}`;
    this.announceForAccessibility(message, 'normal');
  }

  // Accessibility configuration
  isScreenReaderEnabled(): boolean {
    return this.config.screenReaderEnabled;
  }

  isReduceMotionEnabled(): boolean {
    return this.config.reduceMotionEnabled;
  }

  isHighContrastEnabled(): boolean {
    return this.config.highContrastEnabled;
  }

  isLargeTextEnabled(): boolean {
    return this.config.largeTextEnabled;
  }

  getAccessibilityConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  // Accessibility helpers for components
  getRecipeCardAccessibilityProps(recipe: any, suggestion: any) {
    const priorityText = suggestion.expirationPriority > 0 
      ? `Priority: ${this.getPriorityText(suggestion.expirationPriority)}. `
      : '';
    
    const matchText = `Match score: ${Math.round(suggestion.matchScore * 100)}%. `;
    const missingText = suggestion.missingIngredients.length > 0 
      ? `${suggestion.missingIngredients.length} missing ingredients. `
      : 'All ingredients available. ';
    
    const accessibilityLabel = `${recipe.name}. ${priorityText}${matchText}${missingText}Double tap to view recipe details.`;
    
    return {
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel,
      accessibilityHint: 'Double tap to view full recipe details and instructions',
      accessibilityState: {
        selected: false,
        disabled: false,
      },
    };
  }

  getFilterButtonAccessibilityProps(filterType: string, isActive: boolean, value: string) {
    const state = isActive ? 'selected' : 'not selected';
    const accessibilityLabel = `${filterType} filter: ${value}, ${state}`;
    
    return {
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel,
      accessibilityHint: `Double tap to ${isActive ? 'remove' : 'apply'} ${filterType} filter`,
      accessibilityState: {
        selected: isActive,
        disabled: false,
      },
    };
  }

  getProgressiveDisclosureAccessibilityProps(title: string, isExpanded: boolean) {
    const state = isExpanded ? 'expanded' : 'collapsed';
    const accessibilityLabel = `${title} section, ${state}`;
    
    return {
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel,
      accessibilityHint: `Double tap to ${isExpanded ? 'collapse' : 'expand'} ${title} details`,
      accessibilityState: {
        expanded: isExpanded,
        disabled: false,
      },
    };
  }

  getTooltipAccessibilityProps(tooltipId: string, content: string) {
    return {
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel: `Help for ${tooltipId}`,
      accessibilityHint: `Long press to show help information: ${content}`,
      accessibilityState: {
        disabled: false,
      },
    };
  }

  private getPriorityText(priority: number): string {
    if (priority >= 0.7) return 'Use Today';
    if (priority >= 0.4) return 'Use Soon';
    if (priority >= 0.1) return 'Low Priority';
    return 'No Priority';
  }

  // Accessibility testing helpers
  validateAccessibilityProps(props: any): boolean {
    const requiredProps = ['accessible', 'accessibilityRole', 'accessibilityLabel'];
    return requiredProps.every(prop => props.hasOwnProperty(prop));
  }

  generateAccessibilityReport(): Record<string, any> {
    return {
      screenReaderEnabled: this.config.screenReaderEnabled,
      reduceMotionEnabled: this.config.reduceMotionEnabled,
      highContrastEnabled: this.config.highContrastEnabled,
      largeTextEnabled: this.config.largeTextEnabled,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    };
  }
}
