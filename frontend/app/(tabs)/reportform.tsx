import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  TextInput,
  Pressable,
  View,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { sessionStorage } from "@/utils/sessionStorage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Fonts } from "@/constants/theme";
import { ImageUploadBox } from "@/components/ImageUploadBox";
import { BeforeCont } from "@/components/ui/BeforeCont";

import { supabase } from "@/lib/supabase";
import { LocationTagging, LocationCoords } from "@/components/LocationTagging";

const CATEGORIES = ["Facilities", "Safety", "Dining", "Tech"];
const STORAGE_KEY = "disclaimer_dont_show_again";

export default function ReportForm() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Facilities");
  const [notes, setNotes] = useState("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<LocationCoords | null>(null);

  const [isAcknowledged, setIsAcknowledged] = useState(false);

  const resetForm = () => {
    setNotes("");
    setImageUris([]);
    setSelectedCategory("Facilities");
    setLocation(null);
    setIsAcknowledged(false);
    router.back();
  };

  const handleSubmit = async () => {
    if (!notes.trim()) {
      Alert.alert("Missing Info", "Please provide a description of the issue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user)
        throw new Error("Please log in to submit a report.");

      const username =
        user.user_metadata?.username || user.email?.split("@")[0] || "user";
      let uploadedPaths: string[] = [];

      if (imageUris.length > 0) {
        const mimeToExt: Record<string, string> = {
          "image/jpeg": "jpg",
          "image/jpg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/heic": "heic",
          "image/heif": "heif",
        };

        for (const uri of imageUris) {
          const response = await fetch(uri);
          let uploadData;
          let contentType;
          let fileExt: string | undefined;
          if (Platform.OS === "web") {
            uploadData = await response.blob();
            contentType =
              uploadData.type ||
              response.headers.get("content-type") ||
              "image/jpeg";
            fileExt = mimeToExt[contentType] ?? "jpg";
          } else {
            uploadData = await response.arrayBuffer();
            fileExt = uri.split(".").pop()?.toLowerCase();
            contentType =
              Object.keys(mimeToExt).find(
                (key) => mimeToExt[key] === fileExt,
              ) || "image/jpeg";
          }

          const timestamp = Date.now();
          const uniqueId = Math.random().toString(36).substring(7);
          const fileName = `${username}-${timestamp}-${uniqueId}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { data: storageData, error: storageError } =
            await supabase.storage
              .from("report-photos")
              .upload(filePath, uploadData, {
                contentType,
                upsert: false,
              });

          if (storageError) throw storageError;
          uploadedPaths.push(storageData.path);
        }
      }

      const { error: dbError } = await supabase.from("reports").insert([
        {
          user_id: user.id,
          username: username,
          category: selectedCategory,
          description: notes,
          image_paths: uploadedPaths,
          location: location
            ? { latitude: location.latitude, longitude: location.longitude }
            : null,
          status: "pending",
        },
      ]);

      if (dbError) throw dbError;

      if (Platform.OS === "web") {
        window.alert("Your report has been submitted.");
        resetForm();
        router.replace("/(tabs)/profile");
      } else {
        Alert.alert("Success", "Your report has been submitted.", [
          {
            text: "OK",
            onPress: () => {
              resetForm();
              router.replace("/(tabs)/profile");
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error("Submission error:", error);

      const message = error?.message || "An unexpected error occurred.";

      if (Platform.OS === "web") {
        window.alert(`Submission Failed\n\n${message}`);
      } else {
        Alert.alert("Submission Failed", message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    checkDisclaimerPreference();
  }, []);
  useFocusEffect(
    React.useCallback(() => {
      checkDisclaimerPreference();
    }, []),
  );

  const checkDisclaimerPreference = () => {
    const value = sessionStorage.getItem(STORAGE_KEY);
    setShowDisclaimer(value === "true" ? false : true);
  };

  if (showDisclaimer) {
    return (
      <BeforeCont
        visible={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        setDisclaimer={setShowDisclaimer}
      />
    );
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
          style={({ pressed }) => [
            styles.backLink,
            { opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color={Colors[colorScheme ?? "light"].text}
          />
          <ThemedText type="defaultSemiBold">Reporting Issues</ThemedText>
        </Pressable>

        <ThemedText style={styles.sectionTitle}>Issue Details</ThemedText>

        <ImageUploadBox images={imageUris} onImagesPicked={setImageUris} />

        <LocationTagging value={location} onChange={setLocation} />

        <TextInput
          style={[
            styles.textArea,
            {
              color: Colors[colorScheme ?? "light"].text,
              borderColor: colorScheme === "dark" ? "#444" : "#E0E0E0",
            },
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
                  { borderColor: colorScheme === "dark" ? "#444" : "#E0E0E0" },
                ]}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    selectedCategory === cat && styles.chipTextSelected,
                  ]}
                >
                  {cat}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={styles.acknowledgeContainer}
          onPress={() => setIsAcknowledged(!isAcknowledged)}
        >
          <Ionicons
            name={isAcknowledged ? "checkbox" : "square-outline"}
            size={24}
            color={isAcknowledged ? "#2D4635" : "#999"}
          />
          <ThemedText style={styles.acknowledgeText}>
            I acknowledge that this report is accurate to the best of my
            knowledge and understand it may be reviewed or shared with relevant
            university departments.
          </ThemedText>
        </Pressable>

        <Pressable
          style={[
            styles.continueButton,
            (!isAcknowledged || isSubmitting) && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isAcknowledged || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText style={styles.continueText}>Submit Report</ThemedText>
          )}
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 25,
    fontFamily: Fonts.heading,
    marginBottom: 10,
  },
  previewContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    height: 120,
    fontSize: 16,
    fontFamily: Fonts.body,
    textAlignVertical: "top",
  },
  labelSection: {
    gap: 12,
  },
  labelTitle: {
    fontSize: 16,
    fontFamily: Fonts.heading,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 30,
  },
  chipSelected: {
    backgroundColor: "#2D4635",
    borderColor: "#2D4635",
  },
  chipText: {
    fontFamily: Fonts.body,
  },
  chipTextSelected: {
    color: "white",
  },
  continueButton: {
    backgroundColor: "#2D4635",
    paddingVertical: 18,
    borderRadius: 35,
    alignItems: "center",
    marginTop: 10,
  },
  continueText: {
    color: "white",
    fontSize: 18,
    fontFamily: Fonts.heading,
  },
  acknowledgeContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 10,
    paddingRight: 10,
  },
  acknowledgeText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    opacity: 0.8,
    fontFamily: Fonts.body,
  },
  buttonDisabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.7,
  },
});
