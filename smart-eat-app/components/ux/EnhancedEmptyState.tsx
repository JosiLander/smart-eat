import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

interface EnhancedEmptyStateProps {
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
  icon?: string;
  showAddItemsSuggestion?: boolean;
  showFilterGuidance?: boolean;
  onAddItems?: () => void;
  onAdjustFilters?: () => void;
}

export const EnhancedEmptyState: React.FC<EnhancedEmptyStateProps> = ({
  title,
  subtitle,
  actionText,
  onAction,
  icon = '🍽️',
  showAddItemsSuggestion = false,
  showFilterGuidance = false,
  onAddItems,
  onAdjustFilters,
}) => {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      <Text style={styles.icon}>{icon}</Text>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {showAddItemsSuggestion && (
        <View style={styles.suggestionContainer}>
          <Text style={styles.suggestionTitle}>💡 Try adding items to your inventory:</Text>
          <TouchableOpacity
            style={styles.suggestionButton}
            onPress={onAddItems}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Add items to inventory"
            accessibilityHint="Opens camera to scan new items"
          >
            <Text style={styles.suggestionButtonText}>📷 Scan New Items</Text>
          </TouchableOpacity>
        </View>
      )}

      {showFilterGuidance && (
        <View style={styles.suggestionContainer}>
          <Text style={styles.suggestionTitle}>🔍 Adjust your filters:</Text>
          <TouchableOpacity
            style={styles.suggestionButton}
            onPress={onAdjustFilters}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Adjust filters"
            accessibilityHint="Opens filter options to modify search criteria"
          >
            <Text style={styles.suggestionButtonText}>⚙️ Modify Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {actionText && onAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={actionText}
        >
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  suggestionContainer: {
    width: '100%',
    marginBottom: 16,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 8,
    textAlign: 'center',
  },
  suggestionButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  suggestionButtonText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
