import { useColorScheme } from "react-native";
import {Ionicons} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Image, StyleSheet } from "react-native";
import { Colors } from "@/constants/theme";
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ProfileScreen() {
  const scheme = useColorScheme(); // "light" | "dark" | null
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  const styles = profileStyles(theme);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Settings icon */}
        <ThemedView style={styles.topRow}>
          <ThemedView style={{ flex: 1 }} />
          <Ionicons name="settings-outline" size={24} color={theme.tint} />
        </ThemedView>

        {/* Profile header */}
        <ThemedView style={styles.header}>
          <ThemedView style={styles.avatarRing}>
            <Image
              source={{ uri: "https://i.pravatar.cc/300" }}
              style={styles.avatar}
            />
          </ThemedView>

          <ThemedText style={styles.username}>{profileUser.username}</ThemedText>
          <ThemedText style={styles.subtle}>
            Member since {profileUser.memberSince}
          </ThemedText>
          <ThemedText style={styles.subtle}>
            {profileUser.reportsCount} Reports | {profileUser.commentsCount}{" "}
            comments
          </ThemedText>
        </ThemedView>

        {/* Reports */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Reports</ThemedText>

          {profileReports.map((report) => (
            <ThemedView key={report.id} style={styles.card}>
              <ThemedText style={styles.cardTitle}>{report.title}</ThemedText>

              <ThemedView style={styles.cardFooter}>
                <ThemedView style={styles.viewButton}>
                  <ThemedText style={styles.viewButtonText}>View</ThemedText>
                </ThemedView>

              </ThemedView>
            </ThemedView>
          ))}

        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

{/* Hardcoded Profile Data */ }
export type Report = {
  id: string;
  title: string;
};

export const profileUser = {
  username: "@johndoe",
  memberSince: "December 2025",
  reportsCount: 2,
  commentsCount: 4,
};

export const profileReports: Report[] = [
  { id: "1", title: "Broken Laundry Machine in Cerro Vista 203" },
  { id: "2", title: "Water Pressure Low in Tower 5 Showers" },
];

{/* Style Stuff */ }
const profileStyles = (theme: {
    background: string;
    text: string;
    tint: string;
    icon: string;
}) => StyleSheet.create({
        safe: {
            flex: 1,
            backgroundColor: theme.background,
        },
        container: {
            paddingHorizontal: 20,
        },
        topRow: {
            flexDirection: "row",
            paddingTop: 10,
            paddingBottom: 10,
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
            borderRadius: 65,
            backgroundColor: "#d9d9d9",
        },
        username: {
            fontSize: 28,
            fontWeight: "600",
            marginTop: 4,
            color: theme.text,
        },
        subtle: {
            fontSize: 14,
            color: theme.icon,
            marginTop: 6,
        },
        section: {
            marginTop: 20,
        },
        sectionTitle: {
            fontSize: 28,
            fontWeight: "bold",
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
            fontWeight: "900",
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
            fontWeight: "700",
        },

    });
