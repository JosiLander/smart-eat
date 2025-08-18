import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from '../theme';
import { Text, Heading2, BodyText } from './design-system/Text';
import { Button, PrimaryButton, OutlineButton } from './design-system/Button';
import { BackButton } from './design-system/BackButton';
import { SuccessMessage } from './design-system/SuccessMessage';
import { EnhancedTouchable } from './design-system/EnhancedTouchable';
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
  const theme = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
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
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
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
          <>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <TouchableOpacity
              style={[styles.toggle, item.value && styles.toggleActive]}
              onPress={() => item.onChange(!item.value)}
            >
              <View style={[styles.toggleThumb, item.value && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </>
        );

      case 'select':
        return (
          <>
            <Text style={styles.settingLabel}>{item.label}</Text>
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
          </>
        );

      case 'input':
        return (
          <>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <TextInput
              style={styles.input}
              value={String(item.value)}
              onChangeText={(text) => item.onChange(Number(text) || 0)}
              keyboardType="numeric"
              placeholder="Enter value"
            />
          </>
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
          <>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Text style={styles.settingValue}>Custom component needed</Text>
          </>
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
          activeOpacity={0.7}
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
            {filteredItems.map((item, index) => (
              <View key={item.key} style={[
                styles.settingItem,
                index === filteredItems.length - 1 && styles.settingItemLast
              ]}>
                {renderSettingItem(item)}
              </View>
            ))}
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Success Message */}
      <SuccessMessage
        message="Settings saved successfully!"
        visible={showSuccessMessage}
        onHide={() => setShowSuccessMessage(false)}
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Heading2 color="textPrimary" align="center">Settings</Heading2>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: theme.colors.backgroundSecondary,
            color: theme.colors.textPrimary 
          }]}
          placeholder="Search settings..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Settings Sections */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {sections.map(renderSettingsSection)}
        
        {/* Quick Actions at the bottom */}
        <View style={styles.quickActionsSection}>
          <OutlineButton
            onPress={() => settingsService.resetToDefaults()}
            style={styles.quickActionButton}
          >
            Reset All Settings
          </OutlineButton>
          <PrimaryButton
            onPress={handleExportData}
            style={styles.exportButton}
          >
            Export Data
          </PrimaryButton>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    paddingTop: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  sectionContent: {
    backgroundColor: '#fafafa',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  settingIcon: {
    fontSize: 16,
    color: '#999',
  },
  toggle: {
    width: 44,
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#27ae60',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
  },
  selectButtonText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginRight: 8,
    fontWeight: '500',
  },
  selectButtonArrow: {
    fontSize: 12,
    color: '#666',
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    color: '#1a1a1a',
    minWidth: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    fontSize: 14,
    fontWeight: '600',
  },
  customComponentContainer: {
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  quickActionsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    padding: 16,
  },
  quickActionButton: {
    marginBottom: 8,
  },
  exportButton: {
    marginBottom: 8,
  },
});

export default SettingsScreen;
