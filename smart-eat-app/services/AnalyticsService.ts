export interface AnalyticsEvent {
  eventName: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UserEngagementMetrics {
  sessionDuration: number;
  featureUsage: Record<string, number>;
  interactionCount: number;
  lastActive: Date;
}

export interface FeatureUsageData {
  featureName: string;
  usageCount: number;
  uniqueUsers: number;
  averageSessionTime: number;
  conversionRate?: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId: string | null = null;
  private sessionStartTime: Date;
  private isEnabled: boolean = true;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      eventName,
      timestamp: new Date(),
      userId: this.userId || undefined,
      sessionId: this.sessionId,
      properties,
      metadata: {
        appVersion: '1.0.0',
        platform: 'react-native'
      }
    };

    this.events.push(event);
    this.processEvent(event);
  }

  // Recipe-specific tracking methods
  trackRecipeView(recipeId: string, recipeName: string, source: string): void {
    this.trackEvent('recipe_viewed', {
      recipeId,
      recipeName,
      source,
      timestamp: new Date().toISOString()
    });
  }

  trackRecipeFilter(filterType: string, filterValue: any): void {
    this.trackEvent('recipe_filter_applied', {
      filterType,
      filterValue,
      timestamp: new Date().toISOString()
    });
  }

  trackExpirationPrioritization(enabled: boolean, priorityScore: number): void {
    this.trackEvent('expiration_prioritization_toggled', {
      enabled,
      priorityScore,
      timestamp: new Date().toISOString()
    });
  }

  trackProgressiveDisclosure(expanded: boolean, section: string): void {
    this.trackEvent('progressive_disclosure_toggled', {
      expanded,
      section,
      timestamp: new Date().toISOString()
    });
  }

  trackTooltipInteraction(tooltipId: string, action: 'show' | 'hide'): void {
    this.trackEvent('tooltip_interaction', {
      tooltipId,
      action,
      timestamp: new Date().toISOString()
    });
  }

  trackEmptyStateAction(action: string, context: string): void {
    this.trackEvent('empty_state_action', {
      action,
      context,
      timestamp: new Date().toISOString()
    });
  }

  trackFeatureUsage(featureName: string, usageData: Record<string, any> = {}): void {
    this.trackEvent('feature_used', {
      featureName,
      ...usageData,
      timestamp: new Date().toISOString()
    });
  }

  trackABTestVariant(testId: string, variantName: string): void {
    this.trackEvent('ab_test_variant_assigned', {
      testId,
      variantName,
      timestamp: new Date().toISOString()
    });
  }

  trackUserEngagement(metric: string, value: number): void {
    this.trackEvent('user_engagement', {
      metric,
      value,
      timestamp: new Date().toISOString()
    });
  }

  // Performance tracking
  trackPerformance(operation: string, duration: number, success: boolean): void {
    this.trackEvent('performance_metric', {
      operation,
      duration,
      success,
      timestamp: new Date().toISOString()
    });
  }

  // Error tracking
  trackError(errorType: string, errorMessage: string, context?: Record<string, any>): void {
    this.trackEvent('error_occurred', {
      errorType,
      errorMessage,
      context,
      timestamp: new Date().toISOString()
    });
  }

  private processEvent(event: AnalyticsEvent): void {
    // In a real implementation, this would send to analytics service
    // For now, we'll just log and store locally
    console.log('Analytics Event:', event.eventName, event.properties);
    
    // Simulate sending to analytics service
    this.sendToAnalyticsService(event);
  }

  private async sendToAnalyticsService(event: AnalyticsEvent): Promise<void> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // In production, this would be:
      // await fetch('https://analytics-api.example.com/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  // Analytics reporting methods
  getSessionMetrics(): UserEngagementMetrics {
    const sessionDuration = Date.now() - this.sessionStartTime.getTime();
    const featureUsage: Record<string, number> = {};
    
    // Count feature usage from events
    this.events.forEach(event => {
      if (event.eventName === 'feature_used') {
        const featureName = event.properties.featureName;
        featureUsage[featureName] = (featureUsage[featureName] || 0) + 1;
      }
    });

    return {
      sessionDuration,
      featureUsage,
      interactionCount: this.events.length,
      lastActive: new Date()
    };
  }

  getFeatureUsageReport(): FeatureUsageData[] {
    const featureUsage: Record<string, { count: number; users: Set<string>; totalTime: number }> = {};
    
    this.events.forEach(event => {
      if (event.eventName === 'feature_used') {
        const featureName = event.properties.featureName;
        if (!featureUsage[featureName]) {
          featureUsage[featureName] = { count: 0, users: new Set(), totalTime: 0 };
        }
        
        featureUsage[featureName].count++;
        if (event.userId) {
          featureUsage[featureName].users.add(event.userId);
        }
      }
    });

    return Object.entries(featureUsage).map(([featureName, data]) => ({
      featureName,
      usageCount: data.count,
      uniqueUsers: data.users.size,
      averageSessionTime: data.totalTime / data.count
    }));
  }

  getEventsByType(eventName: string): AnalyticsEvent[] {
    return this.events.filter(event => event.eventName === eventName);
  }

  getEventsInTimeRange(startTime: Date, endTime: Date): AnalyticsEvent[] {
    return this.events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  // Session management
  startNewSession(): void {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
    this.trackEvent('session_started');
  }

  endSession(): void {
    const sessionDuration = Date.now() - this.sessionStartTime.getTime();
    this.trackEvent('session_ended', { duration: sessionDuration });
  }

  // Data export for analysis
  exportEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}
