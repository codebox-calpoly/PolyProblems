import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function AdminPage() {
  return (
    <ThemedView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <ThemedText>Welcome to the Admin Dashboard!</ThemedText>
    </ThemedView>
  );
}
