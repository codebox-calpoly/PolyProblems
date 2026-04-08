import { supabase } from "@/lib/supabase";
import { Slot, useRouter } from "expo-router";
import { useEffect, useState } from "react";

export default function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .single();

      if (data?.role !== "admin") {
        router.replace("/");
      } else {
        setLoading(false);
      }
    };

    checkRole();
  }, [router]);

  if (loading) return null; // Or a loading spinner

  return <Slot />; // This renders the actual admin page if allowed
}
