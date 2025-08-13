export interface ExtractedDate {
  date: Date;
  confidence: number;
  format: 'best-before' | 'expires-on' | 'use-by';
  rawText: string;
}

export interface OCRResult {
  success: boolean;
  dates: ExtractedDate[];
  error?: string;
  processingTime: number;
}

export class OCRService {
  // Common date patterns found on food products
  private static readonly DATE_PATTERNS = [
    // Best Before patterns
    { regex: /best\s*before\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i, format: 'best-before' as const },
    { regex: /bb\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i, format: 'best-before' as const },
    { regex: /best\s*before\s*end\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i, format: 'best-before' as const },
    
    // Expires On patterns
    { regex: /expires\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i, format: 'expires-on' as const },
    { regex: /exp\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i, format: 'expires-on' as const },
    { regex: /expiry\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i, format: 'expires-on' as const },
    
    // Use By patterns
    { regex: /use\s*by\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i, format: 'use-by' as const },
    { regex: /use\s*before\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i, format: 'use-by' as const },
    

    
    // Generic date patterns (fallback)
    { regex: /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/, format: 'best-before' as const },
  ];

  static async extractDates(imageUri: string): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting OCR date extraction for:', imageUri);
      
      // Simulate processing time (1-2 seconds)
      await this.simulateProcessingDelay();
      
      // Mock OCR extraction - simulate 90% accuracy
      const dates = this.generateMockDateExtraction();
      
      const processingTime = Date.now() - startTime;
      
      console.log(`OCR extraction completed in ${processingTime}ms`);
      console.log('Extracted dates:', dates);
      
      return {
        success: true,
        dates,
        processingTime,
      };
    } catch (error) {
      console.error('OCR extraction error:', error);
      return {
        success: false,
        dates: [],
        error: error instanceof Error ? error.message : 'Unknown OCR error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  private static async simulateProcessingDelay(): Promise<void> {
    // Simulate 1-2 second processing time
    const delay = 1000 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private static generateMockDateExtraction(): ExtractedDate[] {
    const dates: ExtractedDate[] = [];
    
    // Simulate 90% accuracy
    const shouldExtract = Math.random() < 0.9;
    
    if (shouldExtract) {
      // Generate 1-2 dates with high confidence
      const numDates = 1 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < numDates; i++) {
        const date = this.generateRandomFutureDate();
        const format = this.getRandomDateFormat();
        const confidence = 0.8 + Math.random() * 0.2; // 80-100% confidence
        
        dates.push({
          date,
          confidence,
          format,
          rawText: this.formatDateForDisplay(date, format),
        });
      }
    } else {
      // 10% chance of low confidence or no extraction
      if (Math.random() < 0.5) {
        // Low confidence extraction
        const date = this.generateRandomFutureDate();
        const format = this.getRandomDateFormat();
        
        dates.push({
          date,
          confidence: 0.4 + Math.random() * 0.3, // 40-70% confidence
          format,
          rawText: this.formatDateForDisplay(date, format),
        });
      }
      // Otherwise return empty array (no dates found)
    }
    
    return dates;
  }

  private static generateRandomFutureDate(): Date {
    const now = new Date();
    const futureDays = 1 + Math.floor(Math.random() * 30); // 1-30 days in future
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + futureDays);
    return futureDate;
  }

  private static getRandomDateFormat(): ExtractedDate['format'] {
    const formats: ExtractedDate['format'][] = ['best-before', 'expires-on', 'use-by'];
    return formats[Math.floor(Math.random() * formats.length)];
  }

  private static formatDateForDisplay(date: Date, format: ExtractedDate['format']): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    const formatLabels = {
      'best-before': 'Best Before',
      'expires-on': 'Expires',
      'use-by': 'Use By',
    };
    
    return `${formatLabels[format]}: ${day}/${month}/${year}`;
  }

  static async validateExtractedDates(dates: ExtractedDate[]): Promise<boolean> {
    const now = new Date();
    
    return dates.every(date => 
      date.confidence >= 0.3 && 
      date.confidence <= 1.0 &&
      date.date > now && // Dates should be in the future
      date.rawText.length > 0
    );
  }

  static parseDateString(dateString: string): Date | null {
    // Try to parse various date formats
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{1,2})\/(\d{1,2})\/(\d{2})/, // DD/MM/YY
      /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
      /(\d{1,2})-(\d{1,2})-(\d{2})/, // DD-MM-YY
    ];

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        const [, day, month, year] = match;
        const fullYear = year.length === 2 ? `20${year}` : year;
        const date = new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day));
        
        // Validate the date
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    return null;
  }
} 