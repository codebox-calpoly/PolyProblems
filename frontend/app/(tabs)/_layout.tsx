import { Redirect, Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, Platform } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Session } from "@supabase/supabase-js";

import { HapticTab } from "@/components/haptic-tab";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";
import LandingLogo from "@/assets/images/landinglogo.svg";

export default function TabLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const colorScheme = useColorScheme() ?? "light";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsSessionLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsSessionLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const activeColor = Colors[colorScheme].tabIconSelected;
  const inactiveColor = Colors[colorScheme].tabIconDefault;
  const navBackgroundColor = Colors[colorScheme].tabBarBackground;

  const isWeb = Platform.OS === "web";
  const barHeight = isWeb ? 100 : Platform.OS === "ios" ? 90 : 75;
  const iconSize = isWeb ? 32 : 26;
  const fontSize = isWeb ? 14 : 12;

  // 1. While we are checking if the user is logged in, show nothing or a splash
  if (isSessionLoading) {
    return null; // Or a loading spinner
  }

  // 2. If the user is NOT authenticated, kick them to the login screen
  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelPosition: "below-icon",
        tabBarStyle: {
          backgroundColor: navBackgroundColor,
          borderTopWidth: 0,
          elevation: 0,
          height: barHeight,
          paddingBottom: isWeb ? 5 : Platform.OS === "ios" ? 20 : 5,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.heading,
          fontSize: fontSize,
          marginBottom: isWeb ? 10 : 0,
        },
        tabBarIconStyle: {
          marginTop: isWeb ? 15 : 12,
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name={focused ? "view-dashboard" : "view-dashboard-outline"}
              size={iconSize}
              color={focused ? activeColor : inactiveColor}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="reportform"
        options={{
          title: "",
          tabBarIcon: () => (
            <View
              style={[styles.megaphoneContainer, isWeb && styles.megaphoneWeb]}
            >
              <Image
                source={require("../../assets/images/reportBorder.png")}
                style={[styles.borderImage, isWeb && styles.borderWeb]}
                resizeMode="contain"
              />
              <LandingLogo
                width={isWeb ? 40 : 32}
                height={isWeb ? 40 : 32}
                color="#FFFFFF"
                style={styles.logoIcon}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={iconSize}
              color={focused ? activeColor : inactiveColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          href: null, // This hides the tab icon from the bottom bar
        }}
      />

      <Tabs.Screen
        name="[id]"
        options={{
          title: "Report Details",
          href: null, // Users can navigate here, but there's no "button" for it
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notification",
          href: null, // Users can navigate here, but there's no "button" for it
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  megaphoneContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: Platform.OS === "ios" ? 20 : 25,
    width: 70,
    height: 70,
  },
  megaphoneWeb: {
    width: 85,
    height: 85,
    marginTop: 20,
  },
  borderImage: {
    position: "absolute",
    width: 65,
    height: 65,
  },
  borderWeb: {
    width: 80,
    height: 80,
  },
  logoIcon: {
    position: "absolute",
    zIndex: 2,
  },
});
