import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for settings management
export interface SettingsItem {
  type: 'toggle' | 'select' | 'input' | 'button' | 'custom';
  key: string;
  label: string;
  description?: string;
  value: any;
  options?: any[];
  validation?: ValidationRule[];
  onChange: (value: any) => void;
}

export interface SettingsSection {
  icon: string;
  title: string;
  subtitle: string;
  items: SettingsItem[];
  hasSubsections?: boolean;
  requiresConfirmation?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface DietaryPreference {
  id: string;
  name: string;
  icon: string;
  isCustom: boolean;
  enabled?: boolean;
  familyMemberId?: string;
}

export interface NotificationPreference {
  type: 'expiration' | 'recipe' | 'shopping' | 'inventory';
  enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  timing?: number; // days before for expiration alerts
}

export interface HouseholdSettings {
  adults: number;
  children: number;
  childAges: number[];
  autoAdjustPortions: boolean;
}

export interface ShoppingPreferences {
  storeLayout: string[];
  shoppingFrequency: 'daily' | 'twice-weekly' | 'weekly' | 'bi-weekly';
  budgetConscious: boolean;
  preferOrganic: boolean;
  preferLocal: boolean;
  expirationBuffer: number;
  units: 'metric' | 'imperial';
}

export interface AppBehaviorSettings {
  cameraQuality: 'high' | 'medium' | 'low';
  offlineMode: boolean;
  syncFrequency: 'immediate' | 'hourly' | 'daily';
  autoSave: {
    shoppingLists: boolean;
    inventory: boolean;
  };
  language: string;
  region: string;
}

export interface PrivacySettings {
  shareAnalytics: boolean;
  shareCrashReports: boolean;
  shareFeatureSuggestions: boolean;
}

export interface UserSettings {
  dietaryPreferences: DietaryPreference[];
  notifications: NotificationPreference[];
  household: HouseholdSettings;
  shopping: ShoppingPreferences;
  appBehavior: AppBehaviorSettings;
  privacy: PrivacySettings;
}

class SettingsService {
  private static instance: SettingsService;
  private settings: UserSettings;
  private listeners: Map<string, Function[]> = new Map();
  private isInitialized = false;

