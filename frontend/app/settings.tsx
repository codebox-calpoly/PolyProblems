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
import { Ionicons } from "@expo/vector-icons";

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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={15} color={colors.text} />
          <Text style={[styles.subTitle, { color: colors.text }]}>Profile</Text>
        </TouchableOpacity>
        <Image
          source={require("../assets/images/settings.png")}
          style={styles.decorativeImage}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.text }]}>Back</Text>
      </View>

      {/* Settings Options */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            { backgroundColor: colors.settingsButton },
          ]}
          onPress={handleEditProfile}
          activeOpacity={0.7}
        >
          <Text style={styles.optionText}>Edit Profile</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            { backgroundColor: colors.settingsButton },
          ]}
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  subTitle: {
    fontSize: 16,
    fontFamily: Fonts.heading,
    marginBottom: 4,
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
    marginBottom: 10,
    fontFamily: Fonts.heading,
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
    fontFamily: Fonts.body,
  },
  arrow: {
    fontSize: 20,
    color: "#000",
    fontFamily: Fonts.body,
  },
});

export default Settings;
