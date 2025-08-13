import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { RecipeService, Recipe } from '../services/RecipeService';
import { InventoryService, InventoryItem } from '../services/InventoryService';

interface RecipeDetailScreenProps {
  recipeId: string;
  onBack: () => void;
  onAddToGroceryList?: (missingIngredients: string[]) => void;
}

export const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({
  recipeId,
  onBack,
  onAddToGroceryList,
}) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [showNutrition, setShowNutrition] = useState(false);

  useEffect(() => {
    loadRecipeDetails();
  }, [recipeId]);

  const loadRecipeDetails = async () => {
    try {
      setLoading(true);
      const [recipeData, items] = await Promise.all([
        RecipeService.getRecipeById(recipeId),
        InventoryService.getAllItems(),
      ]);
      
      setRecipe(recipeData);
      setInventoryItems(items);
    } catch (error) {
      console.error('Failed to load recipe details:', error);
      Alert.alert('Error', 'Failed to load recipe details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#27ae60';
      case 'medium': return '#f39c12';
      case 'hard': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const checkIngredientAvailability = (ingredientName: string) => {
    return inventoryItems.some(item => 
      item.name.toLowerCase() === ingredientName.toLowerCase()
    );
  };

  const getMissingIngredients = () => {
    if (!recipe) return [];
    
    return recipe.ingredients
      .filter(ing => !ing.isOptional && !checkIngredientAvailability(ing.name))
      .map(ing => `${ing.name} (${ing.amount} ${ing.unit})`);
  };

  const handleAddToGroceryList = () => {
    const missingIngredients = getMissingIngredients();
    if (missingIngredients.length === 0) {
      Alert.alert('Great!', 'You have all the ingredients needed for this recipe!');
      return;
    }
    
    if (onAddToGroceryList) {
      onAddToGroceryList(missingIngredients);
      Alert.alert('Added!', 'Missing ingredients have been added to your grocery list.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Recipe not found</Text>
        <Text style={styles.errorSubtitle}>The recipe you're looking for doesn't exist.</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recipe Header */}
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <Text style={styles.recipeDescription}>{recipe.description}</Text>
          
          <View style={styles.recipeMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Prep Time</Text>
              <Text style={styles.metaValue}>{formatTime(recipe.prepTime)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Cook Time</Text>
              <Text style={styles.metaValue}>{formatTime(recipe.cookTime)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Servings</Text>
              <Text style={styles.metaValue}>{recipe.servings}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Difficulty</Text>
              <Text style={[styles.metaValue, { color: getDifficultyColor(recipe.difficulty) }]}>
                {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {recipe.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Ingredients Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <View style={styles.ingredientsList}>
            {recipe.ingredients.map((ingredient, index) => {
              const isAvailable = checkIngredientAvailability(ingredient.name);
              return (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientInfo}>
                    <Text style={[
                      styles.ingredientName,
                      isAvailable ? styles.availableIngredient : styles.missingIngredient
                    ]}>
                      {ingredient.name}
                    </Text>
                    <Text style={styles.ingredientAmount}>
                      {ingredient.amount} {ingredient.unit}
                    </Text>
                  </View>
                  <View style={styles.ingredientStatus}>
                    {isAvailable ? (
                      <Text style={styles.availableText}>✓ Available</Text>
                    ) : (
                      <Text style={styles.missingText}>✗ Missing</Text>
                    )}
                    {ingredient.isOptional && (
                      <Text style={styles.optionalText}>(Optional)</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Instructions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <View style={styles.instructionsList}>
            {recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Nutrition Section */}
        {recipe.nutritionInfo && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.nutritionHeader}
              onPress={() => setShowNutrition(!showNutrition)}
            >
              <Text style={styles.sectionTitle}>Nutrition Information</Text>
              <Text style={styles.expandIcon}>{showNutrition ? '▼' : '▶'}</Text>
            </TouchableOpacity>
            
            {showNutrition && (
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutritionInfo.calories}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutritionInfo.protein}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutritionInfo.carbs}g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutritionInfo.fat}g</Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{recipe.nutritionInfo.fiber}g</Text>
                  <Text style={styles.nutritionLabel}>Fiber</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAddToGroceryList}
          >
            <Text style={styles.primaryButtonText}>Add Missing to Grocery List</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Save Recipe</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  recipeHeader: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 24,
    marginBottom: 16,
  },
  recipeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#ecf0f1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  ingredientsList: {
    marginBottom: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  availableIngredient: {
    color: '#27ae60',
  },
  missingIngredient: {
    color: '#e74c3c',
  },
  ingredientAmount: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  ingredientStatus: {
    alignItems: 'flex-end',
  },
  availableText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
  },
  missingText: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '600',
  },
  optionalText: {
    fontSize: 10,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  instructionsList: {
    marginBottom: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 16,
    color: '#3498db',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '18%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  actionButtons: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#ecf0f1',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
  },
}); 