
import { Platform, StyleSheet, TextInput, Pressable, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#fff", dark: "#fff" }}
      headerImage={<View style={{ height: 0 }} />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to Poly Problems</ThemedText>
      </ThemedView>

      <ThemedView style={styles.descriptionContainer}>
        <ThemedText style={styles.descriptionText} type="subtitle">Join other students working to keep Cal Poly running its best. Sign up or log in to share issues and find quick fixes around campus. </ThemedText>
      </ThemedView>

      <ThemedView>
        <TextInput
        placeholder="johndoe@example.com"
        placeholderTextColor="#999"
        style={styles.input}
        />
      </ThemedView>

      <Pressable style={styles.button}>
        <ThemedText style={styles.buttonText}>Continue</ThemedText>
      </Pressable>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  descriptionContainer: {
    fontSize: 16,
    lineHeight: 22,
    color: '#444',
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 15,
    fontWeight: "400",
  },
  input: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1f4d3a",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
