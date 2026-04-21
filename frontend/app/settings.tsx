import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Colors, Fonts } from "@/constants/theme";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";

const Settings = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // const handleEditProfile = () => {
  //   router.push("/(tabs)/profile");
  // };

  const handleNotifications = () => {
    router.push("/notifications");
  };

  const confirmSignOut = () => {
    if (isSigningOut) return;

    const title = "Sign Out";
    const message = "Are you sure you want to sign out?";

    if (Platform.OS === "web") {
      // Standard browser confirmation dialog
      const confirmed = window.confirm(`${title}\n${message}`);
      if (confirmed) {
        void handleSignOut();
      }
    } else {
      // Native Mobile Alert
      Alert.alert(title, message, [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            void handleSignOut();
          },
        },
      ]);
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.replace("/login");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign out right now.";
      Alert.alert("Sign out failed", message);
    } finally {
      setIsSigningOut(false);
    }
  };

  // --- DELETE ACCOUNT LOGIC ---
  const confirmDeleteAccount = () => {
    if (isProcessing) return;

    const title = "Delete Account";
    const message =
      "This action is permanent. All your reports, photos, and votes will be deleted forever.";

    if (Platform.OS === "web") {
      if (window.confirm(`${title}\n${message}`)) void handleDeleteAccount();
    } else {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: () => void handleDeleteAccount(),
        },
      ]);
    }
  };

  const handleDeleteAccount = async () => {
    setIsProcessing(true);
    try {
      // 1. Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // List all files inside the user's specific folder
      const { data: files, error: listError } = await supabase.storage
        .from("report-photos") // Using your specific bucket name
        .list(user.id);

      if (listError) throw listError;

      // Delete the files if they exist
      if (files && files.length > 0) {
        // We map the files to their full path within the bucket: "userId/fileName.jpg"
        const pathsToDelete = files.map((f) => `${user.id}/${f.name}`);

        const { error: storageError } = await supabase.storage
          .from("report-photos")
          .remove(pathsToDelete);

        if (storageError) throw storageError;
      }

      /**
       * IMPORTANT: By default, Supabase does not allow a user to delete themselves
       * via the client SDK for security. You should call a Postgres function
       * or an Edge Function here.
       * * For now, we will call a custom RPC function named 'delete_user_data'
       * which you should create in your Supabase dashboard.
       */
      const { error } = await supabase.rpc("delete_user_data");

      if (error) throw error;

      // 2. Sign the user out locally after successful deletion
      await supabase.auth.signOut();
      router.replace("/login");

      Alert.alert(
        "Account Deleted",
        "Your data has been removed from our systems.",
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Could not delete account.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with decorative image */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={15} color={colors.text} />
          <Text style={[styles.subTitle, { color: colors.text }]}>Profile</Text>
        </TouchableOpacity>
        <Image
          source={require("@/assets/images/settings.png")}
          style={styles.decorativeImage}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.text }]}>Back</Text>
      </View>

      {/* Settings Options */}
      <View style={styles.optionsContainer}>
        {/* <TouchableOpacity
          style={[
            styles.optionButton,
            { backgroundColor: colors.settingsButton },
          ]}
          onPress={handleEditProfile}
          activeOpacity={0.7}
        >
          <Text style={styles.optionText}>Edit Profile</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={[
            styles.optionButton,
            { backgroundColor: colors.settingsButton },
          ]}
          onPress={handleNotifications}
          activeOpacity={0.7}
        >
          <Text style={styles.optionText}>Notifications</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.signOutButton,
            isSigningOut && styles.signOutButtonDisabled,
          ]}
          onPress={confirmSignOut}
          activeOpacity={0.7}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.signOutText}>Sign Out</Text>
              <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, isProcessing && styles.buttonDisabled]}
          onPress={confirmDeleteAccount}
          disabled={isProcessing}
        >
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        <Text style={styles.legalDisclaimer}>
          Deleting your account will permanently remove your photos and reports.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "relative",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  subTitle: {
    fontSize: 16,
    fontFamily: Fonts.heading,
    marginBottom: 4,
  },
  decorativeImage: {
    position: "absolute",
    top: -3,
    right: 0,
    width: 160,
    height: 160,
  },
  title: {
    fontSize: 48,
    marginBottom: 10,
    fontFamily: Fonts.heading,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  optionText: {
    fontSize: 16,
    color: "#000",
    fontFamily: Fonts.body,
  },
  signOutButton: {
    marginTop: 8,
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: "#C24E3D",
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  signOutButtonDisabled: {
    opacity: 0.7,
  },
  signOutText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: Fonts.heading,
  },
  arrow: {
    fontSize: 20,
    color: "#000",
    fontFamily: Fonts.body,
  },
  deleteButton: { paddingVertical: 12, alignItems: "center" },
  buttonDisabled: { opacity: 0.6 },
  deleteText: {
    fontSize: 14,
    color: "#C24E3D",
    fontFamily: Fonts.heading,
    textDecorationLine: "underline",
  },
  legalDisclaimer: {
    fontSize: 12,
    color: "#718096",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
});

export default Settings;
