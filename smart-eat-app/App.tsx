import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { CameraScreen } from './components/CameraScreen';
import { PhotoPreview } from './components/PhotoPreview';
import { ScanResultsScreen } from './components/ScanResultsScreen';
import { RecipeSuggestionsScreen } from './components/RecipeSuggestionsScreen';
import { RecipeDetailScreen } from './components/RecipeDetailScreen';
import { InventoryOverviewScreen } from './components/InventoryOverviewScreen';
import { InventoryItemDetailScreen } from './components/InventoryItemDetailScreen';
import { GroceryListScreen } from './components/GroceryListScreen';
import { PermissionService, PermissionStatus } from './services/PermissionService';
import { ImageService } from './services/ImageService';
import { ScanningService, ScanResult } from './services/ScanningService';
import { InventoryService, InventoryItem } from './services/InventoryService';
import { GroceryListService } from './services/GroceryListService';

type AppState = 'loading' | 'permission-denied' | 'main' | 'camera' | 'preview' | 'scan-results' | 'recipe-suggestions' | 'recipe-detail' | 'inventory-overview' | 'inventory-item-detail' | 'grocery-list';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    camera: false,
    mediaLibrary: false,
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    initializeApp();
    // Initialize services
    InventoryService.initialize();
    GroceryListService.initialize();
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

  const handlePhotoCaptured = async (photoUri: string) => {
    console.log('Photo captured:', photoUri);
    setCapturedImage(photoUri);
    
    try {
      // Start AI scanning process
      console.log('Starting AI scan...');
      const result = await ScanningService.scanImage(photoUri);
      setScanResult(result);
      
      if (result.success) {
        setAppState('scan-results');
      } else {
        // Fall back to preview if scan fails
        setAppState('preview');
      }
    } catch (error) {
      console.error('Scan failed:', error);
      setAppState('preview');
    }
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
          setScanResult(null);
          setAppState('main');
        }}
      ]);
    } else {
      Alert.alert('Error', `Failed to save photo: ${result.error}`);
    }
  };

  const handleScanResultsConfirm = async (products: any[], dates: any[]) => {
    if (!capturedImage) return;

    try {
      // Add items to inventory
      for (const product of products) {
        await InventoryService.addItem(product, dates, capturedImage);
      }

      Alert.alert('Success', `${products.length} items added to inventory!`, [
        { text: 'OK', onPress: () => {
          setCapturedImage(null);
          setScanResult(null);
          setAppState('main');
        }}
      ]);
    } catch (error) {
      console.error('Failed to add items to inventory:', error);
      Alert.alert('Error', 'Failed to add items to inventory. Please try again.');
    }
  };

  const handleScanResultsCancel = () => {
    setCapturedImage(null);
    setScanResult(null);
    setAppState('main');
  };

  const handleViewRecipeSuggestions = () => {
    setAppState('recipe-suggestions');
  };

  const handleViewRecipe = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    setAppState('recipe-detail');
  };

  const handleRecipeBack = () => {
    setSelectedRecipeId(null);
    setAppState('recipe-suggestions');
  };

  const handleRecipeSuggestionsBack = () => {
    setAppState('main');
  };

  const handleAddToGroceryList = (missingIngredients: string[]) => {
    // TODO: Implement grocery list functionality
    console.log('Adding to grocery list:', missingIngredients);
    Alert.alert('Coming Soon', 'Grocery list functionality will be available in the next update!');
  };

  const handleViewInventoryOverview = () => {
    console.log('Opening inventory overview...');
    setAppState('inventory-overview');
  };

  const handleInventoryOverviewBack = () => {
    setAppState('main');
  };

  const handleViewInventoryItem = (item: InventoryItem) => {
    console.log('Opening inventory item detail:', item.name);
    setSelectedInventoryItem(item);
    setAppState('inventory-item-detail');
  };

  const handleInventoryItemDetailBack = () => {
    setSelectedInventoryItem(null);
    setAppState('inventory-overview');
  };

  const handleInventoryItemUpdated = () => {
    // Refresh inventory data when item is updated
    console.log('Inventory item updated, refreshing...');
  };

  const handleViewGroceryList = () => {
    console.log('Opening grocery list...');
    setAppState('grocery-list');
  };

  const handleGroceryListBack = () => {
    setAppState('main');
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

          // Scan Results state
        if (appState === 'scan-results' && capturedImage && scanResult) {
          return (
            <ScanResultsScreen
              scanResult={scanResult}
              imageUri={capturedImage}
              onConfirm={handleScanResultsConfirm}
              onRetake={handleRetakePhoto}
              onCancel={handleScanResultsCancel}
            />
          );
        }

        // Recipe Suggestions state
        if (appState === 'recipe-suggestions') {
          return (
            <RecipeSuggestionsScreen
              onBack={handleRecipeSuggestionsBack}
              onViewRecipe={handleViewRecipe}
            />
          );
        }

        // Recipe Detail state
        if (appState === 'recipe-detail' && selectedRecipeId) {
          return (
            <RecipeDetailScreen
              recipeId={selectedRecipeId}
              onBack={handleRecipeBack}
              onAddToGroceryList={handleAddToGroceryList}
            />
          );
        }

        // Inventory Overview state
        if (appState === 'inventory-overview') {
          return (
            <InventoryOverviewScreen
              onBack={handleInventoryOverviewBack}
              onViewItem={handleViewInventoryItem}
            />
          );
        }

        // Inventory Item Detail state
        if (appState === 'inventory-item-detail' && selectedInventoryItem) {
          return (
            <InventoryItemDetailScreen
              item={selectedInventoryItem}
              onBack={handleInventoryItemDetailBack}
              onItemUpdated={handleInventoryItemUpdated}
            />
          );
        }

        // Grocery List state
        if (appState === 'grocery-list') {
          return (
            <GroceryListScreen
              onBack={handleGroceryListBack}
            />
          );
        }

        // Preview state (fallback)
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
      
      <TouchableOpacity style={styles.secondaryButton} onPress={handleViewRecipeSuggestions}>
        <Text style={styles.secondaryButtonText}>🍳 Recipe Suggestions</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={handleViewInventoryOverview}>
        <Text style={styles.secondaryButtonText}>📦 Inventory Overview</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={handleViewGroceryList}>
        <Text style={styles.secondaryButtonText}>🛒 Grocery List</Text>
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
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
    letterSpacing: -0.5,
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
  secondaryButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
  },
  secondaryButtonText: {
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
