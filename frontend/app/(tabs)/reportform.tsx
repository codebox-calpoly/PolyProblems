import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, Pressable, View, ScrollView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { sessionStorage } from '@/utils/sessionStorage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { ImageUploadBox } from '@/components/ImageUploadBox';
import { BeforeCont } from '@/components/ui/BeforeCont';
import { LocationTagging, LocationCoords } from '@/components/LocationTagging';

const CATEGORIES = ['Facilities', 'Safety', 'Dining', 'Tech'];
const STORAGE_KEY = 'disclaimer_dont_show_again';

export default function ReportForm() {
  const colorScheme = useColorScheme();
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Facilities');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<LocationCoords | null>(null);

  useEffect(() => {
    checkDisclaimerPreference();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkDisclaimerPreference();
    }, [])
  );

  const checkDisclaimerPreference = () => {
    const value = sessionStorage.getItem(STORAGE_KEY);
    setShowDisclaimer(value !== 'true');
  };

  const handleCloseDisclaimer = (dontShowAgain: boolean) => {
    setShowDisclaimer(false);
  };

  const handleBackNavigation = () => {
    console.log("Back to Reporting Form");
  };

  if (showDisclaimer) {
    return (
      <BeforeCont
        visible={showDisclaimer}
        onClose={handleCloseDisclaimer}
        setDisclaimer={setShowDisclaimer}
      />
    );
  }

  return (
    <ThemedView style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <Pressable 
          onPress={handleBackNavigation} 
          style={({ pressed }) => [styles.backLink, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Ionicons 
            name="arrow-back" 
            size={18} 
            color={Colors[colorScheme ?? "light"].text} 
          />
          <ThemedText type="defaultSemiBold">Reporting Issues</ThemedText>
        </Pressable>

        <ThemedText style={styles.sectionTitle}>Issue Details</ThemedText>

        <ImageUploadBox/>
        
        <LocationTagging value={location} onChange={setLocation} />

        <TextInput
          style={[
            styles.textArea, 
            { 
              color: Colors[colorScheme ?? "light"].text,
              borderColor: colorScheme === 'dark' ? '#444' : '#E0E0E0' 
            }
          ]}
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
                  { borderColor: colorScheme === 'dark' ? '#444' : '#E0E0E0' }
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
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingTop: 60,
    gap: 16,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  uploadText: {
    color: '#888',
    fontSize: 16,
  },
  browseButton: {
    backgroundColor: '#2D4635',
    borderRadius: 25,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: Fonts.rounded,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    height: 120,
    fontSize: 16,
    textAlignVertical: 'top',
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
    borderRadius: 30,
  },
  chipSelected: {
    backgroundColor: '#2D4635',
    borderColor: '#2D4635',
  },
  chipText: {
    fontWeight: '500',
  },
  chipTextSelected: {
    color: 'white',
  },
  continueButton: {
    backgroundColor: '#2D4635',
    paddingVertical: 18,
    borderRadius: 35,
    alignItems: 'center',
    marginTop: 10,
  },
  continueText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});