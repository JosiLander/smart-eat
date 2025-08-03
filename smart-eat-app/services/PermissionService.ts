import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export interface PermissionStatus {
  camera: boolean;
  mediaLibrary: boolean;
}

export class PermissionService {
  static async requestPermissions(): Promise<PermissionStatus> {
    try {
      const [cameraStatus, mediaLibraryStatus] = await Promise.all([
        Camera.requestCameraPermissionsAsync(),
        MediaLibrary.requestPermissionsAsync(),
      ]);

      return {
        camera: cameraStatus.status === 'granted',
        mediaLibrary: mediaLibraryStatus.status === 'granted',
      };
    } catch (error) {
      console.error('Permission request error:', error);
      return {
        camera: false,
        mediaLibrary: false,
      };
    }
  }

  static async checkPermissions(): Promise<PermissionStatus> {
    try {
      const [cameraStatus, mediaLibraryStatus] = await Promise.all([
        Camera.getCameraPermissionsAsync(),
        MediaLibrary.getPermissionsAsync(),
      ]);

      return {
        camera: cameraStatus.status === 'granted',
        mediaLibrary: mediaLibraryStatus.status === 'granted',
      };
    } catch (error) {
      console.error('Permission check error:', error);
      return {
        camera: false,
        mediaLibrary: false,
      };
    }
  }

  static async ensurePermissions(): Promise<PermissionStatus> {
    const currentStatus = await this.checkPermissions();
    
    if (currentStatus.camera && currentStatus.mediaLibrary) {
      return currentStatus;
    }

    return await this.requestPermissions();
  }
} 