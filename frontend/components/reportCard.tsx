import React from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';

export type Report = {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
};

interface ReportCardProps {
  report: Report;
}

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    backgroundColor: theme.background,
  },
  cardDescription: {
    fontSize: 22,
    fontFamily: Fonts.heading,
    lineHeight: 28,
    color: theme.text,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  categoryBadge: {
    backgroundColor: theme.tint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
});

export const ReportCard = ({ report }: ReportCardProps) => {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  const styles = createStyles(theme);

  // Format the date to a readable format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <ThemedView key={report.id} style={styles.card}>

      {report.description && (
        <ThemedText style={styles.cardDescription}>{report.description}</ThemedText>
      )}

      <ThemedView style={styles.cardMeta}>
        {report.category && (
          <ThemedView style={styles.categoryBadge}>
            <ThemedText style={styles.categoryText}>{report.category}</ThemedText>
          </ThemedView>
        )}
        {report.created_at && (
          <ThemedText style={styles.timeText}>{formatDate(report.created_at)}</ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.cardFooter}>
        <ThemedView style={styles.viewButton}>
          <ThemedText style={styles.viewButtonText}>View</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
};
