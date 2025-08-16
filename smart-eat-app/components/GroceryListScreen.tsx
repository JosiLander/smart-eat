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
  Button,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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

  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateItem, setCurrentDateItem] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
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

  const handleShoppingComplete = () => {
    const purchasedItems = activeList?.items.filter(item => item.isPurchased) || [];
    
    if (purchasedItems.length === 0) {
      Alert.alert('No Items Purchased', 'Please mark some items as purchased before completing shopping.');
      return;
    }

    // Initialize expiry dates for purchased items
    const initialExpiryDates: Record<string, string> = {};
    purchasedItems.forEach(item => {
      initialExpiryDates[item.id] = '';
    });
    setExpiryDates(initialExpiryDates);
    setShowExpiryModal(true);
  };

  const handleDatePickerOpen = (itemId: string) => {
    setCurrentDateItem(itemId);
    setSelectedDate(new Date());
    setShowDatePicker(true);
  };

  const handleDatePickerChange = (event: any, date?: Date) => {
    if (date && currentDateItem) {
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      setExpiryDates(prev => ({ ...prev, [currentDateItem]: formattedDate }));
      setSelectedDate(date);
    }
  };

  const handleTransferToInventory = async () => {
    const purchasedItems = activeList?.items.filter(item => item.isPurchased) || [];
    const missingExpiryDates = purchasedItems.filter(item => !expiryDates[item.id] || expiryDates[item.id].trim() === '');
    
    if (missingExpiryDates.length > 0) {
      Alert.alert(
        'Missing Expiry Dates',
        `Please add expiry dates for: ${missingExpiryDates.map(item => item.name).join(', ')}`
      );
      return;
    }

    try {
      // Transfer items to inventory with expiry dates
      for (const item of purchasedItems) {
        const result = await InventoryService.addItemFromGroceryList({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          expiryDate: expiryDates[item.id],
          notes: item.notes,
        });

        if (!result.success) {
          console.error('Failed to add item to inventory:', result.error);
        }
      }

      // Clear purchased items from grocery list
      if (activeList) {
        await GroceryListService.clearPurchasedItems(activeList.id);
      }

      setShowExpiryModal(false);
      setExpiryDates({});
      loadActiveList();
      loadInventory();

      Alert.alert(
        'Shopping Complete!',
        `${purchasedItems.length} items have been transferred to your inventory.`
      );
    } catch (error) {
      console.error('Failed to transfer items to inventory:', error);
      Alert.alert('Error', 'Failed to transfer items to inventory. Please try again.');
    }
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
      dairy: '#27ae60',
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



  const renderGroceryItem = ({ item }: { item: GroceryItem }) => {
    const inventoryItem = checkInventoryForItem(item.name);
    
    return (
      <View style={[
        styles.itemCard, 
        item.isPurchased && styles.itemCardPurchased
      ]}>
        <View style={styles.itemHeader}>
          <TouchableOpacity
            style={[styles.checkbox, item.isPurchased && styles.checkboxChecked]}
            onPress={() => handleTogglePurchased(item.id)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${item.name} as ${item.isPurchased ? 'not purchased' : 'purchased'}`}
            accessibilityHint="Double tap to toggle purchase status"
          >
            {item.isPurchased && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          
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

  const renderExpiryModal = () => {
    const purchasedItems = activeList?.items.filter(item => item.isPurchased) || [];
    
    return (
      <Modal
        visible={showExpiryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExpiryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expiry Dates</Text>
              <TouchableOpacity onPress={() => setShowExpiryModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.suggestionsSubtitle}>
                Please add expiry dates for your purchased items before transferring to inventory
              </Text>
              
              {purchasedItems.map((item) => (
                <View key={item.id} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {item.name} ({item.quantity} {item.unit})
                  </Text>
                  <TouchableOpacity
                    style={styles.dateInputButton}
                    onPress={() => handleDatePickerOpen(item.id)}
                  >
                    <Text style={[
                      styles.dateInputText,
                      expiryDates[item.id] ? styles.dateInputTextFilled : styles.dateInputTextPlaceholder
                    ]}>
                      {expiryDates[item.id] || 'Tap to select expiry date'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowExpiryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleTransferToInventory}
              >
                <Text style={styles.addButtonText}>Transfer to Inventory</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

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
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={handleClearPurchased}
            >
              <Text style={styles.clearButtonText}>🗑️ Clear Purchased</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.shoppingDoneButton]}
              onPress={handleShoppingComplete}
            >
              <Text style={styles.shoppingDoneButtonText}>✅ Shopping Done</Text>
            </TouchableOpacity>
          </>
        )}
        

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
      {renderExpiryModal()}
      
      {/* Date Picker */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowDatePicker(false);
            setCurrentDateItem(null);
          }}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Expiry Date</Text>
                <TouchableOpacity
                  style={styles.datePickerCloseButton}
                  onPress={() => {
                    setShowDatePicker(false);
                    setCurrentDateItem(null);
                  }}
                >
                  <Text style={styles.datePickerCloseText}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerContent}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDatePickerChange}
                  minimumDate={new Date()}
                  style={styles.datePicker}
                />
              </View>
            </View>
          </View>
        </Modal>
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
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
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
    fontSize: 22,
    fontWeight: '700',
    color: '#27ae60',
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
    borderColor: '#27ae60',
    backgroundColor: '#f0f8f0',
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
    backgroundColor: '#27ae60',
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
  shoppingDoneButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  shoppingDoneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  dateInputButton: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  dateInputText: {
    fontSize: 16,
  },
  dateInputTextFilled: {
    color: '#2c3e50',
    fontWeight: '500',
  },
  dateInputTextPlaceholder: {
    color: '#95a5a6',
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
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#229954',
    minHeight: 56,
  },
  addButtonDisabled: {
    backgroundColor: '#bdc3c7',
    elevation: 2,
    shadowOpacity: 0.2,
    borderColor: '#bdc3c7',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    color: '#27ae60',
    fontWeight: 'bold',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  datePickerCloseButton: {
    padding: 10,
  },
  datePickerCloseText: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: '600',
  },
  datePickerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  datePicker: {
    width: 320,
    height: 200,
  },
});
