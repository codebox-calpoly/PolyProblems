import { useColorScheme } from "react-native";
import { useState, useEffect } from "react";
import {Ionicons} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Image, StyleSheet } from "react-native";
import { Colors, Fonts } from "@/constants/theme";
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ReportCard } from '@/components/reportCard';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const scheme = useColorScheme(); // "light" | "dark" | null
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  const styles = profileStyles(theme);
  
  const [profileUser, setProfileUser] = useState<any>(null);
  const [profileReports, setProfileReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProfileData();
  }, []);
  
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Get current user session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // TODO: Fetch user profile from Supabase profiles table
        // For now, create a basic profile from auth data
        setProfileUser({
          username: user.email?.split('@')[0] || 'User',
          memberSince: new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
          commentsCount: 0,
        });
        
        // TODO: Fetch reports from Supabase reports table
        // const { data: reports } = await supabase
        //   .from('reports')
        //   .select('*')
        //   .eq('user_id', user.id);
        // setProfileReports(reports || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate reportsCount dynamically based on actual reports
  const reportsCount = profileReports.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Settings icon */}
        <ThemedView style={styles.topRow}>
          <ThemedView style={{ flex: 1 }} />
          <Ionicons name="settings-outline" size={24} color={theme.tint} />
        </ThemedView>

        {loading ? (
          <ThemedText style={styles.emptyMessage}>Loading profile...</ThemedText>
        ) : !profileUser ? (
          <ThemedText style={styles.emptyMessage}>No profile data found</ThemedText>
        ) : (
          <>
            {/* Profile header */}
            <ThemedView style={styles.header}>
              <ThemedView style={styles.avatarRing}>
                <Image
                  source={{ uri: "https://i.pravatar.cc/300" }}
                  style={styles.avatar}
                />
              </ThemedView>

              <ThemedText style={styles.username}>@{profileUser.username}</ThemedText>
              <ThemedText style={styles.subtle}>
                Member since {profileUser.memberSince}
              </ThemedText>
              <ThemedText style={styles.subtle}>
                {reportsCount} Reports | {profileUser.commentsCount}{" "}
                comments
              </ThemedText>
            </ThemedView>

            {/* Reports */}
            <ThemedView style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Reports</ThemedText>

              {profileReports.length === 0 ? (
                <ThemedText style={styles.emptyMessage}>No reports yet</ThemedText>
              ) : (
                profileReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))
              )}

            </ThemedView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
