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
import { GroceryListService } from '../services/GroceryListService';
import { FamilyService, FamilyProfile } from '../services/FamilyService';

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
  const [familyProfile, setFamilyProfile] = useState<FamilyProfile | null>(null);
  const [scaledRecipe, setScaledRecipe] = useState<Recipe | null>(null);
  const [dietaryCompliance, setDietaryCompliance] = useState<{
    compliance: number;
    warnings: string[];
    isCompliant: boolean;
  } | null>(null);

  useEffect(() => {
    loadRecipeDetails();
  }, [recipeId]);

  const loadRecipeDetails = async () => {
    try {
      setLoading(true);
      const [recipeData, items, profile] = await Promise.all([
        RecipeService.getRecipeById(recipeId),
        InventoryService.getAllItems(),
        FamilyService.getFamilyProfile(),
      ]);
      
      setRecipe(recipeData);
      setInventoryItems(items);
      setFamilyProfile(profile);
      
      // Calculate family size and scale recipe
      if (recipeData && profile) {
        const familySize = profile.adults + profile.children;
        const scaled = RecipeService.scaleRecipeForFamily(recipeData, familySize);
        setScaledRecipe(scaled);
        
        // Check dietary compliance
        const dietaryCheck = RecipeService.checkDietaryCompliance(scaled, profile.dietaryRestrictions.map(r => r.type));
        setDietaryCompliance(dietaryCheck);
      }
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
    if (!recipe || !familyProfile) return [];
    
    const familySize = familyProfile.adults + familyProfile.children;
    return RecipeService.getMissingIngredientsForFamily(recipe, inventoryItems, familySize)
      .map(ing => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        category: (ing.category as 'fruits' | 'vegetables' | 'dairy' | 'meat' | 'pantry' | 'beverages' | 'snacks' | 'frozen' | 'other') || 'other'
      }));
  };

  const handleAddToGroceryList = async () => {
    const missingIngredients = getMissingIngredients();
    console.log('Missing ingredients:', missingIngredients);
    
    if (missingIngredients.length === 0) {
      Alert.alert('Great!', 'You have all the ingredients needed for this recipe!');
      return;
    }
    
    try {
      // Ensure GroceryListService is initialized
      await GroceryListService.initialize();
      
      const activeList = await GroceryListService.getActiveList();
      console.log('Active list:', activeList);
      
      if (!activeList) {
        // Create a default list if none exists
        const createResult = await GroceryListService.createList('Shopping List');
        if (createResult.success) {
          console.log('Created new grocery list:', createResult.listId);
        } else {
          Alert.alert('Error', 'Failed to create grocery list. Please try again.');
          return;
        }
      }

      // Get the active list again (either existing or newly created)
      const finalActiveList = await GroceryListService.getActiveList();
      if (!finalActiveList) {
        Alert.alert('Error', 'No active grocery list found. Please try again.');
        return;
      }

      console.log('Using grocery list:', finalActiveList.id);

      const result = await GroceryListService.addItemsFromRecipe(
        finalActiveList.id,
        missingIngredients,
        recipeId
      );

      console.log('Add items result:', result);

      if (result.success) {
        Alert.alert(
          'Added to Grocery List!', 
          `${missingIngredients.length} missing ingredients have been added to your grocery list.`
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to add ingredients to grocery list.');
      }
    } catch (error) {
      console.error('Failed to add ingredients to grocery list:', error);
      Alert.alert('Error', 'Failed to add ingredients to grocery list. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
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
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back to recipe suggestions"
          accessibilityHint="Double tap to return to the previous screen"
        >
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

        {/* Family-Aware Information */}
        {familyProfile && scaledRecipe && (
          <View style={styles.familySection}>
            <Text style={styles.familySectionTitle}>Family Information</Text>
            
            <View style={styles.familyInfo}>
              <View style={styles.familyInfoItem}>
                <Text style={styles.familyInfoLabel}>Family Size</Text>
                <Text style={styles.familyInfoValue}>
                  {familyProfile.adults + familyProfile.children} people
                </Text>
              </View>
              
              <View style={styles.familyInfoItem}>
                <Text style={styles.familyInfoLabel}>Scaled Servings</Text>
                <Text style={styles.familyInfoValue}>
                  {scaledRecipe.servings} servings
                </Text>
              </View>
              
              <View style={styles.familyInfoItem}>
                <Text style={styles.familyInfoLabel}>Total Time</Text>
                <Text style={styles.familyInfoValue}>
                  {formatTime(scaledRecipe.prepTime + scaledRecipe.cookTime)}
                </Text>
              </View>
            </View>

            {/* Dietary Compliance */}
            {dietaryCompliance && (
              <View style={styles.dietarySection}>
                <View style={styles.dietaryHeader}>
                  <Text style={styles.dietaryTitle}>Dietary Compliance</Text>
                  <View style={[
                    styles.complianceIndicator,
                    { backgroundColor: dietaryCompliance.isCompliant ? '#4CAF50' : '#FF5722' }
                  ]}>
                    <Text style={styles.complianceText}>
                      {Math.round(dietaryCompliance.compliance * 100)}%
                    </Text>
                  </View>
                </View>
                
                {dietaryCompliance.warnings.length > 0 && (
                  <View style={styles.warningsContainer}>
                    <Text style={styles.warningsTitle}>⚠️ Warnings:</Text>
                    {dietaryCompliance.warnings.map((warning, index) => (
                      <Text key={index} style={styles.warningText}>• {warning}</Text>
                    ))}
                  </View>
                )}
                
                {familyProfile.dietaryRestrictions.length > 0 && (
                  <View style={styles.restrictionsContainer}>
                    <Text style={styles.restrictionsTitle}>Your Dietary Restrictions:</Text>
                    {familyProfile.dietaryRestrictions.map((restriction, index) => (
                      <Text key={index} style={styles.restrictionText}>
                        • {restriction.type} ({restriction.severity})
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

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
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 18,
    minWidth: 88,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 26,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#f0f8f0',
  },
  backButtonText: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#27ae60',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(39, 174, 96, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    backgroundColor: '#27ae60',
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
    color: '#27ae60',
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
    backgroundColor: '#27ae60',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14,
    elevation: 5,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#2ecc71',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  secondaryButtonText: {
    color: '#2c3e50',
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
  // Family-aware styles
  familySection: {
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  familySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12,
  },
  familyInfo: {
    marginBottom: 16,
  },
  familyInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  familyInfoLabel: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  familyInfoValue: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: 'bold',
  },
  dietarySection: {
    borderTopWidth: 1,
    borderTopColor: '#BBDEFB',
    paddingTop: 12,
  },
  dietaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dietaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
  },
  complianceIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  complianceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  warningsContainer: {
    marginTop: 8,
  },
  warningsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF5722',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#D32F2F',
    marginLeft: 8,
    marginBottom: 2,
  },
  restrictionsContainer: {
    marginTop: 8,
  },
  restrictionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 4,
  },
  restrictionText: {
    fontSize: 12,
    color: '#616161',
    marginLeft: 8,
    marginBottom: 2,
  },
}); 