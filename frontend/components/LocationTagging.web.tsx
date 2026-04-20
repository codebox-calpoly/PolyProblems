import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import LocationPreview from "./Location.web";
import { ThemedText } from "@/components/themed-text";

/** Latitude / longitude pair returned to parent components. */
export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface LocationTaggingProps {
  value?: LocationCoords | null;
  onChange: (location: LocationCoords | null) => void;
}

type Status =
  | "idle"
  | "loading"
  | "attached"
  | "denied"
  | "unavailable"
  | "error";

export function LocationTagging({
  value = null,
  onChange,
}: LocationTaggingProps) {
  const colorScheme = useColorScheme();

  const [status, setStatus] = useState<Status>(value ? "attached" : "idle");

  const enableTagging = useCallback(async () => {
    setStatus("loading");

    try {
      const { status: permStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (permStatus !== "granted") {
        setStatus("denied");
        onChange(null);
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setStatus("unavailable");
        onChange(null);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: LocationCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setStatus("attached");
      onChange(coords);
    } catch {
      setStatus("error");
      onChange(null);
    }
  }, [onChange]);

  const disableTagging = useCallback(() => {
    setStatus("idle");
    onChange(null);
  }, [onChange]);

  const isAttached = status === "attached" && value != null;
  const isLoading = status === "loading";
  const hasWarning =
    status === "denied" || status === "unavailable" || status === "error";

  const warningMessage: Record<string, string> = {
    denied:
      "Location permission was denied. You can enable it in your browser settings.",
    unavailable: "Location services are turned off on this device.",
    error: "Unable to retrieve your location. Please try again.",
  };

  return (
    <View
      style={[
        styles.wrapper,
        { borderColor: colorScheme === "dark" ? "#444" : "#E0E0E0" },
      ]}
    >
      {isAttached && value && (
        <View style={styles.map}>
          <LocationPreview value={value} />
        </View>
      )}

      <View style={styles.bar}>
        <View style={styles.barLeft}>
          <Ionicons
            name={isAttached ? "location" : "location-outline"}
            size={20}
            color="#fff"
          />
          <ThemedText style={styles.barText}>
            {isLoading
              ? "Getting location…"
              : isAttached
                ? "Location attached"
                : "Add location"}
          </ThemedText>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : isAttached ? (
          <Pressable
            onPress={disableTagging}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            accessibilityLabel="Remove location"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={24} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={enableTagging}
            style={({ pressed }) => [
              styles.attachButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            accessibilityLabel="Attach location"
            accessibilityRole="button"
          >
            <ThemedText style={styles.attachButtonText}>
              {hasWarning ? "Retry" : "Enable"}
            </ThemedText>
          </Pressable>
        )}
      </View>

      {hasWarning && (
        <View style={styles.warning}>
          <Ionicons name="alert-circle-outline" size={16} color="#B85C00" />
          <ThemedText style={styles.warningText}>
            {warningMessage[status]}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
  },
  map: {
    width: "100%",
    height: 250,
  },
  bar: {
    backgroundColor: "#2D4635",
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  barLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  attachButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  attachButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFF7ED",
  },
  warningText: {
    color: "#B85C00",
    fontSize: 13,
    flex: 1,
  },
});
