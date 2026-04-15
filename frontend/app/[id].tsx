import React, { useEffect, useState, useRef } from "react";
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
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Fonts } from "@/constants/theme";
import LocationPreview from "@/components/Location";
import { LocationCoords } from "@/components/LocationTagging";
import { useQuery } from "@tanstack/react-query";

const { width } = Dimensions.get("window");

const isWeb = Platform.OS === "web";
const MAX_CONTENT_WIDTH = 800;
const displayWidth = isWeb ? Math.min(width, MAX_CONTENT_WIDTH) : width;
const imageWidth = isWeb ? displayWidth - 80 : width - 40;

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const modalScrollRef = useRef<ScrollView>(null);
  const styles = reportStyles(theme);
  const mainScrollRef = useRef<ScrollView>(null);

  const {
    data,
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: ["report", id],
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data: report, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();

      // Just throw the error here
      if (error || !report) throw new Error("NOT_FOUND");

      let urls: string[] = [];
      if (report.image_paths?.length > 0) {
        const { data: signedData } = await supabase.storage
          .from("report-photos")
          .createSignedUrls(report.image_paths, 3600);
        if (signedData) urls = signedData.map((item) => item.signedUrl);
      }

      const coords = report.location
        ? {
            latitude: report.location.latitude,
            longitude: report.location.longitude,
          }
        : null;

      return {
        report,
        imageUrls: urls,
        location: coords,
      };
    },
  });

  // Handle the side effect (Alert/Back) here, OUTSIDE the fetcher
  useEffect(() => {
    if (isError) {
      const msg = "Report not found";
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("Error", msg);
      }
      router.back();
    }
  }, [isError, router]);

  // Destructure for easy use in your JSX
  const report = data?.report;
  const imageUrls = data?.imageUrls || [];
  const location: LocationCoords | null = data?.location ?? null;

  useEffect(() => {
    if (isModalVisible) {
      const timer = setTimeout(() => {
        modalScrollRef.current?.scrollTo({
          x: viewerIndex * width,
          animated: false,
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isModalVisible, viewerIndex]);

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setIsModalVisible(true);
  };

  const scrollToIndex = (index: number) => {
    if (index < 0 || index >= imageUrls.length) return;
    setViewerIndex(index);
    modalScrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleScroll = (e: any) => {
    const xOffset = e.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / width);
    if (index !== viewerIndex && index >= 0 && index < imageUrls.length) {
      setViewerIndex(index);
    }
  };

  if (loading)
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );

  return (
    <ThemedView style={[styles.safe, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerIcon}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Report Details</ThemedText>
          <View style={{ width: 44 }} />
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

          {/* Details Card with Location Restored */}
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

          {/* Main Gallery */}
          <View style={styles.imageSection}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.label}>Attached Images</ThemedText>
              {imageUrls.length > 1 && (
                <ThemedText style={styles.imageCount}>
                  {activeIndex + 1} of {imageUrls.length}
                </ThemedText>
              )}
            </View>

            <View style={styles.galleryContainer}>
              {/* Left Arrow - Web Only */}
              {isWeb && activeIndex > 0 && (
                <TouchableOpacity
                  style={[styles.webNavButton, styles.webLeftArrow]}
                  onPress={() => {
                    const prevIndex = activeIndex - 1;
                    // 1. Move the scrollview
                    mainScrollRef.current?.scrollTo({
                      x: prevIndex * imageWidth,
                      animated: true,
                    });
                    // 2. Update the dots/count immediately
                    setActiveIndex(prevIndex);
                  }}
                >
                  <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
              )}

              <ScrollView
                ref={mainScrollRef} // Add a ref here
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                style={[{ width: imageWidth }]}
                scrollEventThrottle={16}
                onScroll={(e) => {
                  const offset = e.nativeEvent.contentOffset.x;
                  const newIndex = Math.round(offset / imageWidth);
                  if (newIndex !== activeIndex) {
                    setActiveIndex(newIndex);
                  }
                }}
                onMomentumScrollEnd={(e) =>
                  setActiveIndex(
                    Math.round(e.nativeEvent.contentOffset.x / imageWidth),
                  )
                }
              >
                {imageUrls.map((url, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openViewer(index)}
                    style={styles.imageWrapper}
                  >
                    <Image
                      source={{ uri: url }}
                      style={styles.evidenceImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Right Arrow - Web Only */}
              {isWeb && activeIndex < imageUrls.length - 1 && (
                <TouchableOpacity
                  style={[styles.webNavButton, styles.webRightArrow]}
                  onPress={() => {
                    const nextIndex = activeIndex + 1;
                    // 1. Move the scrollview
                    mainScrollRef.current?.scrollTo({
                      x: nextIndex * imageWidth,
                      animated: true,
                    });
                    // 2. Update the dots/count immediately
                    setActiveIndex(nextIndex);
                  }}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={theme.text}
                  />
                </TouchableOpacity>
              )}
            </View>

            {imageUrls.length > 1 && (
              <View style={styles.paginationContainer}>
                {imageUrls.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.paginationDot,
                      {
                        backgroundColor:
                          i === activeIndex ? theme.tint : theme.icon + "30",
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* MODAL SECTION */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalHeaderContainer}>
            <ThemedText style={styles.modalCount}>
              {viewerIndex + 1} / {imageUrls.length}
            </ThemedText>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={styles.closeButton}
              hitSlop={20}
            >
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalMainContainer}>
            <ScrollView
              ref={modalScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              onMomentumScrollEnd={handleScroll}
              scrollEventThrottle={16}
            >
              {imageUrls.map((url, index) => (
                <View key={index} style={styles.fullImageWrapper}>
                  <Image
                    source={{ uri: url }}
                    style={styles.fullImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>

            {/* Navigation Buttons */}
            {viewerIndex > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.leftButton]}
                onPress={() => scrollToIndex(viewerIndex - 1)}
              >
                <Ionicons name="chevron-back" size={36} color="#FFF" />
              </TouchableOpacity>
            )}
            {viewerIndex < imageUrls.length - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.rightButton]}
                onPress={() => scrollToIndex(viewerIndex + 1)}
              >
                <Ionicons name="chevron-forward" size={36} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const reportStyles = (theme: { background: string }) =>
  StyleSheet.create({
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
      height: 60,
    },
    headerIcon: {
      width: 44,
      height: 44,
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: Fonts.heading,
    },
    scrollContent: {
      padding: 20,
      alignSelf: "center", // Centers the content on web
      width: "100%",
      maxWidth: MAX_CONTENT_WIDTH,
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
      fontSize: 28,
      marginBottom: 5,
      fontWeight: "700",
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
      backgroundColor: "rgba(150,150,150,0.05)",
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
      marginBottom: 10,
    },
    divider: {
      height: 1,
      backgroundColor: "rgba(150,150,150,0.1)",
      marginVertical: 15,
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
    galleryContainer: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    webNavButton: {
      position: "absolute",
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.background + "CC", // Semi-transparent background
      justifyContent: "center",
      alignItems: "center",
      // Standard web shadow
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
    webLeftArrow: {
      left: -20, // Hangs slightly off the image
    },
    webRightArrow: {
      right: -20,
    },
    imageWrapper: {
      width: imageWidth,
    },
    evidenceImage: {
      width: "100%",
      height: isWeb ? 500 : 300,
      borderRadius: 20,
      backgroundColor: theme.background,
    },
    paginationContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 15,
    },
    paginationDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginHorizontal: 4,
    },

    modalBackground: {
      flex: 1,
      backgroundColor: "#000",
    },
    modalHeaderContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      marginTop: Platform.OS === "web" ? 20 : Platform.OS === "ios" ? 60 : 40,
      height: 50,
      zIndex: 20,
    },
    modalCount: {
      color: "#FFF",
      fontSize: 17,
      fontWeight: "600",
    },
    closeButton: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 22,
    },
    modalMainContainer: {
      flex: 1,
      position: "relative",
    },
    fullImageWrapper: {
      width: width,
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    fullImage: {
      width: "100%",
      height: "80%",
    },
    navButton: {
      position: "absolute",
      top: "50%",
      transform: [{ translateY: -25 }],
      backgroundColor: "rgba(0,0,0,0.4)",
      borderRadius: 25,
      width: 50,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 100,
    },
    leftButton: {
      left: 20,
    },
    rightButton: {
      right: 20,
    },
  });
