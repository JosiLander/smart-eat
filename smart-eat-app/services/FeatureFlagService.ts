export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number; // 0-100, for gradual rollout
  targetAudience?: string[]; // User segments
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
}

export interface ABTestVariant {
  name: string;
  weight: number; // 0-100, percentage of users
  config: Record<string, any>;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private abTests: Map<string, ABTest> = new Map();
  private userSegments: Set<string> = new Set();
  private userId: string | null = null;

  private constructor() {
    this.initializeDefaultFlags();
  }

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  private initializeDefaultFlags() {
    // Default feature flags for recipe expiration prioritization
    this.setFeatureFlag({
      name: 'recipe_expiration_prioritization',
      enabled: true,
      rolloutPercentage: 100,
      startDate: new Date('2024-01-01'),
      metadata: {
        description: 'Recipe suggestions prioritize expiring ingredients',
        version: '1.0.0'
      }
    });

    this.setFeatureFlag({
      name: 'progressive_disclosure',
      enabled: true,
      rolloutPercentage: 100,
      startDate: new Date('2024-01-01'),
      metadata: {
        description: 'Collapsible recipe details for better UX',
        version: '1.0.0'
      }
    });

    this.setFeatureFlag({
      name: 'enhanced_empty_states',
      enabled: true,
      rolloutPercentage: 100,
      startDate: new Date('2024-01-01'),
      metadata: {
        description: 'Improved empty states with actionable guidance',
        version: '1.0.0'
      }
    });

    this.setFeatureFlag({
      name: 'tooltips_and_help',
      enabled: true,
      rolloutPercentage: 100,
      startDate: new Date('2024-01-01'),
      metadata: {
        description: 'Contextual tooltips and user education',
        version: '1.0.0'
      }
    });

    // A/B test for expiration prioritization UI
    this.setABTest({
      id: 'expiration_ui_variant',
      name: 'Expiration Priority UI Variants',
      description: 'Testing different UI approaches for expiration prioritization',
      variants: [
        {
          name: 'control',
          weight: 50,
          config: {
            showPriorityBadge: true,
            showExpiringCount: true,
            badgeStyle: 'default'
          }
        },
        {
          name: 'enhanced',
          weight: 50,
          config: {
            showPriorityBadge: true,
            showExpiringCount: true,
            badgeStyle: 'enhanced',
            showUrgencyIndicator: true
          }
        }
      ],
      startDate: new Date('2024-01-01'),
      isActive: true
    });
  }

  setFeatureFlag(flag: FeatureFlag): void {
    this.featureFlags.set(flag.name, flag);
  }

  getFeatureFlag(name: string): FeatureFlag | null {
    return this.featureFlags.get(name) || null;
  }

  isFeatureEnabled(name: string): boolean {
    const flag = this.getFeatureFlag(name);
    if (!flag) return false;

    // Check if flag is enabled
    if (!flag.enabled) return false;

    // Check date range
    const now = new Date();
    if (flag.startDate && now < flag.startDate) return false;
    if (flag.endDate && now > flag.endDate) return false;

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined) {
      const userHash = this.getUserHash();
      const userPercentage = userHash % 100;
      if (userPercentage >= flag.rolloutPercentage) return false;
    }

    // Check target audience
    if (flag.targetAudience && flag.targetAudience.length > 0) {
      const hasMatchingSegment = flag.targetAudience.some(segment => 
        this.userSegments.has(segment)
      );
      if (!hasMatchingSegment) return false;
    }

    return true;
  }

  setABTest(test: ABTest): void {
    this.abTests.set(test.id, test);
  }

  getABTestVariant(testId: string): ABTestVariant | null {
    const test = this.abTests.get(testId);
    if (!test || !test.isActive) return null;

    const now = new Date();
    if (now < test.startDate || (test.endDate && now > test.endDate)) {
      return null;
    }

    const userHash = this.getUserHash();
    let cumulativeWeight = 0;

    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (userHash % 100 < cumulativeWeight) {
        return variant;
      }
    }

    return test.variants[0] || null;
  }

  setUserSegments(segments: string[]): void {
    this.userSegments.clear();
    segments.forEach(segment => this.userSegments.add(segment));
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  private getUserHash(): number {
    if (!this.userId) {
      // Fallback to device-based hash for anonymous users
      return Math.floor(Math.random() * 100);
    }

    // Simple hash function for user ID
    let hash = 0;
    for (let i = 0; i < this.userId.length; i++) {
      const char = this.userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getAllFeatureFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values());
  }

  getAllABTests(): ABTest[] {
    return Array.from(this.abTests.values());
  }

  // Remote configuration methods (for future implementation)
  async fetchRemoteConfig(): Promise<void> {
    // TODO: Implement remote configuration fetching
    // This would typically fetch from a remote service
    console.log('Fetching remote configuration...');
  }

  async updateFeatureFlag(name: string, updates: Partial<FeatureFlag>): Promise<void> {
    const flag = this.getFeatureFlag(name);
    if (flag) {
      this.setFeatureFlag({ ...flag, ...updates });
    }
  }
}
