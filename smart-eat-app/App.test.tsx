import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from './App';
import { PermissionService } from './services/PermissionService';
import { ImageService } from './services/ImageService';

// Mock the services
jest.mock('./services/PermissionService');
jest.mock('./services/ImageService');

// Mock the components
jest.mock('./components/CameraScreen', () => ({
  CameraScreen: ({ onPhotoCaptured, onClose }: any) => (
    <div data-testid="camera-screen">
      <button data-testid="capture-photo" onClick={() => onPhotoCaptured('mock-photo-uri')}>
        Capture Photo
      </button>
      <button data-testid="close-button" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

jest.mock('./components/PhotoPreview', () => ({
  PhotoPreview: ({ onRetake, onUsePhoto }: any) => (
    <div data-testid="photo-preview">
      <img data-testid="preview-image" alt="Preview" />
      <button data-testid="retake-photo" onClick={onRetake}>
        Retake Photo
      </button>
      <button data-testid="use-photo" onClick={onUsePhoto}>
        Use Photo
      </button>
    </div>
  ),
}));

describe('Smart Eat App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    (PermissionService.ensurePermissions as jest.Mock).mockResolvedValue({
      camera: true,
      mediaLibrary: true,
    });
    (PermissionService.requestPermissions as jest.Mock).mockResolvedValue({
      camera: true,
      mediaLibrary: true,
    });
    (ImageService.saveImage as jest.Mock).mockResolvedValue({
      success: true,
      localUri: 'mock-local-uri',
      mediaLibraryUri: 'mock-media-uri',
    });
  });

  describe('Initialization', () => {
    it('renders main screen when permissions are granted', async () => {
      const { getByText } = render(<App />);
      
      await waitFor(() => {
        expect(getByText('Smart Eat')).toBeTruthy();
      });
      
      expect(getByText('Scan Groceries')).toBeTruthy();
    });

    it('renders permission request screen when permissions are denied', async () => {
      (PermissionService.ensurePermissions as jest.Mock).mockResolvedValue({
        camera: false,
        mediaLibrary: false,
      });
      
      const { getByText } = render(<App />);
      
      await waitFor(() => {
        expect(getByText('Grant Permissions')).toBeTruthy();
      });
    });

    it('handles initialization error gracefully', async () => {
      (PermissionService.ensurePermissions as jest.Mock).mockRejectedValue(new Error('Init error'));
      
      const { getByText } = render(<App />);
      
      await waitFor(() => {
        expect(getByText('Grant Permissions')).toBeTruthy();
      });
    });
  });

  describe('Camera Flow', () => {
    it('opens camera when scan button is pressed', async () => {
      const { getByText, getByTestId } = render(<App />);
      
      await waitFor(() => {
        expect(getByText('Scan Groceries')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Scan Groceries'));
      
      await waitFor(() => {
        expect(getByTestId('camera-screen')).toBeTruthy();
      });
    });

    it('shows photo preview when photo is captured', async () => {
      const { getByText, getByTestId } = render(<App />);
      
      await waitFor(() => {
        expect(getByText('Scan Groceries')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Scan Groceries'));
      fireEvent.press(getByTestId('capture-photo'));
      
      await waitFor(() => {
        expect(getByTestId('photo-preview')).toBeTruthy();
      });
    });

    it('returns to camera when retake is pressed', async () => {
      const { getByText, getByTestId } = render(<App />);
      
      await waitFor(() => {
        expect(getByText('Scan Groceries')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Scan Groceries'));
      fireEvent.press(getByTestId('capture-photo'));
      fireEvent.press(getByTestId('retake-photo'));
      
      await waitFor(() => {
        expect(getByTestId('camera-screen')).toBeTruthy();
      });
    });

    it('saves photo and returns to main screen when use photo is pressed', async () => {
      (ImageService.saveImage as jest.Mock).mockResolvedValue({
        success: true,
        localUri: 'mock-local-uri',
        mediaLibraryUri: 'mock-media-uri',
      });
      
      const { getByText, getByTestId } = render(<App />);
      
      await waitFor(() => {
        expect(getByText('Scan Groceries')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Scan Groceries'));
      fireEvent.press(getByTestId('capture-photo'));
      fireEvent.press(getByTestId('use-photo'));
      
      // The Alert is automatically dismissed by our mock, so we should return to main screen
      await waitFor(() => {
        expect(getByText('Smart Eat')).toBeTruthy();
      });
      
      expect(ImageService.saveImage).toHaveBeenCalledWith('mock-photo-uri');
    });

    it('handles photo save error gracefully', async () => {
      (ImageService.saveImage as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Save failed',
      });
      
      const { getByText, getByTestId } = render(<App />);
      
      await waitFor(() => {
        expect(getByText('Scan Groceries')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Scan Groceries'));
      fireEvent.press(getByTestId('capture-photo'));
      fireEvent.press(getByTestId('use-photo'));
      
      // Should still be in preview mode due to error
      await waitFor(() => {
        expect(getByTestId('photo-preview')).toBeTruthy();
      });
    });
  });

  describe('Permission Handling', () => {
    it('requests permissions when grant button is pressed', async () => {
      (PermissionService.ensurePermissions as jest.Mock).mockResolvedValue({
        camera: false,
        mediaLibrary: false,
      });
      
      (PermissionService.requestPermissions as jest.Mock).mockResolvedValue({
        camera: true,
        mediaLibrary: true,
      });
      
      const { getByText } = render(<App />);
      
      await waitFor(() => {
        expect(getByText('Grant Permissions')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Grant Permissions'));
      
      await waitFor(() => {
        expect(getByText('Smart Eat')).toBeTruthy();
      });
      
      expect(PermissionService.requestPermissions).toHaveBeenCalled();
    });
  });
}); 