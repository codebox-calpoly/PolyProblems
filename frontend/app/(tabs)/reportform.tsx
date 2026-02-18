import React, { useState } from 'react';
import { StyleSheet, TextInput, Pressable, View, ScrollView, useColorScheme, ActivityIndicator, Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { ImageUploadBox } from '@/components/ImageUploadBox';

import { supabase } from '@/lib/supabase'; 

const CATEGORIES = ['Facilities', 'Safety', 'Dining', 'Tech'];

export default function ReportForm() {
  const colorScheme = useColorScheme();
  
  const [selectedCategory, setSelectedCategory] = useState('Facilities');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!notes.trim()) {
      Alert.alert("Missing Info", "Please provide a description of the issue.");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedPath = null;

      if (imageUri) {
        const response = await fetch(imageUri);
        
        const arrayBuffer = await response.arrayBuffer();
        
        const fileExt = imageUri.split('.').pop()?.toLowerCase() ?? 'jpeg';
        //do date.now and dash -> some form of counter. Help upload multiple images
        //check if the current date /id is already exist. prevent duplication and race conditions
        const fileName = `${Date.now()}.${fileExt}`; 
        const filePath = `${fileName}`;

        const { data: storageData, error: storageError } = await supabase.storage
          .from('report-photos')
          .upload(filePath, arrayBuffer, { // Pass the arrayBuffer here
            contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
            upsert: false
          });

        if (storageError) throw storageError;
        uploadedPath = storageData.path;
      }

      const { error: dbError } = await supabase
        .from('reports')
        .insert([
          {
            category: selectedCategory,
            description: notes,
            image_path: uploadedPath,
            location: null,
            status: 'pending',
          },
        ]);

      if (dbError) throw dbError;

      //when submitted/refresh on the image upload box
      //navigate back to the profile page - after submitting the form
      Alert.alert("Success", "Your report has been submitted.", [
        { 
          text: "OK", 
          onPress: () => {
            setNotes('');
            setImageUri(null);
            setSelectedCategory('Facilities');
          } 
        }
      ]);

    } catch (error: any) {
      console.error("Submission error:", error);
      Alert.alert("Submission Failed", error.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackNavigation = () => {
    console.log("Back to Reporting Form");
  };

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

        <ImageUploadBox onImagePicked={(uri: string) => setImageUri(uri)} />
        
        <View style={styles.mapWrapper}>
          <View style={styles.mapPlaceholder}> </View>
          <View style={styles.locationBar}>
            <ThemedText style={styles.locationBarText}>Choose a location</ThemedText>
          </View>
        </View>

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
          editable={!isSubmitting}
        />

        {/* Label Selection */}
        <View style={styles.labelSection}>
          <ThemedText style={styles.labelTitle}>Select labels</ThemedText>
          <View style={styles.chipContainer}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                disabled={isSubmitting}
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

        {/* Submit Button */}
        <Pressable 
          style={[styles.continueButton, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText style={styles.continueText}>Continue</ThemedText>
          )}
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
  sectionTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: Fonts.rounded,
  },
  mapWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  mapPlaceholder: {
    height: 140,
    backgroundColor: '#F9F9F9',
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