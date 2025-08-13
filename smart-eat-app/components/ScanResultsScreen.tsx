import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Platform,
  TextInput
} from 'react-native';
import { RecognizedProduct } from '../services/AIService';
import { ExtractedDate } from '../services/OCRService';
import { ScanResult } from '../services/ScanningService';

interface ScanResultsScreenProps {
  scanResult: ScanResult;
  imageUri: string;
  onConfirm: (products: RecognizedProduct[], dates: ExtractedDate[]) => void;
  onRetake: () => void;
  onCancel: () => void;
}

interface EditableProduct extends RecognizedProduct {
  isSelected: boolean;
  customName?: string;
  customQuantity?: number;
  customUnit?: string;
}

export const ScanResultsScreen: React.FC<ScanResultsScreenProps> = ({
  scanResult,
  imageUri,
  onConfirm,
  onRetake,
  onCancel,
}) => {
  const [editableProducts, setEditableProducts] = useState<EditableProduct[]>(
    scanResult.products.map(product => ({
      ...product,
      isSelected: true,
    }))
  );
  const [selectedDates, setSelectedDates] = useState<ExtractedDate[]>(
    scanResult.dates
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProductToggle = (index: number) => {
    const updated = [...editableProducts];
    updated[index].isSelected = !updated[index].isSelected;
    setEditableProducts(updated);
  };

  const handleProductEdit = (index: number, field: keyof EditableProduct, value: any) => {
    const updated = [...editableProducts];
    updated[index] = { ...updated[index], [field]: value };
    setEditableProducts(updated);
  };

  const handleDateToggle = (index: number) => {
    const updated = [...selectedDates];
    if (updated[index]) {
      updated.splice(index, 1);
    } else {
      updated.push(scanResult.dates[index]);
    }
    setSelectedDates(updated);
  };

  const handleConfirm = async () => {
    const selectedProducts = editableProducts.filter(p => p.isSelected);
    
    if (selectedProducts.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to add to your inventory.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Transform editable products back to RecognizedProduct format
      const confirmedProducts: RecognizedProduct[] = selectedProducts.map(product => ({
        name: product.customName || product.name,
        confidence: product.confidence,
        category: product.category,
        suggestedExpirationDays: product.suggestedExpirationDays,
        barcode: product.barcode,
      }));

      onConfirm(confirmedProducts, selectedDates);
    } catch (error) {
      console.error('Error confirming scan results:', error);
      Alert.alert('Error', 'Failed to save items. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#27ae60'; // Green
    if (confidence >= 0.6) return '#f39c12'; // Orange
    return '#e74c3c'; // Red
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Results</Text>
        <Text style={styles.subtitle}>
          Review and edit the recognized items
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Products Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recognized Products</Text>
          {editableProducts.length > 0 ? (
            editableProducts.map((product, index) => (
              <View key={index} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <TouchableOpacity
                    style={[styles.checkbox, product.isSelected && styles.checkboxSelected]}
                    onPress={() => handleProductToggle(index)}
                  >
                    {product.isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>
                      {product.customName || product.name}
                    </Text>
                    <Text style={styles.productCategory}>{product.category}</Text>
                  </View>
                  
                  <View style={styles.confidenceBadge}>
                    <Text style={[
                      styles.confidenceText,
                      { color: getConfidenceColor(product.confidence) }
                    ]}>
                      {getConfidenceText(product.confidence)}
                    </Text>
                    <Text style={styles.confidencePercent}>
                      {Math.round(product.confidence * 100)}%
                    </Text>
                  </View>
                </View>
                
                {product.isSelected && (
                  <View style={styles.productDetails}>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Name:</Text>
                      <TextInput
                        style={styles.textInput}
                        value={product.customName || product.name}
                        onChangeText={(text) => handleProductEdit(index, 'customName', text)}
                        placeholder="Product name"
                      />
                    </View>
                    
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Quantity:</Text>
                      <TextInput
                        style={styles.quantityInput}
                        value={product.customQuantity?.toString() || '1'}
                        onChangeText={(text) => handleProductEdit(index, 'customQuantity', parseInt(text) || 1)}
                        keyboardType="numeric"
                        placeholder="1"
                      />
                      <TextInput
                        style={styles.unitInput}
                        value={product.customUnit || 'piece'}
                        onChangeText={(text) => handleProductEdit(index, 'customUnit', text)}
                        placeholder="piece"
                      />
                    </View>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No products recognized</Text>
              <Text style={styles.emptySubtext}>
                Try taking a clearer photo or adjusting the lighting
              </Text>
            </View>
          )}
        </View>

        {/* Dates Section */}
        {scanResult.dates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expiration Dates</Text>
            {scanResult.dates.map((date, index) => (
              <View key={index} style={styles.dateCard}>
                <View style={styles.dateHeader}>
                  <TouchableOpacity
                    style={[styles.checkbox, selectedDates.includes(date) && styles.checkboxSelected]}
                    onPress={() => handleDateToggle(index)}
                  >
                    {selectedDates.includes(date) && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateText}>{date.rawText}</Text>
                    <Text style={styles.dateFormat}>{date.format.replace('-', ' ')}</Text>
                  </View>
                  
                  <View style={styles.confidenceBadge}>
                    <Text style={[
                      styles.confidenceText,
                      { color: getConfidenceColor(date.confidence) }
                    ]}>
                      {getConfidenceText(date.confidence)}
                    </Text>
                    <Text style={styles.confidencePercent}>
                      {Math.round(date.confidence * 100)}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Processing Time */}
        <View style={styles.processingInfo}>
          <Text style={styles.processingText}>
            Processing time: {scanResult.processingTime}ms
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onRetake}>
          <Text style={styles.secondaryButtonText}>Retake Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.primaryButton, isProcessing && styles.primaryButtonDisabled]}
          onPress={handleConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Add to Inventory</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 14,
    color: '#7f8c8d',
    textTransform: 'capitalize',
  },
  confidenceBadge: {
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  confidencePercent: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  productDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    width: 80,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  },
  quantityInput: {
    width: 60,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    marginRight: 8,
  },
  unitInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  },
  dateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  dateFormat: {
    fontSize: 14,
    color: '#7f8c8d',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
  },
  processingInfo: {
    alignItems: 'center',
    padding: 16,
  },
  processingText: {
    fontSize: 12,
    color: '#95a5a6',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
}); 