import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { CameraScreen } from './components/CameraScreen';
import { PhotoPreview } from './components/PhotoPreview';
import { PermissionService, PermissionStatus } from './services/PermissionService';
import { ImageService } from './services/ImageService';

type AppState = 'loading' | 'permission-denied' | 'main' | 'camera' | 'preview';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    camera: false,
    mediaLibrary: false,
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const permissions = await PermissionService.ensurePermissions();
      setPermissionStatus(permissions);
      
      if (permissions.camera && permissions.mediaLibrary) {
        setAppState('main');
      } else {
        setAppState('permission-denied');
      }
    } catch (error) {
      console.error('App initialization error:', error);
      setAppState('permission-denied');
    }
  };

  const handlePhotoCaptured = (photoUri: string) => {
    setCapturedImage(photoUri);
    setAppState('preview');
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setAppState('camera');
  };

  const handleUsePhoto = async () => {
    if (!capturedImage) return;

    const result = await ImageService.saveImage(capturedImage);
    
    if (result.success) {
      Alert.alert('Success', 'Photo saved successfully!', [
        { text: 'OK', onPress: () => {
          setCapturedImage(null);
          setAppState('main');
        }}
      ]);
    } else {
      Alert.alert('Error', `Failed to save photo: ${result.error}`);
    }
  };

  const handleStartCamera = () => {
    setAppState('camera');
  };

  const handleCloseCamera = () => {
    setAppState('main');
  };

  const handleRequestPermissions = async () => {
    const permissions = await PermissionService.requestPermissions();
    setPermissionStatus(permissions);
    
    if (permissions.camera && permissions.mediaLibrary) {
      setAppState('main');
    }
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  // Permission denied state
  if (appState === 'permission-denied') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera and Media Library permissions are required</Text>
        <TouchableOpacity style={styles.button} onPress={handleRequestPermissions}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Camera state
  if (appState === 'camera') {
    return (
      <CameraScreen
        onPhotoCaptured={handlePhotoCaptured}
        onClose={handleCloseCamera}
      />
    );
  }

  // Preview state
  if (appState === 'preview' && capturedImage) {
    return (
      <PhotoPreview
        imageUri={capturedImage}
        onRetake={handleRetakePhoto}
        onUsePhoto={handleUsePhoto}
      />
    );
  }

  // Main screen
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Eat</Text>
      <Text style={styles.subtitle}>Grocery Scanner</Text>
      <TouchableOpacity style={styles.scanButton} onPress={handleStartCamera}>
        <Text style={styles.scanButtonText}>Scan Groceries</Text>
      </TouchableOpacity>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 40,
  },
  scanButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 18,
    color: '#7f8c8d',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
});
