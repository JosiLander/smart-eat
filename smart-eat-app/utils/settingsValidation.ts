import { ValidationRule } from '../services/SettingsService';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SettingsValidator {
  private static instance: SettingsValidator;

  static getInstance(): SettingsValidator {
    if (!SettingsValidator.instance) {
      SettingsValidator.instance = new SettingsValidator();
    }
    return SettingsValidator.instance;
  }

  validateDietaryPreference(preference: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!preference.name || preference.name.trim().length === 0) {
      errors.push('Dietary preference name is required');
    }

    if (preference.name && preference.name.length > 50) {
      errors.push('Dietary preference name must be less than 50 characters');
    }

    if (!preference.icon || preference.icon.trim().length === 0) {
      errors.push('Dietary preference icon is required');
    }

    if (preference.isCustom && !preference.name) {
      errors.push('Custom dietary preferences must have a name');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateHouseholdSettings(settings: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof settings.adults !== 'number' || settings.adults < 0 || settings.adults > 20) {
      errors.push('Number of adults must be between 0 and 20');
    }

    if (typeof settings.children !== 'number' || settings.children < 0 || settings.children > 20) {
      errors.push('Number of children must be between 0 and 20');
    }

    if (settings.children > 0 && (!Array.isArray(settings.childAges) || settings.childAges.length !== settings.children)) {
      errors.push('Child ages must be specified for all children');
    }

    if (Array.isArray(settings.childAges)) {
      settings.childAges.forEach((age: number, index: number) => {
        if (typeof age !== 'number' || age < 0 || age > 18) {
          errors.push(`Child ${index + 1} age must be between 0 and 18`);
        }
      });
    }

    if (settings.adults === 0 && settings.children === 0) {
      warnings.push('Household has no members. Some features may not work properly.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateNotificationPreferences(preferences: any[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(preferences)) {
      errors.push('Notification preferences must be an array');
      return { isValid: false, errors, warnings };
    }

    const validTypes = ['expiration', 'recipe', 'shopping', 'inventory'];
    const validFrequencies = ['immediate', 'daily', 'weekly'];

    preferences.forEach((pref, index) => {
      if (!pref.type || !validTypes.includes(pref.type)) {
        errors.push(`Invalid notification type at index ${index}`);
      }

      if (typeof pref.enabled !== 'boolean') {
        errors.push(`Notification enabled must be boolean at index ${index}`);
      }

      if (!pref.frequency || !validFrequencies.includes(pref.frequency)) {
        errors.push(`Invalid notification frequency at index ${index}`);
      }

      if (pref.type === 'expiration' && (typeof pref.timing !== 'number' || pref.timing < 0 || pref.timing > 30)) {
        errors.push(`Expiration timing must be between 0 and 30 days at index ${index}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateShoppingPreferences(preferences: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(preferences.storeLayout) || preferences.storeLayout.length === 0) {
      errors.push('Store layout must be a non-empty array');
    }

    const validFrequencies = ['daily', 'twice-weekly', 'weekly', 'bi-weekly'];
    if (!preferences.shoppingFrequency || !validFrequencies.includes(preferences.shoppingFrequency)) {
      errors.push('Invalid shopping frequency');
    }

    if (typeof preferences.budgetConscious !== 'boolean') {
      errors.push('Budget conscious must be boolean');
    }

    if (typeof preferences.preferOrganic !== 'boolean') {
      errors.push('Prefer organic must be boolean');
    }

    if (typeof preferences.preferLocal !== 'boolean') {
      errors.push('Prefer local must be boolean');
    }

    if (typeof preferences.expirationBuffer !== 'number' || preferences.expirationBuffer < 0 || preferences.expirationBuffer > 30) {
      errors.push('Expiration buffer must be between 0 and 30 days');
    }

    const validUnits = ['metric', 'imperial'];
    if (!preferences.units || !validUnits.includes(preferences.units)) {
      errors.push('Invalid units preference');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateAppBehaviorSettings(settings: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validCameraQualities = ['high', 'medium', 'low'];
    if (!settings.cameraQuality || !validCameraQualities.includes(settings.cameraQuality)) {
      errors.push('Invalid camera quality setting');
    }

    if (typeof settings.offlineMode !== 'boolean') {
      errors.push('Offline mode must be boolean');
    }

    const validSyncFrequencies = ['immediate', 'hourly', 'daily'];
    if (!settings.syncFrequency || !validSyncFrequencies.includes(settings.syncFrequency)) {
      errors.push('Invalid sync frequency');
    }

    if (!settings.autoSave || typeof settings.autoSave.shoppingLists !== 'boolean' || typeof settings.autoSave.inventory !== 'boolean') {
      errors.push('Auto-save settings must be properly configured');
    }

    if (!settings.language || settings.language.length !== 2) {
      errors.push('Language must be a 2-character code');
    }

    if (!settings.region || settings.region.length !== 2) {
      errors.push('Region must be a 2-character code');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validatePrivacySettings(settings: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof settings.shareAnalytics !== 'boolean') {
      errors.push('Share analytics must be boolean');
    }

    if (typeof settings.shareCrashReports !== 'boolean') {
      errors.push('Share crash reports must be boolean');
    }

    if (typeof settings.shareFeatureSuggestions !== 'boolean') {
      errors.push('Share feature suggestions must be boolean');
    }

    if (!settings.shareAnalytics && !settings.shareCrashReports) {
      warnings.push('Sharing no data may limit app functionality and improvements');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateSetting(key: string, value: any, rules?: ValidationRule[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Apply custom validation rules
    if (rules) {
      rules.forEach(rule => {
        switch (rule.type) {
          case 'required':
            if (!value || (typeof value === 'string' && value.trim().length === 0)) {
              errors.push(rule.message);
            }
            break;

          case 'min':
            if (typeof value === 'number' && value < rule.value!) {
              errors.push(rule.message);
            }
            if (typeof value === 'string' && value.length < rule.value!) {
              errors.push(rule.message);
            }
            break;

          case 'max':
            if (typeof value === 'number' && value > rule.value!) {
              errors.push(rule.message);
            }
            if (typeof value === 'string' && value.length > rule.value!) {
              errors.push(rule.message);
            }
            break;

          case 'pattern':
            if (typeof value === 'string' && !new RegExp(rule.value!).test(value)) {
              errors.push(rule.message);
            }
            break;

          case 'custom':
            // Custom validation logic would be implemented here
            break;
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateAllSettings(settings: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate each section
    const dietaryResult = this.validateDietaryPreferences(settings.dietaryPreferences);
    const householdResult = this.validateHouseholdSettings(settings.household);
    const notificationResult = this.validateNotificationPreferences(settings.notifications);
    const shoppingResult = this.validateShoppingPreferences(settings.shopping);
    const appBehaviorResult = this.validateAppBehaviorSettings(settings.appBehavior);
    const privacyResult = this.validatePrivacySettings(settings.privacy);

    // Combine all results
    errors.push(...dietaryResult.errors);
    errors.push(...householdResult.errors);
    errors.push(...notificationResult.errors);
    errors.push(...shoppingResult.errors);
    errors.push(...appBehaviorResult.errors);
    errors.push(...privacyResult.errors);

    warnings.push(...dietaryResult.warnings);
    warnings.push(...householdResult.warnings);
    warnings.push(...notificationResult.warnings);
    warnings.push(...shoppingResult.warnings);
    warnings.push(...appBehaviorResult.warnings);
    warnings.push(...privacyResult.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateDietaryPreferences(preferences: any[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(preferences)) {
      errors.push('Dietary preferences must be an array');
      return { isValid: false, errors, warnings };
    }

    preferences.forEach((pref, index) => {
      const result = this.validateDietaryPreference(pref);
      result.errors.forEach(error => errors.push(`Dietary preference ${index + 1}: ${error}`));
      result.warnings.forEach(warning => warnings.push(`Dietary preference ${index + 1}: ${warning}`));
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export default SettingsValidator;
