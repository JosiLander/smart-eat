import { InventoryItem } from './InventoryService';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  tags: string[];
  imageUrl?: string;
  nutritionInfo?: NutritionInfo;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  category: string; // matches inventory categories
  isOptional: boolean;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface RecipeSuggestion {
  recipe: Recipe;
  matchScore: number; // 0-1, how well it matches available ingredients
  missingIngredients: RecipeIngredient[];
  availableIngredients: RecipeIngredient[];
  canMakeWithSubstitutions: boolean;
  estimatedPrepTime: number;
  // New fields for expiration prioritization
  expirationPriority: number; // 0-1 score based on expiring ingredients
  expiringIngredientsCount: number; // Count of ingredients expiring soon
  expiringIngredients: RecipeIngredient[]; // List of expiring ingredients used
}

export interface RecipeSearchFilters {
  maxPrepTime?: number;
  difficulty?: Recipe['difficulty'];
  cuisine?: string;
  tags?: string[];
  maxMissingIngredients?: number;
  // New field for expiration prioritization
  prioritizeExpiring?: boolean; // Whether to prioritize expiring items
  expirationWeightMultiplier?: number; // Configurable weight multiplier (default: 0.3)
  expirationThreshold?: number; // Days threshold for considering items "expiring" (default: 7)
}

export class RecipeService {
  // Configuration constants for expiration prioritization
  private static readonly DEFAULT_EXPIRATION_WEIGHT_MULTIPLIER = 0.3;
  private static readonly DEFAULT_EXPIRATION_THRESHOLD = 7;
  private static readonly EXPIRATION_WEIGHT_LEVELS = {
    CRITICAL: { days: 1, weight: 2.0 },
    HIGH: { days: 3, weight: 1.5 },
    MEDIUM: { days: 7, weight: 1.2 },
    NORMAL: { days: Infinity, weight: 1.0 }
  };

