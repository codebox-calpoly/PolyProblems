import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import type L_Type from "leaflet";

import { ThemedText } from "@/components/themed-text";

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

// Leaflet requires its CSS for correct tile/marker rendering.
const LEAFLET_CSS_ID = "leaflet-css";
function injectLeafletCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById(LEAFLET_CSS_ID)) return;
  const link = document.createElement("link");
  link.id = LEAFLET_CSS_ID;
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
  link.crossOrigin = "";
  document.head.appendChild(link);
}

function LeafletMap({ latitude, longitude }: LocationCoords) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L_Type.Map | null>(null);
  const LRef = useRef<typeof L_Type | null>(null);

  useEffect(() => {
    injectLeafletCSS();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    (async () => {
      // Dynamically import leaflet only in the browser
      if (!LRef.current) {
        const leaflet = await import("leaflet");
        LRef.current = leaflet.default ?? leaflet;
      }
      const L = LRef.current;
      if (cancelled || !containerRef.current) return;

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      if (!mapRef.current) {
        const map = L.map(containerRef.current, {
          center: [latitude, longitude],
          zoom: 16,
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          touchZoom: false,
          keyboard: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map);

        L.marker([latitude, longitude], { icon }).addTo(map);

        mapRef.current = map;
      } else {
        mapRef.current.setView([latitude, longitude], 16);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: 180 }} />;
}

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
        <LeafletMap latitude={value.latitude} longitude={value.longitude} />
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
