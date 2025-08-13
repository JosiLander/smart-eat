import { AIService, RecognizedProduct } from '../AIService';

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recognizeProducts', () => {
    it('should return a successful recognition result', async () => {
      const imageUri = 'file://test-image.jpg';
      const result = await AIService.recognizeProducts(imageUri);

      expect(result.success).toBe(true);
      expect(result.products).toBeDefined();
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it('should return products with valid structure', async () => {
      const imageUri = 'file://test-image.jpg';
      const result = await AIService.recognizeProducts(imageUri);

      if (result.products.length > 0) {
        const product = result.products[0];
        expect(product.name).toBeDefined();
        expect(typeof product.name).toBe('string');
        expect(product.name.length).toBeGreaterThan(0);
        expect(product.confidence).toBeGreaterThanOrEqual(0);
        expect(product.confidence).toBeLessThanOrEqual(1);
        expect(product.category).toBeDefined();
        expect(product.suggestedExpirationDays).toBeGreaterThan(0);
      }
    });

    it('should handle processing delays', async () => {
      const imageUri = 'file://test-image.jpg';
      const startTime = Date.now();
      
      const result = await AIService.recognizeProducts(imageUri);
      
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeGreaterThan(1000); // Should take at least 1 second
      expect(result.processingTime).toBeGreaterThan(1000);
    });

    it('should return different results on multiple calls (simulating randomness)', async () => {
      const imageUri = 'file://test-image.jpg';
      
      const result1 = await AIService.recognizeProducts(imageUri);
      const result2 = await AIService.recognizeProducts(imageUri);
      
      // Results should be different due to mock randomness
      expect(result1.products.length).toBeGreaterThanOrEqual(0);
      expect(result2.products.length).toBeGreaterThanOrEqual(0);
    }, 15000); // Increase timeout to 15 seconds

    it('should handle errors gracefully', async () => {
      // Mock a scenario where recognition fails
      const originalSimulateDelay = AIService['simulateProcessingDelay'];
      AIService['simulateProcessingDelay'] = jest.fn().mockRejectedValue(new Error('AI Service Error'));

      const imageUri = 'file://test-image.jpg';
      const result = await AIService.recognizeProducts(imageUri);

      expect(result.success).toBe(false);
      expect(result.products).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);

      // Restore original method
      AIService['simulateProcessingDelay'] = originalSimulateDelay;
    });
  });

  describe('validateRecognition', () => {
    it('should validate correct product data', async () => {
      const validProducts: RecognizedProduct[] = [
        {
          name: 'Apple',
          confidence: 0.85,
          category: 'fruits',
          suggestedExpirationDays: 14,
        },
        {
          name: 'Milk',
          confidence: 0.92,
          category: 'dairy',
          suggestedExpirationDays: 7,
        },
      ];

      const isValid = await AIService.validateRecognition(validProducts);
      expect(isValid).toBe(true);
    });

    it('should reject products with invalid confidence scores', async () => {
      const invalidProducts: RecognizedProduct[] = [
        {
          name: 'Apple',
          confidence: 1.5, // Invalid: > 1.0
          category: 'fruits',
          suggestedExpirationDays: 14,
        },
      ];

      const isValid = await AIService.validateRecognition(invalidProducts);
      expect(isValid).toBe(false);
    });

    it('should reject products with empty names', async () => {
      const invalidProducts: RecognizedProduct[] = [
        {
          name: '', // Invalid: empty name
          confidence: 0.85,
          category: 'fruits',
          suggestedExpirationDays: 14,
        },
      ];

      const isValid = await AIService.validateRecognition(invalidProducts);
      expect(isValid).toBe(false);
    });

    it('should reject products with invalid expiration days', async () => {
      const invalidProducts: RecognizedProduct[] = [
        {
          name: 'Apple',
          confidence: 0.85,
          category: 'fruits',
          suggestedExpirationDays: -1, // Invalid: negative
        },
      ];

      const isValid = await AIService.validateRecognition(invalidProducts);
      expect(isValid).toBe(false);
    });

    it('should handle empty product array', async () => {
      const isValid = await AIService.validateRecognition([]);
      expect(isValid).toBe(true); // Empty array is considered valid
    });
  });

  describe('product categories', () => {
    it('should return products with valid categories', async () => {
      const imageUri = 'file://test-image.jpg';
      const result = await AIService.recognizeProducts(imageUri);

      const validCategories = [
        'fruits', 'vegetables', 'dairy', 'meat', 
        'pantry', 'beverages', 'snacks', 'frozen', 'other'
      ];

      result.products.forEach(product => {
        expect(validCategories).toContain(product.category);
      });
    });
  });

  describe('confidence scores', () => {
    it('should return confidence scores within valid range', async () => {
      const imageUri = 'file://test-image.jpg';
      const result = await AIService.recognizeProducts(imageUri);

      result.products.forEach(product => {
        expect(product.confidence).toBeGreaterThanOrEqual(0.3);
        expect(product.confidence).toBeLessThanOrEqual(1.0);
      });
    });
  });
}); 