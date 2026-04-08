import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  View,
  Alert,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Fonts } from "@/constants/theme";
import LocationPreview from "@/components/Location";
import { LocationCoords } from "@/components/LocationTagging";

const { width } = Dimensions.get("window");

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;

  const [report, setReport] = useState<any>(null);
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) {
          Alert.alert("Error", "Report not found");
          router.back();
          return;
        }

        setReport(data);

        if (data.image_paths && data.image_paths.length > 0) {
          const { data: signedData } = await supabase.storage
            .from("report-photos")
            .createSignedUrls(data.image_paths, 3600);
          if (signedData) {
            setImageUrls(signedData.map((item) => item.signedUrl));
          }
        }

        if (data && data.location) {
          const coords: LocationCoords = {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          };
          setLocation(coords);
        }
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReport();
  }, [id, router]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.safe, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Report Details</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Badge */}
          <View
            style={[styles.statusBadge, { backgroundColor: theme.tint + "15" }]}
          >
            <View style={[styles.dot, { backgroundColor: theme.tint }]} />
            <ThemedText style={[styles.statusText, { color: theme.tint }]}>
              {report?.status?.toUpperCase() || "PENDING"}
            </ThemedText>
          </View>

          <ThemedText type="title" style={styles.mainTitle}>
            {report?.title || "Issue Report"}
          </ThemedText>

          <ThemedText style={styles.dateText}>
            Reported on{" "}
            {report?.created_at
              ? new Date(report.created_at).toLocaleDateString()
              : "..."}
          </ThemedText>

          {/* Details Card */}
          <View style={[styles.card, { borderColor: theme.icon + "20" }]}>
            <ThemedText style={styles.label}>Description</ThemedText>
            <ThemedText style={styles.description}>
              {report?.description}
            </ThemedText>
            <View style={styles.divider} />
            <ThemedText style={styles.label}>Location Details</ThemedText>
            {location ? (
              <View style={styles.mapWrapper}>
                {location && <LocationPreview value={location} />}
              </View>
            ) : (
              <View style={styles.locationRow}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: theme.tint + "20" },
                  ]}
                >
                  <Ionicons name="navigate" size={18} color={theme.tint} />
                </View>
                <ThemedText style={styles.locationValue}>
                  Location not shared.
                </ThemedText>
              </View>
            )}
          </View>

          {/* Secure Evidence Gallery */}
          <View style={styles.imageSection}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.label}>Attached Images</ThemedText>
              {imageUrls.length > 1 && (
                <ThemedText style={styles.imageCount}>
                  {activeIndex + 1} of {imageUrls.length}
                </ThemedText>
              )}
            </View>

            {imageUrls.length > 0 ? (
              <View>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={(e) => {
                    const contentOffset = e.nativeEvent.contentOffset.x;
                    const index = Math.round(contentOffset / (width - 40));
                    setActiveIndex(index);
                  }}
                  scrollEventThrottle={16}
                  style={styles.imageScroll}
                >
                  {imageUrls.map((url, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image
                        source={{ uri: url }}
                        style={styles.evidenceImage}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </ScrollView>

                {/* Pagination Dots */}
                {imageUrls.length > 1 && (
                  <View style={styles.paginationContainer}>
                    {imageUrls.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.paginationDot,
                          {
                            backgroundColor:
                              i === activeIndex
                                ? theme.tint
                                : theme.icon + "30",
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons
                  name="lock-closed-outline"
                  size={48}
                  color={theme.icon + "40"}
                />
                <ThemedText style={{ color: theme.icon + "60", marginTop: 10 }}>
                  No photos attached
                </ThemedText>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.heading,
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 15,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  mainTitle: {
    fontSize: 30,
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    opacity: 0.5,
    marginBottom: 25,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: "rgba(150, 150, 150, 0.05)",
  },
  label: {
    fontSize: 11,
    textTransform: "uppercase",
    opacity: 0.5,
    fontWeight: "bold",
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  imageCount: {
    fontSize: 12,
    opacity: 0.6,
    fontWeight: "600",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(150, 150, 150, 0.1)",
    marginVertical: 20,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mapWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    height: 250,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locationValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  imageSection: {
    marginTop: 30,
    marginBottom: 40,
  },
  imageScroll: {
    marginTop: 10,
  },
  imageWrapper: {
    width: width - 40,
    paddingRight: 10,
  },
  evidenceImage: {
    width: "100%",
    height: 300,
    borderRadius: 24,
    backgroundColor: "#000",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  placeholderImage: {
    height: 200,
    borderRadius: 24,
    backgroundColor: "rgba(150,150,150,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
});
