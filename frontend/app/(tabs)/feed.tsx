import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  useColorScheme,
  Platform,
  useWindowDimensions,
  Animated,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";

import { Colors, Fonts, feedTabs } from "@/constants/theme";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import FeedPost from "@/components/feedPost";

const FeedScene = ({ title, color }: { title: string; color: string }) => {
  const {
    data: reports,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["reports", title],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id")
        .eq("category", title)
        .eq("status", "unresolved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    // Optional: Prevents fetching if title is empty
    enabled: !!title,

    // Keep the list "fresh" for 2 minutes
    // Users won't see a loading spinner or background refresh if they
    // switch tabs and come back quickly.
    staleTime: 2 * 60 * 1000,

    // Keep in memory for 10 minutes even if the user leaves the screen
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading || isRefetching) {
    return (
      <View style={styles.scene}>
        <ActivityIndicator color={color} />
      </View>
    );
  }
  // --- CASE 1: No Reports Found (Uses your centered scene style) ---
  if (!reports || reports.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.scene,
          { flex: 1, justifyContent: "center" },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={color} // Matches your theme
          />
        }
      >
        <Text style={[styles.testText, { color }]}>{title} Feed</Text>
        <Text style={[styles.subText, { color: color }]}>
          No reports in {title} yet.
        </Text>
      </ScrollView>
    );
  }

  // --- CASE 2: Reports Exist (Uses ScrollView for content) ---
  return (
    <ScrollView
      style={{ flex: 1 }} // Force the width to the screen size
      contentContainerStyle={{
        paddingVertical: 20,
        alignItems: "center",
        flexGrow: 1,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={color} // For iOS spinner color
        />
      }
    >
      <Text style={[styles.testText, { color, marginBottom: 20 }]}>
        {title} Feed
      </Text>

      {reports.map((report) => (
        <View
          key={report.id}
          style={{ width: "100%", maxWidth: 1200, alignItems: "center" }}
        >
          <FeedPost reportId={report.id} />
        </View>
      ))}
    </ScrollView>
  );
};

const renderScene = SceneMap({
  Facilities: () => (
    <FeedScene title="Facilities" color={feedTabs.Facilities} />
  ),
  Safety: () => <FeedScene title="Safety" color={feedTabs.Safety} />,
  Dining: () => <FeedScene title="Dining" color={feedTabs.Dining} />,
  Tech: () => <FeedScene title="Tech" color={feedTabs.Tech} />,
});

export default function FeedScreen() {
  const layout = useWindowDimensions();
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "Facilities", title: "Facilities" },
    { key: "Safety", title: "Safety" },
    { key: "Dining", title: "Dining" },
    { key: "Tech", title: "Tech" },
  ]);

  // Helper to get color array matching the routes
  const colorRange = routes.map((route) => feedTabs[route.key] || theme.tint);
  const inputRange = routes.map((_, i) => i);

  const renderTabBar = (props: any) => {
    // Interpolate the indicator and label colors based on scroll position
    const activeColor = props.position.interpolate({
      inputRange,
      outputRange: colorRange,
    });

    return (
      <TabBar
        {...props}
        // Animate the Indicator
        renderIndicator={(indicatorProps) => {
          // Calculate width of one tab
          const width = layout.width / routes.length;
          const translateX = indicatorProps.position.interpolate({
            inputRange,
            outputRange: inputRange.map((i) => i * width),
          });

          return (
            <Animated.View
              style={[
                styles.indicator,
                {
                  width: width - 20, // slightly narrower for aesthetic
                  transform: [{ translateX: Animated.add(translateX, 10) }],
                  backgroundColor: activeColor,
                },
              ]}
            />
          );
        }}
        style={{
          backgroundColor: theme.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.line,
          paddingTop: 10,
        }}
        activeColor={theme.text}
        inactiveColor={theme.text}
        tabStyle={{ width: layout.width / 4 }}
        pressColor="transparent"
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        swipeEnabled={Platform.OS !== "web"}
        renderTabBar={renderTabBar}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scene: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  testText: {
    fontSize: 24,
    fontFamily: Fonts.heading,
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: "#888",
    fontFamily: Fonts.body,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 14,
    textTransform: "none",
    margin: 4,
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 4,
    borderRadius: 2,
  },
});
