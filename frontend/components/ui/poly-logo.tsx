import React from 'react';
import LandingLogo from "@/assets/images/landinglogo.svg";

import { StyleSheet, ViewStyle } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { useThemeColor } from "@/hooks/use-theme-color";

type PolyLogoProps = {
  size?: number;
  color?: string; 
};

export default function PolyLogo({
    size = 56,
    color,
}: PolyLogoProps) {

    const themeTextColor = useThemeColor({}, "text");
    const finalColor = color ?? themeTextColor;

    return (
    <ThemedView style={styles.header}>
        <LandingLogo color={finalColor} />
        <ThemedText type="title" style={{ color: finalColor }}>
          Poly Problems
        </ThemedText>
      </ThemedView>
    )
    }


const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
});
