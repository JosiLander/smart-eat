export interface ExpiryResolution {
  itemName: string;
  ocrResult?: Date;
  aiSuggestion?: Date;
  finalDate?: Date;
  confidence: 'high' | 'medium' | 'low';
  source: 'ocr' | 'ai' | 'manual' | 'none';
  requiresUserInput: boolean;
  storageConditions?: string[];
  reasoning?: string;
}

export interface ExpirySuggestion {
  date: Date;
  confidence: number;
  source: 'ocr' | 'ai' | 'manual';
  reasoning: string;
  storageConditions: string[];
}

export interface UserCorrection {
  itemName: string;
  originalDate: Date;
  correctedDate: Date;
  originalSource: 'ocr' | 'ai' | 'manual';
  timestamp: Date;
}

export class SmartExpiryService {
  private static readonly STORAGE_KEY = 'expiry_resolutions';
  private static readonly CORRECTIONS_KEY = 'expiry_corrections';
  private static corrections: UserCorrection[] = [];

  // Enhanced product database with detailed expiry information
  private static readonly ENHANCED_PRODUCT_DATABASE: Record<string, {
    name: string;
    category: string;
    expirationDays: number;
    storageConditions: string[];
    seasonalVariations?: { [season: string]: number };
    brandVariations?: { [brand: string]: number };
  }> = {
    'carrot': {
      name: 'Carrot',
      category: 'vegetables',
      expirationDays: 21,
      storageConditions: ['refrigerated', 'dark_place', 'high_humidity'],
      seasonalVariations: { summer: 14, winter: 28 },
    },
    'apple': {
      name: 'Apple',
      category: 'fruits',
      expirationDays: 14,
      storageConditions: ['refrigerated', 'crisper_drawer'],
      seasonalVariations: { fall: 21, spring: 10 },
    },
    'banana': {
      name: 'Banana',
      category: 'fruits',
      expirationDays: 7,
      storageConditions: ['room_temperature', 'away_from_other_fruits'],
      seasonalVariations: { summer: 5, winter: 10 },
    },
    'milk': {
      name: 'Milk',
      category: 'dairy',
      expirationDays: 7,
      storageConditions: ['refrigerated', 'back_of_fridge'],
      brandVariations: { 'organic': 5, 'ultra_pasteurized': 14 },
    },
    'cheese': {
      name: 'Cheese',
      category: 'dairy',
      expirationDays: 14,
      storageConditions: ['refrigerated', 'cheese_drawer'],
      brandVariations: { 'aged': 30, 'fresh': 7 },
    },
    'chicken': {
      name: 'Chicken Breast',
      category: 'meat',
      expirationDays: 3,
      storageConditions: ['refrigerated', 'meat_drawer'],
      brandVariations: { 'organic': 2, 'frozen': 180 },
    },
    'bread': {
      name: 'Bread',
      category: 'pantry',
      expirationDays: 7,
      storageConditions: ['room_temperature', 'bread_box'],
      brandVariations: { 'whole_grain': 5, 'artisan': 3 },
    },
    'tomato': {
      name: 'Tomato',
      category: 'vegetables',
      expirationDays: 7,
      storageConditions: ['room_temperature', 'stem_side_down'],
      seasonalVariations: { summer: 5, winter: 10 },
    },
    'lettuce': {
      name: 'Lettuce',
      category: 'vegetables',
      expirationDays: 5,
      storageConditions: ['refrigerated', 'crisper_drawer', 'paper_towel'],
      seasonalVariations: { summer: 3, winter: 7 },
    },
    'yogurt': {
      name: 'Yogurt',
      category: 'dairy',
      expirationDays: 10,
      storageConditions: ['refrigerated', 'back_of_fridge'],
      brandVariations: { 'greek': 14, 'probiotic': 7 },
    },
  };

