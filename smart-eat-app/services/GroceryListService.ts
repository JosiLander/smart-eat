export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'fruits' | 'vegetables' | 'dairy' | 'meat' | 'pantry' | 'beverages' | 'snacks' | 'frozen' | 'other';
  isPurchased: boolean;
  addedAt: string;
  notes?: string;
  source?: 'recipe' | 'manual' | 'suggestion';
  recipeId?: string;
  sectionOrder?: number;
  itemOrder?: number;
}

export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  templateId?: string;
  storeLayoutId?: string;
  shoppingProgress?: {
    totalItems: number;
    completedItems: number;
    currentSection?: string;
  };
}

export interface CreateListResult {
  success: boolean;
  listId?: string;
  error?: string;
}

export interface AddItemResult {
  success: boolean;
  itemId?: string;
  error?: string;
}

export class GroceryListService {
  private static readonly STORAGE_KEY = 'grocery_lists';
  private static lists: GroceryList[] = [];

  static async initialize(): Promise<void> {
    try {
      console.log('GroceryListService.initialize called');
      // Check if localStorage is available (for test environment)
      if (typeof localStorage !== 'undefined') {
        console.log('localStorage is available');
        const stored = localStorage.getItem(this.STORAGE_KEY);
        console.log('Stored data:', stored);
        if (stored) {
          this.lists = JSON.parse(stored);
          console.log('Loaded existing lists:', this.lists);
        } else {
          console.log('No stored data, creating default list');
          // Create a default active list
          this.lists = [{
            id: 'default',
            name: 'Shopping List',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
          }];
          console.log('Created default list:', this.lists);
          await this.saveToStorage();
        }
      } else {
        console.log('localStorage not available, using fallback');
        // Fallback for environments without localStorage (like tests)
        this.lists = [{
          id: 'default',
          name: 'Shopping List',
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
        }];
      }
      console.log('Initialization complete, lists:', this.lists);
    } catch (error) {
      console.error('Failed to initialize grocery list service:', error);
      // Fallback to default list
      this.lists = [{
        id: 'default',
        name: 'Shopping List',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      }];
    }
  }

  static async getAllLists(): Promise<GroceryList[]> {
    return [...this.lists];
  }

  static async getActiveList(): Promise<GroceryList | null> {
    console.log('getActiveList called, current lists:', this.lists);
    const activeList = this.lists.find(list => list.isActive);
    console.log('Found active list:', activeList);
    return activeList ? { ...activeList } : null;
  }

  static async getListById(listId: string): Promise<GroceryList | null> {
    const list = this.lists.find(l => l.id === listId);
    return list ? { ...list } : null;
  }

