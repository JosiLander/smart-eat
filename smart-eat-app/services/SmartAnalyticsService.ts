export interface ShoppingPattern {
  userId: string;
  itemName: string;
  frequency: number;
  averageQuantity: number;
  preferredBrand?: string;
  lastPurchased: string;
  totalSpent: number;
  category: string;
}

export interface CostEstimate {
  itemName: string;
  estimatedPrice: number;
  priceRange: { min: number; max: number };
  confidence: number;
  lastUpdated: string;
  source: 'user_history' | 'market_data' | 'ai_estimate';
}

export interface SmartSuggestion {
  itemName: string;
  reason: 'frequently_bought' | 'recipe_ingredient' | 'seasonal' | 'complementary' | 'low_stock';
  confidence: number;
  estimatedCost: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ShoppingInsight {
  type: 'cost_saving' | 'efficiency' | 'health' | 'sustainability';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  action?: string;
}

export interface SeasonalPattern {
  itemName: string;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  availability: number; // 0-1
  priceVariation: number; // percentage
  recommendation: 'buy_now' | 'wait' | 'avoid';
}

export class SmartAnalyticsService {
  private static readonly PATTERNS_KEY = 'shopping_patterns';
  private static readonly COSTS_KEY = 'cost_estimates';
  private static readonly SUGGESTIONS_KEY = 'smart_suggestions';
  private static readonly INSIGHTS_KEY = 'shopping_insights';

  private static patterns: ShoppingPattern[] = [];
  private static costEstimates: CostEstimate[] = [];
  private static suggestions: SmartSuggestion[] = [];
  private static insights: ShoppingInsight[] = [];

  // Enhanced price database with seasonal variations
  private static readonly PRICE_DATABASE: Record<string, {
    basePrice: number;
    seasonalVariations: { [season: string]: number };
    brandVariations: { [brand: string]: number };
    category: string;
    lastUpdated: string;
  }> = {
    'milk': {
      basePrice: 3.99,
      seasonalVariations: { summer: 1.1, winter: 0.95 },
      brandVariations: { 'organic': 1.3, 'store_brand': 0.8 },
      category: 'dairy',
      lastUpdated: new Date().toISOString(),
    },
    'bread': {
      basePrice: 2.49,
      seasonalVariations: { summer: 1.0, winter: 1.05 },
      brandVariations: { 'artisan': 1.5, 'whole_grain': 1.2 },
      category: 'pantry',
      lastUpdated: new Date().toISOString(),
    },
    'banana': {
      basePrice: 0.59,
      seasonalVariations: { summer: 0.9, winter: 1.2 },
      brandVariations: { 'organic': 1.4 },
      category: 'fruits',
      lastUpdated: new Date().toISOString(),
    },
    'chicken_breast': {
      basePrice: 8.99,
      seasonalVariations: { summer: 1.15, winter: 0.9 },
      brandVariations: { 'organic': 1.6, 'free_range': 1.3 },
      category: 'meat',
      lastUpdated: new Date().toISOString(),
    },
    'tomato': {
      basePrice: 2.99,
      seasonalVariations: { summer: 0.7, winter: 1.4 },
      brandVariations: { 'organic': 1.5, 'cherry': 1.8 },
      category: 'vegetables',
      lastUpdated: new Date().toISOString(),
    },
  };

