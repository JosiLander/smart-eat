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
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { PostShoppingService, PurchaseSummary, PurchaseItem, ScanResult } from '../services/PostShoppingService';
import { GroceryListService, GroceryList } from '../services/GroceryListService';
import { CameraScreen } from './CameraScreen';
import { PhotoPreview } from './PhotoPreview';

interface PostShoppingScreenProps {
  groceryListId: string;
  onBack: () => void;
  onComplete: (inventoryItems: any[]) => void;
}

export const PostShoppingScreen: React.FC<PostShoppingScreenProps> = ({
  groceryListId,
  onBack,
  onComplete,
}) => {
  const [summary, setSummary] = useState<PurchaseSummary | null>(null);
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit: 'piece',
    category: 'other',
  });

  useEffect(() => {
    initializePostShopping();
  }, [groceryListId]);

  const initializePostShopping = async () => {
    try {
      setLoading(true);
      
      // Get grocery list details
      const list = await GroceryListService.getListById(groceryListId);
      setGroceryList(list);

      // Start post-shopping scan process
      const result = await PostShoppingService.startPostShoppingScan(groceryListId);
      
      if (result.success && result.summaryId) {
        const purchaseSummary = await PostShoppingService.getPurchaseSummary(result.summaryId);
        setSummary(purchaseSummary);
      } else {
        Alert.alert('Error', result.error || 'Failed to start post-shopping scan');
      }
    } catch (error) {
      console.error('Failed to initialize post-shopping:', error);
      Alert.alert('Error', 'Failed to initialize post-shopping scan');
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = () => {
    setShowCamera(true);
  };

  const handlePhotoCaptured = (photoUri: string) => {
    setSelectedPhoto(photoUri);
    setShowCamera(false);
    setShowPhotoPreview(true);
  };

  const handlePhotoConfirmed = async () => {
    if (!selectedPhoto || !summary) return;

    setShowPhotoPreview(false);
    setScanning(true);

    try {
      const result = await PostShoppingService.processScannedItems(summary.id, selectedPhoto);
      setScanResult(result);
      
      if (result.success) {
        // Refresh summary
        const updatedSummary = await PostShoppingService.getPurchaseSummary(summary.id);
        setSummary(updatedSummary);
        
        Alert.alert(
          'Scan Complete',
          `Found ${result.items?.length || 0} items with ${Math.round(result.confidence * 100)}% confidence`
        );
      } else {
        Alert.alert('Scan Failed', result.error || 'Failed to process scanned items');
      }
    } catch (error) {
      console.error('Failed to process scan:', error);
      Alert.alert('Error', 'Failed to process scanned items');
    } finally {
      setScanning(false);
      setSelectedPhoto(null);
    }
  };

  const handlePhotoCancelled = () => {
    setShowPhotoPreview(false);
    setSelectedPhoto(null);
  };

  const handleConfirmItem = async (itemId: string) => {
    if (!summary) return;

    try {
      const result = await PostShoppingService.confirmPurchaseItems(summary.id, [itemId]);
      
      if (result.success) {
        const updatedSummary = await PostShoppingService.getPurchaseSummary(summary.id);
        setSummary(updatedSummary);
      } else {
        Alert.alert('Error', result.error || 'Failed to confirm item');
      }
    } catch (error) {
      console.error('Failed to confirm item:', error);
      Alert.alert('Error', 'Failed to confirm item');
    }
  };

  const handleMarkNotPurchased = async (itemId: string) => {
    if (!summary) return;

    try {
      const result = await PostShoppingService.markNotPurchased(summary.id, [itemId]);
      
      if (result.success) {
        const updatedSummary = await PostShoppingService.getPurchaseSummary(summary.id);
        setSummary(updatedSummary);
      } else {
        Alert.alert('Error', result.error || 'Failed to mark item as not purchased');
      }
    } catch (error) {
      console.error('Failed to mark item as not purchased:', error);
      Alert.alert('Error', 'Failed to mark item as not purchased');
    }
  };

  const handleAddAdditionalItem = async () => {
    if (!summary || !newItem.name.trim()) return;

    try {
      const result = await PostShoppingService.addAdditionalItem(summary.id, {
        name: newItem.name.trim(),
        quantity: newItem.quantity,
        unit: newItem.unit,
        category: newItem.category,
        confidence: 1.0,
      });

      if (result.success) {
        const updatedSummary = await PostShoppingService.getPurchaseSummary(summary.id);
        setSummary(updatedSummary);
        setShowAddItemModal(false);
        setNewItem({ name: '', quantity: 1, unit: 'piece', category: 'other' });
      } else {
        Alert.alert('Error', result.error || 'Failed to add item');
      }
    } catch (error) {
      console.error('Failed to add additional item:', error);
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleCompleteShopping = async () => {
    if (!summary) return;

    try {
      setLoading(true);
      const result = await PostShoppingService.completePostShopping(summary.id);
      
      if (result.success) {
        Alert.alert(
          'Shopping Complete!',
          `Successfully added ${result.inventoryItems?.length || 0} items to inventory`,
          [
            {
              text: 'OK',
              onPress: () => onComplete(result.inventoryItems || []),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to complete shopping');
      }
    } catch (error) {
      console.error('Failed to complete shopping:', error);
      Alert.alert('Error', 'Failed to complete shopping');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PurchaseItem['status']) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'not_purchased': return '#F44336';
      case 'modified': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: PurchaseItem['status']) => {
    switch (status) {
      case 'confirmed': return '✓ Confirmed';
      case 'pending': return '⏳ Pending';
      case 'not_purchased': return '✗ Not Purchased';
      case 'modified': return '✏️ Modified';
      default: return 'Unknown';
    }
  };

  const renderItem = ({ item }: { item: PurchaseItem }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetails}>
          {item.quantity} {item.unit} • {item.category}
        </Text>
        {item.expirationDate && (
          <Text style={styles.expiryDate}>
            Expires: {item.expirationDate.toLocaleDateString()}
          </Text>
        )}
        {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
      </View>
      
      <View style={styles.itemActions}>
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {getStatusText(item.status)}
        </Text>
        
        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => handleConfirmItem(item.id)}
            >
              <Text style={styles.actionButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.notPurchasedButton]}
              onPress={() => handleMarkNotPurchased(item.id)}
            >
              <Text style={styles.actionButtonText}>Not Bought</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderSummary = () => {
    if (!summary) return null;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Shopping Summary</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{summary.totalItems}</Text>
            <Text style={styles.summaryStatLabel}>Total Items</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={[styles.summaryStatValue, { color: '#4CAF50' }]}>
              {summary.confirmedItems}
            </Text>
            <Text style={styles.summaryStatLabel}>Confirmed</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={[styles.summaryStatValue, { color: '#F44336' }]}>
              {summary.notPurchasedItems}
            </Text>
            <Text style={styles.summaryStatLabel}>Not Bought</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={[styles.summaryStatValue, { color: '#2196F3' }]}>
              {summary.additionalItems}
            </Text>
            <Text style={styles.summaryStatLabel}>Additional</Text>
          </View>
        </View>
        <View style={styles.efficiencyContainer}>
          <Text style={styles.efficiencyLabel}>Shopping Efficiency</Text>
          <View style={styles.efficiencyBar}>
            <View 
              style={[
                styles.efficiencyFill, 
                { width: `${summary.efficiency * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.efficiencyText}>{Math.round(summary.efficiency * 100)}%</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={styles.loadingText}>Initializing post-shopping scan...</Text>
      </SafeAreaView>
    );
  }

  if (!summary || !groceryList) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>Failed to load shopping summary</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post-Shopping Scan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        {renderSummary()}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.scanButton]}
            onPress={handleTakePhoto}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.actionButtonText}>📷 Scan Items</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.addButton]}
            onPress={() => setShowAddItemModal(true)}
          >
            <Text style={styles.actionButtonText}>➕ Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Items List */}
        <View style={styles.itemsContainer}>
          <Text style={styles.sectionTitle}>Purchase Items</Text>
          <FlatList
            data={summary.items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Complete Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.completeButton]}
          onPress={handleCompleteShopping}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.actionButtonText}>✅ Complete Shopping</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <CameraScreen
          onPhotoCaptured={handlePhotoCaptured}
          onCancel={() => setShowCamera(false)}
        />
      </Modal>

      {/* Photo Preview Modal */}
      <Modal visible={showPhotoPreview} animationType="slide">
        <PhotoPreview
          photoUri={selectedPhoto!}
          onConfirm={handlePhotoConfirmed}
          onCancel={handlePhotoCancelled}
        />
      </Modal>

      {/* Add Item Modal */}
      <Modal visible={showAddItemModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Additional Item</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Item name"
              value={newItem.name}
              onChangeText={(text) => setNewItem({ ...newItem, name: text })}
            />
            
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.quantityInput]}
                placeholder="Quantity"
                value={newItem.quantity.toString()}
                onChangeText={(text) => setNewItem({ ...newItem, quantity: parseInt(text) || 1 })}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.unitInput]}
                placeholder="Unit"
                value={newItem.unit}
                onChangeText={(text) => setNewItem({ ...newItem, unit: text })}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddItemModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addItemButton]}
                onPress={handleAddAdditionalItem}
              >
                <Text style={styles.addItemButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryStat: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  efficiencyContainer: {
    alignItems: 'center',
  },
  efficiencyLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  efficiencyBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  efficiencyFill: {
    height: '100%',
    backgroundColor: '#27ae60',
    borderRadius: 4,
  },
  efficiencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  scanButton: {
    backgroundColor: '#27ae60',
  },
  addButton: {
    backgroundColor: '#3498db',
  },
  completeButton: {
    backgroundColor: '#e67e22',
    marginTop: 16,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  itemsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
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
  itemDetails: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  expiryDate: {
    fontSize: 12,
    color: '#e67e22',
    marginBottom: 2,
  },
  itemNotes: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quantityInput: {
    flex: 1,
    marginRight: 8,
  },
  unitInput: {
    flex: 1,
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
  },
  addItemButton: {
    backgroundColor: '#27ae60',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  addItemButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
