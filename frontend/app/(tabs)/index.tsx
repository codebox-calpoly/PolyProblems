import { StyleSheet, Pressable, View } from "react-native";

import Dot from "@/assets/images/dot.svg";
import DotActive from "@/assets/images/dot-active.svg";
import PolyLogo from "@/components/ui/poly-logo";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { useThemeColor } from "@/hooks/use-theme-color";

export default function HomeScreen() {
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const inactiveDotColor = useThemeColor({}, "tabIconDefault");
  const backgroundColor = useThemeColor({}, "background");

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <PolyLogo />

      <View style={{ flex: 1 }} />

      <ThemedView style={styles.descriptionContainer}>
        <ThemedText
          style={[styles.descriptionText, { color: textColor }]}
          type="subtitle"
        >
          Review and manage reported campus issues.
        </ThemedText>
      </ThemedView>

      <View style={styles.dots}>
        <DotActive width={8} height={8} fill={tintColor} />
        <Dot width={8} height={8} fill={inactiveDotColor} />
        <Dot width={8} height={8} fill={inactiveDotColor} />
      </View>

      <Pressable style={[styles.button, { backgroundColor: tintColor }]}>
        <ThemedText style={styles.buttonText}>Get Started</ThemedText>
      </Pressable>

      <ThemedView>
        <ThemedText
          style={[styles.signInText, { color: textColor }]}
          type="subtitle">
          Already have an account? {" "}
        
          <ThemedText style={styles.signInLink} onPress={() => {}}>Sign in</ThemedText>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
    descriptionContainer: {
      paddingHorizontal: 20,
      marginBottom:20,
    },
  descriptionText: {
    fontSize: 25,
    fontWeight: 500,
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
    fontWeight: "400",
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  signInText: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: 200,
    textAlign: "center",
  },
  signInLink: {
    fontWeight: 600,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});