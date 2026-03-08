import React from "react";
import { View, Text } from "react-native";
import { Fonts } from "@/constants/theme";

export default function CameraScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 20, fontFamily: Fonts.body }}>Camera</Text>
    </View>
  );
}
