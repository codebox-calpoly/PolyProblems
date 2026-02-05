import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Colors, Fonts } from "@/constants/theme";
import { router } from "expo-router";

// Define navigation type (adjust based on your navigation setup)
type SettingsNavigationProp = {
  navigate: (screen: string) => void;
};

const Settings = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleEditProfile = () => {
    router.push("/(tabs)/profile");
  };

  const handleNotifications = () => {
    router.push("/notifications");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with decorative image */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/settings.svg")}
          style={styles.decorativeImage}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      {/* Settings Options */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: "#F5F5F5" }]}
          onPress={handleEditProfile}
          activeOpacity={0.7}
        >
          <Text style={styles.optionText}>Edit Profile</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: "#F5F5F5" }]}
          onPress={handleNotifications}
          activeOpacity={0.7}
        >
          <Text style={styles.optionText}>Notifications</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "relative",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  decorativeImage: {
    position: "absolute",
    top: -3,
    right: 0,
    width: 160,
    height: 160,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 10,
    fontFamily: Fonts.rounded,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  optionText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
    fontFamily: Fonts.sans,
  },
  arrow: {
    fontSize: 20,
    color: "#000",
    fontWeight: "300",
  },
});

export default Settings;
