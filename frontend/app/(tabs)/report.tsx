import { StyleSheet, View, Text } from 'react-native';
import { ImageUploadBox } from '@/components/ImageUploadBox';

export default function ReportScreen() {
  return (
    <View style={styles.container}>
      {/* Simple Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Reporting Issues</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Upload Photo</Text>
        
        {/* Only the Upload Box remains */}
        <ImageUploadBox />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: { fontSize: 18, fontWeight: '600' },
  body: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
});