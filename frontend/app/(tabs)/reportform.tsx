import React, { useState } from 'react';
import { StyleSheet, TextInput, Pressable, View, Platform } from 'react-native';
import Octicons from '@expo/vector-icons/Octicons';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';

const CATEGORIES = ['Facilities', 'Safety', 'Dining', 'Tech'];

export default function ReportForm() {
  const [selectedCategory, setSelectedCategory] = useState('Facilities');
  const [notes, setNotes] = useState('');

  const handleBackNavigation = () => {
    console.log("Navigating back to Reporting Issues...");
  };

  return (
    <ParallaxScrollView

      headerBackgroundColor={{ light: '#7ca98aff', dark: '#173720' }}

      headerImage={
        <ThemedView style={styles.headerContent}>
          <Octicons
            size={100}
            color="rgba(255,255,255,0.15)"
            name="report"
            style={styles.headerIcon}
          />

          <ThemedText type="title" style={styles.headerTitleText}>
            Reporting Form
          </ThemedText>
          
        </ThemedView>
      }>

      <ThemedView style={styles.container}>
        
        <Pressable 
          onPress={handleBackNavigation} 
          style={({ pressed }) => [styles.backLink, { opacity: pressed? 0.5:10 }]}
        >
          <Ionicons name="arrow-back" size={18} color="black" />
          <ThemedText style={styles.backLinkText}>Reporting Issues</ThemedText>
        </Pressable>

        <ThemedText style={styles.sectionTitle}>Issue Details</ThemedText>

        <View style={styles.uploadBox}>
          <MaterialCommunityIcons name="tray-arrow-up" size={40} color="#999" />
          <ThemedText style={styles.uploadText}>Upload an Image</ThemedText>
          <Pressable style={styles.browseButton}>
            <ThemedText style={styles.browseButtonText}>Browse</ThemedText>
          </Pressable>
        </View>

        <View style={styles.mapWrapper}>
          <View style={styles.mapPlaceholder}> </View>
          <View style={styles.locationBar}>
            <ThemedText style={styles.locationBarText}>Choose a location</ThemedText>
          </View>
        </View>

        <TextInput
          style={styles.textArea}
          placeholder="Comments / Notes"
          placeholderTextColor="#999"
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <View style={styles.labelSection}>
          <ThemedText style={styles.labelTitle}>Select labels</ThemedText>
          <View style={styles.chipContainer}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.chip,
                  selectedCategory === cat && styles.chipSelected,
                ]}>
                <ThemedText
                  style={[
                    styles.chipText,
                    selectedCategory === cat && styles.chipTextSelected,
                  ]}>
                  {cat}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.continueButton}>
          <ThemedText style={styles.continueText}>Continue</ThemedText>
        </Pressable>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContent: {
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D4635',
  },
  headerIcon: {
    position: 'absolute',
    bottom: 10,
    right: 21,
  },
  headerTitleText: {
    fontFamily: Fonts.rounded,
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },

  container: {
    padding: 24,
    gap: 16,
  },

  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  backLinkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },

  sectionTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  uploadBox: {
    height: 180,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FAFAFA',
  },
  uploadText: {
    color: '#888',
    fontSize: 16,
  },
  browseButton: {
    backgroundColor: '#2D4635',
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  mapWrapper: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  mapPlaceholder: {
    height: 140,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#2D4635',
    padding: 6,
  },

  locationBar: {
    backgroundColor: '#2D4635',
    padding: 14,
  },
  locationBarText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },

  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 18,
    height: 120,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },

  labelSection: {
    gap: 12,
  },
  labelTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#2D4635',
    borderColor: '#2D4635',
  },
  chipText: {
    color: '#555',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: 'white',
  },

  continueButton: {
    backgroundColor: '#2D4635',
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  continueText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});