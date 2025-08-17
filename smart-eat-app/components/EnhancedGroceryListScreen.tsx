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
  Animated,
} from 'react-native';
import { GroceryListService, GroceryList, GroceryItem } from '../services/GroceryListService';
import { TemplateService, ShoppingTemplate, TemplateSuggestion } from '../services/TemplateService';
import { StoreLayoutService, StoreLayout, SortedItem } from '../services/StoreLayoutService';
import { FamilyService, FamilyProfile } from '../services/FamilyService';
import { InventoryService, InventoryItem } from '../services/InventoryService';
import { EmptyState } from './EmptyState';

interface EnhancedGroceryListScreenProps {
  onBack: () => void;
}

export const EnhancedGroceryListScreen: React.FC<EnhancedGroceryListScreenProps> = ({
  onBack,
}) => {
  // Core state
  const [activeList, setActiveList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortedItems, setSortedItems] = useState<SortedItem[]>([]);
  const [currentLayout, setCurrentLayout] = useState<StoreLayout | null>(null);
  const [familyProfile, setFamilyProfile] = useState<FamilyProfile | null>(null);
  const [shoppingProgress, setShoppingProgress] = useState({ total: 0, completed: 0, progress: 0 });

  // Template state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<ShoppingTemplate[]>([]);
  const [templateSuggestions, setTemplateSuggestions] = useState<TemplateSuggestion[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ShoppingTemplate | null>(null);

  // Store layout state
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [layouts, setLayouts] = useState<StoreLayout[]>([]);

  // Item management state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompletedItems, setShowCompletedItems] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('piece');
  const [newItemCategory, setNewItemCategory] = useState<GroceryItem['category']>('other');
  const [newItemNotes, setNewItemNotes] = useState('');

  // Shopping mode state
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [reorderAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    initializeAndLoad();
  }, []);

  useEffect(() => {
    if (activeList && currentLayout) {
      sortItemsByLayout();
    }
  }, [activeList, currentLayout]);

  useEffect(() => {
    updateShoppingProgress();
  }, [activeList]);

  const initializeAndLoad = async () => {
    try {
      setLoading(true);
      
      // Initialize all services
      await Promise.all([
        GroceryListService.initialize(),
        TemplateService.initialize(),
        StoreLayoutService.initialize(),
        FamilyService.initialize(),
      ]);

      // Load all data
      await Promise.all([
        loadActiveList(),
        loadTemplates(),
        loadLayouts(),
        loadFamilyProfile(),
        loadTemplateSuggestions(),
      ]);
    } catch (error) {
      console.error('Failed to initialize enhanced grocery list screen:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveList = async () => {
    try {
      const list = await GroceryListService.getActiveList();
      setActiveList(list);
      
      if (list?.storeLayoutId) {
        const layout = await StoreLayoutService.getLayoutById(list.storeLayoutId);
        setCurrentLayout(layout);
      } else {
        const defaultLayout = await StoreLayoutService.getDefaultLayout();
        setCurrentLayout(defaultLayout);
      }
    } catch (error) {
      console.error('Failed to load active list:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const allTemplates = await TemplateService.getAllTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadLayouts = async () => {
    try {
      const allLayouts = await StoreLayoutService.getAllLayouts();
      setLayouts(allLayouts);
    } catch (error) {
      console.error('Failed to load layouts:', error);
    }
  };

  const loadFamilyProfile = async () => {
    try {
      const profile = await FamilyService.getFamilyProfile();
      setFamilyProfile(profile);
    } catch (error) {
      console.error('Failed to load family profile:', error);
    }
  };

  const loadTemplateSuggestions = async () => {
    try {
      // Mock shopping history for now
      const shoppingHistory = [
        {
          items: [
            { name: 'Milk', category: 'dairy' },
            { name: 'Bread', category: 'pantry' },
          ],
          date: new Date(),
        },
      ];
      
      const suggestions = await TemplateService.getSuggestions(shoppingHistory);
      setTemplateSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load template suggestions:', error);
    }
  };

  const sortItemsByLayout = () => {
    if (!activeList || !currentLayout) return;

    const sorted = StoreLayoutService.sortItemsByLayout(activeList.items, currentLayout);
    setSortedItems(sorted);
  };

  const updateShoppingProgress = () => {
    if (!activeList) return;

    const total = activeList.items.length;
    const completed = activeList.items.filter(item => item.isPurchased).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    setShoppingProgress({ total, completed, progress });
  };

  const handleToggleItem = async (itemId: string) => {
    if (!activeList) return;

    try {
      await GroceryListService.toggleItemPurchased(activeList.id, itemId);
      await loadActiveList(); // Reload to get updated data
      
      // Trigger reorder animation
      if (isShoppingMode) {
        Animated.sequence([
          Animated.timing(reorderAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(reorderAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      console.error('Failed to toggle item:', error);
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleAddItem = async () => {
    if (!activeList || !newItemName.trim()) return;

    try {
      const quantity = parseInt(newItemQuantity) || 1;
      
      await GroceryListService.addItem(
        activeList.id,
        newItemName.trim(),
        quantity,
        newItemUnit,
        newItemCategory,
        newItemNotes.trim() || undefined
      );

      // Reset form
      setNewItemName('');
      setNewItemQuantity('1');
      setNewItemUnit('piece');
      setNewItemCategory('other');
      setNewItemNotes('');
      setShowAddModal(false);

      await loadActiveList();
    } catch (error) {
      console.error('Failed to add item:', error);
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleUseTemplate = async (template: ShoppingTemplate) => {
    try {
      const result = await GroceryListService.createListFromTemplate(template.id, template.name);
      
      if (result.success) {
        setSelectedTemplate(null);
        setShowTemplateModal(false);
        await loadActiveList();
        Alert.alert('Success', `Created list from template: ${template.name}`);
      } else {
        Alert.alert('Error', 'Failed to create list from template');
      }
    } catch (error) {
      console.error('Failed to use template:', error);
      Alert.alert('Error', 'Failed to use template');
    }
  };

  const handleChangeLayout = async (layout: StoreLayout) => {
    if (!activeList) return;

    try {
      await GroceryListService.sortListByStoreLayout(activeList.id, layout.id);
      setCurrentLayout(layout);
      setShowLayoutModal(false);
      await loadActiveList();
    } catch (error) {
      console.error('Failed to change layout:', error);
      Alert.alert('Error', 'Failed to change store layout');
    }
  };

  const handleShoppingCompleted = async () => {
    if (!activeList) return;

    Alert.alert(
      'Shopping Completed',
      'Mark all items as purchased and proceed to scan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await GroceryListService.markShoppingCompleted(activeList.id);
              await loadActiveList();
              // Here you would navigate to the post-shopping scan screen
              Alert.alert('Success', 'Ready to scan your purchases!');
            } catch (error) {
              console.error('Failed to mark shopping completed:', error);
              Alert.alert('Error', 'Failed to complete shopping');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: SortedItem }) => {
    const groceryItem = item.item as GroceryItem;
    const section = currentLayout?.sections.find(s => s.name === item.section);
    
    return (
      <Animated.View
        style={[
          styles.itemContainer,
          {
            opacity: groceryItem.isPurchased ? 0.6 : 1,
            transform: [
              {
                translateY: reorderAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleToggleItem(groceryItem.id)}
        >
          <View style={[styles.checkbox, groceryItem.isPurchased && styles.checked]}>
            {groceryItem.isPurchased && <Text style={styles.checkmark}>✓</Text>}
          </View>
          
          <View style={styles.itemDetails}>
            <Text style={[
              styles.itemName,
              groceryItem.isPurchased && styles.completedItem
            ]}>
              {groceryItem.name}
            </Text>
            <Text style={styles.itemQuantity}>
              {groceryItem.quantity} {groceryItem.unit}
            </Text>
            {groceryItem.notes && (
              <Text style={styles.itemNotes}>{groceryItem.notes}</Text>
            )}
          </View>
          
          {section && (
            <View style={[styles.sectionIndicator, { backgroundColor: section.color }]}>
              <Text style={styles.sectionIcon}>{section.icon}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSectionHeader = ({ item }: { item: SortedItem }) => {
    const section = currentLayout?.sections.find(s => s.name === item.section);
    if (!section) return null;

    const sectionItems = sortedItems.filter(si => si.section === item.section);
    const completedItems = sectionItems.filter(si => (si.item as GroceryItem).isPurchased).length;
    const totalItems = sectionItems.length;

    return (
      <View style={[styles.sectionHeader, { backgroundColor: section.color + '20' }]}>
        <Text style={styles.sectionTitle}>{section.name}</Text>
        <Text style={styles.sectionProgress}>
          {completedItems}/{totalItems}
        </Text>
      </View>
    );
  };

  const renderTemplateSuggestion = ({ item }: { item: TemplateSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionCard}
      onPress={() => handleUseTemplate(item.template)}
    >
      <Text style={styles.suggestionTitle}>{item.template.name}</Text>
      <Text style={styles.suggestionReason}>{item.reason}</Text>
      <Text style={styles.suggestionConfidence}>
        Confidence: {Math.round(item.confidence * 100)}%
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateIcon}>🛒</Text>
      <Text style={styles.emptyStateTitle}>Your list is empty</Text>
      <Text style={styles.emptyStateMessage}>Add some items to get started with your shopping</Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.emptyStateButtonText}>+ Add First Item</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading enhanced grocery list...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeList) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.title}>Shopping List</Text>
            <Text style={styles.subtitle}>Create your first list</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowTemplateModal(true)}
            >
              <Text style={styles.actionButtonText}>📋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: '0%' },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            0% Complete
          </Text>
        </View>

        {/* Shopping Mode Toggle */}
        <View style={styles.shoppingModeContainer}>
          <TouchableOpacity
            style={styles.modeToggle}
            onPress={() => setIsShoppingMode(!isShoppingMode)}
          >
            <Text style={styles.shoppingModeText}>📝 Planning Mode</Text>
          </TouchableOpacity>
        </View>

        {/* Template Suggestions */}
        {templateSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Suggested Templates</Text>
            <FlatList
              data={templateSuggestions}
              renderItem={renderTemplateSuggestion}
              keyExtractor={(item) => item.template.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.suggestionsList}
            />
          </View>
        )}

        {/* Main Content */}
        <View style={styles.mainContent}>
          <EmptyState
            title="No Shopping List"
            subtitle="Create a new shopping list to get started"
            actionText="Create List"
            onAction={() => setShowAddModal(true)}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Create List</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>{activeList.name}</Text>
          <Text style={styles.subtitle}>
            {shoppingProgress.completed} of {shoppingProgress.total} items
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowTemplateModal(true)}
          >
            <Text style={styles.actionButtonText}>📋</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowLayoutModal(true)}
          >
            <Text style={styles.actionButtonText}>🏪</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setIsShoppingMode(!isShoppingMode)}
          >
            <Text style={styles.actionButtonText}>
              {isShoppingMode ? '🛒' : '📝'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${shoppingProgress.progress}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(shoppingProgress.progress)}% Complete
        </Text>
      </View>

      {/* Shopping Mode Toggle */}
      <View style={styles.shoppingModeContainer}>
        <TouchableOpacity
          style={styles.modeToggle}
          onPress={() => setIsShoppingMode(!isShoppingMode)}
        >
          <Text style={styles.shoppingModeText}>
            {isShoppingMode ? '🛒 Shopping Mode' : '📝 Planning Mode'}
          </Text>
        </TouchableOpacity>
        {isShoppingMode && (
          <TouchableOpacity
            style={styles.completedToggle}
            onPress={() => setShowCompletedItems(!showCompletedItems)}
          >
            <Text style={styles.completedToggleText}>
              {showCompletedItems ? 'Hide' : 'Show'} Completed
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Template Suggestions */}
      {templateSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Suggested Templates</Text>
          <FlatList
            data={templateSuggestions}
            renderItem={renderTemplateSuggestion}
            keyExtractor={(item) => item.template.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionsList}
          />
        </View>
      )}

      {/* Main Content */}
      <View style={styles.mainContent}>
        {sortedItems.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={showCompletedItems ? sortedItems : sortedItems.filter(item => !(item.item as GroceryItem).isPurchased)}
            renderItem={renderItem}
            keyExtractor={(item) => (item.item as GroceryItem).id}
            ListHeaderComponent={currentLayout ? renderSectionHeader : undefined}
            style={styles.itemsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
        
        {isShoppingMode && shoppingProgress.completed > 0 && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleShoppingCompleted}
          >
            <Text style={styles.completeButtonText}>✅ Shopping Done</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Item</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Item name"
              value={newItemName}
              onChangeText={setNewItemName}
            />
            
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.quantityInput]}
                placeholder="Qty"
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
                keyboardType="numeric"
              />
              
              <TextInput
                style={[styles.input, styles.unitInput]}
                placeholder="Unit"
                value={newItemUnit}
                onChangeText={setNewItemUnit}
              />
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Notes (optional)"
              value={newItemNotes}
              onChangeText={setNewItemNotes}
              multiline
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddItem}
              >
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Template Modal */}
      <Modal
        visible={showTemplateModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Shopping Templates</Text>
            
            <ScrollView style={styles.templateList}>
              {templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateItem}
                  onPress={() => handleUseTemplate(template)}
                >
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateDescription}>{template.description}</Text>
                  <Text style={styles.templateUsage}>
                    Used {template.usageCount} times
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowTemplateModal(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Layout Modal */}
      <Modal
        visible={showLayoutModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Store Layout</Text>
            
            <ScrollView style={styles.layoutList}>
              {layouts.map((layout) => (
                <TouchableOpacity
                  key={layout.id}
                  style={[
                    styles.layoutItem,
                    currentLayout?.id === layout.id && styles.selectedLayout,
                  ]}
                  onPress={() => handleChangeLayout(layout)}
                >
                  <Text style={styles.layoutName}>{layout.name}</Text>
                  <Text style={styles.layoutSections}>
                    {layout.sections.length} sections
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowLayoutModal(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 8,
    padding: 8,
  },
  actionButtonText: {
    fontSize: 20,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  shoppingModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  shoppingModeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  modeToggle: {
    flex: 1,
  },
  completedToggle: {
    padding: 4,
  },
  completedToggleText: {
    fontSize: 12,
    color: '#1976D2',
  },
  suggestionsContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  suggestionsList: {
    maxHeight: 120,
  },
  suggestionCard: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    minWidth: 150,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  suggestionReason: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  suggestionConfidence: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  itemsList: {
    flex: 1,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionProgress: {
    fontSize: 12,
    color: '#666',
  },
  itemContainer: {
    marginHorizontal: 16,
    marginVertical: 2,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  completedItem: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemNotes: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  sectionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: 16,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  completeButtonText: {
    color: '#fff',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  quantityInput: {
    flex: 1,
  },
  unitInput: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  templateList: {
    maxHeight: 300,
  },
  templateItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  templateUsage: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  layoutList: {
    maxHeight: 300,
  },
  layoutItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedLayout: {
    backgroundColor: '#E3F2FD',
  },
  layoutName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  layoutSections: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