  private constructor() {
    this.settings = this.getDefaultSettings();
  }

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  private getDefaultSettings(): UserSettings {
    return {
      dietaryPreferences: [
        { id: 'vegan', name: 'Vegan', icon: '🌱', isCustom: false, enabled: false },
        { id: 'vegetarian', name: 'Vegetarian', icon: '🥬', isCustom: false, enabled: false },
        { id: 'gluten-free', name: 'Gluten-free', icon: '🌾', isCustom: false, enabled: false },
        { id: 'dairy-free', name: 'Dairy-free', icon: '🥛', isCustom: false, enabled: false },
        { id: 'nut-free', name: 'Nut-free', icon: '🥜', isCustom: false, enabled: false },
        { id: 'soy-free', name: 'Soy-free', icon: '🫘', isCustom: false, enabled: false },
        { id: 'shellfish-free', name: 'Shellfish-free', icon: '🦐', isCustom: false, enabled: false },
        { id: 'egg-free', name: 'Egg-free', icon: '🥚', isCustom: false, enabled: false },
      ],
      notifications: [
        { type: 'expiration', enabled: true, frequency: 'immediate', timing: 1 },
        { type: 'recipe', enabled: true, frequency: 'daily' },
        { type: 'shopping', enabled: true, frequency: 'weekly' },
        { type: 'inventory', enabled: false, frequency: 'weekly' },
      ],
      household: {
        adults: 2,
        children: 0,
        childAges: [],
        autoAdjustPortions: true,
      },
      shopping: {
        storeLayout: ['produce', 'dairy', 'meat', 'pantry'],
        shoppingFrequency: 'weekly',
        budgetConscious: false,
        preferOrganic: false,
        preferLocal: false,
        expirationBuffer: 3,
        units: 'metric',
      },
      appBehavior: {
        cameraQuality: 'medium',
        offlineMode: false,
        syncFrequency: 'immediate',
        autoSave: {
          shoppingLists: true,
          inventory: true,
        },
        language: 'en',
        region: 'US',
      },
      privacy: {
        shareAnalytics: true,
        shareCrashReports: true,
        shareFeatureSuggestions: false,
      },
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const storedSettings = await AsyncStorage.getItem('user_settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        this.settings = { ...this.getDefaultSettings(), ...parsed };
      } else {
        await this.saveSettings();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      // Fall back to default settings
      this.settings = this.getDefaultSettings();
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('user_settings', JSON.stringify(this.settings));
      this.notifyListeners('settings_updated', this.settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  // Dietary Preferences
  async getDietaryPreferences(): Promise<DietaryPreference[]> {
    await this.initialize();
    return this.settings.dietaryPreferences;
  }

  async updateDietaryPreference(preference: DietaryPreference): Promise<void> {
    await this.initialize();
    const index = this.settings.dietaryPreferences.findIndex(p => p.id === preference.id);
    if (index >= 0) {
      this.settings.dietaryPreferences[index] = preference;
    } else {
      this.settings.dietaryPreferences.push(preference);
    }
    await this.saveSettings();
  }

  async addCustomDietaryPreference(name: string, icon: string): Promise<DietaryPreference> {
    await this.initialize();
    const customPreference: DietaryPreference = {
      id: `custom_${Date.now()}`,
      name,
      icon,
      isCustom: true,
    };
    this.settings.dietaryPreferences.push(customPreference);
    await this.saveSettings();
    return customPreference;
  }

  async removeDietaryPreference(id: string): Promise<void> {
    await this.initialize();
    this.settings.dietaryPreferences = this.settings.dietaryPreferences.filter(p => p.id !== id);
    await this.saveSettings();
  }

  // Notifications
  async getNotificationPreferences(): Promise<NotificationPreference[]> {
    await this.initialize();
    return this.settings.notifications;
  }

  async updateNotificationPreference(type: string, updates: Partial<NotificationPreference>): Promise<void> {
    await this.initialize();
    const index = this.settings.notifications.findIndex(n => n.type === type);
    if (index >= 0) {
      this.settings.notifications[index] = { ...this.settings.notifications[index], ...updates };
      await this.saveSettings();
    }
  }

  // Household
  async getHouseholdSettings(): Promise<HouseholdSettings> {
    await this.initialize();
    return this.settings.household;
  }

  async updateHouseholdSettings(updates: Partial<HouseholdSettings>): Promise<void> {
    await this.initialize();
    this.settings.household = { ...this.settings.household, ...updates };
    await this.saveSettings();
  }

  // Shopping
  async getShoppingPreferences(): Promise<ShoppingPreferences> {
    await this.initialize();
    return this.settings.shopping;
  }

  async updateShoppingPreferences(updates: Partial<ShoppingPreferences>): Promise<void> {
    await this.initialize();
    this.settings.shopping = { ...this.settings.shopping, ...updates };
    await this.saveSettings();
  }

  // App Behavior
  async getAppBehaviorSettings(): Promise<AppBehaviorSettings> {
    await this.initialize();
    return this.settings.appBehavior;
  }

  async updateAppBehaviorSettings(updates: Partial<AppBehaviorSettings>): Promise<void> {
    await this.initialize();
    this.settings.appBehavior = { ...this.settings.appBehavior, ...updates };
    await this.saveSettings();
  }

  // Privacy
  async getPrivacySettings(): Promise<PrivacySettings> {
    await this.initialize();
    return this.settings.privacy;
  }

  async updatePrivacySettings(updates: Partial<PrivacySettings>): Promise<void> {
    await this.initialize();
    this.settings.privacy = { ...this.settings.privacy, ...updates };
    await this.saveSettings();
  }

  // General settings management
  async getAllSettings(): Promise<UserSettings> {
    await this.initialize();
    return { ...this.settings };
  }

  async resetToDefaults(): Promise<void> {
    this.settings = this.getDefaultSettings();
    await this.saveSettings();
  }

  async exportSettings(): Promise<string> {
    await this.initialize();
    return JSON.stringify(this.settings, null, 2);
  }

  async importSettings(settingsJson: string): Promise<void> {
    try {
      const imported = JSON.parse(settingsJson);
      this.settings = { ...this.getDefaultSettings(), ...imported };
      await this.saveSettings();
    } catch (error) {
      throw new Error('Invalid settings format');
    }
  }

  // Event listeners
  addListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  removeListener(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notifyListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Validation
  validateSetting(key: string, value: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Add validation logic based on setting type
    switch (key) {
      case 'household.adults':
      case 'household.children':
        if (typeof value !== 'number' || value < 0 || value > 20) {
          errors.push('Must be a number between 0 and 20');
        }
        break;
      case 'shopping.expirationBuffer':
        if (typeof value !== 'number' || value < 0 || value > 30) {
          errors.push('Must be a number between 0 and 30 days');
        }
        break;
      // Add more validation rules as needed
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Integration with other services
  async applySettingsToServices(): Promise<void> {
    await this.initialize();
    
    // Apply dietary preferences to recipe service
    // Apply notification preferences to notification service
    // Apply shopping preferences to grocery service
    // Apply app behavior to relevant services
    
    // This will be implemented as we integrate with other services
  }
}

export default SettingsService;
