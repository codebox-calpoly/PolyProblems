import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, useColorScheme } from 'react-native';
import { sessionStorage } from '@/utils/sessionStorage';
import {Colors, Fonts} from '@/constants/theme';

interface BeforeContProps {
  visible: boolean;
  onClose: (dontShowAgain: boolean) => void;
  setDisclaimer: (value: boolean) => void;
}

const STORAGE_KEY = 'disclaimer_dont_show_again';

export const BeforeCont: React.FC<BeforeContProps> = ({ visible, onClose, setDisclaimer }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;
  const styles = beforeContStyles(theme);

  const handleContinue = () => {
    if (dontShowAgain) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    }
    setDisclaimer(false);
    onClose(dontShowAgain);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleContinue}
    >
      <ScrollView style={styles.modalContainer} contentContainerStyle={styles.scrollContent}>
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
                Submitted reports may become part of a student&apos;s educational record and may be reviewed by OSRR.
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

          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setDontShowAgain(!dontShowAgain)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkboxBox, dontShowAgain && styles.checkboxChecked]}>
                {dontShowAgain && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Don&apos;t show this again</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.reportButton}
              activeOpacity={0.8}
              onPress={handleContinue}
            >
              <Text style={styles.reportButtonText}>Report an Issue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

const beforeContStyles = (theme: {
  background: string;
  text: string;
  tint: string;
  icon: string;
}) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  modalContent: {
    width: '100%',
    maxWidth: 600,
    paddingHorizontal: 28,
    paddingTop: 40,
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 32,
    color: theme.text,
    textAlign: 'center',
    lineHeight: 39,
    fontFamily: Fonts.heading,
  },
  contentBlock: {
    marginBottom: 32,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.text,
    marginBottom: 12,
    fontFamily: Fonts.body,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    color: theme.text,
    marginBottom: 4,
    lineHeight: 20,
    fontFamily: Fonts.heading,
  },
  sectionText: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.text,
    marginBottom: 4,
    fontFamily: Fonts.body,
  },
  bulletList: {
    marginLeft: 4,
    marginVertical: 4,
  },
  bullet: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.text,
    marginBottom: 2,
    fontFamily: Fonts.body,
  },
  contactText: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.text,
    marginBottom: 16,
    fontFamily: Fonts.body,
  },
  footer: {
    marginTop: 8,
  },
  readyText: {
    fontSize: 13,
    color: theme.text,
    marginBottom: 4,
    lineHeight: 20,
    fontFamily: Fonts.heading,
  },
  continueText: {
    fontSize: 13,
    color: theme.text,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.text,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.tint,
    borderColor: theme.tint,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.heading,
  },
  checkboxLabel: {
    fontSize: 18,
    color: theme.text,
    fontFamily: Fonts.body,
  },
  reportButton: {
    backgroundColor: theme.tint,
    width: '100%',
    maxWidth: 324,
    height: 49,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.body,
    lineHeight: 21,
    letterSpacing: 0,
  },
});