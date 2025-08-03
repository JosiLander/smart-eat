import { PermissionService, PermissionStatus } from '../PermissionService';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

// Mock the modules
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(),
    getCameraPermissionsAsync: jest.fn(),
  },
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
}));

describe('PermissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPermissions', () => {
    it('returns granted permissions when both are granted', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

      const result = await PermissionService.requestPermissions();

      expect(result).toEqual({
        camera: true,
        mediaLibrary: true,
      });
    });

    it('returns denied permissions when camera is denied', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

      const result = await PermissionService.requestPermissions();

      expect(result).toEqual({
        camera: false,
        mediaLibrary: true,
      });
    });

    it('returns denied permissions when media library is denied', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      const result = await PermissionService.requestPermissions();

      expect(result).toEqual({
        camera: true,
        mediaLibrary: false,
      });
    });

    it('handles camera permission error gracefully', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockRejectedValue(new Error('Camera error'));
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

      const result = await PermissionService.requestPermissions();

      expect(result).toEqual({
        camera: false,
        mediaLibrary: false,
      });
    });

    it('handles media library permission error gracefully', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockRejectedValue(new Error('Media library error'));

      const result = await PermissionService.requestPermissions();

      expect(result).toEqual({
        camera: false,
        mediaLibrary: false,
      });
    });
  });

  describe('checkPermissions', () => {
    it('returns current permission status', async () => {
      (Camera.getCameraPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (MediaLibrary.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

      const result = await PermissionService.checkPermissions();

      expect(result).toEqual({
        camera: true,
        mediaLibrary: true,
      });
    });

    it('handles errors gracefully', async () => {
      (Camera.getCameraPermissionsAsync as jest.Mock).mockRejectedValue(new Error('Camera error'));
      (MediaLibrary.getPermissionsAsync as jest.Mock).mockRejectedValue(new Error('Media library error'));

      const result = await PermissionService.checkPermissions();

      expect(result).toEqual({
        camera: false,
        mediaLibrary: false,
      });
    });
  });

  describe('ensurePermissions', () => {
    it('returns existing permissions when already granted', async () => {
      (Camera.getCameraPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (MediaLibrary.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

      const result = await PermissionService.ensurePermissions();

      expect(result).toEqual({
        camera: true,
        mediaLibrary: true,
      });
      expect(Camera.requestCameraPermissionsAsync).not.toHaveBeenCalled();
      expect(MediaLibrary.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('requests permissions when not granted', async () => {
      (Camera.getCameraPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      (MediaLibrary.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

      const result = await PermissionService.ensurePermissions();

      expect(result).toEqual({
        camera: true,
        mediaLibrary: true,
      });
      expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalled();
      expect(MediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
    });
  });
}); 