import { GroceryListService, GroceryList, GroceryItem } from './GroceryListService';
import { InventoryService, InventoryItem } from './InventoryService';
import { AIService, RecognizedProduct } from './AIService';
import { OCRService } from './OCRService';
import { SmartExpiryService, ExpiryResolution } from './SmartExpiryService';

export interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  price?: number;
  expirationDate?: Date;
  imageUri?: string;
  confidence: number;
  source: 'scanned' | 'manual' | 'grocery_list';
  groceryListItemId?: string;
  status: 'confirmed' | 'pending' | 'modified' | 'not_purchased';
  notes?: string;
}

export interface PurchaseSummary {
  id: string;
  groceryListId: string;
  totalItems: number;
  confirmedItems: number;
  notPurchasedItems: number;
  additionalItems: number;
  totalCost?: number;
  shoppingDate: Date;
  duration?: number; // in minutes
  efficiency: number; // 0-1 score
  items: PurchaseItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ScanResult {
  success: boolean;
  items?: PurchaseItem[];
  error?: string;
  confidence: number;
  processingTime: number;
}

export interface ReconciliationResult {
  success: boolean;
  summary?: PurchaseSummary;
  missingItems: string[];
  additionalItems: string[];
  conflicts: {
    itemName: string;
    expectedQuantity: number;
    actualQuantity: number;
    expectedUnit: string;
    actualUnit: string;
  }[];
  error?: string;
}

export interface PostShoppingConfig {
  autoConfirmThreshold: number; // 0-1, confidence threshold for auto-confirmation
  enableBatchProcessing: boolean;
  requireExpiryConfirmation: boolean;
  enablePriceTracking: boolean;
  maxProcessingTime: number; // in seconds
}

export class PostShoppingService {
  private static readonly STORAGE_KEY = 'smart_eat_post_shopping';
  private static readonly CONFIG_KEY = 'smart_eat_post_shopping_config';
  private static summaries: PurchaseSummary[] = [];
  private static config: PostShoppingConfig = {
    autoConfirmThreshold: 0.8,
    enableBatchProcessing: true,
    requireExpiryConfirmation: true,
    enablePriceTracking: false,
    maxProcessingTime: 30,
  };

  static async initialize(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.summaries = JSON.parse(stored).map((summary: any) => ({
            ...summary,
            shoppingDate: new Date(summary.shoppingDate),
            items: summary.items.map((item: any) => ({
              ...item,
              expirationDate: item.expirationDate ? new Date(item.expirationDate) : undefined,
            })),
          }));
        }

