import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  useWindowDimensions,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";

import { feedTabs } from "@/constants/theme";

// --- TEST SCENES ---
const TestScene = ({ title, color }: { title: string; color: string }) => (
  <View style={styles.scene}>
    <Text style={[styles.testText, { color }]}>{title} Feed</Text>
    <Text style={styles.subText}>Everything is working below the bar.</Text>
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
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  // Explicit Platform Colors
  const bgColor = isWeb ? "#000000" : "#FFFFFF";
  const labelColor = isWeb ? "#FFFFFF" : "#000000";

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "Facilities", title: "Facilities" },
    { key: "Safety", title: "Safety" },
    { key: "Dining", title: "Dining" },
    { key: "Tech", title: "Tech" },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* 1. PHYSICAL HEADER: This ensures the bar is pushed down below the notch */}
      <View style={{ height: insets.top, backgroundColor: bgColor }} />

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        swipeEnabled={!isWeb}
        renderTabBar={(props) => (
          <View style={{ height: 60, backgroundColor: bgColor }}>
            <TabBar
              {...props}
              renderIndicator={(indicatorProps) => {
                // Smooth line color transition
                const indicatorColor = props.position.interpolate({
                  inputRange: routes.map((_, i) => i),
                  outputRange: routes.map((route) => feedTabs[route.key] || "#000"),
                });
                return (
                  <Animated.View
                    style={[
                      indicatorProps.style,
                      { backgroundColor: indicatorColor, height: 3, bottom: 0 }
                    ]}
                  />
                );
              }}
              style={{ 
                backgroundColor: 'transparent',
                elevation: 0,
                shadowOpacity: 0,
                height: 60,
              }}
              tabStyle={{ height: 60 }}
              // 2. STABLE COLOR PROPS
              activeColor={labelColor} 
              inactiveColor={isWeb ? "#888" : "#444"}
              renderLabel={({ route, focused, color }) => {
                const routeIndex = routes.findIndex((r) => r.key === route.key);
                const activeColor = feedTabs[route.key] || labelColor;

                // 3. THE "SEAMLESS" COLOR BLEND
                const textColor = props.position.interpolate({
                  inputRange: [routeIndex - 1, routeIndex, routeIndex + 1],
                  outputRange: [labelColor, activeColor, labelColor],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.Text
                    style={{
                      color: textColor,
                      fontSize: 14,
                      fontWeight: "700",
                      textAlign: "center",
                      width: layout.width / 4,
                      // Adding height/lineHeight ensures it doesn't compress to 0
                      height: 20,
                      lineHeight: 20,
                    }}
                  >
                    {route.title}
                  </Animated.Text>
                );
              }}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { flex: 1, alignItems: "center", justifyContent: "center" },
  testText: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  subText: { fontSize: 14, color: "#888" },
});