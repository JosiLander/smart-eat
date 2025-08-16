import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { InventoryOverviewScreen } from '../InventoryOverviewScreen';
import { InventoryService } from '../../services/InventoryService';

// Mock the services
jest.mock('../../services/InventoryService');
jest.mock('../../utils/dateUtils', () => ({
  getExpiryColorInfo: jest.fn((date) => ({
    color: '#ffffff',
    backgroundColor: '#27ae60',
    text: 'Good',
    urgency: 'safe'
  })),
  formatDate: jest.fn(() => 'Jan 15, 2025'),
  getDaysUntilExpiry: jest.fn(() => 10)
}));

const mockInventoryItems = [
  {
    id: '1',
    name: 'Apple',
    category: 'fruits',
    quantity: 3,
    unit: 'pieces',
    expirationDate: new Date('2025-01-25'),
    addedAt: '2025-01-10T10:00:00Z',
    imageUri: null,
  },
  {
    id: '2',
    name: 'Milk',
    category: 'dairy',
    quantity: 1,
    unit: 'liter',
    expirationDate: new Date('2025-01-18'),
    addedAt: '2025-01-10T10:00:00Z',
    imageUri: null,
  },
];

describe('InventoryOverviewScreen', () => {
  const mockOnBack = jest.fn();
  const mockOnViewItem = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (InventoryService.getAllItems as jest.Mock).mockResolvedValue(mockInventoryItems);
  });

  it('should render loading state initially', () => {
    const { getByText } = render(
      <InventoryOverviewScreen
        onBack={mockOnBack}
        onViewItem={mockOnViewItem}
      />
    );

    expect(getByText('Loading inventory...')).toBeTruthy();
  });

  it('should render inventory overview after loading', async () => {
    const { getAllByText } = render(
      <InventoryOverviewScreen
        onBack={mockOnBack}
        onViewItem={mockOnViewItem}
      />
    );

    await waitFor(() => {
      expect(getAllByText('Inventory Overview')).toHaveLength(2); // Header and section title
    });
  });

  it('should render category cards', async () => {
    const { getByText } = render(
      <InventoryOverviewScreen
        onBack={mockOnBack}
        onViewItem={mockOnViewItem}
      />
    );

    await waitFor(() => {
      expect(getByText('Good')).toBeTruthy();
      expect(getByText('This Week')).toBeTruthy();
      expect(getByText('Expires Soon')).toBeTruthy();
      expect(getByText('Expired')).toBeTruthy();
    });
  });

  it('should call onBack when back button is pressed', async () => {
    const { getByText } = render(
      <InventoryOverviewScreen
        onBack={mockOnBack}
        onViewItem={mockOnViewItem}
      />
    );

    await waitFor(() => {
      fireEvent.press(getByText('← Back'));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  it('should render empty state when no items', async () => {
    (InventoryService.getAllItems as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(
      <InventoryOverviewScreen
        onBack={mockOnBack}
        onViewItem={mockOnViewItem}
      />
    );

    await waitFor(() => {
      expect(getByText('No Items in Inventory')).toBeTruthy();
      expect(getByText('Start by scanning some groceries to build your inventory')).toBeTruthy();
    });
  });

  it('should show item count in category cards', async () => {
    const { getByText } = render(
      <InventoryOverviewScreen
        onBack={mockOnBack}
        onViewItem={mockOnViewItem}
      />
    );

    await waitFor(() => {
      // Should show count of items in each category
      expect(getByText('2')).toBeTruthy(); // 2 items in safe category
    });
  });
});
