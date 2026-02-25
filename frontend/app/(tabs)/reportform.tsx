import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, Pressable, View, ScrollView, useColorScheme, ActivityIndicator, Alert,Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { sessionStorage } from '@/utils/sessionStorage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { ImageUploadBox } from '@/components/ImageUploadBox';
import { BeforeCont } from '@/components/ui/BeforeCont';

import { supabase } from '@/lib/supabase'; 

const CATEGORIES = ['Facilities', 'Safety', 'Dining', 'Tech'];
const STORAGE_KEY = 'disclaimer_dont_show_again';

export default function ReportForm() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Facilities');
  const [notes, setNotes] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]); // Array for multiple photos
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setNotes('');
    setImageUris([]);
    setSelectedCategory('Facilities');
    router.back();
  };

  const handleSubmit = async () => {
    if (!notes.trim()) {
      Alert.alert("Missing Info", "Please provide a description of the issue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Please log in to submit a report.");

      const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
      let uploadedPaths: string[] = [];

      // Upload Multiple Photos
      if (imageUris.length > 0) {
        for (const uri of imageUris) {
          const response = await fetch(uri);
          const arrayBuffer = await response.arrayBuffer();
          const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
          
          const timestamp = Date.now();
          const uniqueId = Math.random().toString(36).substring(7);
          const fileName = `${username}-${timestamp}-${uniqueId}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`; 

          const { data: storageData, error: storageError } = await supabase.storage
            .from('report-photos')
            .upload(filePath, arrayBuffer, {
              contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
              upsert: false
            });

          if (storageError) throw storageError;
          uploadedPaths.push(storageData.path);
        }
      }

      // 3. Insert into DB (Matching your new SQL table columns)
      const { error: dbError } = await supabase
        .from('reports')
        .insert([
          {
            user_id: user.id,
            username: username,
            category: selectedCategory,
            description: notes,
            image_paths: uploadedPaths, 
            location: null, 
            status: 'pending',
          },
        ]);

      if (dbError) throw dbError;

      Alert.alert("Success", "Your report has been submitted.", [
        { 
          text: "OK", 
          onPress: () => {
            resetForm();
            router.replace('/(tabs)/profile');
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

  useEffect(() => { checkDisclaimerPreference(); }, []);
  useFocusEffect(React.useCallback(() => { checkDisclaimerPreference(); }, []));

  const checkDisclaimerPreference = () => {
    const value = sessionStorage.getItem(STORAGE_KEY);
    setShowDisclaimer(value === 'true' ? false : true);
  };

  if (showDisclaimer) {
    return <BeforeCont visible={showDisclaimer} onClose={() => setShowDisclaimer(false)} setDisclaimer={setShowDisclaimer} />;
  }

  return (
    <ThemedView style={styles.screenContainer}>
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable 
          onPress={() => resetForm()} 
          style={({ pressed }) => [styles.backLink, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Ionicons name="arrow-back" size={18} color={Colors[colorScheme ?? "light"].text} />
          <ThemedText type="defaultSemiBold">Reporting Issues</ThemedText>
        </Pressable>

        <ThemedText style={styles.sectionTitle}>Issue Details</ThemedText>

        <ImageUploadBox 
          onImagesPicked={(uris: string[]) => setImageUris(uris)} 
          key={imageUris.length === 0 ? 'empty' : 'loaded'}
          multiple={true}
        />

        {/* Thumbnail Preview Area */}
        {imageUris.length > 0 && (
          <ScrollView horizontal style={styles.previewContainer}>
            {imageUris.map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={styles.thumbnail} />
            ))}
          </ScrollView>
        )}
        
        <View style={styles.mapWrapper}>
          <View style={styles.mapPlaceholder} /> 
          <View style={styles.locationBar}>
            <ThemedText style={styles.locationBarText}>Location (Optional)</ThemedText>
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
          placeholder="Describe the issue"
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
                <ThemedText style={[styles.chipText, selectedCategory === cat && styles.chipTextSelected]}>
                  {cat}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable 
          style={[styles.continueButton, isSubmitting && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="white" /> : <ThemedText style={styles.continueText}>Submit Report</ThemedText>}
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  container: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 10,
    gap: 16,
  },
  backLink: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 5 
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    fontFamily: Fonts.rounded,
    marginBottom: 10,
  },
  previewContainer: { 
    flexDirection: 'row', 
    marginBottom: 10 
  },
  thumbnail: { 
    width: 70, 
    height: 70, 
    borderRadius: 10, 
    marginRight: 8 
  },
  mapWrapper: { 
    borderRadius: 20, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#EEE' 
  },
  mapPlaceholder: { 
    height: 140, 
    backgroundColor: '#F9F9F9' 
  },
  locationBar: { 
    backgroundColor: '#2D4635', 
    padding: 14 
  },
  locationBarText: { 
    color: 'white', 
    fontSize: 15, 
    fontWeight: '500' 
  },
  textArea: { 
    borderWidth: 1, 
    borderRadius: 20, 
    padding: 18, 
    height: 120, 
    fontSize: 16, 
    textAlignVertical: 'top' 
  },
  labelSection: { 
    gap: 12 
  },
  labelTitle: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  chipContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10 
  },
  chip: { 
    paddingHorizontal: 22, 
    paddingVertical: 12, 
    borderWidth: 1, 
    borderRadius: 30 
  },
  chipSelected: { 
    backgroundColor: '#2D4635', 
    borderColor: '#2D4635' 
  },
  chipText: { 
    fontWeight: '500' 
  },
  chipTextSelected: { 
    color: 'white' 
  },
  continueButton: { 
    backgroundColor: '#2D4635', 
    paddingVertical: 18, 
    borderRadius: 35, 
    alignItems: 'center', 
    marginTop: 10 
  },
  continueText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
});