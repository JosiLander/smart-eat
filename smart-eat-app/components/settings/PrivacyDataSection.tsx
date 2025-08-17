import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { PrivacySettings } from '../../services/SettingsService';

interface PrivacyDataSectionProps {
  settings: PrivacySettings;
  onSettingsChange: (settings: PrivacySettings) => void;
}

export const PrivacyDataSection: React.FC<PrivacyDataSectionProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [showDataModal, setShowDataModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dataTypes = [
    {
      type: 'profile',
      name: 'Profile Data',
      description: 'Personal information and preferences',
      icon: '👤',
      size: '2.3 KB',
    },
    {
      type: 'inventory',
      name: 'Inventory Data',
      description: 'Food items and quantities',
      icon: '📦',
      size: '15.7 KB',
    },
    {
      type: 'recipes',
      name: 'Recipe Data',
      description: 'Saved recipes and favorites',
      icon: '🍳',
      size: '8.9 KB',
    },
    {
      type: 'shopping',
      name: 'Shopping Lists',
      description: 'Shopping history and lists',
      icon: '🛒',
      size: '5.2 KB',
    },
    {
      type: 'analytics',
      name: 'Usage Analytics',
      description: 'App usage and interaction data',
      icon: '📊',
      size: '12.1 KB',
    },
  ];

  const toggleDataSharing = () => {
    onSettingsChange({
      ...settings,
      dataSharing: !settings.dataSharing,
    });
  };

  const toggleLocationServices = () => {
    onSettingsChange({
      ...settings,
      locationServices: !settings.locationServices,
    });
  };

  const togglePersonalizedAds = () => {
    onSettingsChange({
      ...settings,
      personalizedAds: !settings.personalizedAds,
    });
  };

  const toggleThirdPartySharing = () => {
    onSettingsChange({
      ...settings,
      thirdPartySharing: !settings.thirdPartySharing,
    });
  };

  const exportData = async () => {
    setIsExporting(true);
    setShowDataModal(false);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      Alert.alert(
        'Export Complete',
        'Your data has been exported successfully. You can find it in your Downloads folder.',
        [
          { text: 'OK', onPress: () => console.log('Export acknowledged') },
        ]
      );
    }, 3000);
  };

  const deleteAccount = () => {
    setIsDeleting(true);
    setShowDeleteModal(false);
    
    // Simulate deletion process
    setTimeout(() => {
      setIsDeleting(false);
      Alert.alert(
        'Account Deleted',
        'Your account and all associated data have been permanently deleted.',
        [
          { text: 'OK', onPress: () => console.log('Account deletion acknowledged') },
        ]
      );
    }, 2000);
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your data from this device. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Are you absolutely sure? This will delete ALL your data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: () => {
                    // Simulate data clearing
                    Alert.alert('Success', 'All data has been cleared');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const renderDataModal = () => (
    <Modal
      visible={showDataModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDataModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Export Your Data</Text>
          <Text style={styles.modalSubtitle}>Select what data you want to export</Text>
          
          <ScrollView style={styles.dataList}>
            {dataTypes.map(dataType => (
              <View key={dataType.type} style={styles.dataItem}>
                <View style={styles.dataInfo}>
                  <Text style={styles.dataIcon}>{dataType.icon}</Text>
                  <View style={styles.dataText}>
                    <Text style={styles.dataName}>{dataType.name}</Text>
                    <Text style={styles.dataDescription}>{dataType.description}</Text>
                  </View>
                </View>
                <Text style={styles.dataSize}>{dataType.size}</Text>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDataModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={exportData}
            >
              <Text style={styles.exportButtonText}>Export All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDeleteModal = () => (
    <Modal
      visible={showDeleteModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Delete Account</Text>
          <Text style={styles.modalSubtitle}>
            This action will permanently delete your account and all associated data. This cannot be undone.
          </Text>
          
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              All your data, including recipes, inventory, and preferences will be permanently lost.
            </Text>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={deleteAccount}
            >
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Privacy & Data Management</Text>
        <Text style={styles.sectionSubtitle}>Control your data and privacy</Text>
      </View>

      <View style={styles.privacySection}>
        <Text style={styles.sectionSubtitle}>Privacy Controls</Text>
        
        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Data sharing</Text>
            <Text style={styles.toggleDescription}>
              Allow sharing of anonymous usage data to improve the app
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, settings.dataSharing && styles.toggleActive]}
            onPress={toggleDataSharing}
          >
            <View style={[styles.toggleThumb, settings.dataSharing && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Location services</Text>
            <Text style={styles.toggleDescription}>
              Use location for store recommendations and local features
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, settings.locationServices && styles.toggleActive]}
            onPress={toggleLocationServices}
          >
            <View style={[styles.toggleThumb, settings.locationServices && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Personalized ads</Text>
            <Text style={styles.toggleDescription}>
              Show ads based on your interests and usage
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, settings.personalizedAds && styles.toggleActive]}
            onPress={togglePersonalizedAds}
          >
            <View style={[styles.toggleThumb, settings.personalizedAds && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Third-party sharing</Text>
            <Text style={styles.toggleDescription}>
              Allow sharing data with trusted third-party services
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, settings.thirdPartySharing && styles.toggleActive]}
            onPress={toggleThirdPartySharing}
          >
            <View style={[styles.toggleThumb, settings.thirdPartySharing && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dataSection}>
        <Text style={styles.sectionSubtitle}>Data Management</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowDataModal(true)}
        >
          <Text style={styles.actionButtonText}>📤 Export My Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={clearAllData}
        >
          <Text style={styles.actionButtonText}>🗑️ Clear All Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={() => setShowDeleteModal(true)}
        >
          <Text style={[styles.actionButtonText, styles.dangerButtonText]}>💀 Delete Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Your Data Rights</Text>
        <Text style={styles.infoText}>
          You have the right to access, modify, or delete your personal data at any time. 
          We process your data in accordance with our Privacy Policy and applicable data protection laws.
        </Text>
      </View>

      {renderDataModal()}
      {renderDeleteModal()}

      {(isExporting || isDeleting) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#27ae60" />
            <Text style={styles.loadingText}>
              {isExporting ? 'Exporting your data...' : 'Deleting your account...'}
            </Text>
          </View>
        </View>
      )}
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
    marginBottom: 12,
  },
  privacySection: {
    marginBottom: 24,
  },
  dataSection: {
    marginBottom: 24,
  },
  infoSection: {
    marginBottom: 16,
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
  actionButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: '#e74c3c',
  },
  dangerButtonText: {
    color: 'white',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
  dataList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  dataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  dataText: {
    flex: 1,
  },
  dataName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dataDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dataSize: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
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
  exportButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default PrivacyDataSection;
