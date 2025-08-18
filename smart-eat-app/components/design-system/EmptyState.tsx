import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title,
  message,
  actionLabel,
  onAction,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <Text style={[styles.icon, { color: theme.colors.textTertiary }]}>
          {icon}
        </Text>
        
        <Text
          variant="h3"
          color="textPrimary"
          align="center"
          style={styles.title}
        >
          {title}
        </Text>
        
        <Text
          variant="body"
          color="textSecondary"
          align="center"
          style={styles.message}
        >
          {message}
        </Text>
        
        {actionLabel && onAction && (
          <Button
            variant="primary"
            onPress={onAction}
            style={styles.actionButton}
          >
            {actionLabel}
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  message: {
    marginBottom: 24,
    lineHeight: 22,
  },
  actionButton: {
    minWidth: 120,
  },
});

// Predefined empty states
export const EmptyInventory: React.FC<{ onAddItem?: () => void }> = ({ onAddItem }) => (
  <EmptyState
    icon="📦"
    title="No items in inventory"
    message="Start by adding some food items to your inventory. You can scan barcodes or add them manually."
    actionLabel="Add Item"
    onAction={onAddItem}
  />
);

export const EmptyGroceryList: React.FC<{ onAddItem?: () => void }> = ({ onAddItem }) => (
  <EmptyState
    icon="🛒"
    title="Your grocery list is empty"
    message="Add items to your grocery list to keep track of what you need to buy."
    actionLabel="Add Item"
    onAction={onAddItem}
  />
);

export const EmptyRecipes: React.FC<{ onBrowseRecipes?: () => void }> = ({ onBrowseRecipes }) => (
  <EmptyState
    icon="👨‍🍳"
    title="No recipes found"
    message="We couldn't find any recipes that match your current ingredients. Try adding more items to your inventory."
    actionLabel="Browse Recipes"
    onAction={onBrowseRecipes}
  />
);

export const EmptySearchResults: React.FC<{ onClearSearch?: () => void }> = ({ onClearSearch }) => (
  <EmptyState
    icon="🔍"
    title="No results found"
    message="Try adjusting your search terms or browse all items."
    actionLabel="Clear Search"
    onAction={onClearSearch}
  />
);
