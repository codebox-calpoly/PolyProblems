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
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Fonts } from "@/constants/theme";
import LocationPreview from "@/components/Location";
import { LocationCoords } from "@/components/LocationTagging";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const { width } = Dimensions.get("window");

const isWeb = Platform.OS === "web";
const MAX_CONTENT_WIDTH = 800;
const displayWidth = isWeb ? Math.min(width, MAX_CONTENT_WIDTH) : width;
const imageWidth = isWeb ? displayWidth - 80 : width - 40;

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams();
  const reportId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const modalScrollRef = useRef<ScrollView>(null);
  const styles = reportStyles(theme);
  const mainScrollRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: ["report", reportId],
    enabled: !!reportId,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data: report, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
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

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ["is-admin", user?.id], // Dependent on user ID
    enabled: !!user?.id, // Only run once user is found
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return roleData?.role === "admin";
    },
  });

  const showMessage = (title: string, message?: string) => {
    if (Platform.OS === "web") {
      window.alert(message ? `${title}\n\n${message}` : title);
      return;
    }

    Alert.alert(title, message);
  };

  const updateReportStatus = useMutation({
    mutationFn: async ({
      status,
      reason,
    }: {
      status: "unresolved" | "rejected" | "resolved";
      reason: string | null;
    }) => {
      const { error } = await supabase
        .from("reports")
        .update({
          status,
          rejection_reason: reason,
        })
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: async (_data, variables) => {
      queryClient.setQueryData(["report", reportId], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          report: {
            ...oldData.report,
            status: variables.status,
            rejection_reason: variables.reason,
          },
        };
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["report", reportId] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["user-reports"] }),
      ]);
    },
    onError: (error: any) => {
      showMessage(
        "Update Failed",
        error?.message || "Unable to update the report right now.",
      );
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
  const statusConfig = {
    unresolved: { label: "Unresolved", color: "#2D7A53" },
    pending: { label: "Pending Approval", color: "#C9922F" },
    rejected: { label: "Rejected", color: "#C95C4B" },
    resolved: { label: "Resolved", color: "#2E86C1" },
  } as const;
  const normalizedStatus = (report?.status || "pending").toLowerCase();
  const statusBadge =
    statusConfig[normalizedStatus as keyof typeof statusConfig] ||
    statusConfig.pending;
  const isResolved = normalizedStatus === "resolved";
  const isApproved = normalizedStatus === "unresolved";
  const isRejected = normalizedStatus === "rejected";
  const isOwner = user?.id === report?.user_id;
  const showUserResolveButton = isOwner && !(isRejected || isResolved);

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

  const handleApprove = async (isUserAction: boolean = false) => {
    // If the user/owner clicks it, it ALWAYS goes to resolved (from pending or unresolved)
    // If the admin clicks it, it toggles between unresolved and resolved
    let nextStatus: "resolved" | "unresolved" = "resolved";

    if (!isUserAction) {
      nextStatus = isApproved ? "resolved" : "unresolved";
    }

    await updateReportStatus.mutateAsync({
      status: nextStatus,
      reason: null,
    });

    // Dynamic success message
    let successMsg = "";
    if (isUserAction) {
      successMsg = "You have marked your report as resolved.";
    } else {
      successMsg = isApproved
        ? "The report has been marked as resolved."
        : "The report has been approved and is now unresolved.";
    }

    showMessage("Status Updated", successMsg);
  };

  const handleReject = async () => {
    const trimmedReason = rejectionReason.trim();

    if (!trimmedReason) {
      showMessage(
        "Rejection Reason Required",
        "Please enter a rejection reason.",
      );
      return;
    }

    await updateReportStatus.mutateAsync({
      status: "rejected",
      reason: trimmedReason,
    });
    setIsRejectModalVisible(false);
    setRejectionReason("");
    showMessage("Report Rejected", "The rejection reason was saved.");
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
            style={[
              styles.statusBadge,
              { backgroundColor: statusBadge.color + "15" },
            ]}
          >
            <View
              style={[styles.dot, { backgroundColor: statusBadge.color }]}
            />
            <ThemedText
              style={[styles.statusText, { color: statusBadge.color }]}
            >
              {statusBadge.label.toUpperCase()}
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

          {isAdmin && !isAdminLoading && (
            <View style={styles.adminActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isRejected || isResolved
                    ? styles.inactiveActionButton
                    : styles.approveButton,
                  isApproved && styles.activeApproveButton,
                  updateReportStatus.isPending && styles.actionButtonDisabled,
                ]}
                onPress={() => handleApprove(false)}
                disabled={
                  updateReportStatus.isPending || isResolved || isRejected
                }
              >
                <ThemedText style={styles.actionButtonText}>
                  {updateReportStatus.isPending
                    ? "Updating..."
                    : isApproved
                      ? "Mark as Resolved"
                      : isResolved
                        ? "Resolved"
                        : "Approve"}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isApproved
                    ? styles.inactiveActionButton
                    : styles.rejectButton,
                  isRejected && styles.activeRejectButton,
                  updateReportStatus.isPending && styles.actionButtonDisabled,
                ]}
                onPress={() => {
                  setRejectionReason(report?.rejection_reason || "");
                  setIsRejectModalVisible(true);
                }}
                disabled={updateReportStatus.isPending}
              >
                <ThemedText style={styles.actionButtonText}>
                  {isRejected ? "Rejected" : "Reject"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* User-Owner Action: Resolve Button */}
          {showUserResolveButton && (
            <View style={styles.adminActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.approveButton,
                  updateReportStatus.isPending && styles.actionButtonDisabled,
                ]}
                onPress={() => handleApprove(true)}
                disabled={updateReportStatus.isPending}
              >
                <ThemedText style={styles.actionButtonText}>
                  {updateReportStatus.isPending
                    ? "Updating..."
                    : "Mark as Resolved"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

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

          {!!report?.rejection_reason && (
            <View
              style={[
                styles.rejectionCard,
                {
                  borderColor: theme.icon + "20",
                  backgroundColor: "#C95C4B12",
                },
              ]}
            >
              <ThemedText style={styles.label}>Rejection Reason</ThemedText>
              <ThemedText style={styles.rejectionText}>
                {report.rejection_reason}
              </ThemedText>
            </View>
          )}

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

      <Modal
        visible={isRejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRejectModalVisible(false)}
      >
        <View style={styles.rejectModalBackdrop}>
          <View
            style={[
              styles.rejectModalCard,
              {
                backgroundColor: theme.background,
                borderColor: theme.icon + "20",
              },
            ]}
          >
            <ThemedText style={styles.rejectModalTitle}>
              Reject Report
            </ThemedText>
            <ThemedText style={styles.rejectModalSubtitle}>
              Add a reason that will be saved to the report.
            </ThemedText>
            <TextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter rejection reason"
              placeholderTextColor={theme.icon}
              multiline
              style={[
                styles.rejectInput,
                {
                  color: theme.text,
                  borderColor: theme.icon + "30",
                },
              ]}
              textAlignVertical="top"
            />
            <View style={styles.rejectModalActions}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.cancelButton]}
                onPress={() => setIsRejectModalVisible(false)}
                disabled={updateReportStatus.isPending}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalActionButton,
                  styles.confirmRejectButton,
                  updateReportStatus.isPending && styles.actionButtonDisabled,
                ]}
                onPress={handleReject}
                disabled={updateReportStatus.isPending}
              >
                <ThemedText style={styles.actionButtonText}>
                  {updateReportStatus.isPending ? "Saving..." : "Reject"}
                </ThemedText>
              </TouchableOpacity>
            </View>
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
    adminActions: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 20,
    },
    actionButton: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    approveButton: {
      backgroundColor: "#2D7A53",
    },
    rejectButton: {
      backgroundColor: "#C95C4B",
    },
    activeApproveButton: {
      backgroundColor: "#1F6A46",
      borderWidth: 2,
      borderColor: "#174F35",
    },
    activeRejectButton: {
      backgroundColor: "#B44636",
      borderWidth: 2,
      borderColor: "#8F3428",
    },
    inactiveActionButton: {
      backgroundColor: "#B8B8B8",
    },
    actionButtonText: {
      color: "#FFFFFF",
      fontFamily: Fonts.heading,
      fontSize: 16,
    },
    actionButtonDisabled: {
      opacity: 0.6,
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
    rejectionCard: {
      marginTop: 20,
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
    },
    rejectionText: {
      fontSize: 15,
      lineHeight: 22,
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
    rejectModalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    rejectModalCard: {
      borderRadius: 24,
      borderWidth: 1,
      padding: 20,
    },
    rejectModalTitle: {
      fontSize: 22,
      fontFamily: Fonts.heading,
      marginBottom: 8,
    },
    rejectModalSubtitle: {
      fontSize: 14,
      opacity: 0.7,
      marginBottom: 16,
    },
    rejectInput: {
      minHeight: 120,
      borderWidth: 1,
      borderRadius: 18,
      padding: 16,
      fontSize: 15,
      marginBottom: 16,
    },
    rejectModalActions: {
      flexDirection: "row",
      gap: 12,
    },
    modalActionButton: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
    },
    cancelButton: {
      backgroundColor: "#E7E7E7",
    },
    cancelButtonText: {
      color: "#222222",
      fontFamily: Fonts.heading,
      fontSize: 16,
    },
    confirmRejectButton: {
      backgroundColor: "#C95C4B",
    },
  });