  private static readonly RECIPE_DATABASE: Recipe[] = [
    // Quick & Easy Recipes
    {
      id: 'quick-pasta',
      name: 'Quick Tomato Pasta',
      description: 'A simple and delicious pasta dish using fresh tomatoes and herbs',
      ingredients: [
        { name: 'Pasta', amount: 200, unit: 'g', category: 'pantry', isOptional: false },
        { name: 'Tomato', amount: 4, unit: 'pieces', category: 'vegetables', isOptional: false },
        { name: 'Garlic', amount: 2, unit: 'cloves', category: 'vegetables', isOptional: false },
        { name: 'Olive Oil', amount: 2, unit: 'tbsp', category: 'pantry', isOptional: false },
        { name: 'Basil', amount: 1, unit: 'bunch', category: 'vegetables', isOptional: true },
      ],
      instructions: [
        'Boil pasta according to package instructions',
        'Chop tomatoes and garlic',
        'Heat olive oil in a pan and sauté garlic',
        'Add tomatoes and cook for 5 minutes',
        'Mix with pasta and garnish with basil'
      ],
      prepTime: 10,
      cookTime: 15,
      servings: 2,
      difficulty: 'easy',
      cuisine: 'Italian',
      tags: ['quick', 'vegetarian', 'pasta'],
      nutritionInfo: {
        calories: 450,
        protein: 12,
        carbs: 75,
        fat: 8,
        fiber: 6
      }
    },
    {
      id: 'fruit-salad',
      name: 'Fresh Fruit Salad',
      description: 'A refreshing fruit salad perfect for breakfast or dessert',
      ingredients: [
        { name: 'Apple', amount: 2, unit: 'pieces', category: 'fruits', isOptional: false },
        { name: 'Banana', amount: 2, unit: 'pieces', category: 'fruits', isOptional: false },
        { name: 'Orange', amount: 2, unit: 'pieces', category: 'fruits', isOptional: false },
        { name: 'Honey', amount: 1, unit: 'tbsp', category: 'pantry', isOptional: true },
      ],
      instructions: [
        'Wash and chop all fruits',
        'Mix fruits in a bowl',
        'Drizzle with honey if desired',
        'Serve immediately'
      ],
      prepTime: 10,
      cookTime: 0,
      servings: 4,
      difficulty: 'easy',
      cuisine: 'International',
      tags: ['breakfast', 'dessert', 'healthy', 'vegan'],
      nutritionInfo: {
        calories: 120,
        protein: 1,
        carbs: 30,
        fat: 0,
        fiber: 4
      }
    },
    {
      id: 'scrambled-eggs',
      name: 'Scrambled Eggs with Vegetables',
      description: 'Protein-rich breakfast with fresh vegetables',
      ingredients: [
        { name: 'Eggs', amount: 4, unit: 'pieces', category: 'dairy', isOptional: false },
        { name: 'Milk', amount: 2, unit: 'tbsp', category: 'dairy', isOptional: true },
        { name: 'Tomato', amount: 1, unit: 'piece', category: 'vegetables', isOptional: true },
        { name: 'Spinach', amount: 1, unit: 'cup', category: 'vegetables', isOptional: true },
        { name: 'Cheese', amount: 30, unit: 'g', category: 'dairy', isOptional: true },
      ],
      instructions: [
        'Whisk eggs with milk',
        'Chop vegetables',
        'Heat pan and add vegetables',
        'Pour in egg mixture',
        'Stir gently until cooked',
        'Add cheese if desired'
      ],
      prepTime: 5,
      cookTime: 8,
      servings: 2,
      difficulty: 'easy',
      cuisine: 'International',
      tags: ['breakfast', 'protein', 'quick'],
      nutritionInfo: {
        calories: 280,
        protein: 18,
        carbs: 4,
        fat: 20,
        fiber: 2
      }
    },
    // Medium Difficulty Recipes
    {
      id: 'chicken-stir-fry',
      name: 'Chicken Stir Fry',
      description: 'A healthy and flavorful stir fry with chicken and vegetables',
      ingredients: [
        { name: 'Chicken Breast', amount: 300, unit: 'g', category: 'meat', isOptional: false },
        { name: 'Rice', amount: 200, unit: 'g', category: 'pantry', isOptional: false },
        { name: 'Carrot', amount: 2, unit: 'pieces', category: 'vegetables', isOptional: false },
        { name: 'Broccoli', amount: 1, unit: 'head', category: 'vegetables', isOptional: false },
        { name: 'Soy Sauce', amount: 3, unit: 'tbsp', category: 'pantry', isOptional: false },
        { name: 'Garlic', amount: 3, unit: 'cloves', category: 'vegetables', isOptional: false },
      ],
      instructions: [
        'Cook rice according to package instructions',
        'Cut chicken into small pieces',
        'Chop vegetables',
        'Stir fry chicken until golden',
        'Add vegetables and stir fry',
        'Add soy sauce and garlic',
        'Serve over rice'
      ],
      prepTime: 15,
      cookTime: 20,
      servings: 3,
      difficulty: 'medium',
      cuisine: 'Asian',
      tags: ['dinner', 'protein', 'healthy'],
      nutritionInfo: {
        calories: 380,
        protein: 35,
        carbs: 45,
        fat: 8,
        fiber: 6
      }
    },
    {
      id: 'vegetable-soup',
      name: 'Hearty Vegetable Soup',
      description: 'A warming soup perfect for using up leftover vegetables',
      ingredients: [
        { name: 'Carrot', amount: 3, unit: 'pieces', category: 'vegetables', isOptional: false },
        { name: 'Tomato', amount: 2, unit: 'pieces', category: 'vegetables', isOptional: false },
        { name: 'Lettuce', amount: 1, unit: 'head', category: 'vegetables', isOptional: true },
        { name: 'Onion', amount: 1, unit: 'piece', category: 'vegetables', isOptional: false },
        { name: 'Garlic', amount: 2, unit: 'cloves', category: 'vegetables', isOptional: false },
        { name: 'Vegetable Broth', amount: 1, unit: 'liter', category: 'pantry', isOptional: false },
      ],
      instructions: [
        'Chop all vegetables',
        'Sauté onion and garlic',
        'Add vegetables and broth',
        'Simmer for 20 minutes',
        'Season to taste'
      ],
      prepTime: 15,
      cookTime: 25,
      servings: 4,
      difficulty: 'medium',
      cuisine: 'International',
      tags: ['soup', 'vegetarian', 'healthy', 'warm'],
      nutritionInfo: {
        calories: 120,
        protein: 4,
        carbs: 20,
        fat: 2,
        fiber: 8
      }
    },
    // Advanced Recipes
    {
      id: 'beef-stew',
      name: 'Slow Cooked Beef Stew',
      description: 'A rich and hearty beef stew perfect for cold days',
      ingredients: [
        { name: 'Ground Beef', amount: 500, unit: 'g', category: 'meat', isOptional: false },
        { name: 'Carrot', amount: 4, unit: 'pieces', category: 'vegetables', isOptional: false },
        { name: 'Potato', amount: 3, unit: 'pieces', category: 'vegetables', isOptional: false },
        { name: 'Onion', amount: 2, unit: 'pieces', category: 'vegetables', isOptional: false },
        { name: 'Beef Broth', amount: 1, unit: 'liter', category: 'pantry', isOptional: false },
        { name: 'Flour', amount: 2, unit: 'tbsp', category: 'pantry', isOptional: false },
      ],
      instructions: [
        'Brown beef in a large pot',
        'Add chopped vegetables',
        'Add broth and bring to boil',
        'Simmer for 2 hours',
        'Thicken with flour if desired'
      ],
      prepTime: 20,
      cookTime: 120,
      servings: 6,
      difficulty: 'hard',
      cuisine: 'International',
      tags: ['dinner', 'comfort', 'slow-cook'],
      nutritionInfo: {
        calories: 450,
        protein: 35,
        carbs: 25,
        fat: 25,
        fiber: 6
      }
    }
  ];