  static async initialize(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        // Load patterns
        const storedPatterns = localStorage.getItem(this.PATTERNS_KEY);
        if (storedPatterns) {
          this.patterns = JSON.parse(storedPatterns);
        }

        // Load cost estimates
        const storedCosts = localStorage.getItem(this.COSTS_KEY);
        if (storedCosts) {
          this.costEstimates = JSON.parse(storedCosts);
        }

        // Load suggestions
        const storedSuggestions = localStorage.getItem(this.SUGGESTIONS_KEY);
        if (storedSuggestions) {
          this.suggestions = JSON.parse(storedSuggestions);
        }

        // Load insights
        const storedInsights = localStorage.getItem(this.INSIGHTS_KEY);
        if (storedInsights) {
          this.insights = JSON.parse(storedInsights);
        }
      }
    } catch (error) {
      console.error('Failed to initialize smart analytics service:', error);
      this.patterns = [];
      this.costEstimates = [];
      this.suggestions = [];
      this.insights = [];
    }
  }

  // Record shopping activity to build patterns
  static async recordPurchase(
    userId: string,
    itemName: string,
    quantity: number,
    price: number,
    brand?: string,
    category?: string
  ): Promise<void> {
    try {
      const normalizedName = itemName.toLowerCase().trim();
      let pattern = this.patterns.find(p => p.userId === userId && p.itemName === normalizedName);

      if (pattern) {
        // Update existing pattern
        pattern.frequency += 1;
        pattern.averageQuantity = (pattern.averageQuantity + quantity) / 2;
        pattern.totalSpent += price * quantity;
        pattern.lastPurchased = new Date().toISOString();
        if (brand) pattern.preferredBrand = brand;
      } else {
        // Create new pattern
        pattern = {
          userId,
          itemName: normalizedName,
          frequency: 1,
          averageQuantity: quantity,
          preferredBrand: brand,
          lastPurchased: new Date().toISOString(),
          totalSpent: price * quantity,
          category: category || this.getCategoryFromName(normalizedName),
        };
        this.patterns.push(pattern);
      }

      // Update cost estimate
      await this.updateCostEstimate(normalizedName, price, brand);

      await this.savePatterns();
      await this.saveCostEstimates();
    } catch (error) {
      console.error('Failed to record purchase:', error);
    }
  }

  // Get cost estimate for an item
  static async getCostEstimate(
    itemName: string,
    brand?: string,
    season?: string
  ): Promise<CostEstimate> {
    const normalizedName = itemName.toLowerCase().trim();
    let estimate = this.costEstimates.find(e => e.itemName === normalizedName);

    if (!estimate) {
      // Create new estimate from database or AI
      const basePrice = await this.getBasePrice(normalizedName, brand, season);
      estimate = {
        itemName: normalizedName,
        estimatedPrice: basePrice,
        priceRange: { min: basePrice * 0.8, max: basePrice * 1.2 },
        confidence: 0.6,
        lastUpdated: new Date().toISOString(),
        source: 'ai_estimate',
      };
      this.costEstimates.push(estimate);
      await this.saveCostEstimates();
    }

    return estimate;
  }

  // Get smart suggestions based on patterns and context
  static async getSmartSuggestions(
    userId: string,
    currentList: string[],
    budget?: number,
    familySize?: number
  ): Promise<SmartSuggestion[]> {
    try {
      const suggestions: SmartSuggestion[] = [];
      const userPatterns = this.patterns.filter(p => p.userId === userId);
      const currentSeason = this.getCurrentSeason();

      // Frequently bought items not in current list
      const frequentItems = userPatterns
        .filter(p => p.frequency >= 3 && !currentList.includes(p.itemName))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5);

      for (const item of frequentItems) {
        const costEstimate = await this.getCostEstimate(item.itemName);
        suggestions.push({
          itemName: item.itemName,
          reason: 'frequently_bought',
          confidence: Math.min(item.frequency / 10, 0.9),
          estimatedCost: costEstimate.estimatedPrice,
          category: item.category,
          priority: item.frequency >= 5 ? 'high' : 'medium',
        });
      }

      // Seasonal suggestions
      const seasonalItems = await this.getSeasonalSuggestions(currentSeason);
      for (const item of seasonalItems) {
        if (!currentList.includes(item.itemName)) {
          const costEstimate = await this.getCostEstimate(item.itemName);
          suggestions.push({
            itemName: item.itemName,
            reason: 'seasonal',
            confidence: item.availability,
            estimatedCost: costEstimate.estimatedPrice,
            category: this.getCategoryFromName(item.itemName),
            priority: item.recommendation === 'buy_now' ? 'high' : 'medium',
          });
        }
      }

      // Complementary items based on current list
      const complementaryItems = await this.getComplementaryItems(currentList);
      for (const item of complementaryItems) {
        if (!currentList.includes(item)) {
          const costEstimate = await this.getCostEstimate(item);
          suggestions.push({
            itemName: item,
            reason: 'complementary',
            confidence: 0.7,
            estimatedCost: costEstimate.estimatedPrice,
            category: this.getCategoryFromName(item),
            priority: 'medium',
          });
        }
      }

      // Apply budget constraints
      if (budget) {
        const totalEstimatedCost = suggestions.reduce((sum, s) => sum + s.estimatedCost, 0);
        if (totalEstimatedCost > budget * 0.8) {
          suggestions.sort((a, b) => a.estimatedCost - b.estimatedCost);
        }
      }

      return suggestions.slice(0, 10); // Return top 10 suggestions
    } catch (error) {
      console.error('Failed to get smart suggestions:', error);
      return [];
    }
  }

  // Get shopping insights and recommendations
  static async getShoppingInsights(userId: string): Promise<ShoppingInsight[]> {
    try {
      const insights: ShoppingInsight[] = [];
      const userPatterns = this.patterns.filter(p => p.userId === userId);

      // Cost saving insights
      const expensiveItems = userPatterns
        .filter(p => p.totalSpent > 50)
        .sort((a, b) => b.totalSpent - a.totalSpent);

      if (expensiveItems.length > 0) {
        insights.push({
          type: 'cost_saving',
          title: 'High-Spending Items',
          description: `Consider alternatives for ${expensiveItems[0].itemName} to save money`,
          impact: 'high',
          actionable: true,
          action: 'View alternatives',
        });
      }

      // Efficiency insights
      const frequentItems = userPatterns.filter(p => p.frequency >= 5);
      if (frequentItems.length > 3) {
        insights.push({
          type: 'efficiency',
          title: 'Frequent Purchases',
          description: `You buy ${frequentItems.length} items frequently. Consider bulk buying to save time and money.`,
          impact: 'medium',
          actionable: true,
          action: 'Create bulk shopping list',
        });
      }

      // Health insights
      const unhealthyCategories = ['snacks', 'sweets', 'processed_foods'];
      const unhealthyItems = userPatterns.filter(p => 
        unhealthyCategories.some(cat => p.category.includes(cat))
      );

      if (unhealthyItems.length > 2) {
        insights.push({
          type: 'health',
          title: 'Healthier Choices',
          description: 'Consider adding more fruits and vegetables to your shopping list',
          impact: 'medium',
          actionable: true,
          action: 'Get healthy alternatives',
        });
      }

      // Sustainability insights
      const organicItems = userPatterns.filter(p => p.preferredBrand?.includes('organic'));
      if (organicItems.length < userPatterns.length * 0.3) {
        insights.push({
          type: 'sustainability',
          title: 'Sustainable Shopping',
          description: 'Consider choosing organic or local produce when possible',
          impact: 'low',
          actionable: true,
          action: 'View organic options',
        });
      }

      return insights;
    } catch (error) {
      console.error('Failed to get shopping insights:', error);
      return [];
    }
  }

  // Estimate total cost for a shopping list
  static async estimateListCost(items: Array<{ name: string; quantity: number; brand?: string }>): Promise<{
    totalCost: number;
    breakdown: Array<{ itemName: string; estimatedCost: number; confidence: number }>;
    range: { min: number; max: number };
  }> {
    try {
      const breakdown: Array<{ itemName: string; estimatedCost: number; confidence: number }> = [];
      let totalCost = 0;
      let minCost = 0;
      let maxCost = 0;

      for (const item of items) {
        const estimate = await this.getCostEstimate(item.name, item.brand);
        const itemCost = estimate.estimatedPrice * item.quantity;
        const itemMinCost = estimate.priceRange.min * item.quantity;
        const itemMaxCost = estimate.priceRange.max * item.quantity;

        breakdown.push({
          itemName: item.name,
          estimatedCost: itemCost,
          confidence: estimate.confidence,
        });

        totalCost += itemCost;
        minCost += itemMinCost;
        maxCost += itemMaxCost;
      }

      return {
        totalCost: Math.round(totalCost * 100) / 100,
        breakdown,
        range: {
          min: Math.round(minCost * 100) / 100,
          max: Math.round(maxCost * 100) / 100,
        },
      };
    } catch (error) {
      console.error('Failed to estimate list cost:', error);
      return {
        totalCost: 0,
        breakdown: [],
        range: { min: 0, max: 0 },
      };
    }
  }

  // Get seasonal patterns and recommendations
  static async getSeasonalPatterns(): Promise<SeasonalPattern[]> {
    const currentSeason = this.getCurrentSeason();
    const patterns: SeasonalPattern[] = [];

    for (const [itemName, data] of Object.entries(this.PRICE_DATABASE)) {
      const seasonalVariation = data.seasonalVariations[currentSeason] || 1.0;
      const priceVariation = (seasonalVariation - 1) * 100;

      let recommendation: 'buy_now' | 'wait' | 'avoid';
      if (seasonalVariation < 0.9) {
        recommendation = 'buy_now';
      } else if (seasonalVariation > 1.2) {
        recommendation = 'avoid';
      } else {
        recommendation = 'wait';
      }

      patterns.push({
        itemName,
        season: currentSeason,
        availability: seasonalVariation < 1.1 ? 1.0 : 0.7,
        priceVariation,
        recommendation,
      });
    }

    return patterns;
  }

  // Private helper methods
  private static async updateCostEstimate(itemName: string, price: number, brand?: string): Promise<void> {
    let estimate = this.costEstimates.find(e => e.itemName === itemName);

    if (estimate) {
      // Update existing estimate with new data
      const weight = 0.3; // Weight for new data
      estimate.estimatedPrice = estimate.estimatedPrice * (1 - weight) + price * weight;
      estimate.priceRange.min = Math.min(estimate.priceRange.min, price * 0.8);
      estimate.priceRange.max = Math.max(estimate.priceRange.max, price * 1.2);
      estimate.confidence = Math.min(estimate.confidence + 0.1, 0.9);
      estimate.lastUpdated = new Date().toISOString();
      estimate.source = 'user_history';
    } else {
      // Create new estimate
      estimate = {
        itemName,
        estimatedPrice: price,
        priceRange: { min: price * 0.8, max: price * 1.2 },
        confidence: 0.7,
        lastUpdated: new Date().toISOString(),
        source: 'user_history',
      };
      this.costEstimates.push(estimate);
    }
  }

  private static async getBasePrice(itemName: string, brand?: string, season?: string): Promise<number> {
    const data = this.PRICE_DATABASE[itemName];
    if (!data) return 5.0; // Default price

    let price = data.basePrice;

    // Apply seasonal variation
    if (season && data.seasonalVariations[season]) {
      price *= data.seasonalVariations[season];
    }

    // Apply brand variation
    if (brand && data.brandVariations[brand]) {
      price *= data.brandVariations[brand];
    }

    return Math.round(price * 100) / 100;
  }

  private static async getSeasonalSuggestions(season: string): Promise<Array<{ itemName: string; availability: number; recommendation: 'buy_now' | 'wait' | 'avoid' }>> {
    const suggestions: Array<{ itemName: string; availability: number; recommendation: 'buy_now' | 'wait' | 'avoid' }> = [];

    for (const [itemName, data] of Object.entries(this.PRICE_DATABASE)) {
      const seasonalVariation = data.seasonalVariations[season] || 1.0;
      const availability = seasonalVariation < 1.1 ? 1.0 : 0.7;

      let recommendation: 'buy_now' | 'wait' | 'avoid';
      if (seasonalVariation < 0.9) {
        recommendation = 'buy_now';
      } else if (seasonalVariation > 1.2) {
        recommendation = 'avoid';
      } else {
        recommendation = 'wait';
      }

      if (recommendation === 'buy_now' || availability > 0.8) {
        suggestions.push({ itemName, availability, recommendation });
      }
    }

    return suggestions;
  }

  private static async getComplementaryItems(currentList: string[]): Promise<string[]> {
    const complementaryPairs: Record<string, string[]> = {
      'bread': ['butter', 'jam', 'peanut_butter'],
      'milk': ['cereal', 'cookies', 'chocolate'],
      'chicken': ['rice', 'vegetables', 'sauce'],
      'pasta': ['sauce', 'cheese', 'vegetables'],
      'eggs': ['bacon', 'bread', 'milk'],
      'tomato': ['lettuce', 'onion', 'cheese'],
    };

    const suggestions: string[] = [];
    for (const item of currentList) {
      const complements = complementaryPairs[item.toLowerCase()];
      if (complements) {
        suggestions.push(...complements);
      }
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  private static getCategoryFromName(itemName: string): string {
    const categories: Record<string, string[]> = {
      'dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
      'fruits': ['apple', 'banana', 'orange', 'grape', 'strawberry'],
      'vegetables': ['tomato', 'lettuce', 'carrot', 'onion', 'potato'],
      'meat': ['chicken', 'beef', 'pork', 'lamb', 'turkey'],
      'pantry': ['bread', 'pasta', 'rice', 'flour', 'sugar'],
      'snacks': ['chips', 'cookies', 'crackers', 'nuts'],
    };

    for (const [category, items] of Object.entries(categories)) {
      if (items.some(item => itemName.includes(item))) {
        return category;
      }
    }

    return 'other';
  }

  private static getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private static async savePatterns(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.PATTERNS_KEY, JSON.stringify(this.patterns));
    }
  }

  private static async saveCostEstimates(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.COSTS_KEY, JSON.stringify(this.costEstimates));
    }
  }

  private static async saveSuggestions(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.SUGGESTIONS_KEY, JSON.stringify(this.suggestions));
    }
  }

  private static async saveInsights(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.INSIGHTS_KEY, JSON.stringify(this.insights));
    }
  }
}
