import { RecognizedProduct } from './AIService';
import { ExtractedDate } from './OCRService';

export interface InventoryItem {
  id: string;
  name: string;
  category: RecognizedProduct['category'];
  quantity: number;
  unit: string;
  expirationDate: Date;
  addedDate: Date;
  imageUri?: string;
  confidence: number;
  notes?: string;
  isExpired: boolean;
  daysUntilExpiry: number;
}

export interface InventoryStats {
  totalItems: number;
  expiringSoon: number; // Items expiring in next 3 days
  expired: number;
  byCategory: Record<string, number>;
}

export interface AddItemResult {
  success: boolean;
  item?: InventoryItem;
  error?: string;
}

export class InventoryService {
  private static readonly STORAGE_KEY = 'smart_eat_inventory';
  private static inventory: InventoryItem[] = [];

  static async initialize(): Promise<void> {
    try {
      // In a real app, this would load from AsyncStorage or a database
      // For MVP, we'll use in-memory storage with localStorage fallback
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.inventory = JSON.parse(stored).map((item: any) => ({
            ...item,
            expirationDate: new Date(item.expirationDate),
            addedDate: new Date(item.addedDate),
          }));
        }
      }
      
      // Update computed fields
      this.updateComputedFields();
    } catch (error) {
      console.error('Failed to initialize inventory:', error);
      this.inventory = [];
    }
  }

  static async addItem(
    product: RecognizedProduct,
    extractedDates: ExtractedDate[],
    imageUri?: string,
    quantity: number = 1,
    unit: string = 'piece'
  ): Promise<AddItemResult> {
    try {
      // Use the highest confidence date, or generate a suggested date
      let expirationDate: Date;
      
      if (extractedDates.length > 0) {
        const bestDate = extractedDates.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
        expirationDate = bestDate.date;
      } else {
        // Use suggested expiration days from product recognition
        const suggestedDate = new Date();
        suggestedDate.setDate(suggestedDate.getDate() + product.suggestedExpirationDays);
        expirationDate = suggestedDate;
      }

      const item: InventoryItem = {
        id: this.generateId(),
        name: product.name,
        category: product.category,
        quantity,
        unit,
        expirationDate,
        addedDate: new Date(),
        imageUri,
        confidence: product.confidence,
        isExpired: false,
        daysUntilExpiry: 0,
      };

      this.inventory.push(item);
      this.updateComputedFields();
      await this.saveToStorage();

      console.log('Added item to inventory:', item);
      
      return {
        success: true,
        item,
      };
    } catch (error) {
      console.error('Failed to add item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateItem(id: string, updates: Partial<InventoryItem>): Promise<boolean> {
    try {
      const index = this.inventory.findIndex(item => item.id === id);
      if (index === -1) {
        return false;
      }

      this.inventory[index] = { ...this.inventory[index], ...updates };
      this.updateComputedFields();
      await this.saveToStorage();
      
      return true;
    } catch (error) {
      console.error('Failed to update item:', error);
      return false;
    }
  }

  static async removeItem(id: string): Promise<boolean> {
    try {
      const index = this.inventory.findIndex(item => item.id === id);
      if (index === -1) {
        return false;
      }

      this.inventory.splice(index, 1);
      await this.saveToStorage();
      
      return true;
    } catch (error) {
      console.error('Failed to remove item:', error);
      return false;
    }
  }

  static async getAllItems(): Promise<InventoryItem[]> {
    return [...this.inventory];
  }

  static async getItemsByCategory(category: string): Promise<InventoryItem[]> {
    return this.inventory.filter(item => item.category === category);
  }

  static async getExpiringSoon(days: number = 3): Promise<InventoryItem[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    
    return this.inventory.filter(item => 
      item.expirationDate <= cutoffDate && !item.isExpired
    );
  }

  static async getExpiredItems(): Promise<InventoryItem[]> {
    return this.inventory.filter(item => item.isExpired);
  }

  static async getInventoryStats(): Promise<InventoryStats> {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const stats: InventoryStats = {
      totalItems: this.inventory.length,
      expiringSoon: this.inventory.filter(item => 
        item.expirationDate <= threeDaysFromNow && !item.isExpired
      ).length,
      expired: this.inventory.filter(item => item.isExpired).length,
      byCategory: {},
    };

    // Count by category
    this.inventory.forEach(item => {
      stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
    });

    return stats;
  }

  static async searchItems(query: string): Promise<InventoryItem[]> {
    const lowerQuery = query.toLowerCase();
    return this.inventory.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
  }

  private static updateComputedFields(): void {
    const now = new Date();
    
    this.inventory.forEach(item => {
      const timeDiff = item.expirationDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      item.isExpired = daysDiff < 0;
      item.daysUntilExpiry = Math.max(0, daysDiff);
    });
  }

  private static generateId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static async saveToStorage(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.inventory));
      }
    } catch (error) {
      console.error('Failed to save inventory to storage:', error);
    }
  }

  static async clearInventory(): Promise<void> {
    this.inventory = [];
    await this.saveToStorage();
  }

  static async exportInventory(): Promise<string> {
    return JSON.stringify(this.inventory, null, 2);
  }

  static async importInventory(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data)) {
        this.inventory = data.map((item: any) => ({
          ...item,
          expirationDate: new Date(item.expirationDate),
          addedDate: new Date(item.addedDate),
        }));
        this.updateComputedFields();
        await this.saveToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import inventory:', error);
      return false;
    }
  }
} 