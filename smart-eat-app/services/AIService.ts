export interface RecognizedProduct {
  name: string;
  confidence: number;
  category: 'fruits' | 'vegetables' | 'dairy' | 'meat' | 'pantry' | 'beverages' | 'snacks' | 'frozen' | 'other';
  suggestedExpirationDays: number;
  barcode?: string;
  detectedQuantity?: number;
  detectedUnit?: string;
}

export interface RecognitionResult {
  success: boolean;
  products: RecognizedProduct[];
  error?: string;
  processingTime: number;
}

export class AIService {
  // Mock product database for MVP
  private static readonly PRODUCT_DATABASE = {
    'apple': { name: 'Apple', category: 'fruits' as const, expirationDays: 14 },
    'banana': { name: 'Banana', category: 'fruits' as const, expirationDays: 7 },
    'orange': { name: 'Orange', category: 'fruits' as const, expirationDays: 14 },
    'tomato': { name: 'Tomato', category: 'vegetables' as const, expirationDays: 7 },
    'lettuce': { name: 'Lettuce', category: 'vegetables' as const, expirationDays: 5 },
    'carrot': { name: 'Carrot', category: 'vegetables' as const, expirationDays: 21 },
    'milk': { name: 'Milk', category: 'dairy' as const, expirationDays: 7 },
    'cheese': { name: 'Cheese', category: 'dairy' as const, expirationDays: 14 },
    'yogurt': { name: 'Yogurt', category: 'dairy' as const, expirationDays: 10 },
    'chicken': { name: 'Chicken Breast', category: 'meat' as const, expirationDays: 3 },
    'beef': { name: 'Ground Beef', category: 'meat' as const, expirationDays: 3 },
    'bread': { name: 'Bread', category: 'pantry' as const, expirationDays: 7 },
    'pasta': { name: 'Pasta', category: 'pantry' as const, expirationDays: 365 },
    'rice': { name: 'Rice', category: 'pantry' as const, expirationDays: 730 },
    'cereal': { name: 'Cereal', category: 'pantry' as const, expirationDays: 180 },
    'water': { name: 'Water Bottle', category: 'beverages' as const, expirationDays: 730 },
    'soda': { name: 'Soda', category: 'beverages' as const, expirationDays: 365 },
    'chips': { name: 'Potato Chips', category: 'snacks' as const, expirationDays: 90 },
    'cookies': { name: 'Cookies', category: 'snacks' as const, expirationDays: 60 },
    'ice cream': { name: 'Ice Cream', category: 'frozen' as const, expirationDays: 30 },
  };

  static async recognizeProducts(imageUri: string): Promise<RecognitionResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting AI product recognition for:', imageUri);
      
      // Simulate processing time (2-4 seconds as per requirements)
      await this.simulateProcessingDelay();
      
      // Mock recognition logic - simulate 80% accuracy
      const products = this.generateMockRecognition();
      
      const processingTime = Date.now() - startTime;
      
      console.log(`AI recognition completed in ${processingTime}ms`);
      console.log('Recognized products:', products);
      
      return {
        success: true,
        products,
        processingTime,
      };
    } catch (error) {
      console.error('AI recognition error:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown AI error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  private static async simulateProcessingDelay(): Promise<void> {
    // Simulate 2-4 second processing time
    const delay = 2000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private static generateMockRecognition(): RecognizedProduct[] {
    const products: RecognizedProduct[] = [];
    
    // Simulate 80% accuracy by sometimes recognizing products correctly
    const shouldRecognize = Math.random() < 0.8;
    
    if (shouldRecognize) {
      // Pick 1-3 random products to "recognize"
      const productKeys = Object.keys(this.PRODUCT_DATABASE);
      const numProducts = 1 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < numProducts; i++) {
        const randomKey = productKeys[Math.floor(Math.random() * productKeys.length)];
        const product = this.PRODUCT_DATABASE[randomKey as keyof typeof this.PRODUCT_DATABASE];
        
        // Generate confidence score between 70-95%
        const confidence = 0.7 + Math.random() * 0.25;
        
        // Simulate quantity detection (70% accuracy)
        const shouldDetectQuantity = Math.random() < 0.7;
        let detectedQuantity: number | undefined;
        let detectedUnit: string | undefined;
        
        if (shouldDetectQuantity) {
          // Generate realistic quantities based on product type
          if (product.category === 'fruits' || product.category === 'vegetables') {
            detectedQuantity = Math.floor(Math.random() * 5) + 1; // 1-5 pieces
            detectedUnit = Math.random() < 0.5 ? 'piece' : 'pieces';
          } else if (product.category === 'dairy' || product.category === 'meat') {
            detectedQuantity = Math.floor(Math.random() * 2) + 1; // 1-2 items
            detectedUnit = 'piece';
          } else if (product.category === 'pantry') {
            detectedQuantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
            detectedUnit = Math.random() < 0.3 ? 'pack' : 'piece';
          } else {
            detectedQuantity = Math.floor(Math.random() * 2) + 1; // 1-2 items
            detectedUnit = 'piece';
          }
        }
        
        products.push({
          name: product.name,
          confidence,
          category: product.category,
          suggestedExpirationDays: product.expirationDays,
          detectedQuantity,
          detectedUnit,
        });
      }
    } else {
      // 20% chance of low confidence recognition
      const productKeys = Object.keys(this.PRODUCT_DATABASE);
      const randomKey = productKeys[Math.floor(Math.random() * productKeys.length)];
      const product = this.PRODUCT_DATABASE[randomKey as keyof typeof this.PRODUCT_DATABASE];
      
      products.push({
        name: product.name,
        confidence: 0.3 + Math.random() * 0.3, // 30-60% confidence
        category: product.category,
        suggestedExpirationDays: product.expirationDays,
        detectedQuantity: Math.floor(Math.random() * 2) + 1,
        detectedUnit: 'piece',
      });
    }
    
    return products;
  }

  static async validateRecognition(products: RecognizedProduct[]): Promise<boolean> {
    // Validate that recognized products have reasonable confidence scores
    return products.every(product => 
      product.confidence >= 0.3 && 
      product.confidence <= 1.0 &&
      product.name.length > 0 &&
      product.suggestedExpirationDays > 0
    );
  }
} 