  static async getAllRecipes(): Promise<Recipe[]> {
    return [...this.RECIPE_DATABASE];
  }

  static async getRecipeById(id: string): Promise<Recipe | null> {
    return this.RECIPE_DATABASE.find(recipe => recipe.id === id) || null;
  }

  static async searchRecipes(query: string): Promise<Recipe[]> {
    const lowerQuery = query.toLowerCase();
    return this.RECIPE_DATABASE.filter(recipe => 
      recipe.name.toLowerCase().includes(lowerQuery) ||
      recipe.description.toLowerCase().includes(lowerQuery) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      recipe.cuisine.toLowerCase().includes(lowerQuery)
    );
  }

  static async getRecipeSuggestions(
    inventoryItems: InventoryItem[],
    filters?: RecipeSearchFilters
  ): Promise<RecipeSuggestion[]> {
    const suggestions: RecipeSuggestion[] = [];

    for (const recipe of this.RECIPE_DATABASE) {
      const suggestion = this.analyzeRecipeMatch(recipe, inventoryItems, filters);
      if (suggestion.matchScore > 0.3 && this.passesFilters(suggestion, filters)) { // Only suggest if at least 30% match and passes filters
        suggestions.push(suggestion);
      }
    }

    // Enhanced sorting: prioritize expiration if enabled, otherwise by match score
    return suggestions.sort((a, b) => {
      if (filters?.prioritizeExpiring) {
        // Sort by expiration priority first, then by match score
        if (a.expirationPriority !== b.expirationPriority) {
          return b.expirationPriority - a.expirationPriority;
        }
      }
      return b.matchScore - a.matchScore;
    });
  }