        const configStored = localStorage.getItem(this.CONFIG_KEY);
        if (configStored) {
          this.config = { ...this.config, ...JSON.parse(configStored) };
        }
      }
    } catch (error) {
      console.error('Failed to initialize PostShoppingService:', error);
      this.summaries = [];
    }
  }

  /**
   * Start post-shopping scan process
   */
  static async startPostShoppingScan(groceryListId: string): Promise<{
    success: boolean;
    summaryId?: string;
    error?: string;
  }> {
    try {
      // Get the completed grocery list
      const groceryList = await GroceryListService.getListById(groceryListId);
      if (!groceryList) {
        return { success: false, error: 'Grocery list not found' };
      }

      // Create initial purchase summary
      const summary: PurchaseSummary = {
        id: this.generateId(),
        groceryListId,
        totalItems: groceryList.items.length,
        confirmedItems: 0,
        notPurchasedItems: 0,
        additionalItems: 0,
        shoppingDate: new Date(),
        efficiency: 0,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Convert grocery list items to purchase items
      summary.items = groceryList.items.map(item => ({
        id: this.generateId(),
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        source: 'grocery_list' as const,
        groceryListItemId: item.id,
        status: 'pending' as const,
        confidence: 1.0,
      }));

      this.summaries.push(summary);
      await this.saveToStorage();

      return { success: true, summaryId: summary.id };
    } catch (error) {
      console.error('Failed to start post-shopping scan:', error);
      return { success: false, error: 'Failed to start scan process' };
    }
  }

  /**
   * Process scanned items and reconcile with grocery list
   */
  static async processScannedItems(
    summaryId: string,
    imageUri: string
  ): Promise<ScanResult> {
    const startTime = Date.now();
    
    try {
      const summary = this.summaries.find(s => s.id === summaryId);
      if (!summary) {
        return { success: false, error: 'Purchase summary not found', confidence: 0, processingTime: 0 };
      }

      // Use AI service to recognize products
      const recognizedProducts = await AIService.recognizeProducts(imageUri);
      
      // Process each recognized product
      const scannedItems: PurchaseItem[] = [];
      
      for (const product of recognizedProducts) {
        // Extract expiration dates using OCR
        const expirationDates = await OCRService.extractDates(imageUri);
        
        // Use SmartExpiryService to resolve expiry dates
        const expiryResolution = await SmartExpiryService.resolveExpiryDate(
          product.name,
          expirationDates,
          product.category
        );

        const scannedItem: PurchaseItem = {
          id: this.generateId(),
          name: product.name,
          quantity: 1, // Default quantity, can be adjusted
          unit: product.unit || 'piece',
          category: product.category,
          confidence: product.confidence,
          source: 'scanned' as const,
          status: product.confidence >= this.config.autoConfirmThreshold ? 'confirmed' : 'pending',
          imageUri,
          expirationDate: expiryResolution.finalDate,
        };

        scannedItems.push(scannedItem);
      }

      // Reconcile with grocery list items
      const reconciliation = this.reconcileItems(summary.items, scannedItems);
      
      // Update summary
      summary.items = reconciliation.reconciledItems;
      summary.confirmedItems = summary.items.filter(item => item.status === 'confirmed').length;
      summary.notPurchasedItems = summary.items.filter(item => item.status === 'not_purchased').length;
      summary.additionalItems = summary.items.filter(item => item.source === 'scanned' && !item.groceryListItemId).length;
      summary.efficiency = this.calculateEfficiency(summary);
      summary.updatedAt = new Date().toISOString();

      await this.saveToStorage();

      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        items: scannedItems,
        confidence: scannedItems.reduce((sum, item) => sum + item.confidence, 0) / scannedItems.length,
        processingTime,
      };
    } catch (error) {
      console.error('Failed to process scanned items:', error);
      const processingTime = Date.now() - startTime;
      return { 
        success: false, 
        error: 'Failed to process scanned items', 
        confidence: 0, 
        processingTime 
      };
    }
  }

  /**
   * Confirm or modify purchase items
   */
  static async confirmPurchaseItems(
    summaryId: string,
    itemIds: string[],
    modifications?: Record<string, Partial<PurchaseItem>>
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const summary = this.summaries.find(s => s.id === summaryId);
      if (!summary) {
        return { success: false, error: 'Purchase summary not found' };
      }

      // Update items
      for (const itemId of itemIds) {
        const item = summary.items.find(i => i.id === itemId);
        if (item) {
          item.status = 'confirmed';
          
          // Apply modifications if provided
          if (modifications && modifications[itemId]) {
            Object.assign(item, modifications[itemId]);
          }
        }
      }

      // Recalculate summary
      summary.confirmedItems = summary.items.filter(item => item.status === 'confirmed').length;
      summary.notPurchasedItems = summary.items.filter(item => item.status === 'not_purchased').length;
      summary.efficiency = this.calculateEfficiency(summary);
      summary.updatedAt = new Date().toISOString();

      await this.saveToStorage();

      return { success: true };
    } catch (error) {
      console.error('Failed to confirm purchase items:', error);
      return { success: false, error: 'Failed to confirm items' };
    }
  }

  /**
   * Mark items as not purchased
   */
  static async markNotPurchased(
    summaryId: string,
    itemIds: string[]
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const summary = this.summaries.find(s => s.id === summaryId);
      if (!summary) {
        return { success: false, error: 'Purchase summary not found' };
      }

      // Update items
      for (const itemId of itemIds) {
        const item = summary.items.find(i => i.id === itemId);
        if (item) {
          item.status = 'not_purchased';
        }
      }

      // Recalculate summary
      summary.notPurchasedItems = summary.items.filter(item => item.status === 'not_purchased').length;
      summary.efficiency = this.calculateEfficiency(summary);
      summary.updatedAt = new Date().toISOString();

      await this.saveToStorage();

      return { success: true };
    } catch (error) {
      console.error('Failed to mark items as not purchased:', error);
      return { success: false, error: 'Failed to update items' };
    }
  }

  /**
   * Add additional items not in grocery list
   */
  static async addAdditionalItem(
    summaryId: string,
    item: Omit<PurchaseItem, 'id' | 'source' | 'status'>
  ): Promise<{
    success: boolean;
    itemId?: string;
    error?: string;
  }> {
    try {
      const summary = this.summaries.find(s => s.id === summaryId);
      if (!summary) {
        return { success: false, error: 'Purchase summary not found' };
      }

      const additionalItem: PurchaseItem = {
        ...item,
        id: this.generateId(),
        source: 'manual' as const,
        status: 'confirmed' as const,
      };

      summary.items.push(additionalItem);
      summary.additionalItems = summary.items.filter(item => item.source === 'scanned' && !item.groceryListItemId).length;
      summary.updatedAt = new Date().toISOString();

      await this.saveToStorage();

      return { success: true, itemId: additionalItem.id };
    } catch (error) {
      console.error('Failed to add additional item:', error);
      return { success: false, error: 'Failed to add item' };
    }
  }

  /**
   * Complete post-shopping process and add to inventory
   */
  static async completePostShopping(
    summaryId: string
  ): Promise<{
    success: boolean;
    inventoryItems?: InventoryItem[];
    error?: string;
  }> {
    try {
      const summary = this.summaries.find(s => s.id === summaryId);
      if (!summary) {
        return { success: false, error: 'Purchase summary not found' };
      }

      // Add confirmed items to inventory
      const confirmedItems = summary.items.filter(item => item.status === 'confirmed');
      const inventoryItems: InventoryItem[] = [];

      for (const item of confirmedItems) {
        if (item.expirationDate) {
          const inventoryItem = await InventoryService.addItem(
            {
              name: item.name,
              category: item.category as any,
              confidence: item.confidence,
              suggestedExpirationDays: Math.ceil((item.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            },
            [item.expirationDate],
            item.imageUri,
            item.quantity,
            item.unit
          );

          if (inventoryItem.success && inventoryItem.item) {
            inventoryItems.push(inventoryItem.item);
          }
        }
      }

      // Mark grocery list as completed
      await GroceryListService.markShoppingCompleted(summary.groceryListId);

      return { success: true, inventoryItems };
    } catch (error) {
      console.error('Failed to complete post-shopping:', error);
      return { success: false, error: 'Failed to complete process' };
    }
  }

  /**
   * Get purchase summary by ID
   */
  static async getPurchaseSummary(summaryId: string): Promise<PurchaseSummary | null> {
    return this.summaries.find(s => s.id === summaryId) || null;
  }

  /**
   * Get all purchase summaries
   */
  static async getAllPurchaseSummaries(): Promise<PurchaseSummary[]> {
    return [...this.summaries].sort((a, b) => 
      new Date(b.shoppingDate).getTime() - new Date(a.shoppingDate).getTime()
    );
  }

  /**
   * Get configuration
   */
  static getConfig(): PostShoppingConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  static async updateConfig(config: Partial<PostShoppingConfig>): Promise<boolean> {
    try {
      this.config = { ...this.config, ...config };
      
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to update post-shopping config:', error);
      return false;
    }
  }

  /**
   * Reconcile scanned items with grocery list items
   */
  private static reconcileItems(
    groceryItems: PurchaseItem[],
    scannedItems: PurchaseItem[]
  ): {
    reconciledItems: PurchaseItem[];
    missingItems: string[];
    additionalItems: string[];
    conflicts: any[];
  } {
    const reconciledItems: PurchaseItem[] = [];
    const missingItems: string[] = [];
    const additionalItems: string[] = [];
    const conflicts: any[] = [];

    // Process grocery list items
    for (const groceryItem of groceryItems) {
      const matchingScannedItem = scannedItems.find(scanned => 
        scanned.name.toLowerCase() === groceryItem.name.toLowerCase() &&
        scanned.category === groceryItem.category
      );

      if (matchingScannedItem) {
        // Check for quantity/unit conflicts
        if (groceryItem.quantity !== matchingScannedItem.quantity || 
            groceryItem.unit !== matchingScannedItem.unit) {
          conflicts.push({
            itemName: groceryItem.name,
            expectedQuantity: groceryItem.quantity,
            actualQuantity: matchingScannedItem.quantity,
            expectedUnit: groceryItem.unit,
            actualUnit: matchingScannedItem.unit,
          });
        }

        // Merge items
        reconciledItems.push({
          ...groceryItem,
          status: matchingScannedItem.status,
          confidence: matchingScannedItem.confidence,
          expirationDate: matchingScannedItem.expirationDate,
          imageUri: matchingScannedItem.imageUri,
        });

        // Remove from scanned items to avoid duplicates
        const index = scannedItems.indexOf(matchingScannedItem);
        if (index > -1) {
          scannedItems.splice(index, 1);
        }
      } else {
        // Item not found in scan
        reconciledItems.push({
          ...groceryItem,
          status: 'not_purchased' as const,
        });
        missingItems.push(groceryItem.name);
      }
    }

    // Add remaining scanned items as additional items
    for (const scannedItem of scannedItems) {
      reconciledItems.push(scannedItem);
      additionalItems.push(scannedItem.name);
    }

    return {
      reconciledItems,
      missingItems,
      additionalItems,
      conflicts,
    };
  }

  /**
   * Calculate shopping efficiency score
   */
  private static calculateEfficiency(summary: PurchaseSummary): number {
    if (summary.totalItems === 0) return 1.0;
    
    const confirmedRatio = summary.confirmedItems / summary.totalItems;
    const notPurchasedRatio = summary.notPurchasedItems / summary.totalItems;
    
    // Efficiency decreases with not purchased items
    return Math.max(0, confirmedRatio - (notPurchasedRatio * 0.5));
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `post_shopping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save data to storage
   */
  private static async saveToStorage(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.summaries));
      }
    } catch (error) {
      console.error('Failed to save post-shopping data:', error);
    }
  }
}
