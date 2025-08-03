import { ImageService, ImageSaveResult } from '../ImageService';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

// Mock the modules
jest.mock('expo-media-library', () => ({
  saveToLibraryAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(),
  copyAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
  documentDirectory: '/mock/document/directory/',
}));

describe('ImageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset documentDirectory to default value
    (FileSystem as any).documentDirectory = '/mock/document/directory/';
  });

  describe('saveImage', () => {
    const validImageUri = 'file://mock/path/image.jpg';

    it('successfully saves image to both locations', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (MediaLibrary.saveToLibraryAsync as jest.Mock).mockResolvedValue('media-library-uri');
      (FileSystem.copyAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await ImageService.saveImage(validImageUri);

      expect(result.success).toBe(true);
      expect(result.localUri).toContain('grocery_scan_');
      expect(result.mediaLibraryUri).toBe('media-library-uri');
      expect(MediaLibrary.saveToLibraryAsync).toHaveBeenCalledWith(validImageUri);
      expect(FileSystem.copyAsync).toHaveBeenCalled();
    });

    it('returns error for invalid image URI', async () => {
      const result = await ImageService.saveImage('invalid-uri');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid image URI provided');
      expect(MediaLibrary.saveToLibraryAsync).not.toHaveBeenCalled();
      expect(FileSystem.copyAsync).not.toHaveBeenCalled();
    });

    it('returns error for non-file URI', async () => {
      const result = await ImageService.saveImage('https://example.com/image.jpg');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid image URI provided');
    });

    it('returns error when file does not exist', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

      const result = await ImageService.saveImage(validImageUri);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Image file does not exist');
      expect(MediaLibrary.saveToLibraryAsync).not.toHaveBeenCalled();
    });

    it('handles media library save error', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (MediaLibrary.saveToLibraryAsync as jest.Mock).mockRejectedValue(new Error('Media library error'));

      const result = await ImageService.saveImage(validImageUri);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Media library error');
    });

    it('handles file system copy error', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (MediaLibrary.saveToLibraryAsync as jest.Mock).mockResolvedValue('media-library-uri');
      (FileSystem.copyAsync as jest.Mock).mockRejectedValue(new Error('File system error'));

      const result = await ImageService.saveImage(validImageUri);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File system error');
    });

    it('handles unknown errors gracefully', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (MediaLibrary.saveToLibraryAsync as jest.Mock).mockRejectedValue('Unknown error');

      const result = await ImageService.saveImage(validImageUri);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred');
    });
  });

  describe('getLocalImages', () => {
    it('returns filtered image files', async () => {
      const mockFiles = [
        'grocery_scan_123.jpg',
        'grocery_scan_456.png',
        'other_file.txt',
        'grocery_scan_789.jpeg',
      ];
      (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue(mockFiles);

      const result = await ImageService.getLocalImages();

      expect(result).toEqual([
        '/mock/document/directory/grocery_scan_123.jpg',
        '/mock/document/directory/grocery_scan_456.png',
        '/mock/document/directory/grocery_scan_789.jpeg',
      ]);
    });

    it('returns empty array when no document directory', async () => {
      // Test the logic by temporarily setting documentDirectory to null
      const originalDocumentDirectory = (FileSystem as any).documentDirectory;
      (FileSystem as any).documentDirectory = null;

      const result = await ImageService.getLocalImages();

      expect(result).toEqual([]);

      // Restore the original value
      (FileSystem as any).documentDirectory = originalDocumentDirectory;
    });

    it('handles read directory error gracefully', async () => {
      (FileSystem.readDirectoryAsync as jest.Mock).mockRejectedValue(new Error('Read error'));

      const result = await ImageService.getLocalImages();

      expect(result).toEqual([]);
    });
  });

  describe('deleteLocalImage', () => {
    it('successfully deletes image', async () => {
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await ImageService.deleteLocalImage('file://path/image.jpg');

      expect(result).toBe(true);
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file://path/image.jpg');
    });

    it('handles delete error gracefully', async () => {
      (FileSystem.deleteAsync as jest.Mock).mockRejectedValue(new Error('Delete error'));

      const result = await ImageService.deleteLocalImage('file://path/image.jpg');

      expect(result).toBe(false);
    });
  });
}); 