  static async createList(name: string): Promise<CreateListResult> {
    try {
      // Deactivate all other lists
      this.lists.forEach(list => list.isActive = false);

      const newList: GroceryList = {
        id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      this.lists.push(newList);
      await this.saveToStorage();

      return {
        success: true,
        listId: newList.id,
      };
    } catch (error) {
      console.error('Failed to create grocery list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async addItem(
    listId: string,
    name: string,
    quantity: number = 1,
    unit: string = 'piece',
    category: GroceryItem['category'] = 'other',
    notes?: string,
    source: 'recipe' | 'manual' | 'suggestion' = 'manual',
    recipeId?: string
  ): Promise<AddItemResult> {
    try {
      console.log('GroceryListService.addItem called with:', {
        listId,
        name,
        quantity,
        unit,
        category,
        notes,
        source,
        recipeId
      });
      console.log('Current lists:', this.lists);
      
      const list = this.lists.find(l => l.id === listId);
      console.log('Found list:', list);
      
      if (!list) {
        console.log('List not found for ID:', listId);
        return {
          success: false,
          error: 'List not found',
        };
      }

      // Check if item already exists
      const existingItem = list.items.find(item => 
        item.name.toLowerCase() === name.toLowerCase() && 
        item.unit === unit &&
        !item.isPurchased
      );

      if (existingItem) {
        // Update quantity of existing item
        existingItem.quantity += quantity;
      } else {
        // Add new item
        const newItem: GroceryItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          quantity,
          unit,
          category,
          isPurchased: false,
          addedAt: new Date().toISOString(),
          notes,
          source,
          recipeId,
        };

        list.items.push(newItem);
      }

      list.updatedAt = new Date().toISOString();
      console.log('Updated list:', list);
      await this.saveToStorage();
      console.log('Saved to storage');

      return {
        success: true,
        itemId: existingItem?.id || 'new_item',
      };
    } catch (error) {
      console.error('Failed to add item to grocery list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async addItemsFromRecipe(
    listId: string,
    missingIngredients: Array<{
      name: string;
      amount: number;
      unit: string;
      category?: GroceryItem['category'];
    }>,
    recipeId: string
  ): Promise<AddItemResult> {
    try {
      let addedCount = 0;
      
      for (const ingredient of missingIngredients) {
        const result = await this.addItem(
          listId,
          ingredient.name,
          ingredient.amount,
          ingredient.unit,
          ingredient.category || 'other',
          undefined,
          'recipe',
          recipeId
        );
        
        if (result.success) {
          addedCount++;
        }
      }

      return {
        success: addedCount > 0,
        itemId: `added_${addedCount}_items`,
      };
    } catch (error) {
      console.error('Failed to add items from recipe:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async toggleItemPurchased(listId: string, itemId: string): Promise<boolean> {
    try {
      const list = this.lists.find(l => l.id === listId);
      if (!list) return false;

      const item = list.items.find(i => i.id === itemId);
      if (!item) return false;

      item.isPurchased = !item.isPurchased;
      list.updatedAt = new Date().toISOString();
      await this.saveToStorage();

      return true;
    } catch (error) {
      console.error('Failed to toggle item purchased status:', error);
      return false;
    }
  }

  static async removeItem(listId: string, itemId: string): Promise<boolean> {
    try {
      const list = this.lists.find(l => l.id === listId);
      if (!list) return false;

      const itemIndex = list.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return false;

      list.items.splice(itemIndex, 1);
      list.updatedAt = new Date().toISOString();
      await this.saveToStorage();

      return true;
    } catch (error) {
      console.error('Failed to remove item from grocery list:', error);
      return false;
    }
  }

  static async clearPurchasedItems(listId: string): Promise<boolean> {
    try {
      const list = this.lists.find(l => l.id === listId);
      if (!list) return false;

      list.items = list.items.filter(item => !item.isPurchased);
      list.updatedAt = new Date().toISOString();
      await this.saveToStorage();

      return true;
    } catch (error) {
      console.error('Failed to clear purchased items:', error);
      return false;
    }
  }

  static async updateItem(
    listId: string,
    itemId: string,
    updates: Partial<Pick<GroceryItem, 'name' | 'quantity' | 'unit' | 'category' | 'notes'>>
  ): Promise<boolean> {
    try {
      const list = this.lists.find(l => l.id === listId);
      if (!list) return false;

      const item = list.items.find(i => i.id === itemId);
      if (!item) return false;

      Object.assign(item, updates);
      list.updatedAt = new Date().toISOString();
      await this.saveToStorage();

      return true;
    } catch (error) {
      console.error('Failed to update item:', error);
      return false;
    }
  }

  static async deleteList(listId: string): Promise<boolean> {
    try {
      const listIndex = this.lists.findIndex(l => l.id === listId);
      if (listIndex === -1) return false;

      this.lists.splice(listIndex, 1);

      // If we deleted the active list, make another list active
      if (this.lists.length > 0 && !this.lists.some(l => l.isActive)) {
        this.lists[0].isActive = true;
      }

      await this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to delete grocery list:', error);
      return false;
    }
  }

  static async getSuggestions(): Promise<GroceryItem[]> {
    // Generate suggestions based on common grocery items
    const commonItems = [
      { name: 'Milk', category: 'dairy' as const, unit: 'liter' },
      { name: 'Bread', category: 'pantry' as const, unit: 'loaf' },
      { name: 'Eggs', category: 'dairy' as const, unit: 'dozen' },
      { name: 'Bananas', category: 'fruits' as const, unit: 'pieces' },
      { name: 'Apples', category: 'fruits' as const, unit: 'pieces' },
      { name: 'Chicken Breast', category: 'meat' as const, unit: 'kg' },
      { name: 'Rice', category: 'pantry' as const, unit: 'kg' },
      { name: 'Tomatoes', category: 'vegetables' as const, unit: 'pieces' },
      { name: 'Onions', category: 'vegetables' as const, unit: 'pieces' },
      { name: 'Cheese', category: 'dairy' as const, unit: 'piece' },
    ];

    return commonItems.map((item, index) => ({
      id: `suggestion_${index}`,
      name: item.name,
      quantity: 1,
      unit: item.unit,
      category: item.category,
      isPurchased: false,
      addedAt: new Date().toISOString(),
      source: 'suggestion' as const,
    }));
  }

  static async markShoppingCompleted(listId: string): Promise<boolean> {
    try {
      const list = this.lists.find(l => l.id === listId);
      if (!list) return false;

      // Mark all items as purchased
      list.items.forEach(item => {
        item.isPurchased = true;
      });

      // Update shopping progress
      if (list.shoppingProgress) {
        list.shoppingProgress.completedItems = list.shoppingProgress.totalItems;
      }

      list.updatedAt = new Date().toISOString();
      await this.saveToStorage();

      return true;
    } catch (error) {
      console.error('Failed to mark shopping as completed:', error);
      return false;
    }
  }

  static async createListFromTemplate(templateId: string, name?: string): Promise<CreateListResult> {
    try {
      // This would integrate with TemplateService
      // For now, return a basic implementation
      const listName = name || `Shopping List ${new Date().toLocaleDateString()}`;
      const result = await this.createList(listName);
      
      if (result.success && result.listId) {
        const list = this.lists.find(l => l.id === result.listId);
        if (list) {
          list.templateId = templateId;
          await this.saveToStorage();
        }
      }
      
      return result;
    } catch (error) {
      console.error('Failed to create list from template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async sortListByStoreLayout(listId: string, layoutId: string): Promise<boolean> {
    try {
      const list = this.lists.find(l => l.id === listId);
      if (!list) return false;

      // This would integrate with StoreLayoutService
      // For now, implement basic sorting by category
      const categoryOrder = ['fruits', 'vegetables', 'dairy', 'meat', 'pantry', 'beverages', 'snacks', 'frozen', 'other'];
      
      list.items.sort((a, b) => {
        const aIndex = categoryOrder.indexOf(a.category);
        const bIndex = categoryOrder.indexOf(b.category);
        return aIndex - bIndex;
      });

      list.storeLayoutId = layoutId;
      list.updatedAt = new Date().toISOString();
      await this.saveToStorage();

      return true;
    } catch (error) {
      console.error('Failed to sort list by store layout:', error);
      return false;
    }
  }

  static async getShoppingProgress(listId: string): Promise<{ total: number; completed: number; progress: number } | null> {
    try {
      const list = this.lists.find(l => l.id === listId);
      if (!list) return null;

      const total = list.items.length;
      const completed = list.items.filter(item => item.isPurchased).length;
      const progress = total > 0 ? (completed / total) * 100 : 0;

      return { total, completed, progress };
    } catch (error) {
      console.error('Failed to get shopping progress:', error);
      return null;
    }
  }

  static async reorderCompletedItems(listId: string): Promise<boolean> {
    try {
      const list = this.lists.find(l => l.id === listId);
      if (!list) return false;

      // Move completed items to the bottom while maintaining category order
      const categoryOrder = ['fruits', 'vegetables', 'dairy', 'meat', 'pantry', 'beverages', 'snacks', 'frozen', 'other'];
      
      const uncompletedItems = list.items.filter(item => !item.isPurchased);
      const completedItems = list.items.filter(item => item.isPurchased);

      // Sort both arrays by category
      const sortByCategory = (a: GroceryItem, b: GroceryItem) => {
        const aIndex = categoryOrder.indexOf(a.category);
        const bIndex = categoryOrder.indexOf(b.category);
        return aIndex - bIndex;
      };

      uncompletedItems.sort(sortByCategory);
      completedItems.sort(sortByCategory);

      // Combine with completed items at the bottom
      list.items = [...uncompletedItems, ...completedItems];
      list.updatedAt = new Date().toISOString();
      await this.saveToStorage();

      return true;
    } catch (error) {
      console.error('Failed to reorder completed items:', error);
      return false;
    }
  }

  private static async saveToStorage(): Promise<void> {
    try {
      console.log('saveToStorage called, saving lists:', this.lists);
      if (typeof localStorage !== 'undefined') {
        const dataToSave = JSON.stringify(this.lists);
        console.log('Saving data to localStorage:', dataToSave);
        localStorage.setItem(this.STORAGE_KEY, dataToSave);
        console.log('Data saved successfully');
      } else {
        console.log('localStorage not available, skipping save');
      }
    } catch (error) {
      console.error('Failed to save grocery lists to storage:', error);
    }
  }
}
