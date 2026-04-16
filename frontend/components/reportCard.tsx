import React from "react";
import { StyleSheet, useColorScheme, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, feedTabs, Fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export type Report = {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  total_score: number;
  status?: string;
};

interface ReportCardProps {
  report: Report;
  onPress?: () => void;
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: "#e6e6e6",
      borderRadius: 18,
      padding: 18,
      marginBottom: 14,
      backgroundColor: theme.background,
    },
    cardTitle: {
      fontSize: 20,
      fontFamily: Fonts.heading,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 4,
    },
    cardDescription: {
      fontSize: 16,
      lineHeight: 22,
      color: theme.text,
      marginBottom: 8,
    },
    cardMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 12,
    },
    categoryBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginRight: 8,
    },
    categoryText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "600",
    },
    timeText: {
      fontSize: 12,
      color: theme.icon,
    },
    cardFooter: {
      marginTop: 12,
      alignItems: "flex-end",
    },
    viewButton: {
      backgroundColor: theme.tint,
      paddingHorizontal: 22,
      paddingVertical: 7,
      borderRadius: 999,
    },
    viewButtonText: {
      color: "#ffffff",
      fontSize: 14,
      fontFamily: Fonts.heading,
    },
    scoreBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.icon + "15",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    leftMeta: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    scoreText: {
      fontSize: 14,
      fontWeight: "bold",
      marginLeft: 4,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    statusText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
  });

export const ReportCard = ({ report, onPress }: ReportCardProps) => {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  const styles = createStyles(theme);

  const badgeColor =
    feedTabs[report.category as keyof typeof feedTabs] || theme.tint;
  const statusConfig = {
    unresolved: { label: "Approved", color: "#2D7A53" },
    pending: { label: "Unapproved", color: "#C9922F" },
    rejected: { label: "Rejected", color: "#C95C4B" },
  } as const;
  const normalizedStatus = (report.status || "pending").toLowerCase();
  const statusBadge =
    statusConfig[normalizedStatus as keyof typeof statusConfig] ||
    statusConfig.pending;

  // Format the date to a readable format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <ThemedView key={report.id} style={styles.card}>
      {report.title && (
        <ThemedText style={styles.cardTitle} numberOfLines={1}>
          {report.title}
        </ThemedText>
      )}
      {report.description && (
        <ThemedText style={styles.cardDescription} numberOfLines={3}>
          {report.description}
        </ThemedText>
      )}

      <ThemedView style={styles.cardMeta}>
        <ThemedView style={styles.leftMeta}>
          {report.category && (
            <ThemedView
              style={[styles.categoryBadge, { backgroundColor: badgeColor }]}
            >
              <ThemedText style={styles.categoryText}>
                {report.category}
              </ThemedText>
            </ThemedView>
          )}

          <ThemedView style={styles.scoreBadge}>
            <Ionicons
              name="stats-chart"
              size={14}
              color={(report.total_score || 0) >= 0 ? "#2ECC71" : "#FF4500"}
            />
            <ThemedText
              style={[
                styles.scoreText,
                {
                  color: (report.total_score || 0) >= 0 ? "#2ECC71" : "#FF4500",
                },
              ]}
            >
              {report.total_score || 0}
            </ThemedText>
          </ThemedView>

          <ThemedView
            style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}
          >
            <ThemedText style={styles.statusText}>
              {statusBadge.label}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* DATE REMAINS ON FAR RIGHT */}
        {report.created_at && (
          <ThemedText style={styles.timeText}>
            {formatDate(report.created_at)}
          </ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.viewButtonText}>View</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
};
