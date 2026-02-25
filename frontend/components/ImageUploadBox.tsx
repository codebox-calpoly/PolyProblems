import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather, Ionicons } from '@expo/vector-icons';

interface ImageUploadBoxProps {
  onImagesPicked: (uris: string[]) => void; 
}

export function ImageUploadBox({ onImagesPicked }: ImageUploadBoxProps) {
  const [images, setImages] = useState<string[]>([]);

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Denied", "We need access to your media.");
      return;
    }

    let result = useCamera 
      ? await ImagePicker.launchCameraAsync({ 
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({ 
          quality: 0.8,
          allowsMultipleSelection: true,
          selectionLimit: 5,
        });

    if (!result.canceled) {
      const selectedUris = result.assets.map(asset => asset.uri);
      const newImages = [...images, ...selectedUris];
      
      setImages(newImages);
      onImagesPicked(newImages);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesPicked(updatedImages);
  };

  const showOptions = () => {
    Alert.alert("Upload Images", "Choose a source", [
      { text: "Camera", onPress: () => pickImage(true) },
      { text: "Library", onPress: () => pickImage(false) },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  return (
    <View style={styles.container}>
      {images.length > 0 ? (
        <View style={styles.gridContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.thumbnail} />
                <Pressable style={styles.removeBtn} onPress={() => removeImage(index)}>
                  <Ionicons name="close-circle" size={20} color="red" />
                </Pressable>
              </View>
            ))}
            {/* Small button to add more images */}
            <Pressable style={styles.addMoreBtn} onPress={showOptions}>
              <Feather name="plus" size={24} color="#999" />
            </Pressable>
          </ScrollView>
        </View>
      ) : (
        <Pressable style={styles.dashedBox} onPress={showOptions}>
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
  gridContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 100,
  },
  imageWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  thumbnail: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  removeBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  addMoreBtn: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  inner: { alignItems: 'center' },
  text: { color: '#666', marginVertical: 8, fontSize: 16 },
  button: { backgroundColor: '#2D4335', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 25 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});