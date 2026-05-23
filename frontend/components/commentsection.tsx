import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors, Fonts } from "@/constants/theme";

type Comment = {
  id: string;
  created_at: string;
  report_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  profiles: {
    username: string;
  } | null;
};

function getInitial(username: string) {
  return (username?.[0] ?? "?").toUpperCase();
}

// --- Avatar ---
function CommentAvatar({ username }: { username: string }) {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  return (
    <View style={[avatarStyles.ring, { borderColor: theme.tint }]}>
      <View style={[avatarStyles.avatar, { backgroundColor: theme.tint }]}>
        <Text style={avatarStyles.initial}>{getInitial(username)}</Text>
      </View>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  ring: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    fontFamily: Fonts.heading,
  },
});

// --- Single Comment Row ---
function CommentRow({
  comment,
  currentUserId,
  onReply,
  onDelete,
  isReply = false,
  handleReportComment,
}: {
  comment: Comment;
  currentUserId: string | null;
  onReply: (comment: Comment) => void;
  onDelete: (id: string) => void;
  isReply?: boolean;
  handleReportComment: (commentId: string) => void;
}) {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  const isOwn = currentUserId === comment.user_id;

  return (
    <View style={[styles.commentRow, isReply && styles.replyRow]}>
      {isReply && (
        <View style={[styles.replyLine, { backgroundColor: theme.line }]} />
      )}
      <CommentAvatar username={comment.profiles?.username || "User"} />
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentUsername, { color: theme.text }]}>
            {comment.profiles?.username || "User"}
          </Text>
          <Text style={[styles.commentTime, { color: theme.icon }]}>
            {formatTime(comment.created_at)}
          </Text>
        </View>
        <Text style={[styles.commentContent, { color: theme.text }]}>
          {comment.content}
        </Text>
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.commentActionBtn}
            onPress={() => onReply(comment)}
          >
            <Ionicons
              name="return-down-forward-outline"
              size={14}
              color={theme.icon}
            />
            <Text style={[styles.commentActionText, { color: theme.icon }]}>
              Reply
            </Text>
          </TouchableOpacity>
          {isOwn && (
            /* Show delete if it belongs to the active user */
            <TouchableOpacity
              style={styles.commentActionBtn}
              onPress={() => onDelete(comment.id)}
            >
              <Ionicons name="trash-outline" size={14} color="#C95C4B" />
              <Text style={[styles.commentActionText, { color: "#C95C4B" }]}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.commentActionBtn}
            onPress={() => handleReportComment(comment.id)}
          >
            <Ionicons name="flag-outline" size={14} color={theme.icon} />
            <Text style={[styles.commentActionText, { color: theme.icon }]}>
              Report
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function CommentThread({
  comment,
  allComments,
  currentUserId,
  onReply,
  onDelete,
  depth = 1,
  onShowMore,
  handleReportComment,
}: {
  comment: Comment;
  allComments: Comment[];
  currentUserId: string | null;
  onReply: (comment: Comment) => void;
  onDelete: (id: string) => void;
  depth?: number;
  onShowMore: (id: string) => void;
  handleReportComment: (commentId: string) => void;
}) {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;

  const childReplies = allComments
    .filter((c) => c.parent_id === comment.id)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

  // Maximum nesting depth allowed visually before collapsing
  const MAX_DEPTH = 2;
  const reachedCutoff = depth >= MAX_DEPTH;

  return (
    <View>
      <CommentRow
        comment={comment}
        currentUserId={currentUserId}
        onReply={onReply}
        onDelete={onDelete}
        isReply={depth > 0}
        handleReportComment={handleReportComment}
      />

      {/* If we have children, check if we should render them or show the toggle */}
      {childReplies.length > 0 && (
        <View style={{ marginLeft: depth < 3 ? 35 : 0 }}>
          {reachedCutoff ? (
            /* We hit depth 2, hide the children and show the "Show deeper replies" button */
            <TouchableOpacity
              style={[
                styles.replyRow,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 4,
                  paddingVertical: 4,
                  marginLeft: 16,
                },
              ]}
              onPress={() => onShowMore(comment.id)}
            >
              <View
                style={[styles.replyLine, { backgroundColor: theme.tint }]}
              />
              <Ionicons
                name="chatbubbles-outline"
                size={14}
                color={theme.tint}
              />
              <Text
                style={{ color: theme.tint, fontSize: 13, fontWeight: "600" }}
              >
                Show deeper replies…
              </Text>
            </TouchableOpacity>
          ) : (
            /* Under the limit? Keep processing recursively */
            childReplies.map((child) => (
              <CommentThread
                key={child.id}
                comment={child}
                allComments={allComments}
                currentUserId={currentUserId}
                onReply={onReply}
                onDelete={onDelete}
                depth={depth + 1}
                onShowMore={onShowMore}
                handleReportComment={handleReportComment}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

interface CommentsSectionProps {
  reportId: string;
  handleReportComment: (commentId: string) => void;
}

// --- Main Component ---
export default function CommentsSection({
  reportId,
  handleReportComment,
}: CommentsSectionProps) {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [focusedThreadId, setFocusedThreadId] = useState<string | null>(null);

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch active user's username from the profiles table for the input bar avatar
  const { data: currentProfile } = useQuery({
    queryKey: ["current-profile", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", currentUser.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.id,
  });

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        // Tell Supabase to reach into the profiles table via your user_id foreign key
        .select(
          `
        id,
        created_at,
        report_id,
        user_id,
        content,
        parent_id,
        profiles (
          username
        )
      `,
        )
        .eq("report_id", reportId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as Comment[];
    },
    enabled: !!reportId,
    staleTime: 60 * 1000,
  });

  // Add comment
  const addComment = useMutation({
    mutationFn: async ({
      content,
      parentId,
    }: {
      content: string;
      parentId: string | null;
    }) => {
      if (!currentUser) throw new Error("Not logged in");
      const { error } = await supabase.from("comments").insert({
        report_id: reportId,
        user_id: currentUser.id,
        content,
        parent_id: parentId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", reportId] });
      setInput("");
      setReplyingTo(null);
    },
  });

  // Delete comment
  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", reportId] });
    },
  });

  const handleDeleteRequest = (id: string) => {
    if (Platform.OS === "web") {
      // Regular web browser confirmation box
      const confirmed = window.confirm(
        "Are you sure you want to delete your comment?",
      );
      if (confirmed) {
        deleteComment.mutate(id);
      }
    } else {
      // Native mobile modal dialog
      Alert.alert(
        "Delete Comment",
        "Are you sure you want to delete your comment?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteComment.mutate(id),
          },
        ],
      );
    }
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addComment.mutate({ content: trimmed, parentId: replyingTo?.id ?? null });
  };

  return (
    <View style={styles.container}>
      {/* Header / Back Navigation */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text
          style={[styles.sectionLabel, { color: theme.text, marginBottom: 0 }]}
        >
          {focusedThreadId
            ? "SUB-THREAD REPLIES"
            : `COMMENTS · ${comments.length}`}
        </Text>
        {focusedThreadId && (
          <TouchableOpacity
            onPress={() => setFocusedThreadId(null)}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons name="arrow-back" size={14} color={theme.tint} />
            <Text
              style={{ color: theme.tint, fontSize: 13, fontWeight: "600" }}
            >
              View all comments
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Comment list */}
      {isLoading ? (
        <ActivityIndicator color={theme.tint} style={{ marginVertical: 20 }} />
      ) : (
        (() => {
          // Determine what counts as our "top level" source right now
          const displayRoots = focusedThreadId
            ? comments.filter((c) => c.id === focusedThreadId)
            : comments.filter((c) => !c.parent_id);

          if (displayRoots.length === 0) {
            return (
              <View style={styles.emptyState}>
                <Ionicons
                  name="chatbubble-outline"
                  size={32}
                  color={theme.icon}
                />
                <Text style={[styles.emptyText, { color: theme.icon }]}>
                  No comments yet.
                </Text>
              </View>
            );
          }

          return displayRoots.map((comment) => (
            <View key={comment.id} style={{ marginBottom: 20 }}>
              {/* Main Parent Item */}
              <CommentRow
                comment={comment}
                currentUserId={currentUser?.id ?? null}
                onReply={setReplyingTo}
                onDelete={handleDeleteRequest}
                isReply={false}
                handleReportComment={handleReportComment}
              />

              {/* Immediate First-Level Children */}
              {comments
                .filter((c) => c.parent_id === comment.id)
                .sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime(),
                )
                .map((child) => (
                  <View key={child.id} style={{ marginLeft: 0 }}>
                    <CommentThread
                      comment={child}
                      allComments={comments}
                      currentUserId={currentUser?.id ?? null}
                      onReply={setReplyingTo}
                      onDelete={handleDeleteRequest}
                      depth={1} // Base level child thread starts at depth 1
                      onShowMore={(id) => setFocusedThreadId(id)}
                      handleReportComment={handleReportComment}
                    />
                  </View>
                ))}
            </View>
          ));
        })()
      )}
      {/* --- Input Area (Here is your missing input row!) --- */}
      {currentUser ? (
        <View style={[styles.inputArea, { borderTopColor: theme.line }]}>
          {replyingTo && (
            <View
              style={[
                styles.replyBanner,
                {
                  backgroundColor: theme.tint + "18",
                  borderColor: theme.tint + "40",
                },
              ]}
            >
              <Text style={[styles.replyBannerText, { color: theme.tint }]}>
                Replying to {replyingTo.profiles?.username || "User"}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={16} color={theme.tint} />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <CommentAvatar username={currentProfile?.username || "User"} />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.line + "60",
                  color: theme.text,
                  borderColor: theme.line,
                  paddingBottom: 24,
                },
              ]}
              placeholder={
                replyingTo
                  ? `Reply to ${replyingTo.profiles?.username || "User"}…`
                  : "Add a comment…"
              }
              placeholderTextColor={theme.icon}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: input.trim() ? theme.tint : theme.line },
              ]}
              onPress={handleSubmit}
              disabled={!input.trim() || addComment.isPending}
            >
              {addComment.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="arrow-up" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.authPrompt, { borderTopColor: theme.line }]}>
          <Text style={[styles.authPromptText, { color: theme.icon }]}>
            Sign in to leave a comment.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    marginBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    opacity: 0.5,
    marginBottom: 16,
    fontFamily: Fonts.heading,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  commentRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  replyRow: {
    marginLeft: 0,
    marginBottom: 12,
  },
  replyLine: {
    width: 2,
    borderRadius: 1,
    marginRight: 6,
    marginLeft: 16,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  commentUsername: {
    fontSize: 13,
    fontFamily: Fonts.heading,
    fontWeight: "600",
  },
  commentTime: {
    fontSize: 11,
    fontFamily: Fonts.body,
  },
  commentContent: {
    fontSize: 14,
    fontFamily: Fonts.body,
    lineHeight: 20,
    marginBottom: 6,
  },
  commentActions: {
    flexDirection: "row",
    gap: 12,
  },
  commentActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    fontFamily: Fonts.body,
  },
  inputArea: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  replyBannerText: {
    fontSize: 12,
    fontFamily: Fonts.body,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 14,
    fontFamily: Fonts.body,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  authPrompt: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    alignItems: "center",
  },
  authPromptText: {
    fontSize: 13,
    fontFamily: Fonts.body,
  },
});
