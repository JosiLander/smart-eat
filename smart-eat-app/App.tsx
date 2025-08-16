import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  SafeAreaView,
  Image,
} from 'react-native';
import { CameraScreen } from './components/CameraScreen';
import { ScanResultsScreen } from './components/ScanResultsScreen';
import { RecipeSuggestionsScreen } from './components/RecipeSuggestionsScreen';
import { RecipeDetailScreen } from './components/RecipeDetailScreen';
import { InventoryOverviewScreen } from './components/InventoryOverviewScreen';
import { InventoryItemDetailScreen } from './components/InventoryItemDetailScreen';
import { GroceryListScreen } from './components/GroceryListScreen';
import { PhotoPreview } from './components/PhotoPreview';
import { BottomNavigationBar, TabType } from './components/BottomNavigationBar';
import { PermissionService } from './services/PermissionService';
import { ImageService } from './services/ImageService';
import { InventoryService, InventoryItem } from './services/InventoryService';
import { RecipeService } from './services/RecipeService';
import { ScanningService } from './services/ScanningService';

type AppState = 
  | 'loading' 
  | 'permission-denied' 
  | 'main' 
  | 'camera' 
  | 'preview' 
  | 'scan-results' 
  | 'recipe-suggestions' 
  | 'recipe-detail' 
  | 'inventory-overview' 
  | 'inventory-item-detail' 
  | 'grocery-list';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [activeTab, setActiveTab] = useState<TabType>('scan');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing app...');
      console.log('Platform:', Platform.OS);

      // Initialize services
      await InventoryService.initialize();

      // Check permissions
      const permissions = await PermissionService.checkPermissions();
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

  const requestPermissions = async () => {
    try {
      console.log('Requesting permissions...');
      const permissions = await PermissionService.requestPermissions();
      console.log('New permission status:', permissions);

      if (permissions.camera && permissions.mediaLibrary) {
        setAppState('main');
      } else {
        Alert.alert(
          'Permissions Required',
          'Camera and photo library access are required to use this app. Please enable them in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              // In a real app, you'd open settings here
              console.log('Open settings');
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
    }
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    
    switch (tab) {
      case 'scan':
        setAppState('main');
        break;
      case 'recipes':
        setAppState('recipe-suggestions');
        break;
      case 'inventory':
        setAppState('inventory-overview');
        break;
      case 'grocery':
        setAppState('grocery-list');
        break;
    }
  };

  const handlePhotoCapture = (imageUri: string) => {
    console.log('Photo captured:', imageUri);
    setCapturedImage(imageUri);
    setAppState('preview');
  };

  const handleUsePhoto = async () => {
    if (!capturedImage) return;

    console.log('Processing photo for scanning:', capturedImage);
    
    try {
      // Process the photo through AI recognition and OCR
      const scanResult = await ScanningService.scanImage(capturedImage);
      
      if (scanResult.success) {
        console.log('Scan successful:', scanResult);
        setScanResult(scanResult);
        setAppState('scan-results');
      } else {
        console.log('Scan failed:', scanResult.error);
        Alert.alert('Scan Failed', scanResult.error || 'Failed to recognize items in the photo. Please try again.', [
          { text: 'Retake Photo', onPress: () => setAppState('camera') },
          { text: 'Cancel', style: 'cancel', onPress: () => {
            setCapturedImage(null);
            setScanResult(null);
            setAppState('main');
          }}
        ]);
      }
    } catch (error) {
      console.error('Scan processing error:', error);
      Alert.alert('Error', 'Failed to process the photo. Please try again.', [
        { text: 'Retake Photo', onPress: () => setAppState('camera') },
        { text: 'Cancel', style: 'cancel', onPress: () => {
          setCapturedImage(null);
          setScanResult(null);
          setAppState('main');
        }}
      ]);
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

  const handleViewGroceryList = () => {
    console.log('Opening grocery list...');
    setAppState('grocery-list');
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
    setActiveTab('scan');
    setAppState('main');
  };

  const handleInventoryOverviewBack = () => {
    setActiveTab('scan');
    setAppState('main');
  };

  const handleAddToGroceryList = (missingIngredients: string[]) => {
    // TODO: Implement grocery list functionality
    console.log('Adding to grocery list:', missingIngredients);
    Alert.alert('Coming Soon', 'Grocery list functionality will be available in the next update!');
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

  const handleGroceryListBack = () => {
    setActiveTab('scan');
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
    // Simulate a successful scan
    setCapturedImage('demo-image-uri');
    setScanResult({
      products: [
        {
          name: 'Apple',
          confidence: 0.95,
          category: 'fruits',
          suggestedExpirationDays: 7,
        },
        {
          name: 'Banana',
          confidence: 0.92,
          category: 'fruits',
          suggestedExpirationDays: 5,
        },
      ],
      processingTime: 1500,
    });
    setAppState('scan-results');
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setScanResult(null);
    setAppState('camera');
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Smart-Eat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied state
  if (appState === 'permission-denied') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Permissions Required</Text>
          <Text style={styles.permissionText}>
            Smart-Eat needs camera and photo library access to scan groceries and manage your inventory.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
          {debugInfo && (
            <Text style={styles.debugText}>{debugInfo}</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Camera state
  if (appState === 'camera') {
    return (
      <CameraScreen
        onPhotoCaptured={handlePhotoCapture}
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

  // Scan results state
  if (appState === 'scan-results' && scanResult && capturedImage) {
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

  // Recipe suggestions state
  if (appState === 'recipe-suggestions') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <RecipeSuggestionsScreen
            onBack={handleRecipeSuggestionsBack}
            onViewRecipe={handleViewRecipe}
            onScanItems={handleStartCamera}
          />
        </View>
        <BottomNavigationBar
          activeTab="recipes"
          onTabPress={handleTabPress}
        />
        <StatusBar barStyle="dark-content" />
      </SafeAreaView>
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
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <InventoryOverviewScreen
            onBack={handleInventoryOverviewBack}
            onViewItem={handleViewInventoryItem}
            onScanItems={handleStartCamera}
          />
        </View>
        <BottomNavigationBar
          activeTab="inventory"
          onTabPress={handleTabPress}
        />
        <StatusBar barStyle="dark-content" />
      </SafeAreaView>
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
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <GroceryListScreen
            onBack={handleGroceryListBack}
          />
        </View>
        <BottomNavigationBar
          activeTab="grocery"
          onTabPress={handleTabPress}
        />
        <StatusBar barStyle="dark-content" />
      </SafeAreaView>
    );
  }

  // Main screen with bottom navigation
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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
      </View>
      
      <BottomNavigationBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
      <StatusBar barStyle="dark-content" />
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 20,
    color: '#3498db',
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 18,
    color: '#34495e',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 25,
  },
  permissionButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  debugText: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20, // Adjust for safe area
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
