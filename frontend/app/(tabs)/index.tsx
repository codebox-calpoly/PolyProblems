import { StyleSheet, Pressable, View } from "react-native";
import { Redirect, useRouter } from "expo-router";

// import Dot from "@/assets/images/dot.svg";
// import DotActive from "@/assets/images/dot-active.svg";
import PolyLogo from "@/components/ui/poly-logo";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HomeScreen() {
  const router = useRouter();
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  // const inactiveDotColor = useThemeColor({}, "tabIconDefault");
  const backgroundColor = useThemeColor({}, "background");
  const [session, setSession] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        // User is logged in, redirect to Profile
        setSession(true);
      } else {
        setSession(false);
      }
    };

    checkAuth();
  }, []);

  if (session === true) {
    return <Redirect href="/profile" />;
  }
  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
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

      {/* <View style={styles.dots}>
        <DotActive width={8} height={8} fill={tintColor} />
        <Dot width={8} height={8} fill={inactiveDotColor} />
        <Dot width={8} height={8} fill={inactiveDotColor} />
      </View> */}

      <Pressable
        style={[styles.button, { backgroundColor: tintColor }]}
        onPress={() => router.push("/login")}
      >
        <ThemedText style={styles.buttonText}> Get Started</ThemedText>
      </Pressable>

      <ThemedView>
        <ThemedText
          style={[styles.signInText, { color: textColor }]}
          type="subtitle"
        >
          Already have an account?{" "}
          <ThemedText
            style={styles.signInLink}
            onPress={() => router.push("/login")}
          >
            Sign in
          </ThemedText>
        </ThemedText>
      </ThemedView>

      <View style={{ height: 60 }} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  logoContainer: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
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
  dots: {
    flexDirection: "row",
    gap: 8,
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
});
