import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, feedTabs } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

export default function FeedPost({ reportId }: { reportId: string }) {
  const scheme = useColorScheme();
  const queryClient = useQueryClient();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  const router = useRouter();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [numLines, setNumLines] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isFullscreenLoading, setIsFullscreenLoading] = useState(false);
  const [isImageRendering, setIsImageRendering] = useState(false);

  const mainScrollRef = useRef<ScrollView>(null);
  const isWeb = Platform.OS === "web";
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Adjusted width calculation: screen width minus FeedPost/FeedScene padding
  const cardPadding = 48; // paddingHorizontal: 24 * 2
  const imageWidth = Math.min(windowWidth, 600) - cardPadding;

  const [menuVisible, setMenuVisible] = useState(false);
  const menuButtonRef = React.useRef<any>(null);
  const [menuTop, setMenuTop] = useState(0);
  const [menuLeft, setMenuLeft] = useState(0);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportStep, setReportStep] = useState<"reason" | "thanks">("reason");
  const [reportReason, setReportReason] = useState<string | null>(null);

  // Add this helper inside FeedPost
  const handleNavigate = () => {
    router.push(`/${reportId}`);
  };

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1. Fetch the report
      const { data: report, error: reportError } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (reportError) throw reportError;
      if (!report) return null;

      // 2. Fetch signed URLs if images exist
      let signedUrls: string[] = [];
      if (report.image_paths?.length > 0) {
        const urls = await Promise.all(
          report.image_paths.map(async (path: string) => {
            const { data, error } = await supabase.storage
              .from("report-photos")
              .createSignedUrl(path, 3600, {
                transform: {
                  width: 600,
                  quality: 70,
                  resize: "contain",
                },
              });
            if (error) throw error;
            return data.signedUrl;
          }),
        );
        signedUrls = urls;
      }

      let userVote = 0;
      if (user) {
        const { data: voteData } = await supabase
          .from("votes")
          .select("vote_type")
          .eq("report_id", reportId)
          .eq("user_id", user.id)
          .maybeSingle();

        userVote = voteData?.vote_type || 0;
      }

      // Return all together
      return { report, imageUrls: signedUrls, userVote };
    },
    enabled: !!reportId, // Only run if we have an ID
    // Set to 5 minutes
    staleTime: 5 * 60 * 1000,

    // Garbage collection time (how long to keep data in memory after component unmounts)
    // Usually good to keep this higher than staleTime
    gcTime: 10 * 60 * 1000,
  });

  // Use reportData instead of the local report state
  const report = reportData?.report;
  const userVote = reportData?.userVote;
  const imageUrls = reportData?.imageUrls || [];
  const loading = isLoading;

  const handleImagePress = async (index: number) => {
    const path = report?.image_paths?.[index];
    if (!path) return;

    setIsFullscreenLoading(true);
    setIsImageRendering(true);

    try {
      // .ensureQueryData checks the cache first.
      // If valid data exists, it returns it instantly.
      // If not, it runs the queryFn.
      const data = await queryClient.ensureQueryData({
        queryKey: ["full-image", path],
        queryFn: async () => {
          const { data, error } = await supabase.storage
            .from("report-photos")
            .createSignedUrl(path, 3600);
          if (error) throw error;
          return data.signedUrl;
        },
      });

      setSelectedImage(data);
    } catch (err) {
      console.error("Error:", err);
      setIsImageRendering(false);
    } finally {
      setIsFullscreenLoading(false);
    }
  };

  const hasNewLines = (report?.description?.match(/\n/g) || []).length >= 2;
  const isTooLong = report?.description?.length > 100;

  const shouldShowToggle = isWeb ? isTooLong || hasNewLines : numLines >= 2;

  const voteMutation = useMutation({
    mutationFn: async (type: 1 | -1) => {
      const { error } = await supabase.rpc("handle_vote", {
        target_report_id: reportId,
        new_vote_type: type,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(["report", reportId], (oldData: any) => {
        if (!oldData) return oldData;

        // 1. Calculate the new vote (flip to 0 if clicking the same button)
        const newVote = oldData.userVote === variables ? 0 : variables;

        // 2. Calculate the difference (e.g., going from -1 to 1 is a +2 change)
        const scoreAdjustment = newVote - (oldData.userVote || 0);

        return {
          ...oldData,
          userVote: newVote, // Updates the "light up" color
          report: {
            ...oldData.report,
            // Update the score INSIDE the report object where it actually lives
            total_score: (oldData.report?.total_score || 0) + scoreAdjustment,
          },
        };
      });
    },
  });

  const postReportMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase.from("post_reports").insert({
        report: reportId,
        type: reason,
        reporter: user.id,
      });

      if (error) throw error;
    },
  });

  // --- RENDERING LOGIC FOR IMAGES ---
  const renderImages = () => {
    if (imageUrls.length === 0) return null;

    // We are removing the "if (imageUrls.length < 3)" block entirely.
    // The ScrollView will now handle 1, 2, or 3+ images.

    return (
      <View style={styles.galleryContainer}>
        {/* Left Arrow - Web Only */}
        {isWeb && activeIndex > 0 && (
          <TouchableOpacity
            style={[styles.webNavButton, styles.webLeftArrow]}
            onPress={() => {
              const prevIndex = activeIndex - 1;
              mainScrollRef.current?.scrollTo({
                x: prevIndex * imageWidth,
                animated: true,
              });
              setActiveIndex(prevIndex);
            }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
        )}

        <ScrollView
          ref={mainScrollRef}
          horizontal
          // Disable scrolling if there is only 1 image
          scrollEnabled={imageUrls.length > 1}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={imageWidth}
          decelerationRate="fast"
          style={{ width: imageWidth }}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const offset = e.nativeEvent.contentOffset.x;
            const newIndex = Math.round(offset / imageWidth);
            if (newIndex !== activeIndex) {
              setActiveIndex(newIndex);
            }
          }}
          // Keep this as a backup for when the scroll fully stops
          onMomentumScrollEnd={(e) =>
            setActiveIndex(
              Math.round(e.nativeEvent.contentOffset.x / imageWidth),
            )
          }
        >
          {imageUrls.map((url, index) => (
            <Pressable
              key={index}
              onPress={() => handleImagePress(index)}
              style={{
                width: imageWidth,
                aspectRatio: 1.5,
                borderRadius: 8,
                overflow: "hidden",
                backgroundColor: theme.background,
              }}
            >
              <Image
                source={{ uri: url }}
                style={styles.image}
                resizeMode="contain"
              />
            </Pressable>
          ))}
        </ScrollView>

        {/* Right Arrow - Web Only */}
        {isWeb && activeIndex < imageUrls.length - 1 && (
          <TouchableOpacity
            style={[styles.webNavButton, styles.webRightArrow]}
            onPress={() => {
              const nextIndex = activeIndex + 1;
              mainScrollRef.current?.scrollTo({
                x: nextIndex * imageWidth,
                animated: true,
              });
              setActiveIndex(nextIndex);
            }}
          >
            <Ionicons name="chevron-forward" size={24} color={theme.text} />
          </TouchableOpacity>
        )}

        {/* --- PAGINATION DOTS --- */}
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
    );
  };

  if (loading)
    return (
      <ActivityIndicator style={{ marginVertical: 30 }} color={theme.tint} />
    );
  if (!report) return null;

  const activeCategoryColor = feedTabs[report.category] || theme.tint;
  const statusConfig = {
    unresolved: { label: "Unresolved", color: "#2D7A53" },
    pending: { label: "Pending Approval", color: "#C9922F" },
    rejected: { label: "Rejected", color: "#C95C4B" },
  } as const;
  const normalizedStatus = (report.status || "pending").toLowerCase();
  const statusBadge =
    statusConfig[normalizedStatus as keyof typeof statusConfig] ||
    statusConfig.pending;

  return (
    <Pressable
      onPress={handleNavigate}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? theme.background + "90" : theme.background,
          borderBottomColor: theme.line || "rgba(0,0,0,0.1)",
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>
          {report.title}
        </Text>
        <Text style={[styles.time, { color: theme.text }]}>
          {new Date(report.created_at).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      {/* Meta */}
      <View style={styles.metaRow}>
        <Text style={[styles.author, { color: theme.icon }]}>
          By {report.username || "Anonymous"}
        </Text>
        <View style={[styles.tag, { backgroundColor: activeCategoryColor }]}>
          <Text style={styles.tagText}>{report.category}</Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}
        >
          <Text style={styles.statusText}>{statusBadge.label}</Text>
        </View>
      </View>

      {/* Image Grid */}
      {renderImages()}

      {/* Description Area: Pressable for better iOS feedback */}
      <View style={styles.descriptionWrapper}>
        <Text
          style={[styles.description, { color: theme.text }]}
          numberOfLines={isExpanded ? undefined : 2}
          onTextLayout={
            isWeb
              ? undefined
              : (e) => {
                  setNumLines(e.nativeEvent.lines.length);
                }
          }
        >
          {report.description}
        </Text>

        {shouldShowToggle && (
          <Pressable
            onPress={() => setIsExpanded(!isExpanded)}
            style={({ pressed }) => [
              styles.togglePressable,
              { opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <Text style={[styles.toggleText, { color: theme.icon }]}>
              {isExpanded ? "See less" : "See more"}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Voting Container */}
        <View
          style={[styles.voteContainer, { backgroundColor: theme.icon + "15" }]}
        >
          <TouchableOpacity
            style={styles.voteButton}
            onPress={() => voteMutation.mutate(1)}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={userVote === 1 ? theme.tint : theme.icon}
            />
          </TouchableOpacity>

          <Text style={[styles.voteScore, { color: theme.text }]}>
            {report.total_score}
          </Text>

          <TouchableOpacity
            style={styles.voteButton}
            onPress={() => voteMutation.mutate(-1)}
          >
            <Ionicons
              name="arrow-down"
              size={18}
              color={userVote === -1 ? "#FF4500" : theme.icon}
            />
          </TouchableOpacity>
        </View>

        <Modal
          visible={!!selectedImage || isFullscreenLoading}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setSelectedImage(null);
            setIsImageRendering(false);
          }}
        >
          <View style={styles.modalBackground}>
            <Pressable
              style={styles.modalCloseArea}
              onPress={() => {
                setSelectedImage(null);
                setIsImageRendering(false);
              }}
            >
              <Ionicons name="close" size={32} color="white" />
            </Pressable>

            {(isFullscreenLoading || isImageRendering) && (
              <View style={styles.absoluteCenter}>
                <ActivityIndicator size="large" color="white" />
              </View>
            )}

            {selectedImage && (
              <ScrollView
                // Important for iOS Zoom
                maximumZoomScale={5}
                minimumZoomScale={1}
                centerContent={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                // Ensuring the ScrollView fills the space
                contentContainerStyle={styles.scrollContent}
              >
                <Image
                  source={{ uri: selectedImage }}
                  style={[
                    styles.fullImage,
                    {
                      width: windowWidth,
                      height: windowHeight,
                      opacity: isImageRendering ? 0 : 1,
                    },
                  ]}
                  resizeMode="contain"
                  onLoad={() => setIsImageRendering(false)}
                />
              </ScrollView>
            )}
          </View>
        </Modal>

        {/* More Menu */}
        <TouchableOpacity
          ref={menuButtonRef}
          onPress={() => {
            menuButtonRef.current?.measure(
              (
                _x: number,
                _y: number,
                btnWidth: number,
                height: number,
                pageX: number,
                pageY: number,
              ) => {
                const dropdownWidth = 180;
                const screenWidth = Dimensions.get("window").width;
                const left = Math.min(
                  pageX - dropdownWidth + btnWidth,
                  screenWidth - dropdownWidth - 16,
                );
                setMenuTop(pageY + height + 4);
                setMenuLeft(Math.max(left, 16));
              },
            );
            setMenuVisible(true);
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.icon} />
        </TouchableOpacity>
      </View>
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={[StyleSheet.absoluteFill, { cursor: "default" } as any]}
          onPress={() => setMenuVisible(false)}
        />
        <View
          style={[
            styles.menuDropdown,
            {
              backgroundColor: theme.background,
              borderColor: theme.line,
              top: menuTop,
              left: menuLeft,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              setReportStep("reason");
              setReportReason(null);
              setReportModalVisible(true);
            }}
          >
            <Ionicons name="flag-outline" size={16} color={theme.text} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>
              Report Post
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={async () => {
              setMenuVisible(false);
              try {
                await await postReportMutation.mutateAsync({
                  reason: "Resolved",
                });
              } catch (err: any) {
                if (err?.code !== "23505") console.error(err); // ignore duplicate
              } finally {
                setReportStep("thanks");
                setReportModalVisible(true);
              }
            }}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={theme.text}
            />
            <Text style={[styles.menuItemText, { color: theme.text }]}>
              Report as Resolved
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.5)" },
          ]}
          onPress={() => setReportModalVisible(false)}
        />
        <Pressable
          style={[
            styles.reportModal,
            { backgroundColor: theme.background, cursor: "default" } as any,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {reportStep === "reason" ? (
            <>
              <Text style={[styles.reportTitle, { color: theme.text }]}>
                Report Post
              </Text>
              <Text style={[styles.reportSubtitle, { color: theme.icon }]}>
                Reason for report
              </Text>
              {(["Inappropriate", "Spam", "Misleading", "Other"] as const).map(
                (reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reportOption,
                      { borderColor: theme.line },
                      reportReason === reason && {
                        borderColor: theme.tint,
                        backgroundColor: theme.tint + "18",
                      },
                    ]}
                    onPress={() => setReportReason(reason)}
                  >
                    <Ionicons
                      name={
                        reportReason === reason
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={18}
                      color={reportReason === reason ? theme.tint : theme.icon}
                    />
                    <Text
                      style={[styles.reportOptionText, { color: theme.text }]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
              <TouchableOpacity
                style={[
                  styles.reportNextButton,
                  {
                    backgroundColor: reportReason ? theme.tint : theme.line,
                  },
                ]}
                disabled={!reportReason}
                onPress={async () => {
                  if (!reportReason) return;
                  try {
                    await postReportMutation.mutateAsync({
                      reason: reportReason,
                    });
                    setReportStep("thanks");
                  } catch (err: any) {
                    // Handle duplicate report gracefully
                    if (err?.code === "23505") {
                      // unique constraint — already reported
                      setReportStep("thanks"); // still show thank you
                    } else {
                      console.error("Report failed:", err);
                    }
                  }
                }}
              >
                {postReportMutation.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.reportNextText}>Next</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={48}
                color={theme.tint}
                style={{ alignSelf: "center", marginBottom: 12 }}
              />
              <Text
                style={[
                  styles.reportTitle,
                  { color: theme.text, textAlign: "center" },
                ]}
              >
                Thank You
              </Text>
              <Text
                style={[
                  styles.reportSubtitle,
                  { color: theme.icon, textAlign: "center", marginBottom: 24 },
                ]}
              >
                A moderator will review your report shortly.
              </Text>
              <TouchableOpacity
                style={[
                  styles.reportNextButton,
                  { backgroundColor: theme.tint },
                ]}
                onPress={() => setReportModalVisible(false)}
              >
                <Text style={styles.reportNextText}>Done</Text>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Modal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 19,
    fontFamily: Fonts.heading,
    fontWeight: "700",
    lineHeight: 24,
  },
  time: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 8,
  },
  author: {
    fontSize: 13,
    fontFamily: Fonts.body,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusText: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  galleryContainer: {
    marginVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  webNavButton: {
    position: "absolute",
    zIndex: 10,
    borderRadius: 20,
    padding: 4,
  },
  webLeftArrow: { left: 10 },
  webRightArrow: { right: 10 },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12, // Space between image and dots
    gap: 8, // Space between individual dots
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },

  descriptionWrapper: {
    marginBottom: 22,
  },
  description: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  togglePressable: {
    marginTop: 6,
    alignSelf: "flex-start",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  voteContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  voteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  voteScore: {
    fontSize: 14,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
    fontFamily: Fonts.heading,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseArea: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 20,
    padding: 10,
  },
  fullImage: {
    width: "100%",
    height: "80%",
  },
  absoluteCenter: {
    position: "absolute",
    zIndex: 10,
  },
  scrollContent: {
    // Flex grow ensures it fills the ScrollView even if the image is small
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  menuDropdown: {
    position: "absolute",
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 180,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    cursor: "pointer",
  } as any,
  menuItemText: {
    fontSize: 13,
    fontFamily: Fonts.body,
  },
  reportModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
  },
  reportTitle: {
    fontSize: 18,
    fontFamily: Fonts.heading,
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.body,
    marginBottom: 16,
  },
  reportOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  reportOptionText: {
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  reportNextButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  reportNextText: {
    color: "white",
    fontSize: 15,
    fontFamily: Fonts.heading,
  },
});
