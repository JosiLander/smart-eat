import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DatePicker } from '../DatePicker';

describe('DatePicker', () => {
  const mockOnDateSelect = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly when visible', () => {
    const { getByText } = render(
      <DatePicker
        visible={true}
        onDateSelect={mockOnDateSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText('Select Expiry Date')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <DatePicker
        visible={false}
        onDateSelect={mockOnDateSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(queryByText('Select Expiry Date')).toBeNull();
  });

  it('should call onCancel when cancel button is pressed', () => {
    const { getByText } = render(
      <DatePicker
        visible={true}
        onDateSelect={mockOnDateSelect}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.press(getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when close button is pressed', () => {
    const { getByText } = render(
      <DatePicker
        visible={true}
        onDateSelect={mockOnDateSelect}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.press(getByText('✕'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should display current month and year', () => {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' });
    const currentYear = currentDate.getFullYear().toString();

    const { getByText } = render(
      <DatePicker
        visible={true}
        onDateSelect={mockOnDateSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText(`${currentMonth} ${currentYear}`)).toBeTruthy();
  });

  it('should display week days', () => {
    const { getByText } = render(
      <DatePicker
        visible={true}
        onDateSelect={mockOnDateSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText('Sun')).toBeTruthy();
    expect(getByText('Mon')).toBeTruthy();
    expect(getByText('Tue')).toBeTruthy();
    expect(getByText('Wed')).toBeTruthy();
    expect(getByText('Thu')).toBeTruthy();
    expect(getByText('Fri')).toBeTruthy();
    expect(getByText('Sat')).toBeTruthy();
  });

  it('should display selected date when provided', () => {
    const selectedDate = new Date(2025, 0, 15); // January 15, 2025
    
    const { getByText } = render(
      <DatePicker
        visible={true}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText('Selected: 1/15/2025')).toBeTruthy();
  });

  it('should not display selected date text when no date is selected', () => {
    const { queryByText } = render(
      <DatePicker
        visible={true}
        onDateSelect={mockOnDateSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(queryByText(/Selected:/)).toBeNull();
  });
});
