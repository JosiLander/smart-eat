export interface StoreSection {
  name: string;
  order: number;
  items: string[]; // item categories that belong here
  color: string;
  icon: string;
}

export interface StoreLayout {
  id: string;
  name: string;
  sections: StoreSection[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLayoutResult {
  success: boolean;
  layoutId?: string;
  error?: string;
}

export interface SortedItem {
  item: any; // GroceryItem or similar
  section: string;
  sectionOrder: number;
  itemOrder: number;
}

export class StoreLayoutService {
  private static readonly STORAGE_KEY = 'store_layouts';
  private static layouts: StoreLayout[] = [];

  // Default store layout based on typical supermarket organization
  private static readonly DEFAULT_LAYOUT: Omit<StoreLayout, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Standard Supermarket',
    isDefault: true,
    sections: [
      {
        name: 'Produce',
        order: 1,
        items: ['fruits', 'vegetables'],
        color: '#4CAF50',
        icon: '🥬',
      },
      {
        name: 'Dairy',
        order: 2,
        items: ['dairy'],
        color: '#2196F3',
        icon: '🥛',
      },
      {
        name: 'Meat & Fish',
        order: 3,
        items: ['meat'],
        color: '#F44336',
        icon: '🥩',
      },
      {
        name: 'Pantry',
        order: 4,
        items: ['pantry'],
        color: '#FF9800',
        icon: '🥫',
      },
      {
        name: 'Beverages',
        order: 5,
        items: ['beverages'],
        color: '#9C27B0',
        icon: '🥤',
      },
      {
        name: 'Snacks',
        order: 6,
        items: ['snacks'],
        color: '#FF5722',
        icon: '🍿',
      },
      {
        name: 'Frozen',
        order: 7,
        items: ['frozen'],
        color: '#00BCD4',
        icon: '🧊',
      },
      {
        name: 'Other',
        order: 8,
        items: ['other'],
        color: '#607D8B',
        icon: '📦',
      },
    ],
  };

  static async initialize(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.layouts = JSON.parse(stored);
        } else {
          // Initialize with default layout
          this.layouts = [{
            ...this.DEFAULT_LAYOUT,
            id: 'default_layout',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }];
          await this.saveToStorage();
        }
      } else {
        // Fallback for test environments
        this.layouts = [{
          ...this.DEFAULT_LAYOUT,
          id: 'default_layout',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }];
      }
    } catch (error) {
      console.error('Failed to initialize store layout service:', error);
      // Fallback to default layout only
      this.layouts = [{
        ...this.DEFAULT_LAYOUT,
        id: 'default_layout',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }];
    }
  }

  static async getAllLayouts(): Promise<StoreLayout[]> {
    return [...this.layouts];
  }

  static async getDefaultLayout(): Promise<StoreLayout | null> {
    const defaultLayout = this.layouts.find(layout => layout.isDefault);
    return defaultLayout ? { ...defaultLayout } : null;
  }

  static async getLayoutById(layoutId: string): Promise<StoreLayout | null> {
    const layout = this.layouts.find(l => l.id === layoutId);
    return layout ? { ...layout } : null;
  }

  static async createLayout(
    name: string,
    sections: StoreSection[],
    isDefault: boolean = false
  ): Promise<CreateLayoutResult> {
    try {
      // If this is the new default, unset other defaults
      if (isDefault) {
        this.layouts.forEach(layout => layout.isDefault = false);
      }

      const newLayout: StoreLayout = {
        id: `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        sections: sections.sort((a, b) => a.order - b.order),
        isDefault,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.layouts.push(newLayout);
      await this.saveToStorage();

      return {
        success: true,
        layoutId: newLayout.id,
      };
    } catch (error) {
      console.error('Failed to create store layout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async updateLayout(
    layoutId: string,
    updates: Partial<Omit<StoreLayout, 'id' | 'createdAt'>>
  ): Promise<boolean> {
    try {
      const layout = this.layouts.find(l => l.id === layoutId);
      if (!layout) return false;

      // If this is being set as default, unset other defaults
      if (updates.isDefault) {
        this.layouts.forEach(l => l.isDefault = false);
      }

      Object.assign(layout, updates);
      layout.updatedAt = new Date().toISOString();

      // Sort sections by order
      if (updates.sections) {
        layout.sections.sort((a, b) => a.order - b.order);
      }

      await this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to update store layout:', error);
      return false;
    }
  }

  static async deleteLayout(layoutId: string): Promise<boolean> {
    try {
      const layout = this.layouts.find(l => l.id === layoutId);
      if (!layout || layout.isDefault) return false; // Can't delete default layout

      this.layouts = this.layouts.filter(l => l.id !== layoutId);
      await this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to delete store layout:', error);
      return false;
    }
  }

  static sortItemsByLayout(
    items: Array<{ category: string; [key: string]: any }>,
    layout: StoreLayout
  ): SortedItem[] {
    const sortedItems: SortedItem[] = [];

    for (const item of items) {
      const section = this.findSectionForItem(item.category, layout);
      if (section) {
        sortedItems.push({
          item,
          section: section.name,
          sectionOrder: section.order,
          itemOrder: sortedItems.filter(si => si.section === section.name).length,
        });
      } else {
        // Fallback to "Other" section
        const otherSection = layout.sections.find(s => s.name === 'Other');
        sortedItems.push({
          item,
          section: otherSection?.name || 'Other',
          sectionOrder: otherSection?.order || 999,
          itemOrder: sortedItems.filter(si => si.section === (otherSection?.name || 'Other')).length,
        });
      }
    }

    // Sort by section order, then by item order within section
    return sortedItems.sort((a, b) => {
      if (a.sectionOrder !== b.sectionOrder) {
        return a.sectionOrder - b.sectionOrder;
      }
      return a.itemOrder - b.itemOrder;
    });
  }

  static getSectionForCategory(category: string, layout: StoreLayout): StoreSection | null {
    return this.findSectionForItem(category, layout);
  }

  static getSectionProgress(
    items: Array<{ category: string; isPurchased?: boolean; [key: string]: any }>,
    layout: StoreLayout
  ): Array<{ section: StoreSection; total: number; completed: number; progress: number }> {
    const sectionProgress = new Map<string, { total: number; completed: number }>();

    for (const item of items) {
      const section = this.findSectionForItem(item.category, layout);
      if (section) {
        const current = sectionProgress.get(section.name) || { total: 0, completed: 0 };
        current.total++;
        if (item.isPurchased) {
          current.completed++;
        }
        sectionProgress.set(section.name, current);
      }
    }

    return layout.sections.map(section => {
      const progress = sectionProgress.get(section.name) || { total: 0, completed: 0 };
      return {
        section,
        total: progress.total,
        completed: progress.completed,
        progress: progress.total > 0 ? (progress.completed / progress.total) * 100 : 0,
      };
    }).filter(sp => sp.total > 0); // Only show sections with items
  }

  private static findSectionForItem(category: string, layout: StoreLayout): StoreSection | null {
    return layout.sections.find(section => 
      section.items.includes(category.toLowerCase())
    ) || null;
  }

  private static async saveToStorage(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.layouts));
    }
  }
}
