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
  TouchableOpacity,
  Pressable,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TabView, TabBar } from "react-native-tab-view";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, feedTabs } from "@/constants/theme";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import FeedPost from "@/components/feedPost";

const FeedScene = ({
  title,
  color,
  sort,
}: {
  title: string;
  color: string;
  sort: "new" | "top";
}) => {
  const {
    data: reports,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["reports", title, sort],
    queryFn: async () => {
      let query = supabase
        .from("reports")
        .select("id")
        .eq("status", "unresolved")
        .order(sort === "new" ? "created_at" : "total_score", {
          ascending: false,
        });

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
          {title === "All" ? "No reports yet." : `No reports in ${title} yet.`}
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
  const [sort, setSort] = useState<"new" | "top">("new");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const sortButtonRef = React.useRef<typeof TouchableOpacity.prototype>(null);
  const [dropdownTop, setDropdownTop] = useState(140);

  const openDropdown = () => {
    sortButtonRef.current?.measure(
      (
        _x: number,
        _y: number,
        _width: number,
        height: number,
        _pageX: number,
        pageY: number,
      ) => {
        setDropdownTop(pageY + height + 4);
      },
    );
    setDropdownVisible(true);
  };

  const dropdownScale = Math.min(layout.width / 390, 1.5); // 390 = base iPhone width
  const dropdownFontSize = Math.round(13 * dropdownScale);
  const dropdownIconSize = Math.round(14 * dropdownScale);

  const TAB_MIN_WIDTH = 90;
  const totalMinWidth = routes.length * TAB_MIN_WIDTH;
  const tabWidth =
    totalMinWidth <= layout.width
      ? layout.width / routes.length // spread evenly
      : TAB_MIN_WIDTH; // fixed, lets neighbors peek
  // Build color array matching routes order (All first)
  const colorRange = routes.map(
    (route) => feedTabs[route.key] ?? ALL_TAB_COLOR,
  );
  const inputRange = routes.map((_, i) => i);

  const renderTabBar = (props: any) => {
    const activeColor = props.position.interpolate({
      inputRange,
      outputRange: colorRange,
    });

    return (
      <TabBar
        {...props}
        renderIndicator={(indicatorProps) => {
          const { position, getTabWidth, navigationState } = indicatorProps;

          const offsets = navigationState.routes.map((_: any, i: number) => {
            let offset = 0;
            for (let j = 0; j < i; j++) {
              offset += getTabWidth(j);
            }
            return offset;
          });

          const translateX = position.interpolate({
            inputRange: navigationState.routes.map((_: any, i: number) => i),
            outputRange: offsets,
          });

          const scaleX = position.interpolate({
            inputRange: navigationState.routes.map((_: any, i: number) => i),
            outputRange: navigationState.routes.map((_: any, i: number) =>
              getTabWidth(i),
            ),
          });

          return (
            <Animated.View
              style={[
                styles.indicator,
                {
                  width: 1, // base width of 1, scaleX does the rest
                  transform: [{ translateX }, { scaleX }],
                  transformOrigin: "left",
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
        tabStyle={{ width: tabWidth, paddingHorizontal: 0 }}
        labelStyle={{ fontSize: 12, marginHorizontal: 2, marginVertical: 6 }}
        pressColor="transparent"
        scrollEnabled={true}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="none"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable
          style={[StyleSheet.absoluteFill, { cursor: "default" } as any]}
          onPress={() => setDropdownVisible(false)}
        />
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.background,
              borderColor: theme.line,
              top: dropdownTop,
              width: Math.min(layout.width * 0.4, 200), // 40% of screen, max 200
            },
          ]}
        >
          {(["new", "top"] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.dropdownItem,
                sort === option && { backgroundColor: theme.line },
                {
                  paddingHorizontal: Math.round(14 * dropdownScale),
                  paddingVertical: Math.round(10 * dropdownScale),
                },
              ]}
              onPress={() => {
                setSort(option);
                setDropdownVisible(false);
              }}
            >
              <Ionicons
                name={option === "new" ? "time-outline" : "flame-outline"}
                size={dropdownIconSize}
                color={theme.text}
              />
              <Text
                style={[
                  styles.dropdownItemText,
                  { color: theme.text, fontSize: dropdownFontSize },
                ]}
              >
                {option === "new" ? "New" : "Top"}
              </Text>
              {sort === option && (
                <Ionicons
                  name="checkmark"
                  size={dropdownIconSize + 4}
                  color={ALL_TAB_COLOR}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
      <TabView
        navigationState={{ index, routes }}
        renderScene={({ route }) => {
          const color = feedTabs[route.key] ?? ALL_TAB_COLOR;
          return <FeedScene title={route.key} color={color} sort={sort} />;
        }}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        swipeEnabled={Platform.OS !== "web"}
        renderTabBar={(props) => (
          <>
            {renderTabBar(props)}
            <View
              style={[
                styles.sortRow,
                {
                  backgroundColor: theme.background,
                  borderBottomColor: theme.line,
                  paddingVertical: Math.round(8 * dropdownScale),
                },
              ]}
            >
              <TouchableOpacity
                ref={sortButtonRef}
                style={styles.sortButton}
                onPress={openDropdown}
              >
                <Ionicons
                  name={sort === "new" ? "time-outline" : "flame-outline"}
                  size={dropdownIconSize}
                  color={theme.text}
                />
                <Text
                  style={[
                    styles.sortButtonText,
                    { color: theme.text, fontSize: dropdownFontSize },
                  ]}
                >
                  {sort === "new" ? "New" : "Top"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={Math.round(12 * dropdownScale)}
                  color={theme.text}
                />
              </TouchableOpacity>
            </View>
          </>
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
  sortRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
  },
  sortButtonText: {
    fontSize: 13,
    fontFamily: Fonts.body,
  },
  sortChevron: {
    fontSize: 11,
    fontFamily: Fonts.body,
  },
  dropdown: {
    position: "absolute",
    top: 140,
    left: 16,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 120,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    cursor: "pointer",
  },
  dropdownItemText: {
    fontSize: 13,
    fontFamily: Fonts.body,
  },
});
