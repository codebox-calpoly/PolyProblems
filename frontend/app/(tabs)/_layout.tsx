import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  
  const activeColor = Colors[colorScheme].tabIconSelected; 
  const inactiveColor = Colors[colorScheme].tabIconDefault; 
  const navBackgroundColor = Colors[colorScheme].tabBarBackground;

  const isWeb = Platform.OS === 'web';
  const barHeight = isWeb ? 100 : (Platform.OS === 'ios' ? 90 : 75);
  const iconSize = isWeb ? 32 : 26;
  const fontSize = isWeb ? 14 : 12;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          backgroundColor: navBackgroundColor,
          borderTopWidth: 0,
          elevation: 0, 
          height: barHeight,
          // Reduced padding to allow content to sit lower
          paddingBottom: isWeb ? 5 : (Platform.OS === 'ios' ? 20 : 5),
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: fontSize,
          marginBottom: isWeb ? 10 : 0, // Keeps text from floating too high
        },
        tabBarIconStyle: {
          // Increased margin to push Feed/Profile icons down further
          marginTop: isWeb ? 15 : 12, 
        }
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
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
          title: '', 
          tabBarIcon: () => (
            <View style={[styles.megaphoneContainer, isWeb && styles.megaphoneWeb]}>
              <Image 
                source={require('../../assets/images/reportBorder.png')} 
                style={[styles.borderImage, isWeb && styles.borderWeb]}
                resizeMode="contain"
              />
              <Image 
                source={require('../../assets/images/report.png')} 
                style={[styles.mainIcon, isWeb && styles.iconWeb]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={iconSize} 
              color={focused ? activeColor : inactiveColor} 
            />
          ),
        }}
      />

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
    // Pushing the middle button down further
    marginTop: Platform.OS === 'ios' ? 20 : 25, 
    width: 70,
    height: 70,
  },
  megaphoneWeb: {
    width: 85,
    height: 85,
    marginTop: 20,
  },
  borderImage: {
    position: 'absolute',
    width: 65,
    height: 65,
  },
  borderWeb: {
    width: 80,
    height: 80,
  },
  mainIcon: {
    width: 32,
    height: 32,
    tintColor: 'white', 
  },
  iconWeb: {
    width: 40,
    height: 40,
  }
});