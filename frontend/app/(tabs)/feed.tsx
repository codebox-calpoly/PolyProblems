import { useState, useEffect } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View, Text, useColorScheme, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { Colors, Fonts, feedTabs } from "@/constants/theme";
import FeedPost from "../../components/feedPost";
import { supabase } from "@/lib/supabase";

const tabs = ["Facilities", "Safety", "Dining", "Tech"];

export default function FeedScreen() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  const [activeTab, setActiveTab] = useState("Facilities");
  const [reportIds, setReportIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIds() {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('id')
        .eq('category', activeTab)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReportIds(data.map(item => item.id));
      }
      setLoading(false);
    }
    fetchIds();
  }, [activeTab]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabButton}>
            <Text style={[styles.tabText, { color: activeTab === tab ? (feedTabs[tab] || theme.tint) : theme.icon }]}>
              {tab}
            </Text>
            <View style={[styles.tabIndicator, { backgroundColor: activeTab === tab ? feedTabs[tab] : "transparent" }]} />
          </TouchableOpacity>
        ))}
      </ThemedView>

      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.tint} style={{ marginTop: 50 }} />
        ) : reportIds.length > 0 ? (
          reportIds.map((id) => <FeedPost key={id} reportId={id} />)
        ) : (
          <Text style={[styles.emptyMessage, { color: theme.text }]}>No reports in {activeTab} yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1
   },
  container: { 
    paddingHorizontal: 20, 
    paddingBottom: 40 
  },
  tabRow: { 
    flexDirection: "row", 
    paddingTop: 10 
  },
  tabButton: { 
    flex: 1, 
    alignItems: "center", 
    paddingVertical: 12 
  },
  tabText: { 
    fontSize: 16, 
    fontFamily: Fonts.heading, 
    fontWeight: '700' 
  },
  tabIndicator: { 
    height: 4, 
    width: "100%", 
    marginTop: 4 
  },
  emptyMessage: { 
    textAlign: 'center', 
    marginTop: 50, 
    opacity: 0.5 
  }
});