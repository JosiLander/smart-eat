import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Platform,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { GroceryListService, GroceryList, GroceryItem } from '../services/GroceryListService';
import { InventoryService, InventoryItem } from '../services/InventoryService';
import { EmptyState } from './EmptyState';

interface GroceryListScreenProps {
  onBack: () => void;
}

export const GroceryListScreen: React.FC<GroceryListScreenProps> = ({
  onBack,
}) => {
  const [activeList, setActiveList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<GroceryItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  
  // Add item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('piece');
  const [newItemCategory, setNewItemCategory] = useState<GroceryItem['category']>('other');
  const [newItemNotes, setNewItemNotes] = useState('');

  useEffect(() => {
    loadActiveList();
    loadSuggestions();
    loadInventory();
  }, []);

  const loadActiveList = async () => {
    try {
      setLoading(true);
      const list = await GroceryListService.getActiveList();
      setActiveList(list);
    } catch (error) {
      console.error('Failed to load active list:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const items = await GroceryListService.getSuggestions();
      setSuggestions(items);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const loadInventory = async () => {
    try {
      const items = await InventoryService.getAllItems();
      setInventoryItems(items);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !activeList) return;

    const quantity = parseInt(newItemQuantity) || 1;
    
    const result = await GroceryListService.addItem(
      activeList.id,
      newItemName.trim(),
      quantity,
      newItemUnit,
      newItemCategory,
      newItemNotes.trim() || undefined
    );

    if (result.success) {
      setShowAddModal(false);
      resetForm();
      loadActiveList(); // Refresh the list
    } else {
      Alert.alert('Error', result.error || 'Failed to add item');
    }
  };

  const handleTogglePurchased = async (itemId: string) => {
    if (!activeList) return;

    const success = await GroceryListService.toggleItemPurchased(activeList.id, itemId);
    if (success) {
      loadActiveList(); // Refresh the list
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!activeList) return;

    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await GroceryListService.removeItem(activeList.id, itemId);
            if (success) {
              loadActiveList(); // Refresh the list
            }
          },
        },
      ]
    );
  };

  const handleClearPurchased = async () => {
    if (!activeList) return;

    Alert.alert(
      'Clear Purchased Items',
      'Are you sure you want to remove all purchased items from your list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const success = await GroceryListService.clearPurchasedItems(activeList.id);
            if (success) {
              loadActiveList(); // Refresh the list
            }
          },
        },
      ]
    );
  };

  const handleAddSuggestion = async (suggestion: GroceryItem) => {
    if (!activeList) return;

    const result = await GroceryListService.addItem(
      activeList.id,
      suggestion.name,
      suggestion.quantity,
      suggestion.unit,
      suggestion.category
    );

    if (result.success) {
      setShowSuggestions(false);
      loadActiveList(); // Refresh the list
    }
  };

  const resetForm = () => {
    setNewItemName('');
    setNewItemQuantity('1');
    setNewItemUnit('piece');
    setNewItemCategory('other');
    setNewItemNotes('');
  };

  const getCategoryColor = (category: GroceryItem['category']) => {
    const colors = {
      fruits: '#27ae60',
      vegetables: '#2ecc71',
      dairy: '#3498db',
      meat: '#e74c3c',
      pantry: '#f39c12',
      beverages: '#9b59b6',
      snacks: '#e67e22',
      frozen: '#1abc9c',
      other: '#95a5a6',
    };
    return colors[category];
  };

  const checkInventoryForItem = (itemName: string): InventoryItem | null => {
    return inventoryItems.find(invItem => 
      invItem.name.toLowerCase() === itemName.toLowerCase()
    ) || null;
  };

  const getFilteredItems = () => {
    if (!activeList) return [];
    
    if (!searchQuery.trim()) return activeList.items;
    
    return activeList.items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const handleItemSelect = (itemId: string) => {
    if (!bulkMode) return;
    
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkPurchase = async () => {
    if (!activeList || selectedItems.size === 0) return;
    
    for (const itemId of selectedItems) {
      await GroceryListService.toggleItemPurchased(activeList.id, itemId);
    }
    
    setSelectedItems(new Set());
    setBulkMode(false);
    loadActiveList();
  };

  const handleBulkDelete = async () => {
    if (!activeList || selectedItems.size === 0) return;
    
    Alert.alert(
      'Delete Selected Items',
      `Are you sure you want to delete ${selectedItems.size} items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            for (const itemId of selectedItems) {
              await GroceryListService.removeItem(activeList.id, itemId);
            }
            setSelectedItems(new Set());
            setBulkMode(false);
            loadActiveList();
          },
        },
      ]
    );
  };

  const renderGroceryItem = ({ item }: { item: GroceryItem }) => {
    const inventoryItem = checkInventoryForItem(item.name);
    const isSelected = selectedItems.has(item.id);
    
    return (
      <View style={[
        styles.itemCard, 
        item.isPurchased && styles.itemCardPurchased,
        bulkMode && isSelected && styles.itemCardSelected
      ]}>
        <View style={styles.itemHeader}>
          {bulkMode ? (
            <TouchableOpacity
              style={[styles.checkbox, isSelected && styles.checkboxChecked]}
              onPress={() => handleItemSelect(item.id)}
            >
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.checkbox, item.isPurchased && styles.checkboxChecked]}
              onPress={() => handleTogglePurchased(item.id)}
            >
              {item.isPurchased && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          )}
          
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, item.isPurchased && styles.itemNamePurchased]}>
              {item.name}
            </Text>
            <View style={styles.itemDetails}>
              <Text style={[styles.itemQuantity, item.isPurchased && styles.itemNamePurchased]}>
                {item.quantity} {item.unit}
              </Text>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              {item.source === 'recipe' && (
                <View style={styles.recipeBadge}>
                  <Text style={styles.recipeBadgeText}>Recipe</Text>
                </View>
              )}
              {inventoryItem && (
                <View style={styles.inventoryBadge}>
                  <Text style={styles.inventoryBadgeText}>
                    Already have: {inventoryItem.quantity} {inventoryItem.unit}
                  </Text>
                </View>
              )}
            </View>
            {item.notes && (
              <Text style={[styles.itemNotes, item.isPurchased && styles.itemNamePurchased]}>
                {item.notes}
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id)}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAddItemModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Item</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newItemName}
                onChangeText={setNewItemName}
                placeholder="e.g., Milk, Bread, Apples"
                autoFocus
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.textInput}
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  placeholder="1"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Unit</Text>
                <TextInput
                  style={styles.textInput}
                  value={newItemUnit}
                  onChangeText={setNewItemUnit}
                  placeholder="piece"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryButtons}>
                  {(['fruits', 'vegetables', 'dairy', 'meat', 'pantry', 'beverages', 'snacks', 'frozen', 'other'] as const).map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        newItemCategory === category && { backgroundColor: getCategoryColor(category) }
                      ]}
                      onPress={() => setNewItemCategory(category)}
                    >
                      <Text style={[
                        styles.categoryButtonText,
                        newItemCategory === category && styles.categoryButtonTextActive
                      ]}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newItemNotes}
                onChangeText={setNewItemNotes}
                placeholder="e.g., Organic, Brand preference"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, !newItemName.trim() && styles.addButtonDisabled]}
              onPress={handleAddItem}
              disabled={!newItemName.trim()}
            >
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSuggestionsModal = () => (
    <Modal
      visible={showSuggestions}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSuggestions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quick Add</Text>
            <TouchableOpacity onPress={() => setShowSuggestions(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.suggestionsSubtitle}>Common grocery items</Text>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestionItem}
                onPress={() => handleAddSuggestion(suggestion)}
              >
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionName}>{suggestion.name}</Text>
                  <Text style={styles.suggestionDetails}>
                    {suggestion.quantity} {suggestion.unit} • {suggestion.category}
                  </Text>
                </View>
                <Text style={styles.addIcon}>+</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading grocery list...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const purchasedItems = activeList?.items.filter(item => item.isPurchased) || [];
  const unpurchasedItems = activeList?.items.filter(item => !item.isPurchased) || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Grocery List</Text>
        <View style={styles.headerSpacer} />
      </View>

      {activeList && (
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{activeList.name}</Text>
          <Text style={styles.listStats}>
            {unpurchasedItems.length} items remaining • {purchasedItems.length} purchased
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.actionButtonText}>➕ Add Item</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowSuggestions(true)}
        >
          <Text style={styles.actionButtonText}>💡 Quick Add</Text>
        </TouchableOpacity>
        
        {purchasedItems.length > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleClearPurchased}
          >
            <Text style={styles.clearButtonText}>🗑️ Clear Purchased</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, bulkMode && styles.bulkModeActive]}
          onPress={() => {
            setBulkMode(!bulkMode);
            setSelectedItems(new Set());
          }}
        >
          <Text style={styles.actionButtonText}>
            {bulkMode ? '✕ Cancel' : '☑️ Select'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {activeList && activeList.items.length > 0 && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {/* Bulk Actions */}
      {bulkMode && selectedItems.size > 0 && (
        <View style={styles.bulkActionsContainer}>
          <Text style={styles.bulkActionsText}>
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </Text>
          <View style={styles.bulkActionsButtons}>
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.bulkPurchaseButton]}
              onPress={handleBulkPurchase}
            >
              <Text style={styles.bulkActionButtonText}>✓ Mark Purchased</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.bulkDeleteButton]}
              onPress={handleBulkDelete}
            >
              <Text style={styles.bulkActionButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!activeList || activeList.items.length === 0 ? (
        <EmptyState
          title="Your Grocery List is Empty"
          subtitle="Start by adding some items to your shopping list"
          icon="🛒"
          actionText="Add Your First Item"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <FlatList
          data={getFilteredItems()}
          renderItem={renderGroceryItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.itemsList}
        />
      )}

      {renderAddItemModal()}
      {renderSuggestionsModal()}
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
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
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
    fontSize: 16,
    color: '#7f8c8d',
  },
  listInfo: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  listStats: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  searchContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  bulkModeActive: {
    backgroundColor: '#e74c3c',
  },
  bulkActionsContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bulkActionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  bulkActionsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  bulkActionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bulkPurchaseButton: {
    backgroundColor: '#27ae60',
  },
  bulkDeleteButton: {
    backgroundColor: '#e74c3c',
  },
  bulkActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  itemCardSelected: {
    borderWidth: 2,
    borderColor: '#3498db',
    backgroundColor: '#f0f8ff',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#e74c3c',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  itemCardPurchased: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  itemNamePurchased: {
    textDecorationLine: 'line-through',
    color: '#7f8c8d',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  recipeBadge: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recipeBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  inventoryBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  inventoryBadgeText: {
    fontSize: 10,
    color: '#27ae60',
    fontWeight: '600',
  },
  itemNotes: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    fontSize: 24,
    color: '#7f8c8d',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  suggestionDetails: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  addIcon: {
    fontSize: 20,
    color: '#3498db',
    fontWeight: 'bold',
  },
});
