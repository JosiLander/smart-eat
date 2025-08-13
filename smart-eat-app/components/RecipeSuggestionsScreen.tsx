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
} from 'react-native';
import { RecipeService, RecipeSuggestion, RecipeSearchFilters } from '../services/RecipeService';
import { InventoryService, InventoryItem } from '../services/InventoryService';

interface RecipeSuggestionsScreenProps {
  onBack: () => void;
  onViewRecipe: (recipeId: string) => void;
}

export const RecipeSuggestionsScreen: React.FC<RecipeSuggestionsScreenProps> = ({
  onBack,
  onViewRecipe,
}) => {
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<RecipeSearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    loadRecipeSuggestions();
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

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderRecipeCard = ({ item }: { item: RecipeSuggestion }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => onViewRecipe(item.recipe.id)}
    >
      <View style={styles.recipeHeader}>
        <View style={styles.recipeTitleSection}>
          <Text style={styles.recipeName}>{item.recipe.name}</Text>
          <Text style={styles.recipeDescription} numberOfLines={2}>
            {item.recipe.description}
          </Text>
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
      </View>

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
    </TouchableOpacity>
  );

  const renderFilterSection = () => (
    <View style={styles.filterSection}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, filters.difficulty === 'easy' && styles.filterButtonActive]}
          onPress={() => setFilters(prev => ({ ...prev, difficulty: prev.difficulty === 'easy' ? undefined : 'easy' }))}
        >
          <Text style={[styles.filterButtonText, filters.difficulty === 'easy' && styles.filterButtonTextActive]}>
            Easy
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filters.difficulty === 'medium' && styles.filterButtonActive]}
          onPress={() => setFilters(prev => ({ ...prev, difficulty: prev.difficulty === 'medium' ? undefined : 'medium' }))}
        >
          <Text style={[styles.filterButtonText, filters.difficulty === 'medium' && styles.filterButtonTextActive]}>
            Medium
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filters.difficulty === 'hard' && styles.filterButtonActive]}
          onPress={() => setFilters(prev => ({ ...prev, difficulty: prev.difficulty === 'hard' ? undefined : 'hard' }))}
        >
          <Text style={[styles.filterButtonText, filters.difficulty === 'hard' && styles.filterButtonTextActive]}>
            Hard
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, filters.maxPrepTime === 30 && styles.filterButtonActive]}
          onPress={() => setFilters(prev => ({ ...prev, maxPrepTime: prev.maxPrepTime === 30 ? undefined : 30 }))}
        >
          <Text style={[styles.filterButtonText, filters.maxPrepTime === 30 && styles.filterButtonTextActive]}>
            Quick (&lt; 30m)
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filters.maxMissingIngredients === 1 && styles.filterButtonActive]}
          onPress={() => setFilters(prev => ({ ...prev, maxMissingIngredients: prev.maxMissingIngredients === 1 ? undefined : 1 }))}
        >
          <Text style={[styles.filterButtonText, filters.maxMissingIngredients === 1 && styles.filterButtonTextActive]}>
            Few Missing
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Finding perfect recipes for you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recipe Suggestions</Text>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterToggleText}>Filters</Text>
        </TouchableOpacity>
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
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No recipes found</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your filters or adding more items to your inventory
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadRecipeSuggestions}>
            <Text style={styles.refreshButtonText}>Refresh Suggestions</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={suggestions}
          renderItem={renderRecipeCard}
          keyExtractor={(item) => item.recipe.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.recipesList}
        />
      )}
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  filterToggle: {
    padding: 8,
  },
  filterToggleText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  searchSection: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
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
    borderColor: '#bdc3c7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
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
  recipeDetails: {
    marginTop: 12,
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