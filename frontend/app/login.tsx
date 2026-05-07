import { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AntDesign from "@expo/vector-icons/AntDesign";
import { supabase } from "@/lib/supabase";
import { Fonts } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import PolyLogo from "@/components/ui/poly-logo";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // theme
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const inputBackground = isDark ? "#2a2a2a" : "#f5f5f5";
  const borderColor = isDark ? "#444444" : "#e0e0e0";

  // auth state
  const [session, setSession] = useState<boolean | null>(null);

  // screen state: 'welcome' | 'email' | 'otp'
  const [screen, setScreen] = useState<"welcome" | "email" | "otp">("welcome");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // invalid/expired refresh token — treat as logged out
        supabase.auth.signOut();
        setSession(false);
      } else {
        setSession(!!session?.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // still checking auth
  if (session === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </SafeAreaView>
    );
  }

  // already logged in
  if (session === true) return <Redirect href="/(tabs)/feed" />;

  const handleContinue = async () => {
    setError("");
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    const calPolyEmailRegex = /^[^\s@]+@calpoly\.edu$/i;
    if (!calPolyEmailRegex.test(email)) {
      setError("Please enter a valid Cal Poly email (@calpoly.edu)");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      Alert.alert("Check your email", `We sent a login code to ${email}.`, [
        { text: "OK" },
      ]);
      setScreen("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    if (!otp.trim()) {
      setError("Please enter the verification code");
      return;
    }
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: otp.trim(),
        type: "email",
      });
      if (error) throw error;
      if (data.session) {
        router.replace("/(tabs)/feed");
      } else {
        setError("Invalid code. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      Alert.alert("Code resent", "Check your email for a new code.");
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  // ── WELCOME SCREEN ──
  if (screen === "welcome") {
    return (
      <ThemedView style={[styles.welcomeContainer, { backgroundColor }]}>
        <View style={styles.logoContainer}>
          <PolyLogo />
        </View>
        <ThemedView style={styles.descriptionContainer}>
          <ThemedText
            style={[styles.descriptionText, { color: textColor }]}
            type="subtitle"
          >
            Review and manage reported campus issues.
          </ThemedText>
        </ThemedView>
        <Pressable
          style={[styles.button, { backgroundColor: tintColor }]}
          onPress={() => setScreen("email")}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
        <ThemedView>
          <ThemedText
            style={[styles.signInText, { color: textColor }]}
            type="subtitle"
          >
            Already have an account?{" "}
            <ThemedText
              style={styles.signInLink}
              onPress={() => setScreen("email")}
            >
              Sign in
            </ThemedText>
          </ThemedText>
        </ThemedView>
        <View style={{ height: 60 }} />
      </ThemedView>
    );
  }

  // ── EMAIL / OTP SCREEN ──
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <TouchableWithoutFeedback
        onPress={Platform.OS === "web" ? undefined : () => Keyboard.dismiss()}
        accessible={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          {/* Back to welcome */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setScreen("welcome");
              setError("");
              setOtp("");
            }}
          >
            <AntDesign name="close" size={24} color="black" />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.formSection}>
              <Text style={[styles.title, { color: textColor }]}>
                {screen === "email"
                  ? "Enter your Cal Poly email"
                  : "Enter verification code"}
              </Text>
              {screen === "otp" && (
                <Text style={[styles.subtitle, { color: textColor }]}>
                  We sent a 6-digit code to {email}. Don't see it? Check your spam or junk folder.
                </Text>
              )}
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {screen === "email" ? (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: textColor }]}>
                    Your Cal Poly email
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: inputBackground,
                        color: textColor,
                        borderColor,
                      },
                    ]}
                    placeholder="johndoe@calpoly.edu"
                    placeholderTextColor={isDark ? "#888888" : "#999999"}
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: textColor }]}>
                      Verification code
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: inputBackground,
                          color: textColor,
                          borderColor,
                          textAlign: "center",
                          fontSize: 24,
                          letterSpacing: 8,
                        },
                      ]}
                      placeholder="000000"
                      placeholderTextColor={isDark ? "#888888" : "#999999"}
                      value={otp}
                      onChangeText={setOtp}
                      editable={!loading}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoComplete="one-time-code"
                      textContentType="oneTimeCode"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={loading}
                  >
                    <Text style={[styles.resendButton, { color: textColor }]}>
                      Didn&apos;t receive a code? Resend
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setScreen("email");
                      setOtp("");
                      setError("");
                    }}
                    disabled={loading}
                  >
                    <Text style={[styles.backButton, { color: textColor }]}>
                      ← Back
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={styles.bottomSection}>
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: textColor }]}>
                  By registering, you accept our{" "}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL("https://poly-problems.vercel.app/terms")
                  }
                >
                  <Text
                    style={[
                      styles.link,
                      { color: isDark ? "#ffffff" : "#000000" },
                    ]}
                  >
                    Terms of Use
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.footerText, { color: textColor }]}>
                  {" "}
                  and{" "}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL("https://poly-problems.vercel.app/privacy")
                  }
                >
                  <Text
                    style={[
                      styles.link,
                      { color: isDark ? "#ffffff" : "#000000" },
                    ]}
                  >
                    Privacy Policy
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  loading && styles.continueButtonDisabled,
                ]}
                onPress={screen === "email" ? handleContinue : handleVerifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.continueButtonText}>
                    {screen === "email" ? "Send Code" : "Verify"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // welcome
  welcomeContainer: {
    flex: 1,
    alignItems: "center",
  },
  logoContainer: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 25,
    fontFamily: Fonts.body,
    textAlign: "center",
    marginBottom: 15,
  },
  button: {
    marginTop: 30,
    height: 52,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 110,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: Fonts.body,
  },
  signInText: {
    marginTop: 5,
    fontSize: 13,
    fontFamily: Fonts.body,
    textAlign: "center",
  },
  signInLink: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    textDecorationLine: "underline",
  },
  // login
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#e8e8e8",
    justifyContent: "center",
    alignItems: "center",
    margin: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: "space-between",
  },
  formSection: {
    alignSelf: "stretch",
  },
  bottomSection: {
    gap: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.heading,
    lineHeight: 40,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.body,
    marginBottom: 16,
    marginTop: -16,
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: "#fee",
    borderColor: "#fcc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#c33",
    fontSize: 14,
    textAlign: "center",
    fontFamily: Fonts.body,
  },
  inputGroup: {
    marginBottom: 24,
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.body,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: Fonts.body,
    letterSpacing: 0,
  },
  continueButton: {
    height: 56,
    backgroundColor: "#1a5e3d",
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: Fonts.heading,
  },
  backButton: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  resendButton: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    fontFamily: Fonts.body,
    textDecorationLine: "underline",
  },
  resendButton: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
  link: {
    fontSize: 13,
    fontFamily: Fonts.heading,
    textDecorationLine: "underline",
    lineHeight: 18,
  },
});
