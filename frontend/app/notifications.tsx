import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Stack, router } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // State for all toggles
  const [pushNotifications, setPushNotifications] = useState(true);
  const [priorityAlerts, setPriorityAlerts] = useState(true);
  const [foodDining, setFoodDining] = useState(true);
  const [dorms, setDorms] = useState(true);
  const [facilities, setFacilities] = useState(true);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false, // Hide the default header
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Custom Header */}
        <View style={styles.customHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={15} color={colors.text} />
            <Text
              style={[
                styles.subTitle,
                { fontFamily: Fonts.body, color: colors.text },
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Decorative settings graphic - moved outside ScrollView */}
        <Image
          source={require("@/assets/images/settings.png")}
          style={styles.decorativeImage}
          resizeMode="contain"
        />

        <ScrollView style={styles.scrollContent}>
          {/* Header with decorative graphic */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { fontFamily: Fonts.heading, color: colors.text },
              ]}
            >
              Notifications
            </Text>
          </View>

          {/* Push Notifications Section */}
          <View style={[styles.card, { backgroundColor: colors.background }]}>
            <View style={styles.row}>
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.settingTitle,
                    { fontFamily: Fonts.body, color: colors.text },
                  ]}
                >
                  Push Notifications
                </Text>
                <Text
                  style={[
                    styles.description,
                    { fontFamily: Fonts.body, color: colors.tabIconDefault },
                  ]}
                >
                  Get notified instantly when there's an update to your reports
                  or when something nearby affects you.
                </Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: colors.icon, true: colors.tint }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Priority Alerts Section */}
          <View style={[styles.card, { backgroundColor: colors.background }]}>
            <View style={styles.row}>
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.settingTitle,
                    { fontFamily: Fonts.body, color: colors.text },
                  ]}
                >
                  Priority Alerts
                </Text>
                <Text
                  style={[
                    styles.description,
                    { fontFamily: Fonts.body, color: colors.tabIconDefault },
                  ]}
                >
                  Stay informed about major campus updates and disruptions that
                  could impact your day.
                </Text>
              </View>
              <Switch
                value={priorityAlerts}
                onValueChange={setPriorityAlerts}
                trackColor={{ false: colors.icon, true: colors.tint }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Sub-items (indented) */}
            <View style={styles.subSection}>
              {/* Food & Dining */}
              <View style={styles.subItem}>
                <View style={styles.subTextContainer}>
                  <Text
                    style={[
                      styles.subTitle,
                      { fontFamily: Fonts.body, color: colors.text },
                    ]}
                  >
                    Food & Dining
                  </Text>
                  <Text
                    style={[
                      styles.subDescription,
                      { fontFamily: Fonts.body, color: colors.tabIconDefault },
                    ]}
                  >
                    Alerts about dining hall closures, menu changes, or outages.
                  </Text>
                </View>
                <Switch
                  value={foodDining}
                  onValueChange={setFoodDining}
                  trackColor={{ false: colors.icon, true: colors.tint }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Dorms */}
              <View style={styles.subItem}>
                <View style={styles.subTextContainer}>
                  <Text
                    style={[
                      styles.subTitle,
                      { fontFamily: Fonts.body, color: colors.text },
                    ]}
                  >
                    Dorms
                  </Text>
                  <Text
                    style={[
                      styles.subDescription,
                      { fontFamily: Fonts.body, color: colors.tabIconDefault },
                    ]}
                  >
                    Updates on maintenance, safety notices, or building alerts.
                  </Text>
                </View>
                <Switch
                  value={dorms}
                  onValueChange={setDorms}
                  trackColor={{ false: colors.icon, true: colors.tint }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Facilities */}
              <View style={styles.subItem}>
                <View style={styles.subTextContainer}>
                  <Text
                    style={[
                      styles.subTitle,
                      { fontFamily: Fonts.body, color: colors.text },
                    ]}
                  >
                    Facilities
                  </Text>
                  <Text
                    style={[
                      styles.subDescription,
                      { fontFamily: Fonts.body, color: colors.tabIconDefault },
                    ]}
                  >
                    Major campus infrastructure issues like power, water, or
                    Wi-Fi outages.
                  </Text>
                </View>
                <Switch
                  value={facilities}
                  onValueChange={setFacilities}
                  trackColor={{ false: colors.icon, true: colors.tint }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    paddingTop: 50, // Account for status bar
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: 17,
    marginLeft: 8,
    fontFamily: Fonts.body,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    position: "relative", // Add this!
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 48,
    fontFamily: Fonts.heading,
    marginBottom: 10,
  },

  decorativeImage: {
    position: "absolute",
    top: -3, // Match settings.tsx
    right: 0, // Match settings.tsx
    width: 160,
    height: 160,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 20,
    fontFamily: Fonts.heading,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  subSection: {
    marginTop: 20,
    paddingLeft: 20,
  },
  subItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  subTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  subTitle: {
    fontSize: 16,
    fontFamily: Fonts.heading,
    marginBottom: 4,
  },
  subDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
});
