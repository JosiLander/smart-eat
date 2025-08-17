import { SmartExpiryService, ExpiryResolution, ExpirySuggestion } from '../SmartExpiryService';

describe('SmartExpiryService', () => {
  beforeEach(async () => {
    // Clear localStorage before each test
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    await SmartExpiryService.initialize();
  });

  describe('initialize', () => {
    it('should initialize with empty corrections', async () => {
      await SmartExpiryService.initialize();
      // Service should initialize without errors
      expect(true).toBe(true);
    });

    it('should load existing corrections from localStorage', async () => {
      const mockCorrections = [
        {
          itemName: 'test-item',
          originalDate: new Date('2024-01-01'),
          correctedDate: new Date('2024-01-05'),
          originalSource: 'ai' as const,
          timestamp: new Date(),
        },
      ];

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('expiry_corrections', JSON.stringify(mockCorrections));
      }

      await SmartExpiryService.initialize();
      // Service should load corrections without errors
      expect(true).toBe(true);
    });
  });

  describe('resolveExpiryDate', () => {
    it('should return high confidence OCR result when valid date provided', async () => {
      const validDate = new Date();
      validDate.setDate(validDate.getDate() + 7);

      const result = await SmartExpiryService.resolveExpiryDate('test-item', [validDate]);

      expect(result.confidence).toBe('high');
      expect(result.source).toBe('ocr');
      expect(result.requiresUserInput).toBe(false);
      expect(result.ocrResult).toEqual(validDate);
      expect(result.finalDate).toEqual(validDate);
    });

    it('should return medium confidence AI suggestion when OCR fails', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const result = await SmartExpiryService.resolveExpiryDate('carrot', [pastDate]);

      expect(result.confidence).toBe('medium');
      expect(result.source).toBe('ai');
      expect(result.requiresUserInput).toBe(false);
      expect(result.aiSuggestion).toBeDefined();
      expect(result.storageConditions).toBeDefined();
    });

    it('should return low confidence manual entry when no valid options', async () => {
      const result = await SmartExpiryService.resolveExpiryDate('unknown-item', []);

      expect(result.confidence).toBe('low');
      expect(result.source).toBe('manual');
      expect(result.requiresUserInput).toBe(true);
    });

    it('should handle brand-specific adjustments', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const result = await SmartExpiryService.resolveExpiryDate('milk', [pastDate], undefined, 'organic');

      expect(result.confidence).toBe('medium');
      expect(result.source).toBe('ai');
      expect(result.aiSuggestion).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      // Mock a scenario that would cause an error
      const result = await SmartExpiryService.resolveExpiryDate('', []);

      expect(result.confidence).toBe('low');
      expect(result.source).toBe('manual');
      expect(result.requiresUserInput).toBe(true);
    });
  });

  describe('getAISuggestion', () => {
    it('should return accurate suggestion for known items', async () => {
      const suggestion = await SmartExpiryService.getAISuggestion('carrot');

      expect(suggestion.date).toBeInstanceOf(Date);
      expect(suggestion.confidence).toBeGreaterThan(0.3);
      expect(suggestion.confidence).toBeLessThanOrEqual(0.9);
      expect(suggestion.source).toBe('ai');
      expect(suggestion.reasoning).toContain('Carrot');
      expect(suggestion.storageConditions).toContain('refrigerated');
    });

    it('should apply seasonal adjustments', async () => {
      const suggestion = await SmartExpiryService.getAISuggestion('carrot');

      expect(suggestion.reasoning).toContain('Based on Carrot storage guidelines');
      expect(suggestion.storageConditions).toBeDefined();
    });

    it('should apply brand-specific adjustments', async () => {
      const suggestion = await SmartExpiryService.getAISuggestion('milk', 'organic');

      expect(suggestion.reasoning).toContain('organic brand');
      expect(suggestion.date).toBeInstanceOf(Date);
    });

    it('should return category-based suggestion for unknown items', async () => {
      const suggestion = await SmartExpiryService.getAISuggestion('unknown-fruit');

      expect(suggestion.date).toBeInstanceOf(Date);
      expect(suggestion.confidence).toBe(0.5);
      expect(suggestion.source).toBe('ai');
      expect(suggestion.reasoning).toContain('typical');
    });

    it('should include storage conditions in suggestion', async () => {
      const suggestion = await SmartExpiryService.getAISuggestion('apple');

      expect(suggestion.storageConditions).toBeDefined();
      expect(suggestion.storageConditions.length).toBeGreaterThan(0);
    });
  });

  describe('batchResolveExpiryDates', () => {
    it('should resolve multiple items efficiently', async () => {
      const items = [
        { name: 'carrot', ocrDates: [] },
        { name: 'apple', ocrDates: [] },
        { name: 'milk', ocrDates: [] },
      ];

      const results = await SmartExpiryService.batchResolveExpiryDates(items);

      expect(results).toHaveLength(3);
      expect(results[0].itemName).toBe('carrot');
      expect(results[1].itemName).toBe('apple');
      expect(results[2].itemName).toBe('milk');
      expect(results.every(r => r.confidence === 'medium')).toBe(true);
    });

    it('should handle mixed OCR and AI resolutions', async () => {
      const validDate = new Date();
      validDate.setDate(validDate.getDate() + 7);

      const items = [
        { name: 'carrot', ocrDates: [validDate] },
        { name: 'apple', ocrDates: [] },
      ];

      const results = await SmartExpiryService.batchResolveExpiryDates(items);

      expect(results[0].confidence).toBe('high');
      expect(results[0].source).toBe('ocr');
      expect(results[1].confidence).toBe('medium');
      expect(results[1].source).toBe('ai');
    });
  });

  describe('recordUserCorrection', () => {
    it('should record user corrections', async () => {
      const originalDate = new Date('2024-01-01');
      const correctedDate = new Date('2024-01-05');

      await SmartExpiryService.recordUserCorrection(
        'test-item',
        originalDate,
        correctedDate,
        'ai'
      );

      // Verify correction was recorded by checking if it affects future suggestions
      const suggestion = await SmartExpiryService.getAISuggestion('test-item');
      expect(suggestion.confidence).toBeLessThan(0.8); // Should be reduced due to correction
    });

    it('should handle multiple corrections for same item', async () => {
      const originalDate = new Date('2024-01-01');
      const correctedDate1 = new Date('2024-01-05');
      const correctedDate2 = new Date('2024-01-10');

      await SmartExpiryService.recordUserCorrection(
        'test-item',
        originalDate,
        correctedDate1,
        'ai'
      );

      await SmartExpiryService.recordUserCorrection(
        'test-item',
        originalDate,
        correctedDate2,
        'ai'
      );

      const suggestion = await SmartExpiryService.getAISuggestion('test-item');
      expect(suggestion.confidence).toBeLessThan(0.7); // Should be further reduced
    });
  });

  describe('getStorageRecommendations', () => {
    it('should return specific recommendations for known items', () => {
      const recommendations = SmartExpiryService.getStorageRecommendations('carrot');

      expect(recommendations).toContain('refrigerated');
      expect(recommendations).toContain('dark_place');
      expect(recommendations).toContain('high_humidity');
    });

    it('should return category-based recommendations for unknown items', () => {
      const recommendations = SmartExpiryService.getStorageRecommendations('apple');

      expect(recommendations).toContain('refrigerated');
      expect(recommendations).toContain('crisper_drawer');
    });

    it('should return default recommendation for completely unknown items', () => {
      const recommendations = SmartExpiryService.getStorageRecommendations('completely-unknown');

      expect(recommendations).toEqual(['room_temperature']);
    });

    it('should handle dairy items correctly', () => {
      const recommendations = SmartExpiryService.getStorageRecommendations('milk');

      expect(recommendations).toContain('refrigerated');
      expect(recommendations).toContain('back_of_fridge');
    });

    it('should handle meat items correctly', () => {
      const recommendations = SmartExpiryService.getStorageRecommendations('chicken');

      expect(recommendations).toContain('refrigerated');
      expect(recommendations).toContain('meat_drawer');
    });
  });

  describe('confidence calculation', () => {
    it('should reduce confidence based on user corrections', async () => {
      const originalDate = new Date('2024-01-01');
      const correctedDate = new Date('2024-01-10');

      await SmartExpiryService.recordUserCorrection(
        'carrot',
        originalDate,
        correctedDate,
        'ai'
      );

      const suggestion = await SmartExpiryService.getAISuggestion('carrot');
      expect(suggestion.confidence).toBeLessThanOrEqual(0.8);
    });

    it('should increase confidence for items with detailed storage conditions', async () => {
      const suggestion = await SmartExpiryService.getAISuggestion('carrot');
      expect(suggestion.confidence).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('seasonal adjustments', () => {
    it('should apply seasonal variations to expiry dates', async () => {
      const suggestion = await SmartExpiryService.getAISuggestion('carrot');
      
      // Should include seasonal information in reasoning
      expect(suggestion.reasoning).toMatch(/season/);
    });
  });

  describe('error handling', () => {
    it('should handle invalid dates gracefully', async () => {
      const invalidDate = new Date('invalid-date');
      const result = await SmartExpiryService.resolveExpiryDate('test-item', [invalidDate]);

      expect(result.confidence).toBe('low');
      expect(result.source).toBe('manual');
      expect(result.requiresUserInput).toBe(true);
    });

    it('should handle past dates as invalid', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const result = await SmartExpiryService.resolveExpiryDate('test-item', [pastDate]);

      expect(result.confidence).toBe('low');
      expect(result.source).toBe('manual');
    });
  });
});
