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
import LocationPreview from "./Location";
import { ThemedText } from "@/components/themed-text";
import { Fonts } from "@/constants/theme";

/** Latitude / longitude pair returned to parent components. */
export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface LocationTaggingProps {
  /** Current location value (controlled). `null` means no location attached. */
  value?: LocationCoords | null;
  /** Called whenever the location changes – either coords or `null`. */
  onChange: (location: LocationCoords | null) => void;
}

type Status =
  | "idle"
  | "loading"
  | "attached"
  | "denied"
  | "unavailable"
  | "error";

/**
 * Reusable location-tagging component.
 *
 * - Location tagging is **disabled by default**.
 * - Permission is requested **only** when the user opts in.
 * - Disabling clears the stored location immediately.
 * - Communicates location data (or `null`) to the parent via `onChange`.
 */
export function LocationTagging({
  value = null,
  onChange,
}: LocationTaggingProps) {
  const colorScheme = useColorScheme();

  const [status, setStatus] = useState<Status>(value ? "attached" : "idle");

  /** Enable location tagging: request permission → fetch coords → notify parent. */
  const enableTagging = useCallback(async () => {
    setStatus("loading");

    try {
      // 1. Check / request foreground permission
      const { status: permStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (permStatus !== "granted") {
        setStatus("denied");
        onChange(null);
        return;
      }

      // 2. Check whether location services are enabled on the device
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setStatus("unavailable");
        onChange(null);
        return;
      }

      // 3. Fetch current position
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

  /** Disable location tagging and immediately clear data. */
  const disableTagging = useCallback(() => {
    setStatus("idle");
    onChange(null);
  }, [onChange]);

  // ─── Derived UI helpers ──────────────────────────────────────────────

  const isAttached = status === "attached" && value != null;
  const isLoading = status === "loading";
  const hasWarning =
    status === "denied" || status === "unavailable" || status === "error";

  const warningMessage: Record<string, string> = {
    denied: "Location permission was denied. You can enable it in Settings.",
    unavailable: "Location services are turned off on this device.",
    error: "Unable to retrieve your location. Please try again.",
  };

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <View
      style={[
        styles.wrapper,
        { borderColor: colorScheme === "dark" ? "#444" : "#E0E0E0" },
      ]}
    >
      {/* ── Map preview (only when a location is attached) ───────────── */}
      {isAttached && value && <LocationPreview value={value} />}

      {/* ── Status bar ────────────────────────────────────────────────── */}
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

        {/* Toggle button */}
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : isAttached ? (
          <Pressable
            onPress={disableTagging}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            accessibilityLabel="Remove location"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={24} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={enableTagging}
            hitSlop={8}
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

      {/* ── Warning / error message ───────────────────────────────────── */}
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
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
    fontFamily: Fonts.body,
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
    fontFamily: Fonts.heading,
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
    fontFamily: Fonts.body,
    flex: 1,
  },
});
