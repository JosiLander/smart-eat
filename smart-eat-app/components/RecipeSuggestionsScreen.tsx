import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from 'react-native';
import { RecipeService, RecipeSuggestion, RecipeSearchFilters } from '../services/RecipeService';
import { InventoryService, InventoryItem } from '../services/InventoryService';
import { ProgressiveDisclosure, LoadingIndicator, EnhancedEmptyState, Tooltip } from './ux';
import { FeatureFlagService } from '../services/FeatureFlagService';
import { AnalyticsService } from '../services/AnalyticsService';
import { AccessibilityService } from '../services/AccessibilityService';

interface RecipeSuggestionsScreenProps {
  onBack: () => void;
  onViewRecipe: (recipeId: string) => void;
  onScanItems?: () => void;
}

export const RecipeSuggestionsScreen: React.FC<RecipeSuggestionsScreenProps> = ({
  onBack,
  onViewRecipe,
  onScanItems,
}) => {
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<RecipeSearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true);
  
  // Feature flags and analytics
  const featureFlagService = FeatureFlagService.getInstance();
  const analyticsService = AnalyticsService.getInstance();
  const accessibilityService = AccessibilityService.getInstance();
  const [abTestVariant, setAbTestVariant] = useState<any>(null);

  useEffect(() => {
    loadRecipeSuggestions();
    
    // Initialize feature flags and A/B testing
    const variant = featureFlagService.getABTestVariant('expiration_ui_variant');
    setAbTestVariant(variant);
    
    // Track feature usage
    analyticsService.trackFeatureUsage('recipe_suggestions_screen_opened');
    
    // Track A/B test variant assignment
    if (variant) {
      analyticsService.trackABTestVariant('expiration_ui_variant', variant.name);
    }
  }, [filters]);

  const loadRecipeSuggestions = async () => {
    try {
      setLoading(true);
      const items = await InventoryService.getAllItems();
      setInventoryItems(items);
      
      const recipeSuggestions = await RecipeService.getRecipeSuggestions(items, filters);
      setSuggestions(recipeSuggestions);
    } catch (error) {
      console.error('Failed to load recipe suggestions:', error);
      Alert.alert('Error', 'Failed to load recipe suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (newFilters: RecipeSearchFilters) => {
    try {
      setFilterLoading(true);
      setFilters(newFilters);
      
      // Track filter changes
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined) {
          analyticsService.trackRecipeFilter(key, value);
        }
      });
      
      // Track expiration prioritization specifically
      if (newFilters.prioritizeExpiring !== filters.prioritizeExpiring) {
        analyticsService.trackExpirationPrioritization(
          !!newFilters.prioritizeExpiring,
          newFilters.prioritizeExpiring ? 1 : 0
        );
        
        // Announce to screen readers
        if (newFilters.prioritizeExpiring) {
          accessibilityService.announceForAccessibility('Expiration prioritization enabled. Recipes with expiring ingredients will be shown first.');
        } else {
          accessibilityService.announceForAccessibility('Expiration prioritization disabled.');
        }
      }
      
      const recipeSuggestions = await RecipeService.getRecipeSuggestions(inventoryItems, newFilters);
      setSuggestions(recipeSuggestions);
      
      // Announce results to screen readers
      accessibilityService.announceRecipeFound(recipeSuggestions.length);
    } catch (error) {
      console.error('Failed to apply filters:', error);
      analyticsService.trackError('filter_application_failed', error.message);
      Alert.alert('Error', 'Failed to apply filters. Please try again.');
    } finally {
      setFilterLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadRecipeSuggestions();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await RecipeService.searchRecipes(searchQuery);
      const searchSuggestions = await RecipeService.getRecipeSuggestions(inventoryItems, filters);
      const filteredSuggestions = searchSuggestions.filter(suggestion =>
        searchResults.some(recipe => recipe.id === suggestion.recipe.id)
      );
      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return '#27ae60'; // Green
    if (score >= 0.6) return '#f39c12'; // Orange
    return '#e74c3c'; // Red
  };

  const getMatchScoreText = (score: number) => {
    if (score >= 0.8) return 'Perfect Match';
    if (score >= 0.6) return 'Good Match';
    return 'Partial Match';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#27ae60';
      case 'medium': return '#f39c12';
      case 'hard': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  const getExpirationPriorityColor = (priority: number) => {
    if (priority >= 0.7) return '#e74c3c'; // Red for high priority
    if (priority >= 0.4) return '#f39c12'; // Orange for medium priority
    if (priority >= 0.1) return '#f1c40f'; // Yellow for low priority
    return '#95a5a6'; // Gray for no priority
  };

  const getExpirationPriorityText = (priority: number) => {
    if (priority >= 0.7) return 'Use Today!';
    if (priority >= 0.4) return 'Expires Soon';
    if (priority >= 0.1) return 'Use Soon';
    return '';
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderRecipeCard = ({ item }: { item: RecipeSuggestion }) => (
    <View style={styles.recipeCard}>
      <TouchableOpacity
        style={styles.recipeHeader}
        onPress={() => {
          analyticsService.trackRecipeView(item.recipe.id, item.recipe.name, 'suggestions_list');
          onViewRecipe(item.recipe.id);
        }}
        {...accessibilityService.getRecipeCardAccessibilityProps(item.recipe, item)}
      >
        <View style={styles.recipeTitleSection}>
          <Text style={styles.recipeName}>{item.recipe.name}</Text>
          <Text style={styles.recipeDescription} numberOfLines={2}>
            {item.recipe.description}
          </Text>
          {/* Expiration priority indicator */}
          {item.expirationPriority > 0 && (
            <View style={styles.expirationPriorityContainer}>
              <View style={[
                styles.expirationPriorityBadge,
                { backgroundColor: getExpirationPriorityColor(item.expirationPriority) }
              ]}>
                <Text style={styles.expirationPriorityText}>
                  {getExpirationPriorityText(item.expirationPriority)}
                </Text>
              </View>
              {item.expiringIngredientsCount > 0 && (
                <Text style={styles.expiringCountText}>
                  {item.expiringIngredientsCount} expiring ingredient{item.expiringIngredientsCount > 1 ? 's' : ''}
                </Text>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.matchScoreContainer}>
          <View style={[
            styles.matchScoreBadge,
            { backgroundColor: getMatchScoreColor(item.matchScore) }
          ]}>
            <Text style={styles.matchScoreText}>
              {Math.round(item.matchScore * 100)}%
            </Text>
          </View>
          <Text style={styles.matchScoreLabel}>
            {getMatchScoreText(item.matchScore)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Recipe details section */}
      <View style={styles.recipeDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{formatTime(item.estimatedPrepTime)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Difficulty</Text>
            <Text style={[
              styles.detailValue,
              { color: getDifficultyColor(item.recipe.difficulty) }
            ]}>
              {item.recipe.difficulty.charAt(0).toUpperCase() + item.recipe.difficulty.slice(1)}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Servings</Text>
            <Text style={styles.detailValue}>{item.recipe.servings}</Text>
          </View>
        </View>

        <View style={styles.ingredientsSection}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <View style={styles.ingredientsList}>
            {item.availableIngredients.map((ingredient, index) => (
              <View key={`available-${index}`} style={styles.ingredientItem}>
                <Text style={[styles.ingredientText, styles.availableIngredient]}>
                  ✓ {ingredient.name} ({ingredient.amount} {ingredient.unit})
                </Text>
              </View>
            ))}
            {item.missingIngredients.map((ingredient, index) => (
              <View key={`missing-${index}`} style={styles.ingredientItem}>
                <Text style={[styles.ingredientText, styles.missingIngredient]}>
                  ✗ {ingredient.name} ({ingredient.amount} {ingredient.unit})
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.tagsContainer}>
          {item.recipe.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderFilterSection = () => (
    <View style={styles.filterSection}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, filters.difficulty === 'easy' && styles.filterButtonActive]}
          onPress={() => handleFilterChange({ ...filters, difficulty: filters.difficulty === 'easy' ? undefined : 'easy' })}
          {...accessibilityService.getFilterButtonAccessibilityProps('difficulty', filters.difficulty === 'easy', 'easy')}
        >
          <Text style={[styles.filterButtonText, filters.difficulty === 'easy' && styles.filterButtonTextActive]}>
            Easy
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filters.difficulty === 'medium' && styles.filterButtonActive]}
          onPress={() => handleFilterChange({ ...filters, difficulty: filters.difficulty === 'medium' ? undefined : 'medium' })}
          {...accessibilityService.getFilterButtonAccessibilityProps('difficulty', filters.difficulty === 'medium', 'medium')}
        >
          <Text style={[styles.filterButtonText, filters.difficulty === 'medium' && styles.filterButtonTextActive]}>
            Medium
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filters.difficulty === 'hard' && styles.filterButtonActive]}
          onPress={() => handleFilterChange({ ...filters, difficulty: filters.difficulty === 'hard' ? undefined : 'hard' })}
          {...accessibilityService.getFilterButtonAccessibilityProps('difficulty', filters.difficulty === 'hard', 'hard')}
        >
          <Text style={[styles.filterButtonText, filters.difficulty === 'hard' && styles.filterButtonTextActive]}>
            Hard
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, filters.maxPrepTime === 30 && styles.filterButtonActive]}
          onPress={() => handleFilterChange({ ...filters, maxPrepTime: filters.maxPrepTime === 30 ? undefined : 30 })}
        >
          <Text style={[styles.filterButtonText, filters.maxPrepTime === 30 && styles.filterButtonTextActive]}>
            Quick (&lt; 30m)
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filters.maxMissingIngredients === 1 && styles.filterButtonActive]}
          onPress={() => handleFilterChange({ ...filters, maxMissingIngredients: filters.maxMissingIngredients === 1 ? undefined : 1 })}
        >
          <Text style={[styles.filterButtonText, filters.maxMissingIngredients === 1 && styles.filterButtonTextActive]}>
            Few Missing
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <Tooltip
          content="Prioritize recipes that use ingredients expiring soon. This helps reduce food waste by suggesting recipes that use your most urgent items first."
          position="bottom"
          onShow={() => analyticsService.tooltipInteraction('expiration_prioritization', 'show')}
          onHide={() => analyticsService.tooltipInteraction('expiration_prioritization', 'hide')}
        >
          <TouchableOpacity
            style={[styles.filterButton, filters.prioritizeExpiring && styles.filterButtonActive]}
            onPress={() => handleFilterChange({ ...filters, prioritizeExpiring: !filters.prioritizeExpiring })}
          >
            <Text style={[styles.filterButtonText, filters.prioritizeExpiring && styles.filterButtonTextActive]}>
              {filters.prioritizeExpiring ? '✓' : '○'} Use Expiring Items
            </Text>
          </TouchableOpacity>
        </Tooltip>
      </View>

      {/* Loading indicator for filter changes */}
      <LoadingIndicator
        visible={filterLoading}
        message="Updating recipes..."
        size="small"
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={styles.loadingText}>Finding perfect recipes for you...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back to main menu"
          accessibilityHint="Double tap to return to the previous screen"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recipe Suggestions</Text>
        <View style={styles.headerActions}>
          {onScanItems && (
            <TouchableOpacity style={styles.scanButton} onPress={onScanItems}>
              <Text style={styles.scanButtonText}>📷 Scan</Text>
            </TouchableOpacity>
          )}
          <Tooltip
            content="Use filters to find recipes that match your preferences. You can filter by difficulty, cooking time, and even prioritize recipes that use expiring ingredients!"
            position="bottom"
            showArrow={true}
            onShow={() => analyticsService.tooltipInteraction('filters_help', 'show')}
            onHide={() => analyticsService.tooltipInteraction('filters_help', 'hide')}
          >
            <TouchableOpacity
              style={styles.filterToggle}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Text style={styles.filterToggleText}>Filters</Text>
            </TouchableOpacity>
          </Tooltip>
        </View>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {showFilters && renderFilterSection()}

      <View style={styles.statsSection}>
        <Text style={styles.statsText}>
          {suggestions.length} recipes found • {inventoryItems.length} items in inventory
        </Text>
      </View>

      {suggestions.length === 0 ? (
        <EnhancedEmptyState
          title="No recipes found"
          subtitle={
            filters.prioritizeExpiring 
              ? "No recipes found that use your expiring ingredients. Try adjusting your filters or adding more items to your inventory."
              : "No recipes match your current filters. Try adjusting your search criteria or adding more items to your inventory."
          }
          onAction={() => {
            accessibilityService.announceLoadingState('Refreshing recipe suggestions');
            loadRecipeSuggestions();
          }}
          icon="🍽️"
          showAddItemsSuggestion={inventoryItems.length < 5}
          showFilterGuidance={Object.keys(filters).length > 0}
          onAddItems={() => {
            analyticsService.trackEmptyStateAction('add_items', 'recipe_suggestions');
            if (onScanItems) {
              onScanItems();
            } else {
              Alert.alert('Add Items', 'Navigate to camera to scan new items');
            }
          }}
          onAdjustFilters={() => {
            analyticsService.trackEmptyStateAction('adjust_filters', 'recipe_suggestions');
            setShowFilters(true);
          }}
          actionText="Refresh Suggestions"
          onAction={loadRecipeSuggestions}
        />
      ) : (
        <FlatList
          data={suggestions}
          renderItem={renderRecipeCard}
          keyExtractor={(item) => item.recipe.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.recipesList}
        />
      )}
    </SafeAreaView>
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
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scanButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 2,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#27ae60',
  },
  filterToggle: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterToggleText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  searchSection: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  filterSection: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: 'white',
  },
  filterButtonActive: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  statsSection: {
    padding: 15,
    backgroundColor: '#ecf0f1',
  },
  statsText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  recipesList: {
    padding: 20,
  },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recipeTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  matchScoreContainer: {
    alignItems: 'center',
  },
  matchScoreBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchScoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchScoreLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  expirationPriorityContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expirationPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  expirationPriorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  expiringCountText: {
    fontSize: 11,
    color: '#e74c3c',
    fontWeight: '500',
  },
  recipeDetails: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  ingredientsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ingredientItem: {
    marginRight: 12,
    marginBottom: 4,
  },
  ingredientText: {
    fontSize: 12,
  },
  availableIngredient: {
    color: '#27ae60',
  },
  missingIngredient: {
    color: '#e74c3c',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#ecf0f1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#7f8c8d',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 