import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export type Report = {
  id: string;
  title: string;
};

interface ReportCardProps {
  report: Report;
  styles: any;
}

export const ReportCard = ({ report, styles }: ReportCardProps) => {
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
