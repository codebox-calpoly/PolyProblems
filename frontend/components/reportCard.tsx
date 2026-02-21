import React from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

export type Report = {
  id: string;
  title: string;
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
  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
    color: theme.text,
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
    fontWeight: "700",
  },
});

export const ReportCard = ({ report }: ReportCardProps) => {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  const styles = createStyles(theme);

  return (
    <ThemedView key={report.id} style={styles.card}>
      <ThemedText style={styles.cardTitle}>{report.title}</ThemedText>

      <ThemedView style={styles.cardFooter}>
        <ThemedView style={styles.viewButton}>
          <ThemedText style={styles.viewButtonText}>View</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
};