  static async initialize(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        const storedCorrections = localStorage.getItem(this.CORRECTIONS_KEY);
        if (storedCorrections) {
          this.corrections = JSON.parse(storedCorrections);
        }
      }
    } catch (error) {
      console.error('Failed to initialize smart expiry service:', error);
      this.corrections = [];
    }
  }

  static async resolveExpiryDate(
    itemName: string,
    ocrDates: Date[],
    imageUri?: string,
    brand?: string
  ): Promise<ExpiryResolution> {
    try {
      // Priority 1: Valid OCR result
      if (ocrDates.length > 0 && this.isValidDate(ocrDates[0])) {
        return {
          itemName,
          ocrResult: ocrDates[0],
          finalDate: ocrDates[0],
          confidence: 'high',
          source: 'ocr',
          requiresUserInput: false,
          reasoning: 'Date successfully extracted from product label',
        };
      }

      // Priority 2: AI suggestion with context
      const aiSuggestion = await this.getAISuggestion(itemName, brand);
      if (aiSuggestion.confidence > 0.7) {
        return {
          itemName,
          aiSuggestion: aiSuggestion.date,
          finalDate: aiSuggestion.date,
          confidence: 'medium',
          source: 'ai',
          requiresUserInput: false,
          storageConditions: aiSuggestion.storageConditions,
          reasoning: aiSuggestion.reasoning,
        };
      }

      // Priority 3: Manual entry required
      return {
        itemName,
        confidence: 'low',
        source: 'manual',
        requiresUserInput: true,
        reasoning: 'Unable to determine expiry date automatically',
      };
    } catch (error) {
      console.error('Failed to resolve expiry date:', error);
      return {
        itemName,
        confidence: 'low',
        source: 'manual',
        requiresUserInput: true,
        reasoning: 'Error occurred during date resolution',
      };
    }
  }

  static async getAISuggestion(itemName: string, brand?: string): Promise<ExpirySuggestion> {
    const normalizedName = itemName.toLowerCase().trim();
    const productData = this.ENHANCED_PRODUCT_DATABASE[normalizedName];

    if (!productData) {
      // Fallback to basic category-based suggestion
      return this.getCategoryBasedSuggestion(itemName);
    }

    let expirationDays = productData.expirationDays;
    let reasoning = `Based on ${productData.name} storage guidelines`;

    // Apply seasonal adjustments
    const currentSeason = this.getCurrentSeason();
    if (productData.seasonalVariations && productData.seasonalVariations[currentSeason]) {
      expirationDays = productData.seasonalVariations[currentSeason];
      reasoning += ` (${currentSeason} season)`;
    }

    // Apply brand-specific adjustments
    if (brand && productData.brandVariations && productData.brandVariations[brand.toLowerCase()]) {
      expirationDays = productData.brandVariations[brand.toLowerCase()];
      reasoning += ` (${brand} brand)`;
    }

    // Apply user correction learning
    const userCorrection = this.getUserCorrection(itemName);
    if (userCorrection) {
      const daysDiff = Math.abs(userCorrection.correctedDate.getTime() - userCorrection.originalDate.getTime()) / (1000 * 3600 * 24);
      if (daysDiff > 2) {
        // Significant correction, adjust confidence
        reasoning += ' (adjusted based on your previous corrections)';
      }
    }

    const suggestedDate = new Date();
    suggestedDate.setDate(suggestedDate.getDate() + expirationDays);

    return {
      date: suggestedDate,
      confidence: this.calculateConfidence(itemName, productData),
      source: 'ai',
      reasoning,
      storageConditions: productData.storageConditions,
    };
  }

  static async batchResolveExpiryDates(
    items: Array<{ name: string; ocrDates: Date[]; brand?: string }>
  ): Promise<ExpiryResolution[]> {
    const resolutions: ExpiryResolution[] = [];

    for (const item of items) {
      const resolution = await this.resolveExpiryDate(item.name, item.ocrDates, undefined, item.brand);
      resolutions.push(resolution);
    }

    return resolutions;
  }

  static async recordUserCorrection(
    itemName: string,
    originalDate: Date,
    correctedDate: Date,
    originalSource: 'ocr' | 'ai' | 'manual'
  ): Promise<void> {
    try {
      const correction: UserCorrection = {
        itemName: itemName.toLowerCase(),
        originalDate,
        correctedDate,
        originalSource,
        timestamp: new Date(),
      };

      this.corrections.push(correction);

      // Keep only recent corrections (last 100)
      if (this.corrections.length > 100) {
        this.corrections = this.corrections.slice(-100);
      }

      await this.saveCorrections();
    } catch (error) {
      console.error('Failed to record user correction:', error);
    }
  }

  static getStorageRecommendations(itemName: string): string[] {
    const normalizedName = itemName.toLowerCase().trim();
    const productData = this.ENHANCED_PRODUCT_DATABASE[normalizedName];

    if (productData) {
      return productData.storageConditions;
    }

    // Fallback recommendations by category
    const categoryRecommendations: Record<string, string[]> = {
      'fruits': ['refrigerated', 'crisper_drawer'],
      'vegetables': ['refrigerated', 'crisper_drawer'],
      'dairy': ['refrigerated', 'back_of_fridge'],
      'meat': ['refrigerated', 'meat_drawer'],
      'pantry': ['room_temperature', 'dark_place'],
      'frozen': ['frozen', 'deep_freeze'],
    };

    // Try to determine category from item name
    for (const [category, recommendations] of Object.entries(categoryRecommendations)) {
      if (normalizedName.includes(category) || this.isInCategory(normalizedName, category)) {
        return recommendations;
      }
    }

    return ['room_temperature']; // Default recommendation
  }

  private static isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime()) && date > new Date();
  }

  private static getCategoryBasedSuggestion(itemName: string): ExpirySuggestion {
    const normalizedName = itemName.toLowerCase();
    let expirationDays = 7; // Default
    let category = 'other';

    // Simple category detection
    if (normalizedName.includes('milk') || normalizedName.includes('cheese') || normalizedName.includes('yogurt')) {
      category = 'dairy';
      expirationDays = 7;
    } else if (normalizedName.includes('chicken') || normalizedName.includes('beef') || normalizedName.includes('pork')) {
      category = 'meat';
      expirationDays = 3;
    } else if (normalizedName.includes('apple') || normalizedName.includes('banana') || normalizedName.includes('orange')) {
      category = 'fruits';
      expirationDays = 14;
    } else if (normalizedName.includes('carrot') || normalizedName.includes('tomato') || normalizedName.includes('lettuce')) {
      category = 'vegetables';
      expirationDays = 7;
    } else if (normalizedName.includes('bread') || normalizedName.includes('pasta') || normalizedName.includes('rice')) {
      category = 'pantry';
      expirationDays = 7;
    }

    const suggestedDate = new Date();
    suggestedDate.setDate(suggestedDate.getDate() + expirationDays);

    return {
      date: suggestedDate,
      confidence: 0.5, // Lower confidence for category-based suggestions
      source: 'ai',
      reasoning: `Based on typical ${category} item storage guidelines`,
      storageConditions: this.getStorageRecommendations(itemName),
    };
  }

  private static calculateConfidence(itemName: string, productData: any): number {
    let confidence = 0.8; // Base confidence

    // Reduce confidence if we have user corrections for this item
    const corrections = this.corrections.filter(c => c.itemName === itemName.toLowerCase());
    if (corrections.length > 0) {
      confidence -= 0.1 * Math.min(corrections.length, 3); // Reduce by 0.1 for each correction, max 0.3
    }

    // Increase confidence for well-known items
    if (productData && productData.storageConditions.length > 2) {
      confidence += 0.1;
    }

    return Math.max(0.3, Math.min(0.9, confidence)); // Clamp between 0.3 and 0.9
  }

  private static getUserCorrection(itemName: string): UserCorrection | null {
    const normalizedName = itemName.toLowerCase();
    const itemCorrections = this.corrections.filter(c => c.itemName === normalizedName);
    
    if (itemCorrections.length === 0) return null;
    
    // Return the most recent correction
    return itemCorrections[itemCorrections.length - 1];
  }

  private static getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private static isInCategory(itemName: string, category: string): boolean {
    const categoryKeywords: Record<string, string[]> = {
      'fruits': ['apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry'],
      'vegetables': ['carrot', 'tomato', 'lettuce', 'onion', 'potato', 'broccoli'],
      'dairy': ['milk', 'cheese', 'yogurt', 'cream', 'butter'],
      'meat': ['chicken', 'beef', 'pork', 'lamb', 'turkey'],
      'pantry': ['bread', 'pasta', 'rice', 'flour', 'sugar', 'oil'],
    };

    const keywords = categoryKeywords[category] || [];
    return keywords.some(keyword => itemName.includes(keyword));
  }

  private static async saveCorrections(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.CORRECTIONS_KEY, JSON.stringify(this.corrections));
    }
  }
}
