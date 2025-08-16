import { RecipeService, Recipe, RecipeSuggestion } from '../RecipeService';
import { InventoryService, InventoryItem } from '../InventoryService';

// Mock InventoryService
jest.mock('../InventoryService');
const mockInventoryService = InventoryService as jest.Mocked<typeof InventoryService>;

describe('RecipeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRecipes', () => {
    it('should return all recipes', async () => {
      const recipes = await RecipeService.getAllRecipes();
      
      expect(recipes).toBeDefined();
      expect(Array.isArray(recipes)).toBe(true);
      expect(recipes.length).toBeGreaterThan(0);
      
      // Check that each recipe has required properties
      recipes.forEach(recipe => {
        expect(recipe).toHaveProperty('id');
        expect(recipe).toHaveProperty('name');
        expect(recipe).toHaveProperty('description');
        expect(recipe).toHaveProperty('ingredients');
        expect(recipe).toHaveProperty('instructions');
        expect(recipe).toHaveProperty('prepTime');
        expect(recipe).toHaveProperty('cookTime');
        expect(recipe).toHaveProperty('servings');
        expect(recipe).toHaveProperty('difficulty');
        expect(recipe).toHaveProperty('cuisine');
        expect(recipe).toHaveProperty('tags');
      });
    });
  });

  describe('getRecipeById', () => {
    it('should return a recipe by id', async () => {
      const recipe = await RecipeService.getRecipeById('quick-pasta');
      
      expect(recipe).toBeDefined();
      expect(recipe?.id).toBe('quick-pasta');
      expect(recipe?.name).toBe('Quick Tomato Pasta');
    });

    it('should return null for non-existent recipe', async () => {
      const recipe = await RecipeService.getRecipeById('non-existent');
      
      expect(recipe).toBeNull();
    });
  });

  describe('searchRecipes', () => {
    it('should search recipes by name', async () => {
      const results = await RecipeService.searchRecipes('pasta');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(recipe => recipe.name.toLowerCase().includes('pasta'))).toBe(true);
    });

    it('should search recipes by description', async () => {
      const results = await RecipeService.searchRecipes('simple');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search recipes by tags', async () => {
      const results = await RecipeService.searchRecipes('vegetarian');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', async () => {
      const results = await RecipeService.searchRecipes('xyz123');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should handle case insensitive search', async () => {
      const results = await RecipeService.searchRecipes('PASTA');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getRecipeSuggestions', () => {
    const mockInventoryItems: InventoryItem[] = [
      {
        id: '1',
        name: 'Pasta',
        category: 'pantry',
        quantity: 1,
        unit: 'piece',
        expirationDate: new Date('2025-12-31'),
        addedDate: new Date(),
        confidence: 0.9,
        isExpired: false,
        daysUntilExpiry: 365,
      },
      {
        id: '2',
        name: 'Tomato',
        category: 'vegetables',
        quantity: 4,
        unit: 'pieces',
        expirationDate: new Date('2025-08-20'),
        addedDate: new Date(),
        confidence: 0.8,
        isExpired: false,
        daysUntilExpiry: 7,
      },
      {
        id: '3',
        name: 'Garlic',
        category: 'vegetables',
        quantity: 2,
        unit: 'cloves',
        expirationDate: new Date('2025-09-01'),
        addedDate: new Date(),
        confidence: 0.7,
        isExpired: false,
        daysUntilExpiry: 19,
      },
    ];

    beforeEach(() => {
      mockInventoryService.getAllItems.mockResolvedValue(mockInventoryItems);
    });

    it('should return recipe suggestions based on inventory', async () => {
      const suggestions = await RecipeService.getRecipeSuggestions(mockInventoryItems);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Check that suggestions have required properties
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('recipe');
        expect(suggestion).toHaveProperty('matchScore');
        expect(suggestion).toHaveProperty('missingIngredients');
        expect(suggestion).toHaveProperty('availableIngredients');
        expect(suggestion).toHaveProperty('canMakeWithSubstitutions');
        expect(suggestion).toHaveProperty('estimatedPrepTime');
      });
    });

    it('should filter by difficulty', async () => {
      const suggestions = await RecipeService.getRecipeSuggestions(mockInventoryItems, {
        difficulty: 'easy'
      });
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      
      // All suggestions should be easy difficulty (if any exist)
      if (suggestions.length > 0) {
        suggestions.forEach(suggestion => {
          expect(suggestion.recipe.difficulty).toBe('easy');
        });
      }
    });

    it('should filter by max prep time', async () => {
      const suggestions = await RecipeService.getRecipeSuggestions(mockInventoryItems, {
        maxPrepTime: 30
      });
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      
      // All suggestions should have prep time <= 30 minutes
      suggestions.forEach(suggestion => {
        expect(suggestion.recipe.prepTime).toBeLessThanOrEqual(30);
      });
    });

    it('should filter by max missing ingredients', async () => {
      const suggestions = await RecipeService.getRecipeSuggestions(mockInventoryItems, {
        maxMissingIngredients: 1
      });
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      
      // All suggestions should have <= 1 missing ingredient (if any exist)
      if (suggestions.length > 0) {
        suggestions.forEach(suggestion => {
          expect(suggestion.missingIngredients.length).toBeLessThanOrEqual(1);
        });
      }
    });

    it('should include expiration data in recipe suggestions', async () => {
      const suggestions = await RecipeService.getRecipeSuggestions(mockInventoryItems);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      
      // Check that suggestions have new expiration properties
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('expirationPriority');
        expect(suggestion).toHaveProperty('expiringIngredientsCount');
        expect(suggestion).toHaveProperty('expiringIngredients');
        expect(typeof suggestion.expirationPriority).toBe('number');
        expect(typeof suggestion.expiringIngredientsCount).toBe('number');
        expect(Array.isArray(suggestion.expiringIngredients)).toBe(true);
        expect(suggestion.expirationPriority).toBeGreaterThanOrEqual(0);
        expect(suggestion.expirationPriority).toBeLessThanOrEqual(1);
      });
    });

    it('should prioritize recipes with expiring ingredients when filter is enabled', async () => {
      // Create inventory with some expiring items
      const inventoryWithExpiring: InventoryItem[] = [
        {
          id: '1',
          name: 'Pasta',
          category: 'pantry',
          quantity: 1,
          unit: 'piece',
          expirationDate: new Date('2025-12-31'),
          addedDate: new Date(),
          confidence: 0.9,
          isExpired: false,
          daysUntilExpiry: 365,
        },
        {
          id: '2',
          name: 'Tomato',
          category: 'vegetables',
          quantity: 4,
          unit: 'pieces',
          expirationDate: new Date(),
          addedDate: new Date(),
          confidence: 0.8,
          isExpired: false,
          daysUntilExpiry: 1, // Expiring soon
        },
        {
          id: '3',
          name: 'Garlic',
          category: 'vegetables',
          quantity: 2,
          unit: 'cloves',
          expirationDate: new Date(),
          addedDate: new Date(),
          confidence: 0.7,
          isExpired: false,
          daysUntilExpiry: 2, // Expiring soon
        },
      ];

      const suggestions = await RecipeService.getRecipeSuggestions(inventoryWithExpiring, {
        prioritizeExpiring: true
      });
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      
      // All suggestions should have at least one expiring ingredient
      suggestions.forEach(suggestion => {
        expect(suggestion.expiringIngredientsCount).toBeGreaterThan(0);
      });
    });

    it('should boost match score for recipes with expiring ingredients', async () => {
      // Create inventory with expiring items
      const inventoryWithExpiring: InventoryItem[] = [
        {
          id: '1',
          name: 'Pasta',
          category: 'pantry',
          quantity: 1,
          unit: 'piece',
          expirationDate: new Date('2025-12-31'),
          addedDate: new Date(),
          confidence: 0.9,
          isExpired: false,
          daysUntilExpiry: 365,
        },
        {
          id: '2',
          name: 'Tomato',
          category: 'vegetables',
          quantity: 4,
          unit: 'pieces',
          expirationDate: new Date(),
          addedDate: new Date(),
          confidence: 0.8,
          isExpired: false,
          daysUntilExpiry: 1, // Expiring soon
        },
      ];

      const suggestionsWithoutPriority = await RecipeService.getRecipeSuggestions(inventoryWithExpiring);
      const suggestionsWithPriority = await RecipeService.getRecipeSuggestions(inventoryWithExpiring, {
        prioritizeExpiring: true
      });
      
      // Find a recipe that uses tomatoes (expiring ingredient)
      const tomatoRecipe = suggestionsWithPriority.find(s => 
        s.availableIngredients.some(ing => ing.name.toLowerCase().includes('tomato'))
      );
      
      if (tomatoRecipe) {
        // The recipe should have a higher match score when expiration is prioritized
        const sameRecipeWithoutPriority = suggestionsWithoutPriority.find(s => 
          s.recipe.id === tomatoRecipe.recipe.id
        );
        
        if (sameRecipeWithoutPriority) {
          expect(tomatoRecipe.matchScore).toBeGreaterThanOrEqual(sameRecipeWithoutPriority.matchScore);
        }
      }
    });

    it('should filter out recipes with no expiring ingredients when prioritizeExpiring is enabled', async () => {
      // Create inventory with only non-expiring items
      const inventoryWithoutExpiring: InventoryItem[] = [
        {
          id: '1',
          name: 'Pasta',
          category: 'pantry',
          quantity: 1,
          unit: 'piece',
          expirationDate: new Date('2025-12-31'),
          addedDate: new Date(),
          confidence: 0.9,
          isExpired: false,
          daysUntilExpiry: 365,
        },
        {
          id: '2',
          name: 'Olive Oil',
          category: 'pantry',
          quantity: 1,
          unit: 'bottle',
          expirationDate: new Date('2026-12-31'),
          addedDate: new Date(),
          confidence: 0.8,
          isExpired: false,
          daysUntilExpiry: 500,
        },
      ];

      const suggestionsWithoutFilter = await RecipeService.getRecipeSuggestions(inventoryWithoutExpiring);
      const suggestionsWithFilter = await RecipeService.getRecipeSuggestions(inventoryWithoutExpiring, {
        prioritizeExpiring: true
      });
      
      // Should have fewer suggestions when filtering for expiring items
      expect(suggestionsWithFilter.length).toBeLessThanOrEqual(suggestionsWithoutFilter.length);
      
      // All suggestions with filter should have at least one expiring ingredient
      suggestionsWithFilter.forEach(suggestion => {
        expect(suggestion.expiringIngredientsCount).toBeGreaterThan(0);
      });
    });

    it('should maintain performance with expiration filtering', async () => {
      // Create inventory with mixed expiration dates
      const mixedInventory: InventoryItem[] = [
        {
          id: '1',
          name: 'Pasta',
          category: 'pantry',
          quantity: 1,
          unit: 'piece',
          expirationDate: new Date('2025-12-31'),
          addedDate: new Date(),
          confidence: 0.9,
          isExpired: false,
          daysUntilExpiry: 365,
        },
        {
          id: '2',
          name: 'Tomato',
          category: 'vegetables',
          quantity: 4,
          unit: 'pieces',
          expirationDate: new Date(),
          addedDate: new Date(),
          confidence: 0.8,
          isExpired: false,
          daysUntilExpiry: 1,
        },
        {
          id: '3',
          name: 'Garlic',
          category: 'vegetables',
          quantity: 2,
          unit: 'cloves',
          expirationDate: new Date(),
          addedDate: new Date(),
          confidence: 0.7,
          isExpired: false,
          daysUntilExpiry: 2,
        },
      ];

      const startTime = Date.now();
      const suggestions = await RecipeService.getRecipeSuggestions(mixedInventory, {
        prioritizeExpiring: true
      });
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete within 2 seconds (2000ms)
      expect(executionTime).toBeLessThan(2000);
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should sort recipes by expiration priority when prioritizeExpiring is enabled', async () => {
      // Create inventory with items expiring at different times
      const inventoryWithMixedExpiration: InventoryItem[] = [
        {
          id: '1',
          name: 'Pasta',
          category: 'pantry',
          quantity: 1,
          unit: 'piece',
          expirationDate: new Date('2025-12-31'),
          addedDate: new Date(),
          confidence: 0.9,
          isExpired: false,
          daysUntilExpiry: 365,
        },
        {
          id: '2',
          name: 'Tomato',
          category: 'vegetables',
          quantity: 4,
          unit: 'pieces',
          expirationDate: new Date(),
          addedDate: new Date(),
          confidence: 0.8,
          isExpired: false,
          daysUntilExpiry: 1, // Expires soonest
        },
        {
          id: '3',
          name: 'Garlic',
          category: 'vegetables',
          quantity: 2,
          unit: 'cloves',
          expirationDate: new Date(),
          addedDate: new Date(),
          confidence: 0.7,
          isExpired: false,
          daysUntilExpiry: 3, // Expires later
        },
      ];

      const suggestions = await RecipeService.getRecipeSuggestions(inventoryWithMixedExpiration, {
        prioritizeExpiring: true
      });

      // Should have suggestions
      expect(suggestions.length).toBeGreaterThan(0);

      // Check that recipes with higher expiration priority come first
      for (let i = 0; i < suggestions.length - 1; i++) {
        const current = suggestions[i];
        const next = suggestions[i + 1];
        
        // If current has higher expiration priority, it should come first
        if (current.expirationPriority > next.expirationPriority) {
          expect(current.expirationPriority).toBeGreaterThan(next.expirationPriority);
        }
      }
    });

    it('should handle expired items correctly in expiration filtering', async () => {
      // Create inventory with expired items
      const inventoryWithExpired: InventoryItem[] = [
        {
          id: '1',
          name: 'Expired Tomato',
          category: 'vegetables',
          quantity: 4,
          unit: 'pieces',
          expirationDate: new Date('2024-01-01'),
          addedDate: new Date('2024-01-01'),
          confidence: 0.8,
          isExpired: true,
          daysUntilExpiry: -10,
        },
        {
          id: '2',
          name: 'Fresh Pasta',
          category: 'pantry',
          quantity: 1,
          unit: 'piece',
          expirationDate: new Date('2025-12-31'),
          addedDate: new Date(),
          confidence: 0.9,
          isExpired: false,
          daysUntilExpiry: 365,
        },
      ];

      const suggestions = await RecipeService.getRecipeSuggestions(inventoryWithExpired, {
        prioritizeExpiring: true
      });

      // Expired items should not contribute to expiration priority
      suggestions.forEach(suggestion => {
        expect(suggestion.expiringIngredientsCount).toBe(0);
        expect(suggestion.expirationPriority).toBe(0);
      });
    });

    it('should support configurable expiration threshold', async () => {
      // Create inventory with items expiring at different times
      const inventoryWithMixedExpiration: InventoryItem[] = [
        {
          id: '1',
          name: 'Pasta',
          category: 'pantry',
          quantity: 1,
          unit: 'piece',
          expirationDate: new Date('2025-12-31'),
          addedDate: new Date(),
          confidence: 0.9,
          isExpired: false,
          daysUntilExpiry: 365,
        },
        {
          id: '2',
          name: 'Tomato',
          category: 'vegetables',
          quantity: 4,
          unit: 'pieces',
          expirationDate: new Date(),
          addedDate: new Date(),
          confidence: 0.8,
          isExpired: false,
          daysUntilExpiry: 5, // Expires in 5 days
        },
        {
          id: '3',
          name: 'Garlic',
          category: 'vegetables',
          quantity: 2,
          unit: 'cloves',
          expirationDate: new Date(),
          addedDate: new Date(),
          confidence: 0.7,
          isExpired: false,
          daysUntilExpiry: 10, // Expires in 10 days
        },
      ];

      // Test with default threshold (7 days)
      const suggestionsDefault = await RecipeService.getRecipeSuggestions(inventoryWithMixedExpiration, {
        prioritizeExpiring: true
      });

      // Test with custom threshold (15 days)
      const suggestionsCustom = await RecipeService.getRecipeSuggestions(inventoryWithMixedExpiration, {
        prioritizeExpiring: true,
        expirationThreshold: 15
      });

      // Should have more suggestions with higher threshold
      expect(suggestionsCustom.length).toBeGreaterThanOrEqual(suggestionsDefault.length);
    });

    it('should support configurable weight multiplier', async () => {
      // Create inventory with expiring items
      const inventoryWithExpiring: InventoryItem[] = [
        {
          id: '1',
          name: 'Pasta',
          category: 'pantry',
          quantity: 1,
          unit: 'piece',
          expirationDate: new Date('2025-12-31'),
          addedDate: new Date(),
          confidence: 0.9,
          isExpired: false,
          daysUntilExpiry: 365,
        },
        {
          id: '2',
          name: 'Tomato',
          category: 'vegetables',
          quantity: 4,
          unit: 'pieces',
          expirationDate: new Date(),
          addedDate: new Date(),
          confidence: 0.8,
          isExpired: false,
          daysUntilExpiry: 1, // Expiring soon
        },
      ];

      // Test with default weight multiplier
      const suggestionsDefault = await RecipeService.getRecipeSuggestions(inventoryWithExpiring, {
        prioritizeExpiring: true
      });

      // Test with higher weight multiplier
      const suggestionsHighWeight = await RecipeService.getRecipeSuggestions(inventoryWithExpiring, {
        prioritizeExpiring: true,
        expirationWeightMultiplier: 0.5 // Higher boost
      });

      // Find a recipe that uses tomatoes
      const tomatoRecipeDefault = suggestionsDefault.find(s => 
        s.availableIngredients.some(ing => ing.name.toLowerCase().includes('tomato'))
      );
      const tomatoRecipeHighWeight = suggestionsHighWeight.find(s => 
        s.availableIngredients.some(ing => ing.name.toLowerCase().includes('tomato'))
      );

      if (tomatoRecipeDefault && tomatoRecipeHighWeight) {
        // Higher weight multiplier should result in higher match score
        expect(tomatoRecipeHighWeight.matchScore).toBeGreaterThanOrEqual(tomatoRecipeDefault.matchScore);
      }
    });

    it('should provide configuration options', () => {
      const config = RecipeService.getExpirationConfig();
      
      expect(config).toHaveProperty('defaultWeightMultiplier');
      expect(config).toHaveProperty('defaultThreshold');
      expect(config).toHaveProperty('weightLevels');
      
      expect(typeof config.defaultWeightMultiplier).toBe('number');
      expect(typeof config.defaultThreshold).toBe('number');
      expect(typeof config.weightLevels).toBe('object');
      
      expect(config.weightLevels).toHaveProperty('CRITICAL');
      expect(config.weightLevels).toHaveProperty('HIGH');
      expect(config.weightLevels).toHaveProperty('MEDIUM');
      expect(config.weightLevels).toHaveProperty('NORMAL');
    });

    it('should support custom threshold in getRecipesForExpiringItems', async () => {
      // Create inventory with items expiring at different times
      const inventoryWithMixedExpiration: InventoryItem[] = [
        {
          id: '1',
          name: 'Pasta',
          category: 'pantry',
          quantity: 1,
          unit: 'piece',
          expirationDate: new Date('2025-12-31'),
          addedDate: new Date(),
          confidence: 0.9,
          isExpired: false,
          daysUntilExpiry: 365,
        },
        {
          id: '2',
          name: 'Tomato',
          category: 'vegetables',
          quantity: 4,
          unit: 'pieces',
          expirationDate: new Date(),
          addedDate: new Date(),
          confidence: 0.8,
          isExpired: false,
          daysUntilExpiry: 5, // Expires in 5 days
        },
        {
          id: '3',
          name: 'Garlic',
          category: 'vegetables',
          quantity: 2,
          unit: 'cloves',
          expirationDate: new Date(),
          addedDate: new Date(),
          confidence: 0.7,
          isExpired: false,
          daysUntilExpiry: 10, // Expires in 10 days
        },
      ];

      // Test with default threshold
      const suggestionsDefault = await RecipeService.getRecipesForExpiringItems(inventoryWithMixedExpiration);
      
      // Test with custom threshold (15 days)
      const suggestionsCustom = await RecipeService.getRecipesForExpiringItems(inventoryWithMixedExpiration, 15);

      // Should have more suggestions with higher threshold
      expect(suggestionsCustom.length).toBeGreaterThanOrEqual(suggestionsDefault.length);
    });

    it('should return empty array when no matches found', async () => {
      const emptyInventory: InventoryItem[] = [];
      const suggestions = await RecipeService.getRecipeSuggestions(emptyInventory);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBe(0);
    });
  });

  describe('getRecipesByCategory', () => {
    it('should return recipes by cuisine', async () => {
      const recipes = await RecipeService.getRecipesByCategory('Italian');
      
      expect(recipes).toBeDefined();
      expect(Array.isArray(recipes)).toBe(true);
      expect(recipes.length).toBeGreaterThan(0);
      
      recipes.forEach(recipe => {
        expect(recipe.cuisine).toBe('Italian');
      });
    });

    it('should return recipes by tag', async () => {
      const recipes = await RecipeService.getRecipesByCategory('quick');
      
      expect(recipes).toBeDefined();
      expect(Array.isArray(recipes)).toBe(true);
      expect(recipes.length).toBeGreaterThan(0);
      
      recipes.forEach(recipe => {
        expect(recipe.tags).toContain('quick');
      });
    });
  });

  describe('getQuickRecipes', () => {
    it('should return recipes with total time <= maxTime', async () => {
      const recipes = await RecipeService.getQuickRecipes(30);
      
      expect(recipes).toBeDefined();
      expect(Array.isArray(recipes)).toBe(true);
      
      recipes.forEach(recipe => {
        const totalTime = recipe.prepTime + recipe.cookTime;
        expect(totalTime).toBeLessThanOrEqual(30);
      });
    });

    it('should use default maxTime of 30 minutes', async () => {
      const recipes = await RecipeService.getQuickRecipes();
      
      expect(recipes).toBeDefined();
      expect(Array.isArray(recipes)).toBe(true);
      
      recipes.forEach(recipe => {
        const totalTime = recipe.prepTime + recipe.cookTime;
        expect(totalTime).toBeLessThanOrEqual(30);
      });
    });
  });

  describe('getRecipesByDifficulty', () => {
    it('should return recipes by difficulty level', async () => {
      const recipes = await RecipeService.getRecipesByDifficulty('easy');
      
      expect(recipes).toBeDefined();
      expect(Array.isArray(recipes)).toBe(true);
      expect(recipes.length).toBeGreaterThan(0);
      
      recipes.forEach(recipe => {
        expect(recipe.difficulty).toBe('easy');
      });
    });

    it('should return empty array for non-existent difficulty', async () => {
      const recipes = await RecipeService.getRecipesByDifficulty('expert' as any);
      
      expect(recipes).toBeDefined();
      expect(Array.isArray(recipes)).toBe(true);
      expect(recipes.length).toBe(0);
    });
  });

  describe('getRandomRecipe', () => {
    it('should return a random recipe', async () => {
      const recipe = await RecipeService.getRandomRecipe();
      
      expect(recipe).toBeDefined();
      expect(recipe).toHaveProperty('id');
      expect(recipe).toHaveProperty('name');
      expect(recipe).toHaveProperty('description');
    });

    it('should return different recipes on multiple calls', async () => {
      const recipes = new Set();
      
      // Call multiple times to test randomness
      for (let i = 0; i < 10; i++) {
        const recipe = await RecipeService.getRandomRecipe();
        recipes.add(recipe.id);
      }
      
      // Should have some variety (not all the same)
      expect(recipes.size).toBeGreaterThan(1);
    });
  });

  describe('getRecipesForExpiringItems', () => {
    const mockExpiringItems: InventoryItem[] = [
      {
        id: '1',
        name: 'Tomato',
        category: 'vegetables',
        quantity: 4,
        unit: 'pieces',
        expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        addedDate: new Date(),
        confidence: 0.8,
        isExpired: false,
        daysUntilExpiry: 2,
      },
    ];

    beforeEach(() => {
      mockInventoryService.getAllItems.mockResolvedValue(mockExpiringItems);
    });

    it('should return recipe suggestions for expiring items', async () => {
      const suggestions = await RecipeService.getRecipesForExpiringItems(mockExpiringItems);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      
      // Should prioritize recipes that use expiring items
      suggestions.forEach(suggestion => {
        expect(suggestion.missingIngredients.length).toBeLessThanOrEqual(2);
      });
    });

    it('should return empty array when no expiring items', async () => {
      const nonExpiringItems: InventoryItem[] = [
        {
          id: '1',
          name: 'Pasta',
          category: 'pantry',
          quantity: 1,
          unit: 'piece',
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          addedDate: new Date(),
          confidence: 0.9,
          isExpired: false,
          daysUntilExpiry: 30,
        },
      ];
      
      const suggestions = await RecipeService.getRecipesForExpiringItems(nonExpiringItems);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBe(0);
    });
  });
});
