import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";

import { Colors } from "./constants/theme";
import { profileReports, profileUser } from "./data/profileData";
import { makeProfileStyles } from "./styles/profileStyles";

export default function ProfileScreen() {
  const scheme = useColorScheme(); // "light" | "dark" | null
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  const styles = makeProfileStyles(theme);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Settings icon */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }} />
          <Ionicons name="settings-outline" size={24} color={theme.tint} />
        </View>

        {/* Profile header */}
        <View style={styles.header}>
          <View style={styles.avatarRing}>
            <Image
              source={{ uri: "https://i.pravatar.cc/300" }}
              style={styles.avatar}
            />
          </View>

          <Text style={styles.username}>{profileUser.username}</Text>
          <Text style={styles.subtle}>
            Member since {profileUser.memberSince}
          </Text>
          <Text style={styles.subtle}>
            {profileUser.reportsCount} Reports | {profileUser.commentsCount}{" "}
            comments
          </Text>
        </View>

        {/* Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reports</Text>

          {profileReports.map((report) => (
            <View key={report.id} style={styles.card}>
              <Text style={styles.cardTitle}>{report.title}</Text>

              <View style={styles.cardFooter}>
                <View style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View</Text>
                </View>

              </View>
            </View>
          ))}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
