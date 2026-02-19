import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

export function ImageUploadBox() {
  const [images, setImages] = useState<string[]>([]);

  const pickImage = async (useCamera: boolean = false) => {
    const permission = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      const msg = "Permission Denied: We need access to your media.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Permission Denied", msg);
      return;
    }

    let result;
    if (useCamera && Platform.OS !== 'web') {
      result = await ImagePicker.launchCameraAsync({
        quality: 1,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        quality: 1,
      });
    }

    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...newUris]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePress = () => {
    if (Platform.OS === 'web') {
      pickImage(false);
    } else {
      Alert.alert("Upload Image", "Choose a source", [
        { text: "Camera", onPress: () => pickImage(true) },
        { text: "Library", onPress: () => pickImage(false) },
        { text: "Cancel", style: "cancel" }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {images.length > 0 && (
        <View style={styles.grid}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image 
                source={{ uri }} 
                style={styles.thumbnail} 
                // FIX: "contain" ensures the full image is visible
                resizeMode="contain" 
              />
              <Pressable style={styles.removeBadge} onPress={() => removeImage(index)}>
                <Feather name="x" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
          
          {images.length < 5 && (
            <Pressable style={styles.addMoreButton} onPress={handlePress}>
              <Feather name="plus" size={24} color="#999" />
            </Pressable>
          )}
        </View>
      )}

      {images.length === 0 && (
        <Pressable style={styles.dashedBox} onPress={handlePress}>
          <View style={styles.inner}>
            <Feather name="upload-cloud" size={32} color="#999" />
            <Text style={styles.text}>Upload Images</Text>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Browse</Text>
            </View>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginVertical: 10 },
  dashedBox: {
    height: 180,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  inner: { alignItems: 'center' },
  text: { color: '#666', marginVertical: 8, fontSize: 16 },
  button: { backgroundColor: '#2D4335', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 25 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  imageWrapper: {
    width: '30%', 
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    // Added a light background so "contained" images look uniform
    backgroundColor: '#f9f9f9', 
    borderWidth: 1,
    borderColor: '#eee',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  addMoreButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 2,
    zIndex: 1, // Ensures the button stays on top
  }
});