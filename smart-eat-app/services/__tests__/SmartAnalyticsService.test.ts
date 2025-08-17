import { SmartAnalyticsService, ShoppingPattern, CostEstimate, SmartSuggestion, ShoppingInsight } from '../SmartAnalyticsService';

describe('SmartAnalyticsService', () => {
  beforeEach(async () => {
    // Clear localStorage before each test
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    await SmartAnalyticsService.initialize();
  });

  describe('initialize', () => {
    it('should initialize with empty data', async () => {
      await SmartAnalyticsService.initialize();
      // Service should initialize without errors
      expect(true).toBe(true);
    });

    it('should load existing data from localStorage', async () => {
      const mockPatterns = [
        {
          userId: 'user-1',
          itemName: 'milk',
          frequency: 5,
          averageQuantity: 2,
          preferredBrand: 'organic',
          lastPurchased: new Date().toISOString(),
          totalSpent: 25.0,
          category: 'dairy',
        },
      ];

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('shopping_patterns', JSON.stringify(mockPatterns));
      }

      await SmartAnalyticsService.initialize();
      // Service should load data without errors
      expect(true).toBe(true);
    });
  });

  describe('recordPurchase', () => {
    it('should record new purchase and create pattern', async () => {
      await SmartAnalyticsService.recordPurchase(
        'user-1',
        'milk',
        2,
        3.99,
        'organic',
        'dairy'
      );

      // Verify pattern was created
      const patterns = await SmartAnalyticsService['patterns'];
      expect(patterns.length).toBeGreaterThan(0);
      
      const pattern = patterns.find(p => p.userId === 'user-1' && p.itemName === 'milk');
      expect(pattern).toBeDefined();
      expect(pattern?.frequency).toBe(1);
      expect(pattern?.averageQuantity).toBe(2);
      expect(pattern?.totalSpent).toBe(7.98);
    });

    it('should update existing pattern when item is purchased again', async () => {
      // First purchase
      await SmartAnalyticsService.recordPurchase(
        'user-1',
        'bread',
        1,
        2.49,
        'whole_grain',
        'pantry'
      );

      // Second purchase
      await SmartAnalyticsService.recordPurchase(
        'user-1',
        'bread',
        2,
        2.99,
        'whole_grain',
        'pantry'
      );

      const patterns = await SmartAnalyticsService['patterns'];
      const pattern = patterns.find(p => p.userId === 'user-1' && p.itemName === 'bread');
      
      expect(pattern?.frequency).toBe(2);
      expect(pattern?.averageQuantity).toBe(1.5); // (1 + 2) / 2
      expect(pattern?.totalSpent).toBe(8.47); // 2.49 + (2 * 2.99)
    });

    it('should update cost estimate when recording purchase', async () => {
      await SmartAnalyticsService.recordPurchase(
        'user-1',
        'banana',
        6,
        0.59,
        'organic',
        'fruits'
      );

      const costEstimates = await SmartAnalyticsService['costEstimates'];
      const estimate = costEstimates.find(e => e.itemName === 'banana');
      
      expect(estimate).toBeDefined();
      expect(estimate?.estimatedPrice).toBe(0.59);
      expect(estimate?.source).toBe('user_history');
    });
  });

  describe('getCostEstimate', () => {
    it('should return existing cost estimate', async () => {
      // Record a purchase first
      await SmartAnalyticsService.recordPurchase(
        'user-1',
        'milk',
        1,
        3.99,
        'organic'
      );

      const estimate = await SmartAnalyticsService.getCostEstimate('milk');
      
      expect(estimate.itemName).toBe('milk');
      expect(estimate.estimatedPrice).toBe(3.99);
      expect(estimate.source).toBe('user_history');
    });

    it('should create new estimate from database for unknown item', async () => {
      const estimate = await SmartAnalyticsService.getCostEstimate('bread');
      
      expect(estimate.itemName).toBe('bread');
      expect(estimate.estimatedPrice).toBe(2.49); // From PRICE_DATABASE
      expect(estimate.source).toBe('ai_estimate');
      expect(estimate.confidence).toBe(0.6);
    });

    it('should apply seasonal variations to cost estimates', async () => {
      const estimate = await SmartAnalyticsService.getCostEstimate('tomato', undefined, 'summer');
      
      expect(estimate.estimatedPrice).toBe(2.09); // 2.99 * 0.7 (summer variation)
    });

    it('should apply brand variations to cost estimates', async () => {
      const estimate = await SmartAnalyticsService.getCostEstimate('milk', 'organic');
      
      expect(estimate.estimatedPrice).toBe(5.19); // 3.99 * 1.3 (organic brand variation)
    });
  });

  describe('getSmartSuggestions', () => {
    it('should return frequently bought items as suggestions', async () => {
      // Record multiple purchases to create patterns
      for (let i = 0; i < 5; i++) {
        await SmartAnalyticsService.recordPurchase(
          'user-1',
          'milk',
          1,
          3.99
        );
      }

      for (let i = 0; i < 3; i++) {
        await SmartAnalyticsService.recordPurchase(
          'user-1',
          'bread',
          1,
          2.49
        );
      }

      const suggestions = await SmartAnalyticsService.getSmartSuggestions(
        'user-1',
        ['eggs'] // Current list
      );

      expect(suggestions.length).toBeGreaterThan(0);
      
      const milkSuggestion = suggestions.find(s => s.itemName === 'milk');
      expect(milkSuggestion).toBeDefined();
      expect(milkSuggestion?.reason).toBe('frequently_bought');
      expect(milkSuggestion?.priority).toBe('high');
    });

    it('should return seasonal suggestions', async () => {
      const suggestions = await SmartAnalyticsService.getSmartSuggestions(
        'user-1',
        []
      );

      const seasonalSuggestions = suggestions.filter(s => s.reason === 'seasonal');
      expect(seasonalSuggestions.length).toBeGreaterThan(0);
    });

    it('should return complementary items based on current list', async () => {
      const suggestions = await SmartAnalyticsService.getSmartSuggestions(
        'user-1',
        ['bread', 'milk']
      );

      const complementarySuggestions = suggestions.filter(s => s.reason === 'complementary');
      expect(complementarySuggestions.length).toBeGreaterThan(0);
    });

    it('should respect budget constraints', async () => {
      const suggestions = await SmartAnalyticsService.getSmartSuggestions(
        'user-1',
        [],
        10 // Low budget
      );

      const totalCost = suggestions.reduce((sum, s) => sum + s.estimatedCost, 0);
      expect(totalCost).toBeLessThanOrEqual(10);
    });
  });

  describe('getShoppingInsights', () => {
    it('should return cost saving insights for expensive items', async () => {
      // Record expensive purchase
      await SmartAnalyticsService.recordPurchase(
        'user-1',
        'premium_steak',
        1,
        25.99
      );

      const insights = await SmartAnalyticsService.getShoppingInsights('user-1');
      
      const costSavingInsight = insights.find(i => i.type === 'cost_saving');
      expect(costSavingInsight).toBeDefined();
      expect(costSavingInsight?.impact).toBe('high');
      expect(costSavingInsight?.actionable).toBe(true);
    });

    it('should return efficiency insights for frequent purchases', async () => {
      // Record multiple frequent purchases
      for (let i = 0; i < 6; i++) {
        await SmartAnalyticsService.recordPurchase(
          'user-1',
          'milk',
          1,
          3.99
        );
      }

      for (let i = 0; i < 5; i++) {
        await SmartAnalyticsService.recordPurchase(
          'user-1',
          'bread',
          1,
          2.49
        );
      }

      const insights = await SmartAnalyticsService.getShoppingInsights('user-1');
      
      const efficiencyInsight = insights.find(i => i.type === 'efficiency');
      expect(efficiencyInsight).toBeDefined();
      expect(efficiencyInsight?.actionable).toBe(true);
    });

    it('should return health insights for unhealthy items', async () => {
      // Record unhealthy purchases
      await SmartAnalyticsService.recordPurchase(
        'user-1',
        'chips',
        1,
        3.99,
        undefined,
        'snacks'
      );

      await SmartAnalyticsService.recordPurchase(
        'user-1',
        'cookies',
        1,
        2.99,
        undefined,
        'sweets'
      );

      const insights = await SmartAnalyticsService.getShoppingInsights('user-1');
      
      const healthInsight = insights.find(i => i.type === 'health');
      expect(healthInsight).toBeDefined();
      expect(healthInsight?.actionable).toBe(true);
    });

    it('should return sustainability insights for non-organic items', async () => {
      // Record non-organic purchases
      await SmartAnalyticsService.recordPurchase(
        'user-1',
        'milk',
        1,
        3.99,
        'store_brand'
      );

      await SmartAnalyticsService.recordPurchase(
        'user-1',
        'bread',
        1,
        2.49,
        'regular'
      );

      const insights = await SmartAnalyticsService.getShoppingInsights('user-1');
      
      const sustainabilityInsight = insights.find(i => i.type === 'sustainability');
      expect(sustainabilityInsight).toBeDefined();
      expect(sustainabilityInsight?.actionable).toBe(true);
    });
  });

  describe('estimateListCost', () => {
    it('should estimate total cost for shopping list', async () => {
      const items = [
        { name: 'milk', quantity: 2, brand: 'organic' },
        { name: 'bread', quantity: 1, brand: 'whole_grain' },
        { name: 'banana', quantity: 6 },
      ];

      const estimate = await SmartAnalyticsService.estimateListCost(items);

      expect(estimate.totalCost).toBeGreaterThan(0);
      expect(estimate.breakdown.length).toBe(3);
      expect(estimate.range.min).toBeLessThan(estimate.totalCost);
      expect(estimate.range.max).toBeGreaterThan(estimate.totalCost);
    });

    it('should handle unknown items with default pricing', async () => {
      const items = [
        { name: 'unknown_item', quantity: 1 },
      ];

      const estimate = await SmartAnalyticsService.estimateListCost(items);

      expect(estimate.totalCost).toBe(5.0); // Default price
      expect(estimate.breakdown.length).toBe(1);
    });

    it('should calculate price ranges correctly', async () => {
      const items = [
        { name: 'milk', quantity: 1 },
      ];

      const estimate = await SmartAnalyticsService.estimateListCost(items);

      expect(estimate.range.min).toBeLessThan(estimate.totalCost);
      expect(estimate.range.max).toBeGreaterThan(estimate.totalCost);
      expect(estimate.range.min).toBe(estimate.totalCost * 0.8);
      expect(estimate.range.max).toBe(estimate.totalCost * 1.2);
    });
  });

  describe('getSeasonalPatterns', () => {
    it('should return seasonal patterns for current season', async () => {
      const patterns = await SmartAnalyticsService.getSeasonalPatterns();

      expect(patterns.length).toBeGreaterThan(0);
      
      const currentSeason = new Date().getMonth() >= 2 && new Date().getMonth() <= 4 ? 'spring' :
                           new Date().getMonth() >= 5 && new Date().getMonth() <= 7 ? 'summer' :
                           new Date().getMonth() >= 8 && new Date().getMonth() <= 10 ? 'fall' : 'winter';
      
      expect(patterns.every(p => p.season === currentSeason)).toBe(true);
    });

    it('should include price variations and recommendations', async () => {
      const patterns = await SmartAnalyticsService.getSeasonalPatterns();

      const tomatoPattern = patterns.find(p => p.itemName === 'tomato');
      expect(tomatoPattern).toBeDefined();
      expect(tomatoPattern?.availability).toBeGreaterThan(0);
      expect(tomatoPattern?.priceVariation).toBeDefined();
      expect(['buy_now', 'wait', 'avoid']).toContain(tomatoPattern?.recommendation);
    });
  });

  describe('price database', () => {
    it('should have comprehensive price data', async () => {
      const priceDatabase = SmartAnalyticsService['PRICE_DATABASE'];
      
      expect(priceDatabase['milk']).toBeDefined();
      expect(priceDatabase['bread']).toBeDefined();
      expect(priceDatabase['banana']).toBeDefined();
      expect(priceDatabase['chicken_breast']).toBeDefined();
      expect(priceDatabase['tomato']).toBeDefined();
    });

    it('should include seasonal variations', async () => {
      const priceDatabase = SmartAnalyticsService['PRICE_DATABASE'];
      
      expect(priceDatabase['tomato'].seasonalVariations.summer).toBe(0.7);
      expect(priceDatabase['tomato'].seasonalVariations.winter).toBe(1.4);
    });

    it('should include brand variations', async () => {
      const priceDatabase = SmartAnalyticsService['PRICE_DATABASE'];
      
      expect(priceDatabase['milk'].brandVariations.organic).toBe(1.3);
      expect(priceDatabase['milk'].brandVariations.store_brand).toBe(0.8);
    });
  });

  describe('category detection', () => {
    it('should correctly categorize items', async () => {
      const getCategoryFromName = SmartAnalyticsService['getCategoryFromName'];
      
      expect(getCategoryFromName('milk')).toBe('dairy');
      expect(getCategoryFromName('apple')).toBe('fruits');
      expect(getCategoryFromName('tomato')).toBe('vegetables');
      expect(getCategoryFromName('chicken')).toBe('meat');
      expect(getCategoryFromName('bread')).toBe('pantry');
      expect(getCategoryFromName('unknown_item')).toBe('other');
    });
  });

  describe('complementary items', () => {
    it('should suggest complementary items', async () => {
      const getComplementaryItems = SmartAnalyticsService['getComplementaryItems'];
      
      const complements = await getComplementaryItems(['bread', 'milk']);
      
      expect(complements).toContain('butter');
      expect(complements).toContain('cereal');
      expect(complements.length).toBeGreaterThan(0);
    });

    it('should remove duplicate suggestions', async () => {
      const getComplementaryItems = SmartAnalyticsService['getComplementaryItems'];
      
      const complements = await getComplementaryItems(['bread', 'milk']);
      const uniqueComplements = [...new Set(complements)];
      
      expect(complements.length).toBe(uniqueComplements.length);
    });
  });
});
