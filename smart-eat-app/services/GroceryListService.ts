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
}

export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
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
      // Check if localStorage is available (for test environment)
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.lists = JSON.parse(stored);
        } else {
          // Create a default active list
          this.lists = [{
            id: 'default',
            name: 'Shopping List',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
          }];
          await this.saveToStorage();
        }
      } else {
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
    const activeList = this.lists.find(list => list.isActive);
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
      const list = this.lists.find(l => l.id === listId);
      if (!list) {
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
      await this.saveToStorage();

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

  private static async saveToStorage(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.lists));
      }
    } catch (error) {
      console.error('Failed to save grocery lists to storage:', error);
    }
  }
}
