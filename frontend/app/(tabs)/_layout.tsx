import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  // Design constants based on your screenshots
  const activeColor = '#000000'; 
  const inactiveColor = '#A1A1A1'; 

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 0, 
          height: Platform.OS === 'ios' ? 90 : 75,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 12,
        },
      }}>
      
      {/* 1. FEED PAGE */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "view-dashboard" : "view-dashboard-outline"} 
              size={28} 
              color={focused ? activeColor : inactiveColor} 
            />
          ),
        }}
      />

      {/* 2. REPORT FORM (Layered PNG Assets) */}
      <Tabs.Screen
        name="reportform"
        options={{
          title: '', 
          tabBarIcon: () => (
            <View style={styles.megaphoneContainer}>
              {/* The Circular Green Border Background */}
              <Image 
                source={require('../../assets/images/reportBorder.png')} 
                style={styles.borderImage}
                resizeMode="contain"
              />
              {/* The Megaphone Icon sitting on top */}
              <Image 
                source={require('../../assets/images/report.png')} 
                style={styles.mainIcon}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />

      {/* 3. PROFILE PAGE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={28} 
              color={focused ? activeColor : inactiveColor} 
            />
          ),
        }}
      />

      {/* Hidden Screens */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="camera" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="BeforeCont" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  megaphoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // Lifts the button so it sits higher than the taskbar line
    marginTop: Platform.OS === 'ios' ? -30 : -25,
    width: 70,
    height: 70,
  },
  borderImage: {
    position: 'absolute',
    width: 65,
    height: 65,
  },
  mainIcon: {
    width: 30,
    height: 30,
    // Note: If your report.png is already white, you can remove tintColor
    tintColor: 'white', 
  },
});