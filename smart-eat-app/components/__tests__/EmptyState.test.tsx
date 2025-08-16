import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('should render with default props', () => {
    const { getByText } = render(
      <EmptyState title="No Items Found" />
    );

    expect(getByText('No Items Found')).toBeTruthy();
    expect(getByText('📦')).toBeTruthy();
  });

  it('should render with custom icon', () => {
    const { getByText } = render(
      <EmptyState title="No Items Found" icon="🍎" />
    );

    expect(getByText('🍎')).toBeTruthy();
  });

  it('should render subtitle when provided', () => {
    const { getByText } = render(
      <EmptyState 
        title="No Items Found" 
        subtitle="Try adding some items to get started"
      />
    );

    expect(getByText('Try adding some items to get started')).toBeTruthy();
  });

  it('should render action button when provided', () => {
    const mockOnAction = jest.fn();
    const { getByText } = render(
      <EmptyState 
        title="No Items Found" 
        actionText="Add Item"
        onAction={mockOnAction}
      />
    );

    const actionButton = getByText('Add Item');
    expect(actionButton).toBeTruthy();

    fireEvent.press(actionButton);
    expect(mockOnAction).toHaveBeenCalledTimes(1);
  });

  it('should not render action button when actionText is provided but onAction is not', () => {
    const { queryByText } = render(
      <EmptyState 
        title="No Items Found" 
        actionText="Add Item"
      />
    );

    expect(queryByText('Add Item')).toBeNull();
  });

  it('should not render action button when onAction is provided but actionText is not', () => {
    const mockOnAction = jest.fn();
    const { queryByText } = render(
      <EmptyState 
        title="No Items Found" 
        onAction={mockOnAction}
      />
    );

    expect(queryByText('Add Item')).toBeNull();
  });
});
