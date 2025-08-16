import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { InventoryItemDetailScreen } from '../InventoryItemDetailScreen';
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

const mockItem = {
  id: '1',
  name: 'Apple',
  category: 'fruits',
  quantity: 3,
  unit: 'pieces',
  expirationDate: new Date('2025-01-25'),
  addedAt: '2025-01-10T10:00:00Z',
  imageUri: null,
};

describe('InventoryItemDetailScreen', () => {
  const mockOnBack = jest.fn();
  const mockOnItemUpdated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (InventoryService.removeItem as jest.Mock).mockResolvedValue(true);
  });

  it('should render item details correctly', () => {
    const { getByText, getAllByText } = render(
      <InventoryItemDetailScreen
        item={mockItem}
        onBack={mockOnBack}
        onItemUpdated={mockOnItemUpdated}
      />
    );

    expect(getByText('Item Details')).toBeTruthy();
    expect(getByText('Apple')).toBeTruthy();
    expect(getByText('Quantity:')).toBeTruthy();
    expect(getByText('3 pieces')).toBeTruthy();
    expect(getByText('Category:')).toBeTruthy();
    expect(getByText('Fruits')).toBeTruthy();
    expect(getByText('Expiration Date:')).toBeTruthy();
    expect(getAllByText('Jan 15, 2025')).toHaveLength(2); // Both expiration and added date
  });

  it('should call onBack when back button is pressed', () => {
    const { getByText } = render(
      <InventoryItemDetailScreen
        item={mockItem}
        onBack={mockOnBack}
        onItemUpdated={mockOnItemUpdated}
      />
    );

    fireEvent.press(getByText('← Back'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should render mark as used button', () => {
    const { getByText } = render(
      <InventoryItemDetailScreen
        item={mockItem}
        onBack={mockOnBack}
        onItemUpdated={mockOnItemUpdated}
      />
    );

    expect(getByText('Mark as Used')).toBeTruthy();
  });

  it('should render delete button', () => {
    const { getByText } = render(
      <InventoryItemDetailScreen
        item={mockItem}
        onBack={mockOnBack}
        onItemUpdated={mockOnItemUpdated}
      />
    );

    expect(getByText('Delete Item')).toBeTruthy();
  });

  it('should render urgency badge when item has expiration date', () => {
    const { getByText } = render(
      <InventoryItemDetailScreen
        item={mockItem}
        onBack={mockOnBack}
        onItemUpdated={mockOnItemUpdated}
      />
    );

    expect(getByText('Good')).toBeTruthy(); // Urgency badge text
  });

  it('should render status information', () => {
    const { getByText } = render(
      <InventoryItemDetailScreen
        item={mockItem}
        onBack={mockOnBack}
        onItemUpdated={mockOnItemUpdated}
      />
    );

    expect(getByText('Status:')).toBeTruthy();
    expect(getByText('10 days remaining')).toBeTruthy();
  });

  it('should render added date information', () => {
    const { getByText, getAllByText } = render(
      <InventoryItemDetailScreen
        item={mockItem}
        onBack={mockOnBack}
        onItemUpdated={mockOnItemUpdated}
      />
    );

    expect(getByText('Added:')).toBeTruthy();
    expect(getAllByText('Jan 15, 2025')).toHaveLength(2); // Both expiration and added date
  });

  it('should handle item without expiration date', () => {
    const itemWithoutExpiry = {
      ...mockItem,
      expirationDate: undefined,
    };

    const { getByText, queryByText } = render(
      <InventoryItemDetailScreen
        item={itemWithoutExpiry}
        onBack={mockOnBack}
        onItemUpdated={mockOnItemUpdated}
      />
    );

    expect(getByText('Apple')).toBeTruthy();
    expect(queryByText('Expiration Date:')).toBeNull();
    expect(queryByText('Status:')).toBeNull();
  });

  it('should handle item with image', () => {
    const itemWithImage = {
      ...mockItem,
      imageUri: 'file://test-image.jpg',
    };

    const { getByText } = render(
      <InventoryItemDetailScreen
        item={itemWithImage}
        onBack={mockOnBack}
        onItemUpdated={mockOnItemUpdated}
      />
    );

    expect(getByText('Image:')).toBeTruthy();
    expect(getByText('Available')).toBeTruthy();
  });
});
