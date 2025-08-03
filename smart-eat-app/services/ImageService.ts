import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

export interface ImageSaveResult {
  success: boolean;
  localUri?: string;
  mediaLibraryUri?: string;
  error?: string;
}

export class ImageService {
  static async saveImage(imageUri: string): Promise<ImageSaveResult> {
    try {
      // Validate input
      if (!imageUri || !imageUri.startsWith('file://')) {
        throw new Error('Invalid image URI provided');
      }

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Image file does not exist');
      }

      // Save to media library
      const mediaLibraryAsset = await MediaLibrary.saveToLibraryAsync(imageUri);
      
      // Save to app's local storage with unique naming
      const fileName = `grocery_scan_${Date.now()}.jpg`;
      const localUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: imageUri,
        to: localUri,
      });

      return {
        success: true,
        localUri,
        mediaLibraryUri: mediaLibraryAsset,
      };
    } catch (error) {
      console.error('Image save error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async getLocalImages(): Promise<string[]> {
    try {
      const documentDir = FileSystem.documentDirectory;
      if (!documentDir) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(documentDir);
      return files.filter(file => 
        file.startsWith('grocery_scan_') && 
        (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'))
      ).map(file => `${documentDir}${file}`);
    } catch (error) {
      console.error('Error reading local images:', error);
      return [];
    }
  }

  static async deleteLocalImage(imageUri: string): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(imageUri);
      return true;
    } catch (error) {
      console.error('Error deleting local image:', error);
      return false;
    }
  }
} 