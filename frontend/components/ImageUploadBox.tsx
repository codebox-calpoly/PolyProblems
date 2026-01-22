import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

export function ImageUploadBox() {
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Denied", "We need access to your media.");
      return;
    }

    let result = useCamera 
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 1 });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const showOptions = () => {
    Alert.alert("Upload Image", "Choose a source", [
      { text: "Camera", onPress: () => pickImage(true) },
      { text: "Library", onPress: () => pickImage(false) },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.dashedBox} onPress={showOptions}>
        {image ? (
          <Image source={{ uri: image }} style={styles.preview} />
        ) : (
          <View style={styles.inner}>
            <Feather name="upload-cloud" size={32} color="#999" />
            <Text style={styles.text}>Upload an Image</Text>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Browse</Text>
            </View>
          </View>
        )}
      </Pressable>
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
  preview: { width: '100%', height: '100%', borderRadius: 14 }
});