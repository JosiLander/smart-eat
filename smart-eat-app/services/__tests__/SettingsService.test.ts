import SettingsService, {
  DietaryPreference,
  NotificationPreference,
  HouseholdSettings,
  ShoppingPreferences,
  AppBehaviorSettings,
  PrivacySettings,
  UserSettings,
} from '../SettingsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('SettingsService', () => {
  let settingsService: SettingsService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset the singleton instance
    (SettingsService as any).instance = undefined;
    
    // Create a new instance
    settingsService = SettingsService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = SettingsService.getInstance();
      const instance2 = SettingsService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize with default settings when no stored settings exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      await settingsService.initialize();
      
      const settings = await settingsService.getAllSettings();
      expect(settings.dietaryPreferences).toHaveLength(8);
      expect(settings.notifications).toHaveLength(4);
      expect(settings.household.adults).toBe(2);
      expect(settings.household.children).toBe(0);
    });

    it('should load stored settings when they exist', async () => {
      const storedSettings = {
        household: { adults: 3, children: 2, childAges: [5, 8], autoAdjustPortions: true },
        shopping: { units: 'imperial' },
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedSettings));
      
      await settingsService.initialize();
      
      const settings = await settingsService.getAllSettings();
      expect(settings.household.adults).toBe(3);
      expect(settings.household.children).toBe(2);
      expect(settings.shopping.units).toBe('imperial');
    });

    it('should handle initialization errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      await settingsService.initialize();
      
      const settings = await settingsService.getAllSettings();
      expect(settings).toBeDefined();
      expect(settings.dietaryPreferences).toHaveLength(8);
    });
  });

  describe('Dietary Preferences', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      await settingsService.initialize();
    });

    it('should get dietary preferences', async () => {
      const preferences = await settingsService.getDietaryPreferences();
      expect(preferences).toHaveLength(8);
      expect(preferences[0].name).toBe('Vegan');
      expect(preferences[0].icon).toBe('🌱');
    });

    it('should update dietary preference', async () => {
      const preference: DietaryPreference = {
        id: 'vegan',
        name: 'Vegan Diet',
        icon: '🌱',
        isCustom: false,
      };
      
      await settingsService.updateDietaryPreference(preference);
      
      const preferences = await settingsService.getDietaryPreferences();
      const updatedPreference = preferences.find(p => p.id === 'vegan');
      expect(updatedPreference?.name).toBe('Vegan Diet');
    });

    it('should add custom dietary preference', async () => {
      const customPreference = await settingsService.addCustomDietaryPreference('Keto', '🥩');
      
      expect(customPreference.name).toBe('Keto');
      expect(customPreference.icon).toBe('🥩');
      expect(customPreference.isCustom).toBe(true);
      expect(customPreference.id).toMatch(/^custom_\d+$/);
      
      const preferences = await settingsService.getDietaryPreferences();
      expect(preferences).toHaveLength(9);
    });

    it('should remove dietary preference', async () => {
      await settingsService.removeDietaryPreference('vegan');
      
      const preferences = await settingsService.getDietaryPreferences();
      expect(preferences).toHaveLength(7);
      expect(preferences.find(p => p.id === 'vegan')).toBeUndefined();
    });
  });

  describe('Notification Preferences', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      await settingsService.initialize();
    });

    it('should get notification preferences', async () => {
      const preferences = await settingsService.getNotificationPreferences();
      expect(preferences).toHaveLength(4);
      expect(preferences[0].type).toBe('expiration');
      expect(preferences[0].enabled).toBe(true);
    });

    it('should update notification preference', async () => {
      await settingsService.updateNotificationPreference('expiration', { enabled: false });
      
      const preferences = await settingsService.getNotificationPreferences();
      const expirationPref = preferences.find(p => p.type === 'expiration');
      expect(expirationPref?.enabled).toBe(false);
    });

    it('should update notification frequency', async () => {
      await settingsService.updateNotificationPreference('recipe', { frequency: 'weekly' });
      
      const preferences = await settingsService.getNotificationPreferences();
      const recipePref = preferences.find(p => p.type === 'recipe');
      expect(recipePref?.frequency).toBe('weekly');
    });
  });

  describe('Household Settings', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      await settingsService.initialize();
    });

    it('should get household settings', async () => {
      const settings = await settingsService.getHouseholdSettings();
      expect(settings.adults).toBe(2);
      expect(settings.children).toBe(0);
      expect(settings.autoAdjustPortions).toBe(true);
    });

    it('should update household settings', async () => {
      await settingsService.updateHouseholdSettings({
        adults: 3,
        children: 2,
        childAges: [5, 8],
      });
      
      const settings = await settingsService.getHouseholdSettings();
      expect(settings.adults).toBe(3);
      expect(settings.children).toBe(2);
      expect(settings.childAges).toEqual([5, 8]);
    });

    it('should update auto-adjust portions setting', async () => {
      await settingsService.updateHouseholdSettings({ autoAdjustPortions: false });
      
      const settings = await settingsService.getHouseholdSettings();
      expect(settings.autoAdjustPortions).toBe(false);
    });
  });

  describe('Shopping Preferences', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      await settingsService.initialize();
    });

    it('should get shopping preferences', async () => {
      const preferences = await settingsService.getShoppingPreferences();
      expect(preferences.shoppingFrequency).toBe('weekly');
      expect(preferences.units).toBe('metric');
      expect(preferences.budgetConscious).toBe(false);
    });

    it('should update shopping preferences', async () => {
      await settingsService.updateShoppingPreferences({
        shoppingFrequency: 'daily',
        units: 'imperial',
        budgetConscious: true,
      });
      
      const preferences = await settingsService.getShoppingPreferences();
      expect(preferences.shoppingFrequency).toBe('daily');
      expect(preferences.units).toBe('imperial');
      expect(preferences.budgetConscious).toBe(true);
    });

    it('should update store layout', async () => {
      const newLayout = ['produce', 'meat', 'dairy', 'pantry'];
      await settingsService.updateShoppingPreferences({ storeLayout: newLayout });
      
      const preferences = await settingsService.getShoppingPreferences();
      expect(preferences.storeLayout).toEqual(newLayout);
    });
  });

  describe('App Behavior Settings', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      await settingsService.initialize();
    });

    it('should get app behavior settings', async () => {
      const settings = await settingsService.getAppBehaviorSettings();
      expect(settings.cameraQuality).toBe('medium');
      expect(settings.offlineMode).toBe(false);
      expect(settings.syncFrequency).toBe('immediate');
    });

    it('should update app behavior settings', async () => {
      await settingsService.updateAppBehaviorSettings({
        cameraQuality: 'high',
        offlineMode: true,
        syncFrequency: 'daily',
      });
      
      const settings = await settingsService.getAppBehaviorSettings();
      expect(settings.cameraQuality).toBe('high');
      expect(settings.offlineMode).toBe(true);
      expect(settings.syncFrequency).toBe('daily');
    });

    it('should update auto-save settings', async () => {
      await settingsService.updateAppBehaviorSettings({
        autoSave: {
          shoppingLists: false,
          inventory: true,
        },
      });
      
      const settings = await settingsService.getAppBehaviorSettings();
      expect(settings.autoSave.shoppingLists).toBe(false);
      expect(settings.autoSave.inventory).toBe(true);
    });
  });

  describe('Privacy Settings', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      await settingsService.initialize();
    });

    it('should get privacy settings', async () => {
      const settings = await settingsService.getPrivacySettings();
      expect(settings.shareAnalytics).toBe(true);
      expect(settings.shareCrashReports).toBe(true);
      expect(settings.shareFeatureSuggestions).toBe(false);
    });

    it('should update privacy settings', async () => {
      await settingsService.updatePrivacySettings({
        shareAnalytics: false,
        shareCrashReports: false,
        shareFeatureSuggestions: true,
      });
      
      const settings = await settingsService.getPrivacySettings();
      expect(settings.shareAnalytics).toBe(false);
      expect(settings.shareCrashReports).toBe(false);
      expect(settings.shareFeatureSuggestions).toBe(true);
    });
  });

  describe('General Settings Management', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      await settingsService.initialize();
    });

    it('should get all settings', async () => {
      const settings = await settingsService.getAllSettings();
      expect(settings).toHaveProperty('dietaryPreferences');
      expect(settings).toHaveProperty('notifications');
      expect(settings).toHaveProperty('household');
      expect(settings).toHaveProperty('shopping');
      expect(settings).toHaveProperty('appBehavior');
      expect(settings).toHaveProperty('privacy');
    });

    it('should reset to defaults', async () => {
      // First, change some settings
      await settingsService.updateHouseholdSettings({ adults: 5 });
      await settingsService.updateShoppingPreferences({ units: 'imperial' });
      
      // Reset to defaults
      await settingsService.resetToDefaults();
      
      const settings = await settingsService.getAllSettings();
      expect(settings.household.adults).toBe(2);
      expect(settings.shopping.units).toBe('metric');
    });

    it('should export settings', async () => {
      const exported = await settingsService.exportSettings();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveProperty('dietaryPreferences');
      expect(parsed).toHaveProperty('notifications');
      expect(parsed).toHaveProperty('household');
    });

    it('should import settings', async () => {
      const importedSettings = {
        household: { adults: 4, children: 1, childAges: [6], autoAdjustPortions: true },
        shopping: { units: 'imperial' },
      };
      
      const settingsJson = JSON.stringify(importedSettings);
      await settingsService.importSettings(settingsJson);
      
      const settings = await settingsService.getAllSettings();
      expect(settings.household.adults).toBe(4);
      expect(settings.shopping.units).toBe('imperial');
    });

    it('should handle invalid import data', async () => {
      await expect(settingsService.importSettings('invalid json')).rejects.toThrow('Invalid settings format');
    });
  });

  describe('Event Listeners', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      await settingsService.initialize();
    });

    it('should add and remove listeners', () => {
      const callback = jest.fn();
      
      settingsService.addListener('test_event', callback);
      settingsService.removeListener('test_event', callback);
      
      // This should not throw an error
      expect(true).toBe(true);
    });

    it('should notify listeners when settings are updated', async () => {
      const callback = jest.fn();
      settingsService.addListener('settings_updated', callback);
      
      await settingsService.updateHouseholdSettings({ adults: 3 });
      
      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        household: expect.objectContaining({ adults: 3 }),
      }));
    });
  });

  describe('Validation', () => {
    beforeEach(async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      await settingsService.initialize();
    });

    it('should validate household settings', () => {
      const result = settingsService.validateSetting('household.adults', 5);
      expect(result.isValid).toBe(true);
      
      const invalidResult = settingsService.validateSetting('household.adults', -1);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Must be a number between 0 and 20');
    });

    it('should validate expiration buffer', () => {
      const result = settingsService.validateSetting('shopping.expirationBuffer', 5);
      expect(result.isValid).toBe(true);
      
      const invalidResult = settingsService.validateSetting('shopping.expirationBuffer', 35);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Must be a number between 0 and 30 days');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      await expect(settingsService.updateHouseholdSettings({ adults: 3 })).rejects.toThrow('Failed to save settings');
    });

    it('should handle initialization errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      await settingsService.initialize();
      
      const settings = await settingsService.getAllSettings();
      expect(settings).toBeDefined();
    });
  });
});
