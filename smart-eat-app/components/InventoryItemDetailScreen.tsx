import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { InventoryService, InventoryItem } from '../services/InventoryService';
import { getExpiryColorInfo, formatDate, getDaysUntilExpiry } from '../utils/dateUtils';

interface InventoryItemDetailScreenProps {
  item: InventoryItem;
  onBack: () => void;
  onItemUpdated: () => void;
}

export const InventoryItemDetailScreen: React.FC<InventoryItemDetailScreenProps> = ({
  item,
  onBack,
  onItemUpdated,
}) => {
  const [loading, setLoading] = useState(false);

  const colorInfo = item.expirationDate ? getExpiryColorInfo(item.expirationDate) : null;
  const daysUntilExpiry = item.expirationDate ? getDaysUntilExpiry(item.expirationDate) : null;

  const handleDeleteItem = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await InventoryService.removeItem(item.id);
              onItemUpdated();
              onBack();
            } catch (error) {
              console.error('Failed to delete item:', error);
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleMarkAsUsed = () => {
    Alert.alert(
      'Mark as Used',
      `Mark "${item.name}" as used?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Used',
          onPress: async () => {
            try {
              setLoading(true);
              await InventoryService.removeItem(item.id);
              onItemUpdated();
              onBack();
            } catch (error) {
              console.error('Failed to mark item as used:', error);
              Alert.alert('Error', 'Failed to mark item as used. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Item Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.itemCard}>
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

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.detailValue}>
                {item.quantity} {item.unit}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </Text>
            </View>

            {item.expirationDate && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expiration Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(item.expirationDate)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: colorInfo?.backgroundColor }
                  ]}>
                    {daysUntilExpiry !== null && (
                      daysUntilExpiry > 0 
                        ? `${daysUntilExpiry} days remaining`
                        : `${Math.abs(daysUntilExpiry)} days ago`
                    )}
                  </Text>
                </View>
              </>
            )}

            {item.imageUri && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Image:</Text>
                <Text style={styles.detailValue}>Available</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Added:</Text>
              <Text style={styles.detailValue}>
                {item.addedAt ? formatDate(new Date(item.addedAt)) : 'Unknown'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.useButton]}
            onPress={handleMarkAsUsed}
            disabled={loading}
          >
            <Text style={styles.useButtonText}>Mark as Used</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteItem}
            disabled={loading}
          >
            <Text style={styles.deleteButtonText}>Delete Item</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  actionsSection: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  useButton: {
    backgroundColor: '#27ae60',
  },
  useButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
