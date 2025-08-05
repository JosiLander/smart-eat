import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
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
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing app...');
      console.log('Platform:', Platform.OS);
      
      // Web-specific handling
      if (Platform.OS === 'web') {
        console.log('Running on web platform');
        setDebugInfo('Web platform detected');
        
        // For web, we'll skip the strict permission check initially
        // and let the camera component handle permissions
        setAppState('main');
        return;
      }

      const permissions = await PermissionService.ensurePermissions();
      setPermissionStatus(permissions);
      
      console.log('Permission status:', permissions);
      
      if (permissions.camera && permissions.mediaLibrary) {
        setAppState('main');
      } else {
        setAppState('permission-denied');
      }
    } catch (error) {
      console.error('App initialization error:', error);
      setDebugInfo(`Init error: ${error}`);
      setAppState('permission-denied');
    }
  };

  const handlePhotoCaptured = (photoUri: string) => {
    console.log('Photo captured:', photoUri);
    setCapturedImage(photoUri);
    setAppState('preview');
  };

  const handleRetakePhoto = () => {
    console.log('Retaking photo');
    setCapturedImage(null);
    setAppState('camera');
  };

  const handleUsePhoto = async () => {
    if (!capturedImage) return;

    console.log('Using photo:', capturedImage);
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
    console.log('Starting camera...');
    setAppState('camera');
  };

  const handleCloseCamera = () => {
    console.log('Closing camera');
    setAppState('main');
  };

  const handleDemoMode = () => {
    console.log('Starting demo mode...');
    // Use a sample image for demo purposes
    const demoImageUri = 'https://via.placeholder.com/400x300/3498db/ffffff?text=Demo+Grocery+Photo';
    setCapturedImage(demoImageUri);
    setAppState('preview');
  };

  const handleRequestPermissions = async () => {
    console.log('Requesting permissions...');
    const permissions = await PermissionService.requestPermissions();
    setPermissionStatus(permissions);
    
    console.log('New permission status:', permissions);
    
    if (permissions.camera && permissions.mediaLibrary) {
      setAppState('main');
    }
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Initializing...</Text>
        {debugInfo ? <Text style={styles.debugText}>{debugInfo}</Text> : null}
      </View>
    );
  }

  // Permission denied state
  if (appState === 'permission-denied') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera and Media Library permissions are required</Text>
        <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
        <Text style={styles.debugText}>Camera: {permissionStatus.camera ? 'Granted' : 'Denied'}</Text>
        <Text style={styles.debugText}>Media Library: {permissionStatus.mediaLibrary ? 'Granted' : 'Denied'}</Text>
        <TouchableOpacity style={styles.button} onPress={handleRequestPermissions}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
        {Platform.OS === 'web' && (
          <TouchableOpacity style={styles.button} onPress={() => setAppState('main')}>
            <Text style={styles.buttonText}>Continue Anyway (Web)</Text>
          </TouchableOpacity>
        )}
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
      {Platform.OS === 'web' && (
        <>
          <TouchableOpacity style={styles.demoButton} onPress={handleDemoMode}>
            <Text style={styles.demoButtonText}>Try Demo Mode</Text>
          </TouchableOpacity>
          <View style={styles.webInfo}>
            <Text style={styles.webInfoText}>Web Platform</Text>
            <Text style={styles.webInfoText}>Camera access may be limited</Text>
            <Text style={styles.webInfoText}>Use Demo Mode to test the flow</Text>
          </View>
        </>
      )}
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
  debugText: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 5,
  },
  webInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#ecf0f1',
    borderRadius: 10,
  },
  webInfoText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  demoButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  demoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
