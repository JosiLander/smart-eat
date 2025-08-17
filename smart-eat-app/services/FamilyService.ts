export interface DietaryRestriction {
  type: 'vegan' | 'vegetarian' | 'gluten-free' | 'dairy-free' | 'nut-free' | 'soy-free' | 'shellfish-free' | 'egg-free';
  severity: 'strict' | 'preference';
  notes?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  age: number;
  type: 'adult' | 'child';
  dietaryRestrictions: DietaryRestriction[];
}

export interface FamilyProfile {
  id: string;
  adults: number;
  children: number;
  childAges: number[];
  familyMembers: FamilyMember[];
  dietaryRestrictions: DietaryRestriction[];
  preferences: FamilyPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyPreferences {
  mealSize: 'small' | 'medium' | 'large';
  cookingFrequency: 'daily' | 'every-other-day' | 'weekly';
  shoppingFrequency: 'daily' | 'twice-weekly' | 'weekly' | 'bi-weekly';
  budgetConscious: boolean;
  organicPreference: boolean;
  localProducePreference: boolean;
}

export interface CreateFamilyProfileResult {
  success: boolean;
  profileId?: string;
  error?: string;
}

export interface QuantitySuggestion {
  itemName: string;
  baseQuantity: number;
  suggestedQuantity: number;
  unit: string;
  reasoning: string;
}

export class FamilyService {
  private static readonly STORAGE_KEY = 'family_profile';
  private static profile: FamilyProfile | null = null;

  // Default family profile
  private static readonly DEFAULT_PROFILE: Omit<FamilyProfile, 'id' | 'createdAt' | 'updatedAt'> = {
    adults: 2,
    children: 0,
    childAges: [],
    familyMembers: [
      {
        id: 'adult_1',
        name: 'Adult 1',
        age: 30,
        type: 'adult',
        dietaryRestrictions: [],
      },
      {
        id: 'adult_2',
        name: 'Adult 2',
        age: 30,
        type: 'adult',
        dietaryRestrictions: [],
      },
    ],
    dietaryRestrictions: [],
    preferences: {
      mealSize: 'medium',
      cookingFrequency: 'daily',
      shoppingFrequency: 'weekly',
      budgetConscious: false,
      organicPreference: false,
      localProducePreference: false,
    },
  };

