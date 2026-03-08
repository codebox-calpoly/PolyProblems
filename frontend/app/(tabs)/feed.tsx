import { ThemedView } from "@/components/themed-view";
import { Colors, Fonts, feedTabs } from "@/constants/theme";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const tabs = ["Facilities", "Safety", "Dining", "Tech"];

export default function FeedScreen() {
  const scheme = useColorScheme(); // "light" | "dark" | null
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  const styles = profileStyles(theme);
  const [activeTab, setActiveTab] = useState("Facilities");

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedView style={styles.tabRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tabButton}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && { color: feedTabs[activeTab] },
                ]}
              >
                {tab}
              </Text>
              <View
                style={[
                  styles.tabIndicator,
                  activeTab === tab && { backgroundColor: feedTabs[activeTab] },
                ]}
              />
            </TouchableOpacity>
          ))}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const profileStyles = (theme: {
  background: string;
  text: string;
  tint: string;
  icon: string;
  line: string;
}) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      paddingHorizontal: 20,
    },
    tabRow: {
      flexDirection: "row",
      paddingTop: 10,
      paddingBottom: 10,
    },
    tabButton: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 12,
    },
    tabText: {
      fontSize: 16,
      color: theme.text,
    },
    tabIndicator: {
      height: 4,
      width: "100%",
      marginTop: 4,
      backgroundColor: theme.line,
    },
    header: {
      alignItems: "center",
      paddingVertical: 20,
    },
    avatarRing: {
      width: 130,
      height: 130,
      borderRadius: 65,
      borderWidth: 10,
      borderColor: theme.tint,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    avatar: {
      width: 122,
      height: 122,
      borderRadius: 61,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 56,
      fontWeight: "700",
      color: "#FFFFFF",
      fontFamily: Fonts.heading,
    },
    username: {
      fontSize: 28,
      lineHeight: 32,
      fontFamily: Fonts.heading,
      marginTop: 4,
      color: theme.text,
    },
    subtle: {
      fontSize: 14,
      fontFamily: Fonts.body,
      color: theme.icon,
      marginTop: 6,
    },
    section: {
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 28,
      lineHeight: 32,
      fontFamily: Fonts.heading,
      marginBottom: 16,
      color: theme.text,
    },
    card: {
      borderWidth: 1,
      borderColor: "#e6e6e6",
      borderRadius: 18,
      padding: 18,
      marginBottom: 14,
      backgroundColor: theme.background,
    },
    cardTitle: {
      fontSize: 22,
      fontFamily: Fonts.heading,
      lineHeight: 28,
      color: theme.text,
    },

    cardFooter: {
      marginTop: 12,
      alignItems: "flex-end",
    },

    viewButton: {
      backgroundColor: theme.tint,
      paddingHorizontal: 22,
      paddingVertical: 7,
      borderRadius: 999, //rounded
    },

    viewButtonText: {
      color: "#ffffff",
      fontSize: 14,
      fontFamily: Fonts.heading,
    },

    emptyMessage: {
      fontSize: 14,
      fontFamily: Fonts.body,
      color: theme.icon,
      textAlign: "center",
      paddingVertical: 20,
    },
  });