  private static analyzeRecipeMatch(
    recipe: Recipe,
    inventoryItems: InventoryItem[],
    filters?: RecipeSearchFilters
  ): RecipeSuggestion {
    const availableIngredients: RecipeIngredient[] = [];
    const missingIngredients: RecipeIngredient[] = [];
    let matchScore = 0;
    let totalIngredients = recipe.ingredients.length;
    let matchedIngredients = 0;

    // Check each recipe ingredient against inventory
    for (const recipeIngredient of recipe.ingredients) {
      const inventoryMatch = this.findInventoryMatch(recipeIngredient, inventoryItems);
      
      if (inventoryMatch) {
        availableIngredients.push(recipeIngredient);
        matchedIngredients++;
        matchScore += 1;
      } else if (recipeIngredient.isOptional) {
        // Optional ingredients don't count against the score
        totalIngredients--;
      } else {
        missingIngredients.push(recipeIngredient);
      }
    }

    // Calculate base match score
    let finalMatchScore = totalIngredients > 0 ? matchedIngredients / totalIngredients : 0;

    // Calculate expiration priority
    const threshold = filters?.expirationThreshold || this.DEFAULT_EXPIRATION_THRESHOLD;
    const expirationData = this.calculateExpirationPriority(recipe, inventoryItems, threshold);

    // Apply expiration weighting if enabled
    if (filters?.prioritizeExpiring && expirationData.priority > 0) {
      // Boost match score based on expiration priority
      const weightMultiplier = filters?.expirationWeightMultiplier || this.DEFAULT_EXPIRATION_WEIGHT_MULTIPLIER;
      finalMatchScore = Math.min(1.0, finalMatchScore + (expirationData.priority * weightMultiplier));
    }

    // Apply filters
    if (filters) {
      if (filters.maxPrepTime && recipe.prepTime > filters.maxPrepTime) {
        finalMatchScore = 0;
      }
      if (filters.difficulty && recipe.difficulty !== filters.difficulty) {
        finalMatchScore = 0;
      }
      if (filters.cuisine && recipe.cuisine !== filters.cuisine) {
        finalMatchScore = 0;
      }
      if (filters.tags && !filters.tags.some(tag => recipe.tags.includes(tag))) {
        finalMatchScore = 0;
      }
      if (filters.maxMissingIngredients && missingIngredients.length > filters.maxMissingIngredients) {
        finalMatchScore = 0;
      }
    }

    return {
      recipe,
      matchScore: finalMatchScore,
      missingIngredients,
      availableIngredients,
      canMakeWithSubstitutions: this.canMakeWithSubstitutions(recipe, inventoryItems),
      estimatedPrepTime: recipe.prepTime + recipe.cookTime,
      // New expiration fields
      expirationPriority: expirationData.priority,
      expiringIngredientsCount: expirationData.count,
      expiringIngredients: expirationData.ingredients
    };
  }

  private static findInventoryMatch(
    recipeIngredient: RecipeIngredient,
    inventoryItems: InventoryItem[]
  ): InventoryItem | null {
    // First try exact name match
    let match = inventoryItems.find(item => 
      item.name.toLowerCase() === recipeIngredient.name.toLowerCase()
    );

    if (match) return match;

    // Try category match for similar items
    match = inventoryItems.find(item => 
      item.category === recipeIngredient.category &&
      this.isSimilarIngredient(item.name, recipeIngredient.name)
    );

    return match || null;
  }

  private static isSimilarIngredient(inventoryName: string, recipeName: string): boolean {
    const inventoryWords = inventoryName.toLowerCase().split(' ');
    const recipeWords = recipeName.toLowerCase().split(' ');
    
    // Check if they share common words
    return inventoryWords.some(word => recipeWords.includes(word)) ||
           recipeWords.some(word => inventoryWords.includes(word));
  }

  private static canMakeWithSubstitutions(recipe: Recipe, inventoryItems: InventoryItem[]): boolean {
    const requiredIngredients = recipe.ingredients.filter(ing => !ing.isOptional);
    const missingRequired = requiredIngredients.filter(ing => 
      !this.findInventoryMatch(ing, inventoryItems)
    );

    // Can make if missing less than 30% of required ingredients
    return missingRequired.length <= Math.ceil(requiredIngredients.length * 0.3);
  }

  private static passesFilters(suggestion: RecipeSuggestion, filters?: RecipeSearchFilters): boolean {
    if (!filters) return true;

    if (filters.maxPrepTime && suggestion.recipe.prepTime > filters.maxPrepTime) {
      return false;
    }
    if (filters.difficulty && suggestion.recipe.difficulty !== filters.difficulty) {
      return false;
    }
    if (filters.cuisine && suggestion.recipe.cuisine !== filters.cuisine) {
      return false;
    }
    if (filters.tags && !filters.tags.some(tag => suggestion.recipe.tags.includes(tag))) {
      return false;
    }
    if (filters.maxMissingIngredients && suggestion.missingIngredients.length > filters.maxMissingIngredients) {
      return false;
    }
    if (filters.prioritizeExpiring && suggestion.expiringIngredientsCount === 0) {
      return false; // Filter out recipes with no expiring ingredients when prioritization is enabled
    }

    return true;
  }

  static async getRecipesByCategory(category: string): Promise<Recipe[]> {
    return this.RECIPE_DATABASE.filter(recipe => 
      recipe.cuisine.toLowerCase() === category.toLowerCase() ||
      recipe.tags.includes(category.toLowerCase())
    );
  }

  static async getQuickRecipes(maxTime: number = 30): Promise<Recipe[]> {
    return this.RECIPE_DATABASE.filter(recipe => 
      recipe.prepTime + recipe.cookTime <= maxTime
    );
  }

