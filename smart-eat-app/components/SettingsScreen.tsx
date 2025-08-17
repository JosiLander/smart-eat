import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import SettingsService, {
  SettingsSection,
  SettingsItem,
  UserSettings,
} from '../services/SettingsService';
import DietaryPreferencesSection from './settings/DietaryPreferencesSection';
import HouseholdManagementSection from './settings/HouseholdManagementSection';
import NotificationPreferencesSection from './settings/NotificationPreferencesSection';
import ShoppingPreferencesSection from './settings/ShoppingPreferencesSection';
import AppBehaviorSection from './settings/AppBehaviorSection';
import PrivacyDataSection from './settings/PrivacyDataSection';

interface SettingsScreenProps {
  navigation?: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const settingsService = SettingsService.getInstance();

  useEffect(() => {
    loadSettings();
    
    // Listen for settings updates
    const handleSettingsUpdate = (updatedSettings: UserSettings) => {
      setSettings(updatedSettings);
    };
    
    settingsService.addListener('settings_updated', handleSettingsUpdate);
    
    return () => {
      settingsService.removeListener('settings_updated', handleSettingsUpdate);
    };
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const userSettings = await settingsService.getAllSettings();
      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (section: string, key: string, value: any) => {
    if (!settings) return;

    try {
      switch (section) {
        case 'dietary':
          // Handle dietary preference updates
          break;
        case 'notifications':
          await settingsService.updateNotificationPreference(key, { enabled: value });
          break;
        case 'household':
          await settingsService.updateHouseholdSettings({ [key]: value });
          break;
        case 'shopping':
          await settingsService.updateShoppingPreferences({ [key]: value });
          break;
        case 'appBehavior':
          await settingsService.updateAppBehaviorSettings({ [key]: value });
          break;
        case 'privacy':
          await settingsService.updatePrivacySettings({ [key]: value });
          break;
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const getSettingsSections = (): SettingsSection[] => {
    if (!settings) return [];

    return [
      {
        icon: '🍽️',
        title: 'Dietary Preferences',
        subtitle: 'Manage your food restrictions',
        items: [
          {
            type: 'custom',
            key: 'dietary_preferences',
            label: 'Dietary Restrictions',
            value: settings.dietaryPreferences,
            onChange: (value) => handleSettingChange('dietary', 'preferences', value),
          },
        ],
        hasSubsections: true,
      },
      {
        icon: '👨‍👩‍👧‍👦',
        title: 'Household Management',
        subtitle: 'Configure your family setup',
        items: [
          {
            type: 'custom',
            key: 'household_settings',
            label: 'Household Configuration',
            value: settings.household,
            onChange: (value) => handleSettingChange('household', 'settings', value),
          },
        ],
      },
      {
        icon: '🔔',
        title: 'Notifications',
        subtitle: 'Manage your alert preferences',
        items: [
          {
            type: 'custom',
            key: 'notification_preferences',
            label: 'Notification Settings',
            value: settings.notifications,
            onChange: (value) => handleSettingChange('notifications', 'preferences', value),
          },
        ],
      },
      {
        icon: '🛒',
        title: 'Shopping & Inventory',
        subtitle: 'Configure your shopping experience',
        items: [
          {
            type: 'custom',
            key: 'shopping_preferences',
            label: 'Shopping Configuration',
            value: settings.shopping,
            onChange: (value) => handleSettingChange('shopping', 'preferences', value),
          },
        ],
      },
      {
        icon: '⚙️',
        title: 'App Behavior',
        subtitle: 'Customize your app experience',
        items: [
          {
            type: 'custom',
            key: 'app_behavior_settings',
            label: 'App Behavior Configuration',
            value: settings.appBehavior,
            onChange: (value) => handleSettingChange('appBehavior', 'settings', value),
          },
        ],
      },
      {
        icon: '🔒',
        title: 'Privacy & Data',
        subtitle: 'Control your data and privacy',
        items: [
          {
            type: 'custom',
            key: 'privacy_settings',
            label: 'Privacy Configuration',
            value: settings.privacy,
            onChange: (value) => handleSettingChange('privacy', 'settings', value),
          },
        ],
      },
    ];
  };

  const handleExportData = async () => {
    try {
      const data = await settingsService.exportSettings();
      Alert.alert('Data Exported', 'Your settings have been exported successfully');
      // In a real app, you would share this data or save it to a file
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deleted', 'Your account has been deleted');
            // In a real app, you would call the delete account API
          },
        },
      ]
    );
  };

  const renderSettingItem = (item: SettingsItem) => {
    switch (item.type) {
      case 'toggle':
        return (
          <View key={item.key} style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>{item.label}</Text>
              {item.description && (
                <Text style={styles.settingDescription}>{item.description}</Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.toggle, item.value && styles.toggleActive]}
              onPress={() => item.onChange(!item.value)}
            >
              <View style={[styles.toggleThumb, item.value && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        );

      case 'select':
        return (
          <View key={item.key} style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>{item.label}</Text>
              {item.description && (
                <Text style={styles.settingDescription}>{item.description}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => {
                // In a real app, you would show a picker here
                Alert.alert('Select Option', 'Choose an option', [
                  ...(item.options || []).map(option => ({
                    text: option,
                    onPress: () => item.onChange(option),
                  })),
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
            >
              <Text style={styles.selectButtonText}>{item.value}</Text>
              <Text style={styles.selectButtonArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        );

      case 'input':
        return (
          <View key={item.key} style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>{item.label}</Text>
              {item.description && (
                <Text style={styles.settingDescription}>{item.description}</Text>
              )}
            </View>
            <TextInput
              style={styles.input}
              value={String(item.value)}
              onChangeText={(text) => item.onChange(Number(text) || 0)}
              keyboardType="numeric"
              placeholder="Enter value"
            />
          </View>
        );

      case 'button':
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.buttonItem}
            onPress={() => item.onChange(null)}
          >
            <Text style={styles.buttonText}>{item.label}</Text>
          </TouchableOpacity>
        );

      case 'custom':
        if (item.key === 'dietary_preferences') {
          return (
            <View key={item.key} style={styles.customComponentContainer}>
              <DietaryPreferencesSection
                preferences={item.value}
                onPreferencesChange={(preferences) => item.onChange(preferences)}
              />
            </View>
          );
        }
        if (item.key === 'household_settings') {
          return (
            <View key={item.key} style={styles.customComponentContainer}>
              <HouseholdManagementSection
                settings={item.value}
                onSettingsChange={(settings) => item.onChange(settings)}
              />
            </View>
          );
        }
        if (item.key === 'notification_preferences') {
          return (
            <View key={item.key} style={styles.customComponentContainer}>
              <NotificationPreferencesSection
                preferences={item.value}
                onPreferencesChange={(preferences) => item.onChange(preferences)}
              />
            </View>
          );
        }
        if (item.key === 'shopping_preferences') {
          return (
            <View key={item.key} style={styles.customComponentContainer}>
              <ShoppingPreferencesSection
                preferences={item.value}
                onPreferencesChange={(preferences) => item.onChange(preferences)}
              />
            </View>
          );
        }
        if (item.key === 'app_behavior_settings') {
          return (
            <View key={item.key} style={styles.customComponentContainer}>
              <AppBehaviorSection
                settings={item.value}
                onSettingsChange={(settings) => item.onChange(settings)}
              />
            </View>
          );
        }
        if (item.key === 'privacy_settings') {
          return (
            <View key={item.key} style={styles.customComponentContainer}>
              <PrivacyDataSection
                settings={item.value}
                onSettingsChange={(settings) => item.onChange(settings)}
              />
            </View>
          );
        }
        return (
          <View key={item.key} style={styles.settingItem}>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Text style={styles.settingDescription}>Custom component needed</Text>
          </View>
        );

      default:
        return null;
    }
  };

  const renderSettingsSection = (section: SettingsSection) => {
    const isExpanded = expandedSection === section.title;
    const filteredItems = section.items.filter(item =>
      searchQuery === '' || 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filteredItems.length === 0) return null;

    return (
      <View key={section.title} style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setExpandedSection(isExpanded ? null : section.title)}
        >
          <View style={styles.sectionHeaderContent}>
            <Text style={styles.sectionIcon}>{section.icon}</Text>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
            </View>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.sectionContent}>
            {filteredItems.map(renderSettingItem)}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  const sections = getSettingsSections();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search settings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => settingsService.resetToDefaults()}
        >
          <Text style={styles.quickActionText}>Reset All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={handleExportData}
        >
          <Text style={styles.quickActionText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Sections */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {sections.map(renderSettingsSection)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchButton: {
    padding: 8,
  },
  searchIcon: {
    fontSize: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  quickActionButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 12,
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 12,
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitleContainer: {
    flex: 1,
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
  expandIcon: {
    fontSize: 16,
    color: '#666',
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingDescription: {
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
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  selectButtonText: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  selectButtonArrow: {
    fontSize: 12,
    color: '#666',
  },
  input: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 14,
    color: '#333',
    minWidth: 80,
    textAlign: 'center',
  },
  buttonItem: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  customComponentContainer: {
    paddingVertical: 16,
  },
});

export default SettingsScreen;
