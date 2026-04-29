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
import { TabView, TabBar } from "react-native-tab-view";

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
      let query = supabase
        .from("reports")
        .select("id")
        .eq("status", "unresolved")
        .order("created_at", { ascending: false });

      // Only filter by category when not on the "All" tab
      if (title !== "All") {
        query = query.eq("category", title);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!title,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading || isRefetching) {
    return (
      <View style={styles.scene}>
        <ActivityIndicator color={color} />
      </View>
    );
  }

  // --- CASE 1: No Reports Found ---
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
            tintColor={color}
          />
        }
      >
        <Text style={[styles.testText, { color }]}>
          {title === "All" ? "All Reports" : `${title} Feed`}
        </Text>
        <Text style={[styles.subText, { color }]}>
          {title === "All"
            ? "No reports yet."
            : `No reports in ${title} yet.`}
        </Text>
      </ScrollView>
    );
  }

  // --- CASE 2: Reports Exist ---
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingVertical: 20,
        alignItems: "center",
        flexGrow: 1,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={color}
        />
      }
    >
      <Text style={[styles.testText, { color, marginBottom: 20 }]}>
        {title === "All" ? "All Reports" : `${title} Feed`}
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

export default function FeedScreen() {
  const layout = useWindowDimensions();
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;

  const ALL_TAB_COLOR = "#174735";

  // Default to index 0 = "All"
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "All", title: "All" },
    { key: "Facilities", title: "Facilities" },
    { key: "Safety", title: "Safety" },
    { key: "Dining", title: "Dining" },
    { key: "Tech", title: "Tech" },
  ]);

  // Build color array matching routes order (All first)
  const colorRange = routes.map(
    (route) => feedTabs[route.key] ?? ALL_TAB_COLOR
  );
  const inputRange = routes.map((_, i) => i);

  // Moved inside component so SceneMap has access to theme
  const renderScene = ({ route }: { route: { key: string } }) => {
    const color = feedTabs[route.key] ?? ALL_TAB_COLOR;
    return <FeedScene title={route.key} color={color} />;
  };

  const renderTabBar = (props: any) => {
    const activeColor = props.position.interpolate({
      inputRange,
      outputRange: colorRange,
    });

    return (
      <TabBar
        {...props}
        renderIndicator={(indicatorProps) => {
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
                  width: width - 20,
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
        tabStyle={{ width: layout.width / routes.length }}
        pressColor="transparent"
        scrollEnabled={false}
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