  static async getRecipesByDifficulty(difficulty: Recipe['difficulty']): Promise<Recipe[]> {
    return this.RECIPE_DATABASE.filter(recipe => recipe.difficulty === difficulty);
  }

  static async getRandomRecipe(): Promise<Recipe> {
    const randomIndex = Math.floor(Math.random() * this.RECIPE_DATABASE.length);
    return this.RECIPE_DATABASE[randomIndex];
  }

  static async getRecipesForExpiringItems(
    inventoryItems: InventoryItem[],
    threshold: number = this.DEFAULT_EXPIRATION_THRESHOLD
  ): Promise<RecipeSuggestion[]> {
    const expiringItems = inventoryItems.filter(item => 
      item.daysUntilExpiry <= threshold && !item.isExpired
    );

    if (expiringItems.length === 0) {
      return [];
    }

    return this.getRecipeSuggestions(expiringItems, {
      maxMissingIngredients: 2, // Prioritize recipes that use expiring items
      prioritizeExpiring: true, // Enable expiration prioritization
      expirationThreshold: threshold // Use the provided threshold
    });
  }

  /**
   * Get configuration options for expiration prioritization
   */
  static getExpirationConfig() {
    return {
      defaultWeightMultiplier: this.DEFAULT_EXPIRATION_WEIGHT_MULTIPLIER,
      defaultThreshold: this.DEFAULT_EXPIRATION_THRESHOLD,
      weightLevels: this.EXPIRATION_WEIGHT_LEVELS
    };
  }

  /**
   * Calculate expiration weight for an inventory item
   * Higher weights are given to items expiring soon
   */
  private static calculateExpirationWeight(
    inventoryItem: InventoryItem, 
    threshold: number = this.DEFAULT_EXPIRATION_THRESHOLD
  ): number {
    if (inventoryItem.isExpired) return 0;
    
    // Only consider items within the threshold as "expiring"
    if (inventoryItem.daysUntilExpiry > threshold) return 1.0;
    
    // Apply weight levels based on urgency
    if (inventoryItem.daysUntilExpiry <= this.EXPIRATION_WEIGHT_LEVELS.CRITICAL.days) {
      return this.EXPIRATION_WEIGHT_LEVELS.CRITICAL.weight;
    }
    if (inventoryItem.daysUntilExpiry <= this.EXPIRATION_WEIGHT_LEVELS.HIGH.days) {
      return this.EXPIRATION_WEIGHT_LEVELS.HIGH.weight;
    }
    if (inventoryItem.daysUntilExpiry <= this.EXPIRATION_WEIGHT_LEVELS.MEDIUM.days) {
      return this.EXPIRATION_WEIGHT_LEVELS.MEDIUM.weight;
    }
    
    return this.EXPIRATION_WEIGHT_LEVELS.NORMAL.weight;
  }

  /**
   * Calculate expiration priority score for a recipe suggestion
   * Returns a value between 0-1 based on how many expiring ingredients are used
   */
  private static calculateExpirationPriority(
    recipe: Recipe,
    inventoryItems: InventoryItem[],
    threshold: number = this.DEFAULT_EXPIRATION_THRESHOLD
  ): { priority: number; count: number; ingredients: RecipeIngredient[] } {
    const expiringIngredients: RecipeIngredient[] = [];
    let totalExpirationWeight = 0;
    let maxPossibleWeight = 0;

    for (const recipeIngredient of recipe.ingredients) {
      const inventoryMatch = this.findInventoryMatch(recipeIngredient, inventoryItems);
      
      if (inventoryMatch) {
        const expirationWeight = this.calculateExpirationWeight(inventoryMatch, threshold);
        if (expirationWeight > 1.0) { // Only count items that are expiring soon
          expiringIngredients.push(recipeIngredient);
          totalExpirationWeight += expirationWeight;
        }
        maxPossibleWeight += this.EXPIRATION_WEIGHT_LEVELS.CRITICAL.weight; // Maximum possible weight per ingredient
      }
    }

    const priority = maxPossibleWeight > 0 ? totalExpirationWeight / maxPossibleWeight : 0;
    
    return {
      priority: Math.min(priority, 1.0), // Cap at 1.0
      count: expiringIngredients.length,
      ingredients: expiringIngredients
    };
  }
} 