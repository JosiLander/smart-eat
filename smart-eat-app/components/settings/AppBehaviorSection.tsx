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
import { AppBehaviorSettings } from '../../services/SettingsService';

interface AppBehaviorSectionProps {
  settings: AppBehaviorSettings;
  onSettingsChange: (settings: AppBehaviorSettings) => void;
}

export const AppBehaviorSection: React.FC<AppBehaviorSectionProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);

  const themeOptions = [
    { value: 'light', label: 'Light', icon: '☀️', description: 'Clean and bright interface' },
    { value: 'dark', label: 'Dark', icon: '🌙', description: 'Easy on the eyes in low light' },
    { value: 'auto', label: 'Auto', icon: '🔄', description: 'Follows system preference' },
  ];

  const languageOptions = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { value: 'it', label: 'Italiano', flag: '🇮🇹' },
    { value: 'pt', label: 'Português', flag: '🇵🇹' },
    { value: 'ja', label: '日本語', flag: '🇯🇵' },
    { value: 'ko', label: '한국어', flag: '🇰🇷' },
    { value: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  const performanceOptions = [
    { value: 'low', label: 'Low', description: 'Save battery and data', icon: '🔋' },
    { value: 'medium', label: 'Medium', description: 'Balanced performance', icon: '⚖️' },
    { value: 'high', label: 'High', description: 'Best experience', icon: '🚀' },
  ];

  const updateTheme = (theme: 'light' | 'dark' | 'auto') => {
    onSettingsChange({
      ...settings,
      theme,
    });
    setShowThemeModal(false);
  };

  const updateLanguage = (language: string) => {
    onSettingsChange({
      ...settings,
      language,
    });
    setShowLanguageModal(false);
  };

  const updatePerformance = (performance: 'low' | 'medium' | 'high') => {
    onSettingsChange({
      ...settings,
      performance,
    });
    setShowPerformanceModal(false);
  };

  const toggleAutoSave = () => {
    onSettingsChange({
      ...settings,
      autoSave: !settings.autoSave,
    });
  };

  const toggleOfflineMode = () => {
    onSettingsChange({
      ...settings,
      offlineMode: !settings.offlineMode,
    });
  };

  const toggleAnalytics = () => {
    onSettingsChange({
      ...settings,
      analytics: !settings.analytics,
    });
  };

  const toggleCrashReporting = () => {
    onSettingsChange({
      ...settings,
      crashReporting: !settings.crashReporting,
    });
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. The app will need to re-download some information.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // Simulate cache clearing
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const resetApp = () => {
    Alert.alert(
      'Reset App',
      'This will reset all app settings to default. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Reset',
              'Are you absolutely sure? This will reset ALL settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Reset Everything',
                  style: 'destructive',
                  onPress: () => {
                    // Simulate app reset
                    Alert.alert('Success', 'App has been reset to default settings');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const getThemeLabel = (theme: string) => {
    const option = themeOptions.find(opt => opt.value === theme);
    return option ? `${option.icon} ${option.label}` : 'Auto';
  };

  const getLanguageLabel = (language: string) => {
    const option = languageOptions.find(opt => opt.value === language);
    return option ? `${option.flag} ${option.label}` : 'English';
  };

  const getPerformanceLabel = (performance: string) => {
    const option = performanceOptions.find(opt => opt.value === performance);
    return option ? `${option.icon} ${option.label}` : 'Medium';
  };

  const renderThemeModal = () => (
    <Modal
      visible={showThemeModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowThemeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choose Theme</Text>
          
          <ScrollView style={styles.optionsList}>
            {themeOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  settings.theme === option.value && styles.optionItemSelected,
                ]}
                onPress={() => updateTheme(option.value as 'light' | 'dark' | 'auto')}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <View style={styles.optionText}>
                    <Text style={[
                      styles.optionLabel,
                      settings.theme === option.value && styles.optionLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                </View>
                {settings.theme === option.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowThemeModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderLanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choose Language</Text>
          
          <ScrollView style={styles.optionsList}>
            {languageOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  settings.language === option.value && styles.optionItemSelected,
                ]}
                onPress={() => updateLanguage(option.value)}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionIcon}>{option.flag}</Text>
                  <Text style={[
                    styles.optionLabel,
                    settings.language === option.value && styles.optionLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                </View>
                {settings.language === option.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowLanguageModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderPerformanceModal = () => (
    <Modal
      visible={showPerformanceModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPerformanceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Performance Settings</Text>
          
          <ScrollView style={styles.optionsList}>
            {performanceOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  settings.performance === option.value && styles.optionItemSelected,
                ]}
                onPress={() => updatePerformance(option.value as 'low' | 'medium' | 'high')}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <View style={styles.optionText}>
                    <Text style={[
                      styles.optionLabel,
                      settings.performance === option.value && styles.optionLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                </View>
                {settings.performance === option.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowPerformanceModal(false)}
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
        <Text style={styles.sectionTitle}>App Behavior</Text>
        <Text style={styles.sectionSubtitle}>Customize your app experience</Text>
      </View>

      <View style={styles.appearanceSection}>
        <Text style={styles.sectionSubtitle}>Appearance</Text>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setShowThemeModal(true)}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Theme</Text>
            <Text style={styles.settingDescription}>Choose your preferred theme</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.settingValueText}>{getThemeLabel(settings.theme)}</Text>
            <Text style={styles.settingArrow}>▼</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setShowLanguageModal(true)}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Language</Text>
            <Text style={styles.settingDescription}>Select your preferred language</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.settingValueText}>{getLanguageLabel(settings.language)}</Text>
            <Text style={styles.settingArrow}>▼</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.performanceSection}>
        <Text style={styles.sectionSubtitle}>Performance</Text>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setShowPerformanceModal(true)}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Performance Mode</Text>
            <Text style={styles.settingDescription}>Balance between performance and battery</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.settingValueText}>{getPerformanceLabel(settings.performance)}</Text>
            <Text style={styles.settingArrow}>▼</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Auto-save</Text>
            <Text style={styles.toggleDescription}>
              Automatically save changes as you make them
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, settings.autoSave && styles.toggleActive]}
            onPress={toggleAutoSave}
          >
            <View style={[styles.toggleThumb, settings.autoSave && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Offline mode</Text>
            <Text style={styles.toggleDescription}>
              Work without internet connection
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, settings.offlineMode && styles.toggleActive]}
            onPress={toggleOfflineMode}
          >
            <View style={[styles.toggleThumb, settings.offlineMode && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.privacySection}>
        <Text style={styles.sectionSubtitle}>Privacy & Analytics</Text>
        
        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Analytics</Text>
            <Text style={styles.toggleDescription}>
              Help improve the app with anonymous usage data
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, settings.analytics && styles.toggleActive]}
            onPress={toggleAnalytics}
          >
            <View style={[styles.toggleThumb, settings.analytics && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Crash reporting</Text>
            <Text style={styles.toggleDescription}>
              Send crash reports to help fix bugs
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, settings.crashReporting && styles.toggleActive]}
            onPress={toggleCrashReporting}
          >
            <View style={[styles.toggleThumb, settings.crashReporting && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.maintenanceSection}>
        <Text style={styles.sectionSubtitle}>Maintenance</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={clearCache}
        >
          <Text style={styles.actionButtonText}>🗑️ Clear Cache</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={resetApp}
        >
          <Text style={[styles.actionButtonText, styles.dangerButtonText]}>🔄 Reset App</Text>
        </TouchableOpacity>
      </View>

      {renderThemeModal()}
      {renderLanguageModal()}
      {renderPerformanceModal()}
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
  appearanceSection: {
    marginBottom: 24,
  },
  performanceSection: {
    marginBottom: 24,
  },
  privacySection: {
    marginBottom: 24,
  },
  maintenanceSection: {
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: '500',
    marginRight: 8,
  },
  settingArrow: {
    fontSize: 12,
    color: '#666',
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
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
  },
  optionLabelSelected: {
    color: '#27ae60',
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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

export default AppBehaviorSection;
