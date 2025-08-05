import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

interface PhotoPreviewProps {
  imageUri: string;
  onRetake: () => void;
  onUsePhoto: () => void;
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({ 
  imageUri, 
  onRetake, 
  onUsePhoto 
}) => {
  const savePhoto = async () => {
    try {
      console.log('Saving photo:', imageUri);
      
      // For web demo images, skip media library save
      if (Platform.OS === 'web' && imageUri.startsWith('http')) {
        console.log('Web demo image - skipping media library save');
        Alert.alert('Demo Mode', 'Photo saved successfully! (Demo mode)', [
          { text: 'OK', onPress: onUsePhoto }
        ]);
        return;
      }

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(imageUri);
      
      // Save to app's local storage with unique naming
      const fileName = `grocery_scan_${Date.now()}.jpg`;
      const localUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({
        from: imageUri,
        to: localUri,
      });
      
      Alert.alert('Success', 'Photo saved successfully!', [
        { text: 'OK', onPress: onUsePhoto }
      ]);
    } catch (error) {
      console.error('Photo save error:', error);
      Alert.alert('Error', 'Failed to save photo. Please try again.');
    }
  };

  return (
    <View style={styles.container} testID="photo-preview">
      <Image source={{ uri: imageUri }} style={styles.preview} />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={onRetake} testID="retake-photo">
          <Text style={styles.buttonText}>Retake Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={savePhoto} testID="use-photo">
          <Text style={styles.buttonText}>Use Photo</Text>
        </TouchableOpacity>
      </View>
      {Platform.OS === 'web' && imageUri.startsWith('http') && (
        <View style={styles.demoNote}>
          <Text style={styles.demoNoteText}>Demo Mode - Using sample image</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  preview: {
    width: '100%',
    height: '80%',
    resizeMode: 'cover',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  button: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#27ae60',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  demoNote: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
    padding: 10,
    borderRadius: 10,
  },
  demoNoteText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
}); 