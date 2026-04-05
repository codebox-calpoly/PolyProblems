import { ReportCard } from "@/components/reportCard";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView } from "react-native";

export default function AdminPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, []),
  );

  const fetchReports = async () => {
    const { data: reports, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
    } else {
      setReports(reports || []);
    }
  };
  return (
    <ScrollView>
      {reports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          onPress={() => router.push(`/${report.id}`)}
        />
      ))}
    </ScrollView>
  );
}
