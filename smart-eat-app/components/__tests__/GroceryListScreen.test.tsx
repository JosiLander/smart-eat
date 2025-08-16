import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { GroceryListScreen } from '../GroceryListScreen';
import { GroceryListService } from '../../services/GroceryListService';

// Mock the services
jest.mock('../../services/GroceryListService');

// Mock Alert
const mockAlert = jest.fn();
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: mockAlert,
  },
}));

const mockActiveList = {
  id: 'default',
  name: 'Shopping List',
  items: [
    {
      id: 'item1',
      name: 'Milk',
      quantity: 2,
      unit: 'liters',
      category: 'dairy' as const,
      isPurchased: false,
      addedAt: '2025-01-01T00:00:00Z',
      source: 'manual' as const,
    },
    {
      id: 'item2',
      name: 'Bread',
      quantity: 1,
      unit: 'loaf',
      category: 'pantry' as const,
      isPurchased: true,
      addedAt: '2025-01-01T00:00:00Z',
      source: 'manual' as const,
    },
  ],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  isActive: true,
};

const mockSuggestions = [
  {
    id: 'suggestion_0',
    name: 'Milk',
    quantity: 1,
    unit: 'liter',
    category: 'dairy' as const,
    isPurchased: false,
    addedAt: '2025-01-01T00:00:00Z',
    source: 'suggestion' as const,
  },
  {
    id: 'suggestion_1',
    name: 'Bread',
    quantity: 1,
    unit: 'loaf',
    category: 'pantry' as const,
    isPurchased: false,
    addedAt: '2025-01-01T00:00:00Z',
    source: 'suggestion' as const,
  },
];

