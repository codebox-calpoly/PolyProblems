import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { Fonts } from "@/constants/theme";

interface ImageUploadBoxProps {
  images: string[];
  onImagesPicked: (uris: string[]) => void;
}

export function ImageUploadBox({
  images,
  onImagesPicked,
}: ImageUploadBoxProps) {
  const pickImage = async (useCamera: boolean = false) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      const msg = "Permission Denied: We need access to your media.";
      if (Platform.OS === "web") {
        alert(msg);
      } else {
        Alert.alert("Permission Denied", msg);
      }
      return;
    }

    let result = useCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.8,
          allowsMultipleSelection: true,
          selectionLimit: 6 - images.length,
        });

    if (!result.canceled) {
      const selectedUris = result.assets.map((asset) => asset.uri);
      const newImages = [...images, ...selectedUris].slice(0, 6);
      onImagesPicked(newImages);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesPicked(updatedImages);
  };

  const handlePress = () => {
    if (Platform.OS === "web") {
      pickImage(false);
    } else {
      Alert.alert("Upload Images", "Choose a source", [
        { text: "Camera", onPress: () => pickImage(true) },
        { text: "Library", onPress: () => pickImage(false) },
        { text: "Cancel", style: "cancel" },
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
                resizeMode="contain"
              />
              <Pressable
                style={styles.removeBadge}
                onPress={() => removeImage(index)}
              >
                <Feather name="x" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}

          {/* Add More Button */}
          {images.length < 6 && (
            <Pressable style={styles.addMoreButton} onPress={handlePress}>
              <Feather name="plus" size={32} color="#999" />
            </Pressable>
          )}

          {images.length > 0 && images.length < 5 && (
            <View style={{ width: "32%" }} />
          )}
        </View>
      )}

      {/* Initial Empty State */}
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
  container: {
    width: "100%",
    marginVertical: 10,
  },
  dashedBox: {
    height: 180,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  inner: { alignItems: "center" },
  text: {
    color: "#666",
    marginVertical: 8,
    fontSize: 16,
    fontFamily: Fonts.body,
  },
  button: {
    backgroundColor: "#2D4335",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 25,
  },
  buttonText: {
    color: "#fff",
    fontFamily: Fonts.heading,
    fontSize: 16,
  },

  // Grid Styles
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  imageWrapper: {
    width: "32%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#eee",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  addMoreButton: {
    width: "32%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  removeBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
  },
});
