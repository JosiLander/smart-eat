import { StoreLayoutService, StoreLayout, StoreSection, SortedItem } from '../StoreLayoutService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('StoreLayoutService', () => {
  const mockItems = [
    { name: 'Apple', category: 'fruits', quantity: 1, unit: 'piece' },
    { name: 'Milk', category: 'dairy', quantity: 1, unit: 'liter' },
    { name: 'Chicken', category: 'meat', quantity: 1, unit: 'kg' },
    { name: 'Bread', category: 'pantry', quantity: 1, unit: 'loaf' },
    { name: 'Coke', category: 'beverages', quantity: 1, unit: 'can' },
    { name: 'Chips', category: 'snacks', quantity: 1, unit: 'bag' },
    { name: 'Ice Cream', category: 'frozen', quantity: 1, unit: 'tub' },
  ];

  const mockLayout: StoreLayout = {
    id: 'test_layout',
    name: 'Test Supermarket',
    isDefault: false,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    
    // Reset mock implementations
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  describe('initialize', () => {
    it('should initialize with default layout when no stored data exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      await StoreLayoutService.initialize();
      
      const layouts = await StoreLayoutService.getAllLayouts();
      expect(layouts).toHaveLength(1);
      expect(layouts[0].name).toBe('Standard Supermarket');
      expect(layouts[0].isDefault).toBe(true);
    });

    it('should load existing layouts from storage', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockLayout]));
      
      await StoreLayoutService.initialize();
      
      const layouts = await StoreLayoutService.getAllLayouts();
      expect(layouts).toHaveLength(1);
      expect(layouts[0].name).toBe('Test Supermarket');
    });
  });

  describe('getAllLayouts', () => {
    it('should return all layouts', async () => {
      await StoreLayoutService.initialize();
      
      const layouts = await StoreLayoutService.getAllLayouts();
      
      expect(Array.isArray(layouts)).toBe(true);
      expect(layouts.length).toBeGreaterThan(0);
    });
  });

  describe('getDefaultLayout', () => {
    it('should return the default layout', async () => {
      await StoreLayoutService.initialize();
      
      const defaultLayout = await StoreLayoutService.getDefaultLayout();
      
      expect(defaultLayout).toBeDefined();
      expect(defaultLayout?.isDefault).toBe(true);
    });
  });

  describe('getLayoutById', () => {
    it('should return layout by id', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockLayout]));
      await StoreLayoutService.initialize();
      
      const layout = await StoreLayoutService.getLayoutById('test_layout');
      
      expect(layout).toBeDefined();
      expect(layout?.name).toBe('Test Supermarket');
    });

    it('should return null for non-existent layout', async () => {
      await StoreLayoutService.initialize();
      
      const layout = await StoreLayoutService.getLayoutById('non-existent');
      
      expect(layout).toBeNull();
    });
  });

  describe('createLayout', () => {
    it('should create a new layout', async () => {
      await StoreLayoutService.initialize();
      
      const newSections: StoreSection[] = [
        {
          name: 'Custom Section',
          order: 1,
          items: ['custom'],
          color: '#FF0000',
          icon: '🎯',
        },
      ];
      
      const result = await StoreLayoutService.createLayout(
        'Custom Layout',
        newSections,
        false
      );
      
      expect(result.success).toBe(true);
      expect(result.layoutId).toBeDefined();
      
      const layouts = await StoreLayoutService.getAllLayouts();
      const newLayout = layouts.find(l => l.id === result.layoutId);
      expect(newLayout).toBeDefined();
      expect(newLayout?.name).toBe('Custom Layout');
    });

    it('should set new layout as default when specified', async () => {
      await StoreLayoutService.initialize();
      
      const newSections: StoreSection[] = [
        {
          name: 'Custom Section',
          order: 1,
          items: ['custom'],
          color: '#FF0000',
          icon: '🎯',
        },
      ];
      
      const result = await StoreLayoutService.createLayout(
        'New Default Layout',
        newSections,
        true
      );
      
      expect(result.success).toBe(true);
      
      const layouts = await StoreLayoutService.getAllLayouts();
      const defaultLayouts = layouts.filter(l => l.isDefault);
      expect(defaultLayouts).toHaveLength(1);
      expect(defaultLayouts[0].name).toBe('New Default Layout');
    });

    it('should handle errors during layout creation', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const result = await StoreLayoutService.createLayout(
        'Test Layout',
        [],
        false
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('updateLayout', () => {
    it('should update existing layout', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockLayout]));
      await StoreLayoutService.initialize();
      
      const success = await StoreLayoutService.updateLayout('test_layout', {
        name: 'Updated Layout',
      });
      
      expect(success).toBe(true);
      
      const updatedLayout = await StoreLayoutService.getLayoutById('test_layout');
      expect(updatedLayout?.name).toBe('Updated Layout');
    });

    it('should return false for non-existent layout', async () => {
      await StoreLayoutService.initialize();
      
      const success = await StoreLayoutService.updateLayout('non-existent', {
        name: 'Updated Layout',
      });
      
      expect(success).toBe(false);
    });

    it('should sort sections by order when updating', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockLayout]));
      await StoreLayoutService.initialize();
      
      const newSections: StoreSection[] = [
        { name: 'Section B', order: 2, items: ['b'], color: '#000', icon: 'B' },
        { name: 'Section A', order: 1, items: ['a'], color: '#000', icon: 'A' },
      ];
      
      const success = await StoreLayoutService.updateLayout('test_layout', {
        sections: newSections,
      });
      
      expect(success).toBe(true);
      
      const updatedLayout = await StoreLayoutService.getLayoutById('test_layout');
      expect(updatedLayout?.sections[0].name).toBe('Section A');
      expect(updatedLayout?.sections[1].name).toBe('Section B');
    });
  });

  describe('deleteLayout', () => {
    it('should delete existing layout', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockLayout]));
      await StoreLayoutService.initialize();
      
      const success = await StoreLayoutService.deleteLayout('test_layout');
      
      expect(success).toBe(true);
      
      const layouts = await StoreLayoutService.getAllLayouts();
      expect(layouts.find(l => l.id === 'test_layout')).toBeUndefined();
    });

    it('should not delete default layout', async () => {
      await StoreLayoutService.initialize();
      
      const defaultLayout = await StoreLayoutService.getDefaultLayout();
      if (defaultLayout) {
        const success = await StoreLayoutService.deleteLayout(defaultLayout.id);
        
        expect(success).toBe(false);
        
        const layouts = await StoreLayoutService.getAllLayouts();
        expect(layouts.find(l => l.id === defaultLayout.id)).toBeDefined();
      }
    });

    it('should return false for non-existent layout', async () => {
      await StoreLayoutService.initialize();
      
      const success = await StoreLayoutService.deleteLayout('non-existent');
      
      expect(success).toBe(false);
    });
  });

  describe('sortItemsByLayout', () => {
    it('should sort items according to store layout', () => {
      const sortedItems = StoreLayoutService.sortItemsByLayout(mockItems, mockLayout);
      
      expect(sortedItems).toHaveLength(mockItems.length);
      
      // Check that items are sorted by section order
      const sectionOrders = sortedItems.map(item => item.sectionOrder);
      expect(sectionOrders).toEqual([...sectionOrders].sort((a, b) => a - b));
    });

    it('should assign correct section information', () => {
      const sortedItems = StoreLayoutService.sortItemsByLayout(mockItems, mockLayout);
      
      // Check that Apple (fruits) is in Produce section
      const appleItem = sortedItems.find(item => (item.item as any).name === 'Apple');
      expect(appleItem?.section).toBe('Produce');
      expect(appleItem?.sectionOrder).toBe(1);
      
      // Check that Milk (dairy) is in Dairy section
      const milkItem = sortedItems.find(item => (item.item as any).name === 'Milk');
      expect(milkItem?.section).toBe('Dairy');
      expect(milkItem?.sectionOrder).toBe(2);
      
      // Check that Chicken (meat) is in Meat & Fish section
      const chickenItem = sortedItems.find(item => (item.item as any).name === 'Chicken');
      expect(chickenItem?.section).toBe('Meat & Fish');
      expect(chickenItem?.sectionOrder).toBe(3);
    });

    it('should assign items to Other section when category not found', () => {
      const itemsWithUnknownCategory = [
        { name: 'Unknown Item', category: 'unknown', quantity: 1, unit: 'piece' },
      ];
      
      const sortedItems = StoreLayoutService.sortItemsByLayout(itemsWithUnknownCategory, mockLayout);
      
      expect(sortedItems[0].section).toBe('Other');
      expect(sortedItems[0].sectionOrder).toBe(8);
    });

    it('should maintain item order within sections', () => {
      const itemsInSameSection = [
        { name: 'Apple', category: 'fruits', quantity: 1, unit: 'piece' },
        { name: 'Banana', category: 'fruits', quantity: 1, unit: 'piece' },
        { name: 'Orange', category: 'fruits', quantity: 1, unit: 'piece' },
      ];
      
      const sortedItems = StoreLayoutService.sortItemsByLayout(itemsInSameSection, mockLayout);
      
      // All items should be in the same section
      expect(sortedItems[0].section).toBe('Produce');
      expect(sortedItems[1].section).toBe('Produce');
      expect(sortedItems[2].section).toBe('Produce');
      
      // Item order should be maintained
      expect(sortedItems[0].itemOrder).toBe(0);
      expect(sortedItems[1].itemOrder).toBe(1);
      expect(sortedItems[2].itemOrder).toBe(2);
    });
  });

  describe('getSectionForCategory', () => {
    it('should return correct section for category', () => {
      const section = StoreLayoutService.getSectionForCategory('fruits', mockLayout);
      
      expect(section).toBeDefined();
      expect(section?.name).toBe('Produce');
    });

    it('should return null for unknown category', () => {
      const section = StoreLayoutService.getSectionForCategory('unknown', mockLayout);
      
      expect(section).toBeNull();
    });
  });

  describe('getSectionProgress', () => {
    it('should calculate section progress correctly', () => {
      const itemsWithPurchaseStatus = [
        { name: 'Apple', category: 'fruits', quantity: 1, unit: 'piece', isPurchased: true },
        { name: 'Banana', category: 'fruits', quantity: 1, unit: 'piece', isPurchased: false },
        { name: 'Milk', category: 'dairy', quantity: 1, unit: 'liter', isPurchased: true },
      ];
      
      const progress = StoreLayoutService.getSectionProgress(itemsWithPurchaseStatus, mockLayout);
      
      // Should have progress for Produce and Dairy sections
      expect(progress.length).toBe(2);
      
      const produceProgress = progress.find(p => p.section.name === 'Produce');
      expect(produceProgress?.total).toBe(2);
      expect(produceProgress?.completed).toBe(1);
      expect(produceProgress?.progress).toBe(50);
      
      const dairyProgress = progress.find(p => p.section.name === 'Dairy');
      expect(dairyProgress?.total).toBe(1);
      expect(dairyProgress?.completed).toBe(1);
      expect(dairyProgress?.progress).toBe(100);
    });

    it('should return empty array for items without sections', () => {
      const itemsWithUnknownCategory = [
        { name: 'Unknown Item', category: 'unknown', quantity: 1, unit: 'piece', isPurchased: true },
      ];
      
      const progress = StoreLayoutService.getSectionProgress(itemsWithUnknownCategory, mockLayout);
      
      expect(progress).toHaveLength(0);
    });
  });

  describe('layout data integrity', () => {
    it('should maintain layout structure integrity', async () => {
      await StoreLayoutService.initialize();
      
      const layouts = await StoreLayoutService.getAllLayouts();
      
      for (const layout of layouts) {
        expect(layout).toHaveProperty('id');
        expect(layout).toHaveProperty('name');
        expect(layout).toHaveProperty('sections');
        expect(layout).toHaveProperty('isDefault');
        expect(layout).toHaveProperty('createdAt');
        expect(layout).toHaveProperty('updatedAt');
        
        expect(Array.isArray(layout.sections)).toBe(true);
        expect(typeof layout.isDefault).toBe('boolean');
      }
    });

    it('should validate section structure', async () => {
      await StoreLayoutService.initialize();
      
      const layouts = await StoreLayoutService.getAllLayouts();
      
      for (const layout of layouts) {
        for (const section of layout.sections) {
          expect(section).toHaveProperty('name');
          expect(section).toHaveProperty('order');
          expect(section).toHaveProperty('items');
          expect(section).toHaveProperty('color');
          expect(section).toHaveProperty('icon');
          
          expect(typeof section.order).toBe('number');
          expect(Array.isArray(section.items)).toBe(true);
          expect(typeof section.color).toBe('string');
          expect(typeof section.icon).toBe('string');
        }
      }
    });
  });
});
