import { supabase } from "@/lib/supabase";
import { Colors, Fonts } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";

const TINT = "#174735";
const COMMENTS_PAGE_SIZE = 10;

type Tab = "pending" | "post_reports" | "comment_reports" | "comments";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "pending", label: "Pending", icon: "time-outline" },
  { key: "post_reports", label: "Post Reports", icon: "flag-outline" },
  {
    key: "comment_reports",
    label: "Comment Reports",
    icon: "chatbubble-outline",
  },
  { key: "comments", label: "Comments", icon: "chatbubbles-outline" },
];

const STATUS_COLORS: Record<string, string> = {
  unresolved: "#2D7A53",
  pending: "#C9922F",
  rejected: "#C95C4B",
  resolved: "#2E86C1",
};

const REASON_COLORS: Record<string, string> = {
  Inappropriate: "#C95C4B",
  Spam: "#C9922F",
  Misleading: "#9B6BB5",
  Other: "#6B7280",
  Resolved: "#2D7A53",
};

export default function AdminPage() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  const styles = makeStyles(theme);

  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [commentsPage, setCommentsPage] = useState(1);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // --- Pending Reports ---
  const {
    data: pendingReports = [],
    isLoading: loadingPending,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ["admin-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(
          "id, title, description, category, created_at, status, profiles!reports_user_id_fkey(username)",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // --- Post Reports ---
  const {
    data: postReports = [],
    isLoading: loadingPostReports,
    refetch: refetchPostReports,
  } = useQuery({
    queryKey: ["admin-post-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_reports")
        .select(
          `
            id, created_at, type, report, reporter,
            reports!post_reports_report_fkey(title, category, profiles!reports_user_id_fkey(username)),
            profiles!post_reports_reporter_fkey(username)
          `,
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // --- Comment Reports ---
  const {
    data: commentReports = [],
    isLoading: loadingCommentReports,
    refetch: refetchCommentReports,
  } = useQuery({
    queryKey: ["admin-comment-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comment_reports")
        .select(
          `
            id, created_at, type, comment, reporter,
            comments!comment_reports_comment_fkey(content, report_id, profiles!comments_user_id_fkey(username)),
            profiles!comment_reports_reporter_fkey(username)
          `,
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // --- Comments (paginated) ---
  const fetchComments = useCallback(
    async (page: number, reset = false) => {
      if (loadingMore) return;
      setLoadingMore(true);
      const from = (page - 1) * COMMENTS_PAGE_SIZE;
      const to = from + COMMENTS_PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("comments")
        .select(
          "id, created_at, content, report_id, parent_id, profiles!comments_user_id_fkey(username)",
        )
        .order("created_at", { ascending: false })
        .range(from, to);
      setLoadingMore(false);
      if (error) return;
      if (!data || data.length < COMMENTS_PAGE_SIZE) setHasMoreComments(false);
      if (reset) {
        setAllComments(data || []);
      } else {
        setAllComments((prev) => [...prev, ...(data || [])]);
      }
    },
    [loadingMore],
  );

  useFocusEffect(
    useCallback(() => {
      refetchPending();
      refetchPostReports();
      refetchCommentReports();
      setCommentsPage(1);
      setHasMoreComments(true);
      fetchComments(1, true);
    }, []),
  );

  const loadMoreComments = () => {
    if (!hasMoreComments || loadingMore) return;
    const next = commentsPage + 1;
    setCommentsPage(next);
    fetchComments(next);
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const isLoading =
    loadingPending || loadingPostReports || loadingCommentReports;

  const counts: Record<Tab, number> = {
    pending: pendingReports.length,
    post_reports: postReports.length,
    comment_reports: commentReports.length,
    comments: allComments.length,
  };

  // --- Render helpers ---
  const renderPendingItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.card, { borderColor: theme.line }]}
      onPress={() => router.push(`/${item.id}`)}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.categoryDot,
            { backgroundColor: STATUS_COLORS["pending"] },
          ]}
        />
        <Text
          style={[styles.cardTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={[styles.cardTime, { color: theme.icon }]}>
          {formatTime(item.created_at)}
        </Text>
      </View>
      {item.description && (
        <Text
          style={[styles.cardDescription, { color: theme.icon }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
      )}
      <View style={styles.cardMeta}>
        <View style={[styles.pill, { backgroundColor: theme.icon + "18" }]}>
          <Text style={[styles.pillText, { color: theme.icon }]}>
            {item.category}
          </Text>
        </View>
        <View
          style={[
            styles.pill,
            { backgroundColor: STATUS_COLORS["pending"] + "20" },
          ]}
        >
          <Text style={[styles.pillText, { color: STATUS_COLORS["pending"] }]}>
            Pending
          </Text>
        </View>
        {item.profiles?.username && (
          <Text style={[styles.cardAuthor, { color: theme.icon }]}>
            by {item.profiles.username}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderPostReportItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.card, { borderColor: theme.line }]}
      onPress={() => router.push(`/${item.report}`)}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.categoryDot,
            { backgroundColor: REASON_COLORS[item.type] ?? "#6B7280" },
          ]}
        />
        <Text
          style={[styles.cardTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          {item.reports?.title ?? "Unknown post"}
        </Text>
        <Text style={[styles.cardTime, { color: theme.icon }]}>
          {formatTime(item.created_at)}
        </Text>
      </View>
      <View style={styles.cardMeta}>
        <View
          style={[
            styles.pill,
            { backgroundColor: (REASON_COLORS[item.type] ?? "#6B7280") + "20" },
          ]}
        >
          <Text
            style={[
              styles.pillText,
              { color: REASON_COLORS[item.type] ?? "#6B7280" },
            ]}
          >
            {item.type}
          </Text>
        </View>
        {item.reports?.category && (
          <View style={[styles.pill, { backgroundColor: theme.icon + "18" }]}>
            <Text style={[styles.pillText, { color: theme.icon }]}>
              {item.reports.category}
            </Text>
          </View>
        )}
        {item.reports?.profiles?.username && (
          <Text style={[styles.cardAuthor, { color: theme.icon }]}>
            post by {item.reports.profiles.username}
          </Text>
        )}
        {item.profiles?.username && (
          <Text style={[styles.cardAuthor, { color: theme.icon }]}>
            · reported by {item.profiles.username}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderCommentReportItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.card, { borderColor: theme.line }]}
      onPress={() =>
        item.comments?.report_id && router.push(`/${item.comments.report_id}`)
      }
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.categoryDot,
            { backgroundColor: REASON_COLORS[item.type] ?? "#6B7280" },
          ]}
        />
        <Text
          style={[styles.cardTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          {item.comments?.content ?? "Deleted comment"}
        </Text>
        <Text style={[styles.cardTime, { color: theme.icon }]}>
          {formatTime(item.created_at)}
        </Text>
      </View>
      <View style={styles.cardMeta}>
        <View
          style={[
            styles.pill,
            { backgroundColor: (REASON_COLORS[item.type] ?? "#6B7280") + "20" },
          ]}
        >
          <Text
            style={[
              styles.pillText,
              { color: REASON_COLORS[item.type] ?? "#6B7280" },
            ]}
          >
            {item.type}
          </Text>
        </View>
        {item.comments?.profiles?.username && (
          <Text style={[styles.cardAuthor, { color: theme.icon }]}>
            comment by {item.comments.profiles.username}
          </Text>
        )}
        {item.profiles?.username && (
          <Text style={[styles.cardAuthor, { color: theme.icon }]}>
            · reported by {item.profiles.username}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderCommentItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.card, { borderColor: theme.line }]}
      onPress={() => item.report_id && router.push(`/${item.report_id}`)}
    >
      <View style={styles.cardTop}>
        <View style={[styles.categoryDot, { backgroundColor: TINT }]} />
        <Text
          style={[styles.cardTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          {item.content}
        </Text>
        <Text style={[styles.cardTime, { color: theme.icon }]}>
          {formatTime(item.created_at)}
        </Text>
      </View>
      <View style={styles.cardMeta}>
        {item.profiles?.username && (
          <View style={[styles.pill, { backgroundColor: theme.icon + "18" }]}>
            <Text style={[styles.pillText, { color: theme.icon }]}>
              {item.profiles.username}
            </Text>
          </View>
        )}
        {item.parent_id && (
          <View style={[styles.pill, { backgroundColor: TINT + "18" }]}>
            <Text style={[styles.pillText, { color: TINT }]}>Reply</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isLoading && activeTab !== "comments") {
      return <ActivityIndicator color={TINT} style={{ marginTop: 40 }} />;
    }

    if (activeTab === "pending") {
      if (pendingReports.length === 0)
        return (
          <EmptyState
            icon="time-outline"
            message="No pending reports"
            theme={theme}
          />
        );
      return pendingReports.map(renderPendingItem);
    }

    if (activeTab === "post_reports") {
      if (postReports.length === 0)
        return (
          <EmptyState
            icon="flag-outline"
            message="No post reports"
            theme={theme}
          />
        );
      return postReports.map(renderPostReportItem);
    }

    if (activeTab === "comment_reports") {
      if (commentReports.length === 0)
        return (
          <EmptyState
            icon="chatbubble-outline"
            message="No comment reports"
            theme={theme}
          />
        );
      return commentReports.map(renderCommentReportItem);
    }

    if (activeTab === "comments") {
      if (allComments.length === 0 && !loadingMore)
        return (
          <EmptyState
            icon="chatbubbles-outline"
            message="No comments yet"
            theme={theme}
          />
        );
      return (
        <>
          {allComments.map(renderCommentItem)}
          {hasMoreComments && (
            <TouchableOpacity
              style={[styles.loadMoreBtn, { borderColor: theme.line }]}
              onPress={loadMoreComments}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator color={TINT} size="small" />
              ) : (
                <Text style={[styles.loadMoreText, { color: TINT }]}>
                  Load more
                </Text>
              )}
            </TouchableOpacity>
          )}
        </>
      );
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.line }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Admin</Text>
        <View style={[styles.headerBadge, { backgroundColor: TINT + "18" }]}>
          <Text style={[styles.headerBadgeText, { color: TINT }]}>
            {pendingReports.length} pending
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { borderBottomColor: theme.line }]}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                active && { borderBottomColor: TINT, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={active ? TINT : theme.icon}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[styles.tabText, { color: active ? TINT : theme.icon }]}
              >
                {tab.label}
              </Text>
              {counts[tab.key] > 0 && (
                <View
                  style={[
                    styles.tabBadge,
                    { backgroundColor: active ? TINT : theme.icon + "30" },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      { color: active ? "#fff" : theme.icon },
                    ]}
                  >
                    {counts[tab.key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyState({
  icon,
  message,
  theme,
}: {
  icon: string;
  message: string;
  theme: any;
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 60, gap: 12 }}>
      <Ionicons name={icon as any} size={36} color={theme.icon} />
      <Text style={{ color: theme.icon, fontSize: 14, fontFamily: Fonts.body }}>
        {message}
      </Text>
    </View>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    safe: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    headerTitle: {
      fontSize: 26,
      fontFamily: Fonts.heading,
      fontWeight: "700",
    },
    headerBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    headerBadgeText: {
      fontSize: 12,
      fontFamily: Fonts.body,
      fontWeight: "600",
    },
    tabBar: {
      borderBottomWidth: 1,
      flexGrow: 0,
    },
    tabBarContent: {
      paddingHorizontal: 16,
      gap: 4,
    },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginRight: 4,
    },
    tabText: {
      fontSize: 13,
      fontFamily: Fonts.body,
      fontWeight: "600",
    },
    tabBadge: {
      marginLeft: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    tabBadgeText: {
      fontSize: 10,
      fontFamily: Fonts.heading,
      fontWeight: "700",
    },
    content: {
      padding: 16,
      gap: 10,
    },
    card: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      backgroundColor: "rgba(150,150,150,0.04)",
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    categoryDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      flexShrink: 0,
    },
    cardTitle: {
      flex: 1,
      fontSize: 14,
      fontFamily: Fonts.heading,
      fontWeight: "600",
    },
    cardTime: {
      fontSize: 11,
      fontFamily: Fonts.body,
      flexShrink: 0,
    },
    cardMeta: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
    },
    cardAuthor: {
      fontSize: 11,
      fontFamily: Fonts.body,
    },
    pill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
    },
    pillText: {
      fontSize: 11,
      fontFamily: Fonts.body,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    loadMoreBtn: {
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 4,
      marginBottom: 20,
    },
    loadMoreText: {
      fontSize: 13,
      fontFamily: Fonts.body,
      fontWeight: "600",
    },
  });
