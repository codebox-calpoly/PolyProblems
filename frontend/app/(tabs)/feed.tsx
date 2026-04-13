import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  useColorScheme,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";

import { ThemedView } from "@/components/themed-view";
import { Colors, Fonts, feedTabs } from "@/constants/theme";

// --- TEST SCENES ---
const TestScene = ({ title, color }: { title: string; color: string }) => (
  <View style={styles.scene}>
    <Text style={[styles.testText, { color }]}>{title} Feed</Text>
    <Text style={styles.subText}>Swipe left or right to switch categories</Text>
  </View>
);

const renderScene = SceneMap({
  Facilities: () => <TestScene title="Facilities" color={feedTabs.Facilities} />,
  Safety: () => <TestScene title="Safety" color={feedTabs.Safety} />,
  Dining: () => <TestScene title="Dining" color={feedTabs.Dining} />,
  Tech: () => <TestScene title="Tech" color={feedTabs.Tech} />,
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        swipeEnabled={Platform.OS !== "web"}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            // Smoothly animated indicator
            indicatorStyle={{ 
              backgroundColor: feedTabs[routes[index].key] || theme.tint, 
              height: 4,
              borderRadius: 2 
            }}
            // TabBar Container Styling
            style={{ 
              backgroundColor: theme.background, 
              elevation: 0, 
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: theme.line,
              paddingTop: 10, // Added padding to clear the notch/Dynamic Island
            }}
            // Explicitly set Label colors and styles
            activeColor={feedTabs[routes[index].key] || theme.tint}
            inactiveColor={theme.text}
            labelStyle={{ 
              fontFamily: Fonts.body, 
              fontWeight: '600', 
              fontSize: 14,
              textTransform: 'none' // Keeps "Facilities" instead of "FACILITIES"
            }}
            // Distribute labels evenly
            tabStyle={{ width: layout.width / 4 }}
            pressColor="transparent"
          />
        )}
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
});