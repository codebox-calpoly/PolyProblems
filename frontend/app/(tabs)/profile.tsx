import {
  useColorScheme,
  ScrollView,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  View,
  Text,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Fonts } from "@/constants/theme";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ReportCard } from "@/components/reportCard";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

export default function ProfileScreen() {
  const router = useRouter();
  const scheme = useColorScheme(); // "light" | "dark" | null
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  const styles = profileStyles(theme);

  // --- TANSTACK QUERY: Fetch Profile & Reports ---
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      return {
        id: user.id,
        email: user.email || "",
        username: user.email?.split("@")[0] || "User",
        memberSince: new Date(user.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        }),
      };
    },
  });

  const { data: reports, isLoading: isReportsLoading } = useQuery({
    queryKey: ["user-reports", profileData?.id],
    enabled: !!profileData?.id, // Only run if we have a user ID
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // Consider data "fresh" for 5 minutes
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", profileData!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // const handleSignOut = async () => {
  //   await supabase.auth.signOut();
  //   router.replace("/");
  // };

  const handleSettingsPress = () => {
    router.push("/settings");
  };

  // Get first letter of email (uppercase)
  const getInitial = () => profileData?.email?.charAt(0).toUpperCase() || "?";

  // Calculate reportsCount dynamically based on actual reports
  const reportsCount = reports?.length || 0;
  const loading = isProfileLoading || isReportsLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Settings icon */}
        <ThemedView style={styles.topRow}>
          {/* <TouchableOpacity onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color={theme.tint} />
          </TouchableOpacity> */}
          <ThemedView style={{ flex: 1 }} />
          <Pressable onPress={handleSettingsPress}>
            <Ionicons name="settings-outline" size={24} color={theme.tint} />
          </Pressable>
        </ThemedView>

        {loading ? (
          <ThemedText style={styles.emptyMessage}>
            Loading profile...
          </ThemedText>
        ) : !profileData ? (
          <ThemedText style={styles.emptyMessage}>
            No profile data found
          </ThemedText>
        ) : (
          <>
            {/* Profile header */}
            <ThemedView style={styles.header}>
              <ThemedView style={styles.avatarRing}>
                {/* Letter Avatar */}
                <View style={[styles.avatar, { backgroundColor: theme.tint }]}>
                  <Text style={styles.avatarText}>{getInitial()}</Text>
                </View>
              </ThemedView>

              <ThemedText style={styles.username}>
                @{profileData.username}
              </ThemedText>
              <ThemedText style={styles.subtle}>
                Member since {profileData.memberSince}
              </ThemedText>
              <ThemedText style={styles.subtle}>
                {reportsCount} Reports
              </ThemedText>
            </ThemedView>

            {/* Reports */}
            <ThemedView style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Reports</ThemedText>

              {loading ? (
                <ThemedText style={styles.emptyMessage}>
                  Loading reports...
                </ThemedText>
              ) : reportsCount === 0 ? (
                <ThemedText style={styles.emptyMessage}>
                  No reports yet
                </ThemedText>
              ) : (
                reports?.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onPress={() => router.push(`/${report.id}`)} // Added push navigation
                  />
                ))
              )}
            </ThemedView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

{
  /* Style Stuff */
}
const profileStyles = (theme: {
  background: string;
  text: string;
  tint: string;
  icon: string;
}) =>
  StyleSheet.create({
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
