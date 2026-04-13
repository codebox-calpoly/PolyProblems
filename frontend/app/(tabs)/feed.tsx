import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  useColorScheme,
  Platform,
  useWindowDimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";

import { Colors, Fonts, feedTabs } from "@/constants/theme";

const FeedScene = ({ title, color }: { title: string; color: string }) => (
  <View style={styles.scene}>
    <Text style={[styles.testText, { color }]}>{title} Feed</Text>
    <Text style={styles.subText}>No unresolved reports at the moment.</Text>
  </View>
);

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
