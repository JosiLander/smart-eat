import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  FlatList,
} from 'react-native';
import { ShoppingPreferences } from '../../services/SettingsService';

interface ShoppingPreferencesSectionProps {
  preferences: ShoppingPreferences;
  onPreferencesChange: (preferences: ShoppingPreferences) => void;
}

interface StoreLayout {
  id: string;
  name: string;
  sections: string[];
}

export const ShoppingPreferencesSection: React.FC<ShoppingPreferencesSectionProps> = ({
  preferences,
  onPreferencesChange,
}) => {
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [editingItem, setEditingItem] = useState<string>('');
  const [newThreshold, setNewThreshold] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const defaultStoreLayouts: StoreLayout[] = [
    {
      id: 'grocery',
      name: 'Grocery Store',
      sections: ['Produce', 'Dairy', 'Meat', 'Pantry', 'Frozen', 'Bakery', 'Beverages'],
    },
    {
      id: 'supermarket',
      name: 'Supermarket',
      sections: ['Fresh Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Pantry', 'Frozen Foods', 'Bakery', 'Beverages', 'Household', 'Health & Beauty'],
    },
    {
      id: 'farmers_market',
      name: 'Farmers Market',
      sections: ['Fresh Produce', 'Dairy', 'Meat', 'Bakery', 'Artisan Goods'],
    },
  ];

  const [storeLayouts, setStoreLayouts] = useState<StoreLayout[]>(defaultStoreLayouts);

  const defaultThresholds = {
    'low_stock': 2,
    'expiring_soon': 3,
    'shopping_reminder': 5,
    'auto_add_threshold': 1,
  };

  const updateThreshold = (key: string, value: number) => {
    onPreferencesChange({
      ...preferences,
      thresholds: {
        ...preferences.thresholds,
        [key]: value,
      },
    });
    setShowThresholdModal(false);
    setEditingItem('');
    setNewThreshold('');
  };

  const addCustomStore = () => {
    if (!newStoreName.trim()) {
      Alert.alert('Error', 'Please enter a store name');
      return;
    }

    if (selectedSections.length === 0) {
      Alert.alert('Error', 'Please select at least one section');
      return;
    }

    const newStore: StoreLayout = {
      id: `custom_${Date.now()}`,
      name: newStoreName.trim(),
      sections: selectedSections,
    };

    const updatedLayouts = [...storeLayouts, newStore];
    setStoreLayouts(updatedLayouts);

    onPreferencesChange({
      ...preferences,
      customStoreLayouts: updatedLayouts.filter(layout => layout.id.startsWith('custom_')),
    });

    setNewStoreName('');
    setSelectedSections([]);
    setShowStoreModal(false);
  };

  const removeCustomStore = (storeId: string) => {
    Alert.alert(
      'Remove Store Layout',
      'Are you sure you want to remove this custom store layout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedLayouts = storeLayouts.filter(layout => layout.id !== storeId);
            setStoreLayouts(updatedLayouts);
            
            onPreferencesChange({
              ...preferences,
              customStoreLayouts: updatedLayouts.filter(layout => layout.id.startsWith('custom_')),
            });
          },
        },
      ]
    );
  };

  const toggleSection = (section: string) => {
    const updatedSections = selectedSections.includes(section)
      ? selectedSections.filter(s => s !== section)
      : [...selectedSections, section];
    setSelectedSections(updatedSections);
  };

  const toggleAutoAdd = () => {
    onPreferencesChange({
      ...preferences,
      autoAddToShoppingList: !preferences.autoAddToShoppingList,
    });
  };

  const toggleSmartSuggestions = () => {
    onPreferencesChange({
      ...preferences,
      smartSuggestions: !preferences.smartSuggestions,
    });
  };

  const toggleInventoryTracking = () => {
    onPreferencesChange({
      ...preferences,
      inventoryTracking: !preferences.inventoryTracking,
    });
  };

  const getThresholdLabel = (key: string) => {
    const labels = {
      'low_stock': 'Low Stock Alert',
      'expiring_soon': 'Expiring Soon Alert',
      'shopping_reminder': 'Shopping Reminder',
      'auto_add_threshold': 'Auto-Add Threshold',
    };
    return labels[key as keyof typeof labels] || key;
  };

  const getThresholdDescription = (key: string) => {
    const descriptions = {
      'low_stock': 'Items remaining before low stock alert',
      'expiring_soon': 'Days before expiration to alert',
      'shopping_reminder': 'Items needed before shopping reminder',
      'auto_add_threshold': 'Items to auto-add to shopping list',
    };
    return descriptions[key as keyof typeof descriptions] || '';
  };

  const renderThresholdItem = (key: string, value: number) => (
    <TouchableOpacity
      key={key}
      style={styles.thresholdItem}
      onPress={() => {
        setEditingItem(key);
        setNewThreshold(value.toString());
        setShowThresholdModal(true);
      }}
    >
      <View style={styles.thresholdInfo}>
        <Text style={styles.thresholdLabel}>{getThresholdLabel(key)}</Text>
        <Text style={styles.thresholdDescription}>{getThresholdDescription(key)}</Text>
      </View>
      <View style={styles.thresholdValue}>
        <Text style={styles.thresholdValueText}>{value}</Text>
        <Text style={styles.thresholdArrow}>▼</Text>
      </View>
    </TouchableOpacity>
  );

  const renderStoreLayout = ({ item }: { item: StoreLayout }) => (
    <View style={styles.storeItem}>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{item.name}</Text>
        <Text style={styles.storeSections}>{item.sections.join(', ')}</Text>
      </View>
      {item.id.startsWith('custom_') && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeCustomStore(item.id)}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderThresholdModal = () => (
    <Modal
      visible={showThresholdModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowThresholdModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{getThresholdLabel(editingItem)}</Text>
          <Text style={styles.modalSubtitle}>{getThresholdDescription(editingItem)}</Text>
          
          <TextInput
            style={styles.textInput}
            placeholder="Enter value"
            value={newThreshold}
            onChangeText={setNewThreshold}
            keyboardType="numeric"
            maxLength={3}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowThresholdModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                const value = parseInt(newThreshold);
                if (!isNaN(value) && value >= 0) {
                  updateThreshold(editingItem, value);
                } else {
                  Alert.alert('Error', 'Please enter a valid number');
                }
              }}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderStoreModal = () => (
    <Modal
      visible={showStoreModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowStoreModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Custom Store Layout</Text>
          
          <TextInput
            style={styles.textInput}
            placeholder="Enter store name"
            value={newStoreName}
            onChangeText={setNewStoreName}
            maxLength={50}
          />
          
          <Text style={styles.sectionsTitle}>Select sections:</Text>
          <ScrollView style={styles.sectionsList}>
            {['Produce', 'Dairy', 'Meat', 'Pantry', 'Frozen', 'Bakery', 'Beverages', 'Household', 'Health & Beauty', 'Artisan Goods'].map(section => (
              <TouchableOpacity
                key={section}
                style={[
                  styles.sectionItem,
                  selectedSections.includes(section) && styles.sectionItemSelected,
                ]}
                onPress={() => toggleSection(section)}
              >
                <Text style={[
                  styles.sectionText,
                  selectedSections.includes(section) && styles.sectionTextSelected,
                ]}>
                  {section}
                </Text>
                {selectedSections.includes(section) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowStoreModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={addCustomStore}
            >
              <Text style={styles.saveButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shopping & Inventory Preferences</Text>
        <Text style={styles.sectionSubtitle}>Configure your shopping experience</Text>
      </View>

      <View style={styles.togglesSection}>
        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Auto-add to shopping list</Text>
            <Text style={styles.toggleDescription}>
              Automatically add items when they reach low stock
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, preferences.autoAddToShoppingList && styles.toggleActive]}
            onPress={toggleAutoAdd}
          >
            <View style={[styles.toggleThumb, preferences.autoAddToShoppingList && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Smart suggestions</Text>
            <Text style={styles.toggleDescription}>
              Suggest items based on your shopping history
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, preferences.smartSuggestions && styles.toggleActive]}
            onPress={toggleSmartSuggestions}
          >
            <View style={[styles.toggleThumb, preferences.smartSuggestions && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Inventory tracking</Text>
            <Text style={styles.toggleDescription}>
              Track item quantities and expiration dates
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, preferences.inventoryTracking && styles.toggleActive]}
            onPress={toggleInventoryTracking}
          >
            <View style={[styles.toggleThumb, preferences.inventoryTracking && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.thresholdsSection}>
        <Text style={styles.sectionSubtitle}>Alert Thresholds</Text>
        {Object.entries(preferences.thresholds).map(([key, value]) => 
          renderThresholdItem(key, value)
        )}
      </View>

      <View style={styles.storesSection}>
        <View style={styles.storesHeader}>
          <Text style={styles.sectionSubtitle}>Store Layouts</Text>
          <TouchableOpacity
            style={styles.addStoreButton}
            onPress={() => setShowStoreModal(true)}
          >
            <Text style={styles.addStoreButtonText}>+ Add Custom</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={storeLayouts}
          renderItem={renderStoreLayout}
          keyExtractor={(item) => item.id}
          style={styles.storesList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {renderThresholdModal()}
      {renderStoreModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  togglesSection: {
    marginBottom: 24,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  toggleDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#27ae60',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    backgroundColor: 'white',
    borderRadius: 13,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  thresholdsSection: {
    marginBottom: 24,
  },
  thresholdItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  thresholdInfo: {
    flex: 1,
  },
  thresholdLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  thresholdDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  thresholdValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdValueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    marginRight: 8,
  },
  thresholdArrow: {
    fontSize: 12,
    color: '#666',
  },
  storesSection: {
    marginBottom: 16,
  },
  storesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addStoreButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addStoreButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  storesList: {
    maxHeight: 200,
  },
  storeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  storeSections: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'white',
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
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  sectionsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  sectionsList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  sectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionItemSelected: {
    backgroundColor: '#f0f8f0',
  },
  sectionText: {
    fontSize: 16,
    color: '#333',
  },
  sectionTextSelected: {
    color: '#27ae60',
    fontWeight: '500',
  },
  checkmark: {
    color: '#27ae60',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ShoppingPreferencesSection;
