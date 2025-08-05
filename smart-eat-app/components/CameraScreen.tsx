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

  const takePicture = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    try {
      console.log('Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });
      
      console.log('Picture taken:', photo.uri);
      onPhotoCaptured(photo.uri);
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
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
          
          <TouchableOpacity
            style={[styles.captureButton, !isCameraReady && styles.captureButtonDisabled]}
            onPress={takePicture}
            testID="capture-photo"
            disabled={!isCameraReady}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
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
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#3498db',
  },
  captureButtonDisabled: {
    opacity: 0.5,
    borderColor: '#bdc3c7',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
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
    backgroundColor: '#3498db',
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