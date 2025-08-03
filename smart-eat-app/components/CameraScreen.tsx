import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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

  const takePicture = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });
      
      onPhotoCaptured(photo.uri);
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  return (
    <View style={styles.container} testID="camera-screen">
      <CameraView
        style={styles.camera}
        facing={cameraType}
        ref={cameraRef}
        testID="camera-view"
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
            style={styles.captureButton}
            onPress={takePicture}
            testID="capture-photo"
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
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
}); 