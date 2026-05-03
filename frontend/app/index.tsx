import { useEffect } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Only redirect on iOS/Android.
    // On Web, we let the static landing page stay put.
    if (Platform.OS !== "web") {
      router.replace("/login");
    }
  }, []);

  return null;
}
