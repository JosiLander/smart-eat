import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform, Image } from 'react-native';
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
        <Image 
          source={require('./assets/Gemini_Generated_Image_2h56jp2h56jp2h56.png')}
          style={styles.logo}
          resizeMode="cover"
        />
        <Text style={styles.loadingText}>Initializing...</Text>
        {debugInfo ? <Text style={styles.debugText}>{debugInfo}</Text> : null}
      </View>
    );
  }

  // Permission denied state
  if (appState === 'permission-denied') {
    return (
      <View style={styles.container}>
        <Image 
          source={require('./assets/Gemini_Generated_Image_2h56jp2h56jp2h56.png')}
          style={styles.logo}
          resizeMode="cover"
        />
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
              onScanItems={handleStartCamera}
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
      <View style={styles.headerSection}>
        <Image 
          source={require('./assets/Gemini_Generated_Image_2h56jp2h56jp2h56.png')}
          style={styles.logo}
          resizeMode="cover"
        />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Smart Eat</Text>
          <Text style={styles.subtitle}>Grocery Scanner</Text>
        </View>
      </View>
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
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 24,
    borderRadius: 28,
    backgroundColor: 'white',
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#f0f8f0',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#27ae60',
    marginBottom: 12,
    letterSpacing: -1.2,
    textShadowColor: 'rgba(39, 174, 96, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    color: '#34495e',
    marginBottom: 0,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  scanButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 32,
    elevation: 6,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#2ecc71',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: '#27ae60',
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
    backgroundColor: 'white',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 26,
    marginTop: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  secondaryButtonText: {
    color: '#2c3e50',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    backgroundColor: '#27ae60',
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
