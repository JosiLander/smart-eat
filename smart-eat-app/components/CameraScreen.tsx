import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Text, Platform } from 'react-native';
import { Camera, CameraType, CameraView } from 'expo-camera';

interface CameraScreenProps {
  onPhotoCaptured: (photoUri: string) => void;
  onClose: () => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({ 
  onPhotoCaptured, 
  onClose 
}) => {
  const cameraRef = useRef<CameraView>(null);
  const [cameraType] = useState<CameraType>("back");
  const [cameraError, setCameraError] = useState<string>('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);
      console.log('Taking picture...');
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: true, // Skip processing for faster capture
      });
      
      console.log('Picture taken:', photo.uri);
      onPhotoCaptured(photo.uri);
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCameraReady = () => {
    console.log('Camera is ready');
    setIsCameraReady(true);
    setCameraError('');
  };

  const handleCameraError = (error: any) => {
    console.error('Camera error:', error);
    setCameraError('Camera access failed. Please check permissions.');
  };

  // Web-specific camera error handling
  if (Platform.OS === 'web' && cameraError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Camera Access Issue</Text>
          <Text style={styles.errorDescription}>
            {cameraError}
          </Text>
          <Text style={styles.webNote}>
            Note: Camera access in web browsers may be limited. 
            For full functionality, try the mobile app.
          </Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="camera-screen">
      <CameraView
        style={styles.camera}
        facing={cameraType}
        ref={cameraRef}
        testID="camera-view"
        onCameraReady={handleCameraReady}
        onMountError={handleCameraError}
      >
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            testID="close-button"
          >
            <View style={styles.closeButtonInner} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.captureButtonContainer}>
          <TouchableOpacity
            style={[
              styles.captureButton, 
              !isCameraReady && styles.captureButtonDisabled,
              isCapturing && styles.captureButtonCapturing
            ]}
            onPress={takePicture}
            testID="capture-photo"
            disabled={!isCameraReady || isCapturing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isCapturing ? "Capturing photo..." : "Take photo"}
            accessibilityHint="Double tap to capture a photo"
          >
            <View style={[
              styles.captureButtonInner,
              isCapturing && styles.captureButtonInnerCapturing
            ]} />
          </TouchableOpacity>
          {isCapturing && (
            <Text style={styles.capturingText}>Capturing...</Text>
          )}
        </View>
        
        {!isCameraReady && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Initializing camera...</Text>
          </View>
        )}
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraControls: {
    position: 'absolute',
    top: 50,
    right: 30,
    backgroundColor: 'transparent',
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#27ae60',
    elevation: 8,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  captureButtonDisabled: {
    opacity: 0.5,
    borderColor: '#bdc3c7',
  },
  captureButtonCapturing: {
    backgroundColor: '#e74c3c',
    borderColor: '#c0392b',
  },
  captureButtonInnerCapturing: {
    backgroundColor: '#c0392b',
  },
  capturingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#27ae60',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonInner: {
    width: 20,
    height: 2,
    backgroundColor: 'white',
    transform: [{ rotate: '45deg' }],
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
  errorDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
  webNote: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 