  static async initialize(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.profile = JSON.parse(stored);
        } else {
          // Initialize with default profile
          this.profile = {
            ...this.DEFAULT_PROFILE,
            id: 'default_family',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await this.saveToStorage();
        }
      } else {
        // Fallback for test environments
        this.profile = {
          ...this.DEFAULT_PROFILE,
          id: 'default_family',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Failed to initialize family service:', error);
      // Fallback to default profile
      this.profile = {
        ...this.DEFAULT_PROFILE,
        id: 'default_family',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  static async getFamilyProfile(): Promise<FamilyProfile | null> {
    return this.profile ? { ...this.profile } : null;
  }

  static async updateFamilyProfile(updates: Partial<Omit<FamilyProfile, 'id' | 'createdAt'>>): Promise<boolean> {
    try {
      if (!this.profile) return false;

      Object.assign(this.profile, updates);
      this.profile.updatedAt = new Date().toISOString();

      // Update derived fields
      if (updates.familyMembers) {
        this.profile.adults = this.profile.familyMembers.filter(m => m.type === 'adult').length;
        this.profile.children = this.profile.familyMembers.filter(m => m.type === 'child').length;
        this.profile.childAges = this.profile.familyMembers
          .filter(m => m.type === 'child')
          .map(m => m.age);
      }

      await this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to update family profile:', error);
      return false;
    }
  }

  static async addFamilyMember(member: Omit<FamilyMember, 'id'>): Promise<boolean> {
    try {
      if (!this.profile) return false;

      const newMember: FamilyMember = {
        ...member,
        id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      this.profile.familyMembers.push(newMember);
      this.profile.adults = this.profile.familyMembers.filter(m => m.type === 'adult').length;
      this.profile.children = this.profile.familyMembers.filter(m => m.type === 'child').length;
      this.profile.childAges = this.profile.familyMembers
        .filter(m => m.type === 'child')
        .map(m => m.age);
      this.profile.updatedAt = new Date().toISOString();

      await this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to add family member:', error);
      return false;
    }
  }

  static async removeFamilyMember(memberId: string): Promise<boolean> {
    try {
      if (!this.profile) return false;

      this.profile.familyMembers = this.profile.familyMembers.filter(m => m.id !== memberId);
      this.profile.adults = this.profile.familyMembers.filter(m => m.type === 'adult').length;
      this.profile.children = this.profile.familyMembers.filter(m => m.type === 'child').length;
      this.profile.childAges = this.profile.familyMembers
        .filter(m => m.type === 'child')
        .map(m => m.age);
      this.profile.updatedAt = new Date().toISOString();

      await this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to remove family member:', error);
      return false;
    }
  }

  static async addDietaryRestriction(restriction: DietaryRestriction): Promise<boolean> {
    try {
      if (!this.profile) return false;

      // Check if restriction already exists
      const exists = this.profile.dietaryRestrictions.some(r => r.type === restriction.type);
      if (!exists) {
        this.profile.dietaryRestrictions.push(restriction);
        this.profile.updatedAt = new Date().toISOString();
        await this.saveToStorage();
      }
      return true;
    } catch (error) {
      console.error('Failed to add dietary restriction:', error);
      return false;
    }
  }

  static async removeDietaryRestriction(restrictionType: DietaryRestriction['type']): Promise<boolean> {
    try {
      if (!this.profile) return false;

      this.profile.dietaryRestrictions = this.profile.dietaryRestrictions.filter(
        r => r.type !== restrictionType
      );
      this.profile.updatedAt = new Date().toISOString();
      await this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to remove dietary restriction:', error);
      return false;
    }
  }

  static getQuantitySuggestions(
    baseItems: Array<{ name: string; baseQuantity: number; unit: string }>
  ): QuantitySuggestion[] {
    if (!this.profile) return [];

    const totalFamilySize = this.profile.adults + this.profile.children;
    const suggestions: QuantitySuggestion[] = [];

    for (const item of baseItems) {
      let multiplier = 1;
      let reasoning = 'Base quantity for 1 person';

      // Adjust based on family size
      if (totalFamilySize > 1) {
        multiplier = Math.ceil(totalFamilySize * 0.8); // 80% of family size for efficiency
        reasoning = `Adjusted for ${totalFamilySize} family members`;
      }

      // Adjust based on meal size preference
      switch (this.profile.preferences.mealSize) {
        case 'small':
          multiplier *= 0.8;
          reasoning += ', small meal portions';
          break;
        case 'large':
          multiplier *= 1.2;
          reasoning += ', large meal portions';
          break;
      }

      // Adjust based on cooking frequency
      switch (this.profile.preferences.cookingFrequency) {
        case 'daily':
          multiplier *= 1.0;
          break;
        case 'every-other-day':
          multiplier *= 1.5;
          reasoning += ', cooking every other day';
          break;
        case 'weekly':
          multiplier *= 3.0;
          reasoning += ', weekly meal prep';
          break;
      }

      suggestions.push({
        itemName: item.name,
        baseQuantity: item.baseQuantity,
        suggestedQuantity: Math.round(item.baseQuantity * multiplier * 100) / 100,
        unit: item.unit,
        reasoning,
      });
    }

    return suggestions;
  }

  static getRecipeScalingFactor(recipeServings: number): number {
    if (!this.profile) return 1;

    const totalFamilySize = this.profile.adults + this.profile.children;
    const targetServings = Math.max(totalFamilySize, 2); // Minimum 2 servings for leftovers
    
    return targetServings / recipeServings;
  }

  static getDietaryFilter(): string[] {
    if (!this.profile) return [];

    return this.profile.dietaryRestrictions.map(r => r.type);
  }

  static hasStrictDietaryRestriction(): boolean {
    if (!this.profile) return false;

    return this.profile.dietaryRestrictions.some(r => r.severity === 'strict');
  }

  static getShoppingFrequency(): string {
    if (!this.profile) return 'weekly';
    return this.profile.preferences.shoppingFrequency;
  }

  static isBudgetConscious(): boolean {
    if (!this.profile) return false;
    return this.profile.preferences.budgetConscious;
  }

  private static async saveToStorage(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.profile));
    }
  }
}
