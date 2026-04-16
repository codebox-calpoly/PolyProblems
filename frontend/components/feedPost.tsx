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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, feedTabs } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function FeedPost({ reportId }: { reportId: string }) {
  const scheme = useColorScheme();
  const queryClient = useQueryClient();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [numLines, setNumLines] = useState(0);

  const mainScrollRef = useRef<ScrollView>(null);
  const isWeb = Platform.OS === "web";
  const { width: windowWidth } = useWindowDimensions();

  // Adjusted width calculation: screen width minus FeedPost/FeedScene padding
  const cardPadding = 48; // paddingHorizontal: 24 * 2
  const imageWidth = Math.min(windowWidth, 600) - cardPadding;

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
        const { data: signedData, error: signedError } = await supabase.storage
          .from("report-photos")
          .createSignedUrls(report.image_paths, 3600);

        if (signedError) throw signedError;
        signedUrls = signedData.map((item) => item.signedUrl);
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
      return { ...report, imageUrls: signedUrls, userVote };
    },
    enabled: !!reportId, // Only run if we have an ID
    // Set to 5 minutes
    staleTime: 5 * 60 * 1000,

    // Garbage collection time (how long to keep data in memory after component unmounts)
    // Usually good to keep this higher than staleTime
    gcTime: 10 * 60 * 1000,
  });

  // Use reportData instead of the local report state
  const report = reportData;
  const imageUrls = reportData?.imageUrls || [];
  const loading = isLoading;

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
      // Manually update the cache without a network request
      queryClient.setQueryData(["report", reportId], (oldData: any) => {
        if (!oldData) return oldData;

        // Logic: If user clicks the same vote again, it becomes 0 (unvote)
        // Otherwise, it becomes the new type (1 or -1)
        const newVote = oldData.userVote === variables ? 0 : variables;

        // Calculate the score change
        const scoreAdjustment = newVote - oldData.userVote;

        return {
          ...oldData,
          userVote: newVote,
          total_score: (oldData.total_score || 0) + scoreAdjustment,
        };
      });
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
            <View
              key={index}
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
            </View>
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
    unresolved: { label: "Approved", color: "#2D7A53" },
    pending: { label: "Unapproved", color: "#C9922F" },
    rejected: { label: "Rejected", color: "#C95C4B" },
  } as const;
  const normalizedStatus = (report.status || "pending").toLowerCase();
  const statusBadge =
    statusConfig[normalizedStatus as keyof typeof statusConfig] ||
    statusConfig.pending;

  return (
    <View
      style={[
        styles.card,
        { borderBottomColor: theme.line || "rgba(0,0,0,0.1)" },
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
              color={report?.userVote === 1 ? theme.tint : theme.icon}
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
              color={report?.userVote === -1 ? "#FF4500" : theme.icon}
            />
          </TouchableOpacity>
        </View>

        {/* More Menu */}
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.icon} />
        </TouchableOpacity>
      </View>
    </View>
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
});
