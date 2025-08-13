import { AIService, RecognizedProduct, RecognitionResult } from './AIService';
import { OCRService, ExtractedDate, OCRResult } from './OCRService';
import { InventoryService, InventoryItem, AddItemResult } from './InventoryService';

export interface ScanResult {
  success: boolean;
  products: RecognizedProduct[];
  dates: ExtractedDate[];
  processingTime: number;
  error?: string;
}

export interface ProcessedScan {
  scanResult: ScanResult;
  inventoryItems: InventoryItem[];
  totalProcessingTime: number;
}

export interface ScanProgress {
  stage: 'initializing' | 'recognizing' | 'extracting-dates' | 'saving' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  currentStage: string;
}

export class ScanningService {
  static async scanImage(imageUri: string): Promise<ScanResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting comprehensive scan for:', imageUri);
      
      // Run AI recognition and OCR extraction in parallel for better performance
      const [recognitionResult, ocrResult] = await Promise.all([
        AIService.recognizeProducts(imageUri),
        OCRService.extractDates(imageUri),
      ]);
      
      const processingTime = Date.now() - startTime;
      
      if (!recognitionResult.success && !ocrResult.success) {
        return {
          success: false,
          products: [],
          dates: [],
          processingTime,
          error: 'Both recognition and OCR failed',
        };
      }
      
      const result: ScanResult = {
        success: recognitionResult.success || ocrResult.success,
        products: recognitionResult.products || [],
        dates: ocrResult.dates || [],
        processingTime,
      };
      
      console.log('Scan completed successfully:', result);
      return result;
      
    } catch (error) {
      console.error('Scan failed:', error);
      return {
        success: false,
        products: [],
        dates: [],
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown scan error',
      };
    }
  }

  static async processScanWithProgress(
    imageUri: string,
    onProgress?: (progress: ScanProgress) => void
  ): Promise<ProcessedScan> {
    const totalStartTime = Date.now();
    const inventoryItems: InventoryItem[] = [];
    
    try {
      // Stage 1: Initializing
      onProgress?.({
        stage: 'initializing',
        progress: 10,
        message: 'Initializing scan...',
        currentStage: 'Initializing',
      });
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX
      
      // Stage 2: AI Recognition
      onProgress?.({
        stage: 'recognizing',
        progress: 25,
        message: 'Recognizing products...',
        currentStage: 'AI Recognition',
      });
      
      const recognitionResult = await AIService.recognizeProducts(imageUri);
      
      onProgress?.({
        stage: 'recognizing',
        progress: 50,
        message: 'Products recognized',
        currentStage: 'AI Recognition',
      });
      
      // Stage 3: OCR Date Extraction
      onProgress?.({
        stage: 'extracting-dates',
        progress: 60,
        message: 'Extracting expiration dates...',
        currentStage: 'OCR Processing',
      });
      
      const ocrResult = await OCRService.extractDates(imageUri);
      
      onProgress?.({
        stage: 'extracting-dates',
        progress: 80,
        message: 'Dates extracted',
        currentStage: 'OCR Processing',
      });
      
      // Stage 4: Saving to Inventory
      onProgress?.({
        stage: 'saving',
        progress: 85,
        message: 'Saving to inventory...',
        currentStage: 'Saving',
      });
      
      // Combine results
      const scanResult: ScanResult = {
        success: recognitionResult.success || ocrResult.success,
        products: recognitionResult.products || [],
        dates: ocrResult.dates || [],
        processingTime: recognitionResult.processingTime + ocrResult.processingTime,
      };
      
      // Add items to inventory
      for (const product of scanResult.products) {
        const addResult = await InventoryService.addItem(
          product,
          scanResult.dates,
          imageUri
        );
        
        if (addResult.success && addResult.item) {
          inventoryItems.push(addResult.item);
        }
      }
      
      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Scan completed successfully!',
        currentStage: 'Complete',
      });
      
      const totalProcessingTime = Date.now() - totalStartTime;
      
      return {
        scanResult,
        inventoryItems,
        totalProcessingTime,
      };
      
    } catch (error) {
      console.error('Processed scan failed:', error);
      
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: 'Scan failed. Please try again.',
        currentStage: 'Error',
      });
      
      throw error;
    }
  }

  static async validateScanResult(scanResult: ScanResult): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    // Validate products
    if (scanResult.products.length === 0) {
      issues.push('No products were recognized');
    } else {
      for (const product of scanResult.products) {
        if (product.confidence < 0.3) {
          issues.push(`Low confidence recognition for ${product.name} (${Math.round(product.confidence * 100)}%)`);
        }
      }
    }
    
    // Validate dates
    if (scanResult.dates.length === 0) {
      issues.push('No expiration dates were found');
    } else {
      for (const date of scanResult.dates) {
        if (date.confidence < 0.3) {
          issues.push(`Low confidence date extraction (${Math.round(date.confidence * 100)}%)`);
        }
        
        if (date.date < new Date()) {
          issues.push(`Extracted date is in the past: ${date.rawText}`);
        }
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  static async retryRecognition(imageUri: string): Promise<ScanResult> {
    console.log('Retrying recognition for:', imageUri);
    
    // For retry, we might want to use different parameters or algorithms
    // For MVP, we'll just run the same process again
    return this.scanImage(imageUri);
  }

  static async getScanHistory(): Promise<{
    totalScans: number;
    successfulScans: number;
    averageProcessingTime: number;
    lastScanDate?: Date;
  }> {
    // In a real app, this would query a database
    // For MVP, we'll return mock data
    return {
      totalScans: 0,
      successfulScans: 0,
      averageProcessingTime: 0,
    };
  }

  static async exportScanData(scanResult: ScanResult): Promise<string> {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      scanResult,
      version: '1.0.0',
    }, null, 2);
  }
} 