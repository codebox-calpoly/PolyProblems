// components/ui/ReportCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';

interface ReportCardProps {
  title: string;
  onViewPress?: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, onViewPress }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleViewPress = () => {
    setModalVisible(true);
    if (onViewPress) {
      onViewPress();
    }
  };

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={handleViewPress}
          activeOpacity={0.8}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.modalTitle}>Before You Continue</Text>
            </View>
            
            <View style={styles.contentBlock}>
              <Text style={styles.description}>
                Use this form to submit a report related to student conduct or campus concerns requiring administrative review.
              </Text>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Emergency situations</Text>
                <Text style={styles.sectionText}>
                  If this is an emergency, call 911 immediately.{'\n'}
                  For non-emergency police reports, contact University Police at 805-756-2281.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Confidentiality & records</Text>
                <Text style={styles.sectionText}>
                  Reports are handled confidentially, except when:
                </Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bullet}>• A student waives FERPA protections</Text>
                  <Text style={styles.bullet}>• There is a threat of harm to self or others</Text>
                  <Text style={styles.bullet}>• Disclosure is required by court order</Text>
                </View>
                <Text style={styles.sectionText}>
                  Submitted reports may become part of a student's educational record and may be reviewed by OSRR.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reporting guidelines</Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bullet}>• Please provide factual, appropriate information</Text>
                  <Text style={styles.bullet}>
                    • Filing a report has no legal implications, but may require notification of University Police
                  </Text>
                  <Text style={styles.bullet}>
                    • Retaliation against anyone who reports in good faith is strictly prohibited
                  </Text>
                </View>
              </View>

              <Text style={styles.contactText}>
                If you have questions about whether to submit a report, contact OSRR at 805-756-2794 or via email.
              </Text>

              <View style={styles.footer}>
                <Text style={styles.readyText}>Ready to proceed?</Text>
                <Text style={styles.continueText}>Continue below to submit your report.</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setDontShowAgain(!dontShowAgain)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkboxBox, dontShowAgain && styles.checkboxChecked]}>
                {dontShowAgain && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Don't show this again</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.reportButton}
              activeOpacity={0.8}
              onPress={() => {
                console.log('Report an Issue pressed');
              }}
            >
              <Text style={styles.reportButtonText}>Report an Issue</Text>
            </TouchableOpacity>

            <View style={styles.bottomBorder} />
          </View>
        </View>
      </Modal>
    </>
  );
};
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  viewButton: {
    backgroundColor: '#2d5744',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  modalScroll: {
    width: 393,
  },
  modalContent: {
    width: 393,
    alignSelf: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  titleContainer: {
    width: 318,
    height: 39,
    marginTop: -30,
    marginLeft: 28,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 39,
    fontFamily: 'OpenRunde-Semibold',
    
  },
  contentBlock: {
    width: 327,
    height: 558,
    position: 'absolute',
    top: 92,
    left: 28,
  },
  description: {
    fontSize: 12,
    lineHeight: 20,
    color: '#000000',
    marginBottom: 20,
    fontFamily: 'OpenRunde-Regular',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
    lineHeight: 20,
    fontFamily: 'OpenRunde-Regular',
  },
  sectionText: {
    fontSize: 12,
    lineHeight: 20,
    color: '#000000',
    marginBottom: 6,
    fontFamily: 'OpenRunde-Regular',
  },
  bulletList: {
    marginLeft: 4,
    marginVertical: 6,
  },
  bullet: {
    fontSize: 12,
    lineHeight: 20,
    color: '#000000',
    marginBottom: 3,
    fontFamily: 'OpenRunde-Regular',
  },
  contactText: {
    fontSize: 12,
    lineHeight: 20,
    color: '#000000',
    marginBottom: 24,
    fontFamily: 'OpenRunde-Regular',
  },
  footer: {
    marginTop: 50,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    lineHeight: 20,
    fontFamily: 'OpenRunde-Regular',
  },
  continueText: {
    fontSize: 12,
    color: '#000000',
    lineHeight: 20,
    fontFamily: 'OpenRunde-Regular',
  },
  actionSection: {
    width: '100%',
    position: "absolute",
    top: 720,
    left:35,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 697,
    left: 40
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2d5744',
    borderColor: '#2d5744',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 18,
    color: '#000000',
    fontFamily: 'OpenRunde-Regular',
  },
  reportButton: {
    backgroundColor: '#2d5744',
    width: 324,
    height: 49,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 748,
    left: 35
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'OpenRunde-Regular',
    lineHeight: 21,
    letterSpacing: 0,
  },
  bottomBorder: {
    width: 393,
    height:68,
    backgroundColor: '#174735',
    position:'absolute',
    top: 869, 
    left: 0,
  }
  
});

export default ReportCard;