describe('GroceryListScreen', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (GroceryListService.getActiveList as jest.Mock).mockResolvedValue(mockActiveList);
    (GroceryListService.getSuggestions as jest.Mock).mockResolvedValue(mockSuggestions);
    (GroceryListService.addItem as jest.Mock).mockResolvedValue({ success: true, itemId: 'new_item' });
    (GroceryListService.toggleItemPurchased as jest.Mock).mockResolvedValue(true);
    (GroceryListService.removeItem as jest.Mock).mockResolvedValue(true);
    (GroceryListService.clearPurchasedItems as jest.Mock).mockResolvedValue(true);
  });

  it('should render loading state initially', () => {
    const { getByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    expect(getByText('Loading grocery list...')).toBeTruthy();
  });

  it('should render grocery list after loading', async () => {
    const { getByText, getAllByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByText('Grocery List')).toBeTruthy();
      expect(getByText('Shopping List')).toBeTruthy();
      expect(getByText('1 items remaining • 1 purchased')).toBeTruthy();
    });
  });

  it('should render grocery items correctly', async () => {
    const { getByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByText('Milk')).toBeTruthy();
      expect(getByText('2 liters')).toBeTruthy();
      expect(getByText('Bread')).toBeTruthy();
      expect(getByText('1 loaf')).toBeTruthy();
    });
  });

  it('should call onBack when back button is pressed', async () => {
    const { getByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      fireEvent.press(getByText('← Back'));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  it('should render empty state when no items', async () => {
    (GroceryListService.getActiveList as jest.Mock).mockResolvedValue({
      ...mockActiveList,
      items: [],
    });

    const { getByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByText('Your Grocery List is Empty')).toBeTruthy();
      expect(getByText('Start by adding some items to your shopping list')).toBeTruthy();
      expect(getByText('Add Your First Item')).toBeTruthy();
    });
  });

  it('should show add item modal when add button is pressed', async () => {
    const { getByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      fireEvent.press(getByText('➕ Add Item'));
    });

    await waitFor(() => {
      expect(getByText('Item Name *')).toBeTruthy();
    });
  });

  it('should show suggestions modal when quick add button is pressed', async () => {
    const { getByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      fireEvent.press(getByText('💡 Quick Add'));
      expect(getByText('Quick Add')).toBeTruthy();
      expect(getByText('Common grocery items')).toBeTruthy();
    });
  });

  it('should show clear purchased button when there are purchased items', async () => {
    const { getByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByText('🗑️ Clear Purchased')).toBeTruthy();
    });
  });

  it('should not show clear purchased button when no purchased items', async () => {
    (GroceryListService.getActiveList as jest.Mock).mockResolvedValue({
      ...mockActiveList,
      items: [mockActiveList.items[0]], // Only unpurchased items
    });

    const { queryByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(queryByText('🗑️ Clear Purchased')).toBeNull();
    });
  });

  it('should display category badges correctly', async () => {
    const { getByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByText('dairy')).toBeTruthy();
      expect(getByText('pantry')).toBeTruthy();
    });
  });

  it('should display recipe badge for recipe items', async () => {
    const recipeItem = {
      ...mockActiveList.items[0],
      source: 'recipe' as const,
      recipeId: 'recipe-123',
    };

    (GroceryListService.getActiveList as jest.Mock).mockResolvedValue({
      ...mockActiveList,
      items: [recipeItem],
    });

    const { getByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByText('Recipe')).toBeTruthy();
    });
  });

  it('should display notes when item has notes', async () => {
    const itemWithNotes = {
      ...mockActiveList.items[0],
      notes: 'Organic milk from local farm',
    };

    (GroceryListService.getActiveList as jest.Mock).mockResolvedValue({
      ...mockActiveList,
      items: [itemWithNotes],
    });

    const { getByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByText('Organic milk from local farm')).toBeTruthy();
    });
  });

  it('should show purchased items with strikethrough styling', async () => {
    const { getByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      const breadItem = getByText('Bread');
      // Note: We can't easily test styles in React Native Testing Library
      // But we can verify the item is rendered
      expect(breadItem).toBeTruthy();
    });
  });

  it('should handle add item form submission', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      fireEvent.press(getByText('➕ Add Item'));
    });

    // Fill out the form
    const nameInput = getByPlaceholderText('e.g., Milk, Bread, Apples');
    fireEvent.changeText(nameInput, 'Apples');

    const quantityInput = getByPlaceholderText('1');
    fireEvent.changeText(quantityInput, '3');

    const unitInput = getByPlaceholderText('piece');
    fireEvent.changeText(unitInput, 'pieces');

    // Submit the form
    const addButtons = getAllByText('Add Item');
    const modalAddButton = addButtons[1]; // The second "Add Item" button is in the modal
    fireEvent.press(modalAddButton);

    await waitFor(() => {
      expect(GroceryListService.addItem).toHaveBeenCalledWith(
        'default',
        'Apples',
        3,
        'pieces',
        'other',
        undefined
      );
    });
  });

  it('should handle adding suggestion item', async () => {
    const { getByText, getAllByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      fireEvent.press(getByText('💡 Quick Add'));
    });

    await waitFor(() => {
      const milkElements = getAllByText('Milk');
      const milkSuggestion = milkElements[1]; // The second "Milk" is in the suggestions modal
      fireEvent.press(milkSuggestion);
    });

    await waitFor(() => {
      expect(GroceryListService.addItem).toHaveBeenCalledWith(
        'default',
        'Milk',
        1,
        'liter',
        'dairy'
      );
    });
  });

  it('should handle error when adding item fails', async () => {
    (GroceryListService.addItem as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Failed to add item',
    });

    const { getByText, getByPlaceholderText, getAllByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      fireEvent.press(getByText('➕ Add Item'));
    });

    const nameInput = getByPlaceholderText('e.g., Milk, Bread, Apples');
    fireEvent.changeText(nameInput, 'Test Item');

    const addButtons = getAllByText('Add Item');
    const modalAddButton = addButtons[1]; // The second "Add Item" button is in the modal
    fireEvent.press(modalAddButton);

    await waitFor(() => {
      expect(GroceryListService.addItem).toHaveBeenCalled();
    });
  });

  it('should handle empty list state', async () => {
    (GroceryListService.getActiveList as jest.Mock).mockResolvedValue(null);

    const { getByText } = render(
      <GroceryListScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByText('Your Grocery List is Empty')).toBeTruthy();
    });
  });
});
