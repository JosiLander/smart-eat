import { GroceryListService, GroceryList, GroceryItem } from '../GroceryListService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('GroceryListService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the service state
    (GroceryListService as any).lists = [];
  });

  describe('initialize', () => {
    it('should create default list when no stored data exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await GroceryListService.initialize();

      const lists = await GroceryListService.getAllLists();
      expect(lists).toHaveLength(1);
      expect(lists[0].name).toBe('Shopping List');
      expect(lists[0].isActive).toBe(true);
    });

    it('should load existing lists from storage', async () => {
      const mockLists: GroceryList[] = [
        {
          id: 'test-list',
          name: 'Test List',
          items: [],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          isActive: true,
        },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockLists));

      await GroceryListService.initialize();

      const lists = await GroceryListService.getAllLists();
      expect(lists).toHaveLength(1);
      expect(lists[0].name).toBe('Test List');
    });
  });

  describe('getActiveList', () => {
    it('should return the active list', async () => {
      await GroceryListService.initialize();
      
      const activeList = await GroceryListService.getActiveList();
      expect(activeList).toBeTruthy();
      expect(activeList?.isActive).toBe(true);
    });

    it('should return null when no active list exists', async () => {
      (GroceryListService as any).lists = [];
      
      const activeList = await GroceryListService.getActiveList();
      expect(activeList).toBeNull();
    });
  });

  describe('createList', () => {
    it('should create a new list and make it active', async () => {
      await GroceryListService.initialize();
      
      const result = await GroceryListService.createList('New List');
      
      expect(result.success).toBe(true);
      expect(result.listId).toBeTruthy();
      
      const lists = await GroceryListService.getAllLists();
      expect(lists).toHaveLength(2); // Default + new list
      
      const activeList = await GroceryListService.getActiveList();
      expect(activeList?.name).toBe('New List');
    });

    it('should deactivate other lists when creating a new one', async () => {
      await GroceryListService.initialize();
      
      await GroceryListService.createList('List 1');
      await GroceryListService.createList('List 2');
      
      const lists = await GroceryListService.getAllLists();
      const activeLists = lists.filter(list => list.isActive);
      expect(activeLists).toHaveLength(1);
      expect(activeLists[0].name).toBe('List 2');
    });
  });

  describe('addItem', () => {
    beforeEach(async () => {
      await GroceryListService.initialize();
    });

    it('should add a new item to the active list', async () => {
      const activeList = await GroceryListService.getActiveList();
      expect(activeList).toBeTruthy();

      const result = await GroceryListService.addItem(
        activeList!.id,
        'Milk',
        2,
        'liters',
        'dairy'
      );

      expect(result.success).toBe(true);
      
      const updatedList = await GroceryListService.getListById(activeList!.id);
      expect(updatedList?.items).toHaveLength(1);
      expect(updatedList?.items[0].name).toBe('Milk');
      expect(updatedList?.items[0].quantity).toBe(2);
      expect(updatedList?.items[0].unit).toBe('liters');
      expect(updatedList?.items[0].category).toBe('dairy');
    });

    it('should update quantity when adding duplicate item', async () => {
      const activeList = await GroceryListService.getActiveList();
      
      await GroceryListService.addItem(activeList!.id, 'Milk', 1, 'liter', 'dairy');
      const result = await GroceryListService.addItem(activeList!.id, 'Milk', 2, 'liter', 'dairy');

      expect(result.success).toBe(true);
      
      const updatedList = await GroceryListService.getListById(activeList!.id);
      expect(updatedList?.items).toHaveLength(1);
      expect(updatedList?.items[0].quantity).toBe(3);
    });

    it('should return error when list not found', async () => {
      const result = await GroceryListService.addItem('non-existent', 'Milk', 1, 'liter');

      expect(result.success).toBe(false);
      expect(result.error).toBe('List not found');
    });
  });

  describe('addItemsFromRecipe', () => {
    beforeEach(async () => {
      await GroceryListService.initialize();
    });

    it('should add multiple ingredients from recipe', async () => {
      const activeList = await GroceryListService.getActiveList();
      const missingIngredients = [
        { name: 'Milk', amount: 2, unit: 'cups', category: 'dairy' as const },
        { name: 'Flour', amount: 1, unit: 'cup', category: 'pantry' as const },
      ];

      const result = await GroceryListService.addItemsFromRecipe(
        activeList!.id,
        missingIngredients,
        'recipe-123'
      );

      expect(result.success).toBe(true);
      
      const updatedList = await GroceryListService.getListById(activeList!.id);
      expect(updatedList?.items).toHaveLength(2);
      expect(updatedList?.items[0].source).toBe('recipe');
      expect(updatedList?.items[0].recipeId).toBe('recipe-123');
    });
  });

  describe('toggleItemPurchased', () => {
    beforeEach(async () => {
      await GroceryListService.initialize();
    });

    it('should toggle item purchased status', async () => {
      const activeList = await GroceryListService.getActiveList();
      const addResult = await GroceryListService.addItem(activeList!.id, 'Milk', 1, 'liter');
      expect(addResult.success).toBe(true);

      const updatedList = await GroceryListService.getListById(activeList!.id);
      const itemId = updatedList!.items[0].id; // Get the actual item ID
      
      const success = await GroceryListService.toggleItemPurchased(activeList!.id, itemId);
      expect(success).toBe(true);

      const finalList = await GroceryListService.getListById(activeList!.id);
      const item = finalList?.items.find(i => i.id === itemId);
      expect(item?.isPurchased).toBe(true);
    });

    it('should return false when item not found', async () => {
      const activeList = await GroceryListService.getActiveList();
      const success = await GroceryListService.toggleItemPurchased(activeList!.id, 'non-existent');
      expect(success).toBe(false);
    });
  });

  describe('removeItem', () => {
    beforeEach(async () => {
      await GroceryListService.initialize();
    });

    it('should remove item from list', async () => {
      const activeList = await GroceryListService.getActiveList();
      await GroceryListService.addItem(activeList!.id, 'Milk', 1, 'liter');

      const updatedList = await GroceryListService.getListById(activeList!.id);
      const itemId = updatedList!.items[0].id;

      const success = await GroceryListService.removeItem(activeList!.id, itemId);
      expect(success).toBe(true);

      const finalList = await GroceryListService.getListById(activeList!.id);
      expect(finalList?.items).toHaveLength(0);
    });
  });

  describe('clearPurchasedItems', () => {
    beforeEach(async () => {
      await GroceryListService.initialize();
    });

    it('should remove all purchased items', async () => {
      const activeList = await GroceryListService.getActiveList();
      await GroceryListService.addItem(activeList!.id, 'Milk', 1, 'liter');
      await GroceryListService.addItem(activeList!.id, 'Bread', 1, 'loaf');

      const updatedList = await GroceryListService.getListById(activeList!.id);
      const milkItem = updatedList!.items.find(i => i.name === 'Milk');
      
      // Mark milk as purchased
      await GroceryListService.toggleItemPurchased(activeList!.id, milkItem!.id);

      const success = await GroceryListService.clearPurchasedItems(activeList!.id);
      expect(success).toBe(true);

      const finalList = await GroceryListService.getListById(activeList!.id);
      expect(finalList?.items).toHaveLength(1);
      expect(finalList?.items[0].name).toBe('Bread');
    });
  });

  describe('updateItem', () => {
    beforeEach(async () => {
      await GroceryListService.initialize();
    });

    it('should update item properties', async () => {
      const activeList = await GroceryListService.getActiveList();
      await GroceryListService.addItem(activeList!.id, 'Milk', 1, 'liter');

      const updatedList = await GroceryListService.getListById(activeList!.id);
      const itemId = updatedList!.items[0].id;

      const success = await GroceryListService.updateItem(activeList!.id, itemId, {
        name: 'Organic Milk',
        quantity: 2,
        notes: 'From local farm'
      });

      expect(success).toBe(true);

      const finalList = await GroceryListService.getListById(activeList!.id);
      const updatedItem = finalList!.items[0];
      expect(updatedItem.name).toBe('Organic Milk');
      expect(updatedItem.quantity).toBe(2);
      expect(updatedItem.notes).toBe('From local farm');
    });
  });

  describe('deleteList', () => {
    beforeEach(async () => {
      await GroceryListService.initialize();
    });

    it('should delete a list', async () => {
      await GroceryListService.createList('Test List');
      
      const lists = await GroceryListService.getAllLists();
      const testList = lists.find(l => l.name === 'Test List');
      
      const success = await GroceryListService.deleteList(testList!.id);
      expect(success).toBe(true);

      const updatedLists = await GroceryListService.getAllLists();
      expect(updatedLists).toHaveLength(1); // Only default list remains
    });

    it('should make another list active when deleting active list', async () => {
      await GroceryListService.createList('List 1');
      await GroceryListService.createList('List 2');
      
      const lists = await GroceryListService.getAllLists();
      const list1 = lists.find(l => l.name === 'List 1');
      
      await GroceryListService.deleteList(list1!.id);
      
      const activeList = await GroceryListService.getActiveList();
      expect(activeList?.name).toBe('List 2');
    });
  });

  describe('getSuggestions', () => {
    it('should return common grocery items', async () => {
      const suggestions = await GroceryListService.getSuggestions();
      
      expect(suggestions).toHaveLength(10);
      expect(suggestions[0].name).toBe('Milk');
      expect(suggestions[0].category).toBe('dairy');
      expect(suggestions[0].source).toBe('suggestion');
    });
  });
});
