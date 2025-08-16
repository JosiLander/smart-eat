import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { InventoryService, InventoryItem } from '../services/InventoryService';
import { EmptyState } from './EmptyState';
import { getExpiryColorInfo, formatDate, getDaysUntilExpiry } from '../utils/dateUtils';

interface InventoryOverviewScreenProps {
  onBack: () => void;
  onViewItem: (item: InventoryItem) => void;
  onScanItems?: () => void;
}

type ExpiryCategory = 'safe' | 'warning' | 'danger' | 'expired';

interface CategoryData {
  category: ExpiryCategory;
  title: string;
  subtitle: string;
  color: string;
  backgroundColor: string;
  icon: string;
  items: InventoryItem[];
}

export const InventoryOverviewScreen: React.FC<InventoryOverviewScreenProps> = ({
  onBack,
  onViewItem,
  onScanItems,
}) => {
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ExpiryCategory | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const items = await InventoryService.getAllItems();
      setInventoryItems(items);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const categorizeItems = (items: InventoryItem[]): CategoryData[] => {
    const categories: { [key in ExpiryCategory]: InventoryItem[] } = {
      safe: [],
      warning: [],
      danger: [],
      expired: [],
    };

    items.forEach(item => {
      if (item.expirationDate) {
        const colorInfo = getExpiryColorInfo(item.expirationDate);
        categories[colorInfo.urgency].push(item);
      } else {
        // Items without expiration date go to safe category
        categories.safe.push(item);
      }
    });

    return [
      {
        category: 'safe',
        title: 'Good',
        subtitle: 'Items with good shelf life',
        color: '#ffffff',
        backgroundColor: '#27ae60',
        icon: '✅',
        items: categories.safe,
      },
      {
        category: 'warning',
        title: 'This Week',
        subtitle: 'Expires within 7 days',
        color: '#ffffff',
        backgroundColor: '#f39c12',
        icon: '⚠️',
        items: categories.warning,
      },
      {
        category: 'danger',
        title: 'Expires Soon',
        subtitle: 'Expires within 3 days',
        color: '#ffffff',
        backgroundColor: '#e67e22',
        icon: '🚨',
        items: categories.danger,
      },
      {
        category: 'expired',
        title: 'Expired',
        subtitle: 'Past expiration date',
        color: '#ffffff',
        backgroundColor: '#e74c3c',
        icon: '❌',
        items: categories.expired,
      },
    ];
  };

  const renderCategoryCard = ({ item }: { item: CategoryData }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: item.backgroundColor }]}
      onPress={() => setSelectedCategory(item.category)}
    >
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryIcon}>{item.icon}</Text>
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryTitle, { color: item.color }]}>
            {item.title}
          </Text>
          <Text style={[styles.categorySubtitle, { color: item.color }]}>
            {item.subtitle}
          </Text>
        </View>
        <View style={styles.categoryCount}>
          <Text style={[styles.countText, { color: item.color }]}>
            {item.items.length}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {
    const colorInfo = item.expirationDate ? getExpiryColorInfo(item.expirationDate) : null;
    const daysUntilExpiry = item.expirationDate ? getDaysUntilExpiry(item.expirationDate) : null;

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => onViewItem(item)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          {colorInfo && (
            <View style={[styles.urgencyBadge, { backgroundColor: colorInfo.backgroundColor }]}>
              <Text style={[styles.urgencyText, { color: colorInfo.color }]}>
                {colorInfo.text}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemQuantity}>
            {item.quantity} {item.unit}
          </Text>
          {item.expirationDate && (
            <Text style={styles.itemExpiry}>
              Expires: {formatDate(item.expirationDate)}
              {daysUntilExpiry !== null && (
                <Text style={styles.daysText}>
                  {daysUntilExpiry > 0 ? ` (${daysUntilExpiry} days)` : ` (${Math.abs(daysUntilExpiry)} days ago)`}
                </Text>
              )}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryList = () => {
    const categories = categorizeItems(inventoryItems);
    const selectedCategoryData = categories.find(cat => cat.category === selectedCategory);

    if (!selectedCategoryData) {
      return (
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Inventory Overview</Text>
          <FlatList
            data={categories}
            renderItem={renderCategoryCard}
            keyExtractor={(item) => item.category}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      );
    }

    return (
      <View style={styles.categoryListContainer}>
        <View style={styles.categoryListHeader}>
          <TouchableOpacity
            style={styles.backToCategoriesButton}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={styles.backToCategoriesText}>← Back to Overview</Text>
          </TouchableOpacity>
          <Text style={styles.categoryListTitle}>
            {selectedCategoryData.title} ({selectedCategoryData.items.length})
          </Text>
        </View>
        
        {selectedCategoryData.items.length === 0 ? (
          <EmptyState
            title={`No ${selectedCategoryData.title.toLowerCase()} items`}
            subtitle={`All your items are in good condition!`}
            icon={selectedCategoryData.icon}
          />
        ) : (
          <FlatList
            data={selectedCategoryData.items}
            renderItem={renderInventoryItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.itemsList}
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#27ae60" />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back to main menu"
          accessibilityHint="Double tap to return to the previous screen"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Inventory Overview</Text>
        <View style={styles.headerSpacer} />
      </View>

      {inventoryItems.length === 0 ? (
        <EmptyState
          title="No Items in Inventory"
          subtitle="Start by scanning some groceries to build your inventory"
          icon="📦"
          actionText="Scan Items"
          onAction={onScanItems || onBack}
        />
      ) : (
        renderCategoryList()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 18,
    minWidth: 88,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 26,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#f0f8f0',
  },
  backButtonText: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSpacer: {
    width: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  categoriesContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  categoriesList: {
    paddingBottom: 20,
  },
  categoryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 14,
    opacity: 0.9,
  },
  categoryCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryListContainer: {
    flex: 1,
  },
  categoryListHeader: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backToCategoriesButton: {
    marginBottom: 12,
  },
  backToCategoriesText: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: '600',
  },
  categoryListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  itemsList: {
    padding: 20,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    maxWidth: 120,
    alignItems: 'center',
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  itemExpiry: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'right',
  },
  daysText: {
    fontSize: 12,
    color: '#95a5a6',
  },
});
