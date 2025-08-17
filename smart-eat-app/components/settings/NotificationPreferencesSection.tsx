import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { NotificationPreference } from '../../services/SettingsService';

interface NotificationPreferencesSectionProps {
  preferences: NotificationPreference[];
  onPreferencesChange: (preferences: NotificationPreference[]) => void;
}

export const NotificationPreferencesSection: React.FC<NotificationPreferencesSectionProps> = ({
  preferences,
  onPreferencesChange,
}) => {
  const [showTimingModal, setShowTimingModal] = useState(false);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [editingPreference, setEditingPreference] = useState<NotificationPreference | null>(null);

  const notificationTypes = [
    {
      type: 'expiration',
      name: 'Expiration Alerts',
      description: 'Get notified when items are about to expire',
      icon: '⏰',
    },
    {
      type: 'recipe',
      name: 'Recipe Suggestions',
      description: 'Daily recipe recommendations based on your inventory',
      icon: '🍳',
    },
    {
      type: 'shopping',
      name: 'Shopping Reminders',
      description: 'Reminders to update your shopping list',
      icon: '🛒',
    },
    {
      type: 'inventory',
      name: 'Inventory Summaries',
      description: 'Weekly summaries of your inventory status',
      icon: '📦',
    },
  ];

  const timingOptions = [
    { label: 'Same day', value: 0 },
    { label: '1 day before', value: 1 },
    { label: '2 days before', value: 2 },
    { label: '3 days before', value: 3 },
    { label: '1 week before', value: 7 },
  ];

  const frequencyOptions = [
    { label: 'Immediate', value: 'immediate' },
    { label: 'Daily digest', value: 'daily' },
    { label: 'Weekly digest', value: 'weekly' },
  ];

  const toggleNotification = (type: string) => {
    const updatedPreferences = preferences.map(pref => 
      pref.type === type 
        ? { ...pref, enabled: !pref.enabled }
        : pref
    );
    onPreferencesChange(updatedPreferences);
  };

  const updateTiming = (timing: number) => {
    if (!editingPreference) return;

    const updatedPreferences = preferences.map(pref => 
      pref.type === editingPreference.type 
        ? { ...pref, timing }
        : pref
    );
    onPreferencesChange(updatedPreferences);
    setShowTimingModal(false);
    setEditingPreference(null);
  };

  const updateFrequency = (frequency: 'immediate' | 'daily' | 'weekly') => {
    if (!editingPreference) return;

    const updatedPreferences = preferences.map(pref => 
      pref.type === editingPreference.type 
        ? { ...pref, frequency }
        : pref
    );
    onPreferencesChange(updatedPreferences);
    setShowFrequencyModal(false);
    setEditingPreference(null);
  };

  const testNotification = () => {
    Alert.alert(
      'Test Notification',
      'This is a test notification to verify your settings are working correctly.',
      [
        { text: 'OK', onPress: () => console.log('Test notification acknowledged') },
      ]
    );
  };

  const getPreference = (type: string) => {
    return preferences.find(p => p.type === type) || {
      type,
      enabled: false,
      frequency: 'immediate' as const,
    };
  };

  const getTimingLabel = (timing?: number) => {
    if (timing === undefined) return '1 day before';
    const option = timingOptions.find(opt => opt.value === timing);
    return option ? option.label : '1 day before';
  };

  const getFrequencyLabel = (frequency: string) => {
    const option = frequencyOptions.find(opt => opt.value === frequency);
    return option ? option.label : 'Immediate';
  };

  const renderNotificationItem = (notificationType: typeof notificationTypes[0]) => {
    const preference = getPreference(notificationType.type);
    
    return (
      <View key={notificationType.type} style={styles.notificationItem}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationIcon}>{notificationType.icon}</Text>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationName}>{notificationType.name}</Text>
            <Text style={styles.notificationDescription}>{notificationType.description}</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, preference.enabled && styles.toggleActive]}
            onPress={() => toggleNotification(notificationType.type)}
          >
            <View style={[styles.toggleThumb, preference.enabled && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>
        
        {preference.enabled && (
          <View style={styles.notificationSettings}>
            {notificationType.type === 'expiration' && (
              <TouchableOpacity
                style={styles.settingButton}
                onPress={() => {
                  setEditingPreference(preference);
                  setShowTimingModal(true);
                }}
              >
                <Text style={styles.settingButtonLabel}>Timing:</Text>
                <Text style={styles.settingButtonValue}>{getTimingLabel(preference.timing)}</Text>
                <Text style={styles.settingButtonArrow}>▼</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => {
                setEditingPreference(preference);
                setShowFrequencyModal(true);
              }}
            >
              <Text style={styles.settingButtonLabel}>Frequency:</Text>
              <Text style={styles.settingButtonValue}>{getFrequencyLabel(preference.frequency)}</Text>
              <Text style={styles.settingButtonArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderTimingModal = () => (
    <Modal
      visible={showTimingModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTimingModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Expiration Alert Timing</Text>
          <Text style={styles.modalSubtitle}>When should you be notified about expiring items?</Text>
          
          <ScrollView style={styles.optionsList}>
            {timingOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  editingPreference?.timing === option.value && styles.optionItemSelected,
                ]}
                onPress={() => updateTiming(option.value)}
              >
                <Text style={[
                  styles.optionText,
                  editingPreference?.timing === option.value && styles.optionTextSelected,
                ]}>
                  {option.label}
                </Text>
                {editingPreference?.timing === option.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowTimingModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderFrequencyModal = () => (
    <Modal
      visible={showFrequencyModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFrequencyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Notification Frequency</Text>
          <Text style={styles.modalSubtitle}>How often should you receive notifications?</Text>
          
          <ScrollView style={styles.optionsList}>
            {frequencyOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  editingPreference?.frequency === option.value && styles.optionItemSelected,
                ]}
                onPress={() => updateFrequency(option.value as 'immediate' | 'daily' | 'weekly')}
              >
                <Text style={[
                  styles.optionText,
                  editingPreference?.frequency === option.value && styles.optionTextSelected,
                ]}>
                  {option.label}
                </Text>
                {editingPreference?.frequency === option.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowFrequencyModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <Text style={styles.sectionSubtitle}>Manage your alert preferences</Text>
      </View>

      <ScrollView style={styles.notificationsList}>
        {notificationTypes.map(renderNotificationItem)}
      </ScrollView>

      <TouchableOpacity
        style={styles.testButton}
        onPress={testNotification}
      >
        <Text style={styles.testButtonText}>🔔 Test Notifications</Text>
      </TouchableOpacity>

      {renderTimingModal()}
      {renderFrequencyModal()}
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
  notificationsList: {
    maxHeight: 400,
  },
  notificationItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  notificationDescription: {
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
  notificationSettings: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
  },
  settingButtonLabel: {
    fontSize: 14,
    color: '#666',
  },
  settingButtonValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginLeft: 8,
  },
  settingButtonArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  testButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
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
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionItemSelected: {
    backgroundColor: '#f0f8f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: '#27ae60',
    fontWeight: '500',
  },
  checkmark: {
    color: '#27ae60',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default NotificationPreferencesSection;
