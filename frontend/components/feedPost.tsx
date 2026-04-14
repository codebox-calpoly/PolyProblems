import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, feedTabs } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

export default function FeedPost({ reportId }: { reportId: string }) {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  
  const [report, setReport] = useState<any>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('reports').select('*').eq('id', reportId).single();
        if (error || !data) return;
        setReport(data);

        if (data.image_paths?.length > 0) {
          const { data: signedData, error: signedError } = await supabase.storage
            .from("report-photos")
            .createSignedUrls(data.image_paths, 3600);
          if (signedData && !signedError) setImageUrls(signedData.map((item) => item.signedUrl));
        }
      } catch (e) {
        console.error("Fetch Error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchReportData();
  }, [reportId]);

  if (loading) return <ActivityIndicator style={{ marginVertical: 30 }} color={theme.tint} />;
  if (!report) return null;

  const activeCategoryColor = feedTabs[report.category] || theme.tint;

  return (
    <View style={[styles.card, { borderBottomColor: theme.line || 'rgba(0,0,0,0.1)' }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>{report.title}</Text>
        <Text style={[styles.time, { color: theme.text }]}>
          {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      {/* Meta */}
      <View style={styles.metaRow}>
        <Text style={[styles.author, { color: theme.icon }]}>By {report.author_name || "Anonymous"}</Text>
        <View style={[styles.tag, { backgroundColor: activeCategoryColor }]}>
          <Text style={styles.tagText}>{report.category}</Text>
        </View>
      </View>

      {/* Image Grid */}
      <View style={styles.imageGrid}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={styles.imageBox}>
            {imageUrls[index] ? (
              <Image source={{ uri: imageUrls[index] }} style={styles.image} resizeMode="contain" />
            ) : (
              <View style={[styles.placeholderBox, { backgroundColor: theme.icon + '15' }]} />
            )}
            {index === 2 && imageUrls.length > 3 && (
              <View style={styles.overlay}>
                <Text style={styles.moreText}>+{imageUrls.length - 2} more</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Description Area: Pressable for better iOS feedback */}
      <View style={styles.descriptionWrapper}>
        <Text 
          style={[styles.description, { color: theme.text }]} 
          numberOfLines={isExpanded ? undefined : 2}
        >
          {report.description}
        </Text>
        
        <Pressable 
          onPress={() => setIsExpanded(!isExpanded)}
          style={({ pressed }) => [
            styles.togglePressable,
            { opacity: pressed ? 0.5 : 1 }
          ]}
        >
          <Text style={[styles.toggleText, { color: theme.icon }]}>
            {isExpanded ? "See less" : "See more"}
          </Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.likeButton, { backgroundColor: activeCategoryColor }]}>
          <Ionicons name="thumbs-up" size={14} color="white" />
          <Text style={styles.likeCount}>{report.likes_count || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    paddingVertical: 24, 
    borderBottomWidth: 1 
  },
  headerRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 4 
  },
  title: { 
    flex: 1, 
    fontSize: 19, 
    fontFamily: Fonts.heading, 
    fontWeight: "700", 
    lineHeight: 24 
  },
  time: { 
    fontSize: 14, 
    fontWeight: "600", 
    marginLeft: 12 
  },
  metaRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginTop: 2, 
    gap: 8 
  },
  author: { 
    fontSize: 13, 
    fontFamily: Fonts.body 
  },
  tag: { 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 4 
  },
  tagText: { 
    color: "white", 
    fontSize: 11, 
    fontWeight: "800", 
    textTransform: "uppercase" 
  },
  imageGrid: { 
    flexDirection: "row", 
    gap: 10, 
    marginVertical: 16 
  },
  imageBox: { 
    flex: 1, 
    aspectRatio: 1, 
    borderRadius: 4, 
    overflow: 'hidden' 
  },
  placeholderBox: { 
    flex: 1 
  },
  image: { 
    width: '100%', 
    height: '100%' 
  },
  overlay: { ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  moreText: { 
    color: "white", 
    fontSize: 14, 
    fontWeight: '700' 
  },
  
  descriptionWrapper: {
    marginBottom: 22,
  },
  description: { 
    fontSize: 15, 
    lineHeight: 20, 
    fontFamily: Fonts.body, 
  },
  togglePressable: {
    marginTop: 6,
    alignSelf: 'flex-start', 
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.2, 
  },

  footer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  likeButton: { 
    flexDirection: "row", 
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    borderRadius: 20, 
    alignItems: "center", 
    gap: 6 
  },
  likeCount: { 
    color: "white", 
    fontSize: 15, 
    fontWeight: "700" 
  },
});