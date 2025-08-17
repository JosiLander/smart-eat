export interface TemplateItem {
  name: string;
  quantity: number;
  unit: string;
  category: 'fruits' | 'vegetables' | 'dairy' | 'meat' | 'pantry' | 'beverages' | 'snacks' | 'frozen' | 'other';
  isEssential: boolean;
  frequency: 'always' | 'usually' | 'sometimes';
}

export interface ShoppingTemplate {
  id: string;
  name: string;
  description: string;
  items: TemplateItem[];
  category: 'prebuilt' | 'custom' | 'learned';
  usageCount: number;
  lastUsed: Date;
  seasonal?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateResult {
  success: boolean;
  templateId?: string;
  error?: string;
}

export interface TemplateSuggestion {
  template: ShoppingTemplate;
  confidence: number;
  reason: string;
}

export class TemplateService {
  private static readonly STORAGE_KEY = 'shopping_templates';
  private static templates: ShoppingTemplate[] = [];

  // Pre-built templates
  private static readonly PREBUILT_TEMPLATES: Omit<ShoppingTemplate, 'id' | 'usageCount' | 'lastUsed' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Weekly Essentials',
      description: 'Basic items for a typical week',
      items: [
        { name: 'Milk', quantity: 2, unit: 'L', category: 'dairy', isEssential: true, frequency: 'always' },
        { name: 'Bread', quantity: 1, unit: 'loaf', category: 'pantry', isEssential: true, frequency: 'always' },
        { name: 'Eggs', quantity: 12, unit: 'pieces', category: 'dairy', isEssential: true, frequency: 'always' },
        { name: 'Bananas', quantity: 1, unit: 'bunch', category: 'fruits', isEssential: true, frequency: 'usually' },
        { name: 'Chicken Breast', quantity: 1, unit: 'kg', category: 'meat', isEssential: true, frequency: 'usually' },
        { name: 'Rice', quantity: 1, unit: 'kg', category: 'pantry', isEssential: false, frequency: 'sometimes' },
        { name: 'Tomatoes', quantity: 500, unit: 'g', category: 'vegetables', isEssential: false, frequency: 'sometimes' },
      ],
      category: 'prebuilt',
      seasonal: false,
    },
    {
      name: 'Party Shopping',
      description: 'Items for hosting a party or gathering',
      items: [
        { name: 'Chips', quantity: 3, unit: 'bags', category: 'snacks', isEssential: true, frequency: 'always' },
        { name: 'Soda', quantity: 6, unit: 'cans', category: 'beverages', isEssential: true, frequency: 'always' },
        { name: 'Cheese', quantity: 500, unit: 'g', category: 'dairy', isEssential: true, frequency: 'usually' },
        { name: 'Crackers', quantity: 2, unit: 'boxes', category: 'snacks', isEssential: true, frequency: 'usually' },
        { name: 'Wine', quantity: 2, unit: 'bottles', category: 'beverages', isEssential: false, frequency: 'sometimes' },
        { name: 'Grapes', quantity: 1, unit: 'kg', category: 'fruits', isEssential: false, frequency: 'sometimes' },
      ],
      category: 'prebuilt',
      seasonal: false,
    },
    {
      name: 'Meal Prep',
      description: 'Items for weekly meal preparation',
      items: [
        { name: 'Ground Beef', quantity: 2, unit: 'kg', category: 'meat', isEssential: true, frequency: 'always' },
        { name: 'Pasta', quantity: 1, unit: 'kg', category: 'pantry', isEssential: true, frequency: 'always' },
        { name: 'Onions', quantity: 1, unit: 'kg', category: 'vegetables', isEssential: true, frequency: 'always' },
        { name: 'Garlic', quantity: 1, unit: 'head', category: 'vegetables', isEssential: true, frequency: 'always' },
        { name: 'Bell Peppers', quantity: 6, unit: 'pieces', category: 'vegetables', isEssential: true, frequency: 'usually' },
        { name: 'Zucchini', quantity: 1, unit: 'kg', category: 'vegetables', isEssential: false, frequency: 'sometimes' },
        { name: 'Sweet Potatoes', quantity: 2, unit: 'kg', category: 'vegetables', isEssential: false, frequency: 'sometimes' },
      ],
      category: 'prebuilt',
      seasonal: false,
    },
  ];

  static async initialize(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.templates = JSON.parse(stored);
        } else {
          // Initialize with pre-built templates
          this.templates = this.PREBUILT_TEMPLATES.map(template => ({
            ...template,
            id: `prebuilt_${template.name.toLowerCase().replace(/\s+/g, '_')}`,
            usageCount: 0,
            lastUsed: new Date(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          await this.saveToStorage();
        }
      } else {
        // Fallback for test environments
        this.templates = this.PREBUILT_TEMPLATES.map(template => ({
          ...template,
          id: `prebuilt_${template.name.toLowerCase().replace(/\s+/g, '_')}`,
          usageCount: 0,
          lastUsed: new Date(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('Failed to initialize template service:', error);
      // Fallback to pre-built templates only
      this.templates = this.PREBUILT_TEMPLATES.map(template => ({
        ...template,
        id: `prebuilt_${template.name.toLowerCase().replace(/\s+/g, '_')}`,
        usageCount: 0,
        lastUsed: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }
  }

  static async getAllTemplates(): Promise<ShoppingTemplate[]> {
    return [...this.templates];
  }

  static async getTemplatesByCategory(category: ShoppingTemplate['category']): Promise<ShoppingTemplate[]> {
    return this.templates.filter(template => template.category === category);
  }

  static async createTemplate(
    name: string,
    description: string,
    items: TemplateItem[],
    category: 'custom' | 'learned' = 'custom'
  ): Promise<CreateTemplateResult> {
    try {
      const newTemplate: ShoppingTemplate = {
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        items,
        category,
        usageCount: 0,
        lastUsed: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.templates.push(newTemplate);
      await this.saveToStorage();

      return {
        success: true,
        templateId: newTemplate.id,
      };
    } catch (error) {
      console.error('Failed to create template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async useTemplate(templateId: string): Promise<ShoppingTemplate | null> {
    const template = this.templates.find(t => t.id === templateId);
    if (template) {
      template.usageCount++;
      template.lastUsed = new Date();
      template.updatedAt = new Date().toISOString();
      await this.saveToStorage();
      return { ...template };
    }
    return null;
  }

  static async getSuggestions(
    shoppingHistory: Array<{ items: Array<{ name: string; category: string }>; date: Date }>,
    upcomingEvents?: Array<{ type: string; date: Date }>
  ): Promise<TemplateSuggestion[]> {
    const suggestions: TemplateSuggestion[] = [];

    // Analyze shopping patterns
    const itemFrequency = this.analyzeShoppingPatterns(shoppingHistory);
    
    // Generate learned template suggestions
    const learnedTemplate = this.generateLearnedTemplate(itemFrequency);
    if (learnedTemplate) {
      suggestions.push({
        template: learnedTemplate,
        confidence: 0.8,
        reason: 'Based on your shopping patterns',
      });
    }

    // Suggest based on upcoming events
    if (upcomingEvents) {
      for (const event of upcomingEvents) {
        const eventTemplate = this.getEventBasedTemplate(event);
        if (eventTemplate) {
          suggestions.push({
            template: eventTemplate,
            confidence: 0.9,
            reason: `For your upcoming ${event.type}`,
          });
        }
      }
    }

    // Suggest seasonal templates
    const seasonalTemplate = this.getSeasonalTemplate();
    if (seasonalTemplate) {
      suggestions.push({
        template: seasonalTemplate,
        confidence: 0.7,
        reason: 'Seasonal items you might need',
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private static analyzeShoppingPatterns(
    shoppingHistory: Array<{ items: Array<{ name: string; category: string }>; date: Date }>
  ): Map<string, number> {
    const itemFrequency = new Map<string, number>();
    
    for (const trip of shoppingHistory) {
      for (const item of trip.items) {
        const currentCount = itemFrequency.get(item.name) || 0;
        itemFrequency.set(item.name, currentCount + 1);
      }
    }
    
    return itemFrequency;
  }

  private static generateLearnedTemplate(itemFrequency: Map<string, number>): ShoppingTemplate | null {
    const frequentItems = Array.from(itemFrequency.entries())
      .filter(([_, count]) => count >= 2)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 10);

    if (frequentItems.length === 0) return null;

    const items: TemplateItem[] = frequentItems.map(([name, count]) => ({
      name,
      quantity: 1,
      unit: 'piece',
      category: 'other', // Would need category mapping in real implementation
      isEssential: count >= 3,
      frequency: count >= 4 ? 'always' : count >= 2 ? 'usually' : 'sometimes',
    }));

    return {
      id: `learned_${Date.now()}`,
      name: 'Your Regular Items',
      description: 'Based on your shopping patterns',
      items,
      category: 'learned',
      usageCount: 0,
      lastUsed: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private static getEventBasedTemplate(event: { type: string; date: Date }): ShoppingTemplate | null {
    // Map event types to templates
    const eventTemplateMap: Record<string, string> = {
      'party': 'Party Shopping',
      'birthday': 'Party Shopping',
      'dinner': 'Meal Prep',
      'weekend': 'Weekly Essentials',
    };

    const templateName = eventTemplateMap[event.type.toLowerCase()];
    if (!templateName) return null;

    return this.templates.find(t => t.name === templateName) || null;
  }

  private static getSeasonalTemplate(): ShoppingTemplate | null {
    const month = new Date().getMonth();
    
    // Simple seasonal logic - could be enhanced
    if (month >= 11 || month <= 1) {
      // Winter
      return this.templates.find(t => t.name === 'Weekly Essentials') || null;
    } else if (month >= 5 && month <= 8) {
      // Summer
      return this.templates.find(t => t.name === 'Party Shopping') || null;
    }
    
    return null;
  }

  private static async saveToStorage(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.templates));
    }
  }
}
