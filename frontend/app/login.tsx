import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AntDesign from '@expo/vector-icons/AntDesign';
import { supabase } from '@/lib/supabase';
import { Fonts } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [screen, setScreen] = useState('email'); // 'email' or 'password'
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';
  const backgroundColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const inputBackground = isDark ? '#2a2a2a' : '#f5f5f5';
  const borderColor = isDark ? '#444444' : '#e0e0e0';

  const handleContinue = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    const calPolyEmailRegex = /^[^\s@]+@calpoly\.edu$/i;
    if (!calPolyEmailRegex.test(email)) {
      setError('Please enter a valid Cal Poly email (@calpoly.edu)');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
        },
      });
      

      if (error) throw error;

      Alert.alert(
        'Check your email',
        `We sent a login code to ${email}. Please check your inbox.`,
        [{ text: 'OK' }]
      );
      setScreen('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send code. Please try again.');
      console.error('OTP send error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');

    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: otp.trim(),
        type: 'email',
      });

      if (error) throw error;

      if (data.session) {
        console.log('Login successful:', data.user?.email);
        router.replace('/(tabs)');
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
      console.error('OTP verify error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setScreen('email');
    setOtp('');
    setError('');
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      Alert.alert('Code resent', 'Check your email for a new code.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={() => router.replace('/(tabs)')}>
          <AntDesign name="close" size={24} color="black" />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Header, Error, and Form */}
          <View style={styles.formSection}>
            {/* Header */}
            <Text style={[styles.title, { color: textColor }]}>
              {screen === 'email' ? 'Enter your Cal Poly email' : 'Enter verification code'}
            </Text>

            {screen === 'otp' && (
              <Text style={[styles.title, { color: textColor}]}>
                We sent a 6-digit code to {email}
              </Text>
            )}

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            {/* Form */}
            {screen === 'email' ? (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: textColor }]}>Your Cal Poly email</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: inputBackground,
                        color: textColor,
                        borderColor: borderColor,
                      },
                    ]}
                    placeholder="johndoe@calpoly.edu"
                    placeholderTextColor={isDark ? '#888888' : '#999999'}
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
            ) : (
              <>
                {/* OTP Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: textColor }]}>Verification code</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: inputBackground,
                        color: textColor,
                        borderColor: borderColor,
                        textAlign: 'center',
                        fontSize:24,
                        letterSpacing: 8,
                      },
                    ]}
                    placeholder="000000"
                    placeholderTextColor={isDark ? '#888888' : '#999999'}
                    value={otp}
                    onChangeText={setOtp}
                    editable={!loading}
                    keyboardType = "number-pad"
                    maxLength = {6}
                    autoComplete = "one-time-code"
                  />
                </View>
                {/* Resend Code */}
                <TouchableOpacity onPress = {handleResendCode} disabled = {loading}>
                  <Text style = {[styles.resendButton, {color:textColor}]}>
                    Didn&apos;t Receive a code? Resend
                  </Text>
                </TouchableOpacity>

                {/* Back Button */}
                <TouchableOpacity onPress={handleBackToEmail} disabled={loading}>
                  <Text style={[styles.backButton, { color: textColor }]}>← Back</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Button and Footer */}
          <View style={styles.bottomSection}>
            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: textColor }]}>
                By registering, you accept our{' '}
              </Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://example.com/terms')}>
                <Text style={[styles.link, { color: isDark ? '#ffffff' : '#000000' }]}>Terms of Use</Text>
              </TouchableOpacity>
              <Text style={[styles.footerText, { color: textColor }]}> and </Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://example.com/privacy')}>
                <Text style={[styles.link, { color: isDark ? '#ffffff' : '#000000' }]}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>

            {/* Continue/Verify Button */}
            <TouchableOpacity
              style={[styles.continueButton, loading && styles.continueButtonDisabled]}
              onPress={screen === 'email' ? handleContinue : handleVerifyOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.continueButtonText}>
                  {screen === 'email' ? 'Send Code' : 'Verify'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#e8e8e8',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
  },
  closeButtonText: {
    fontSize: 32,
    color: '#000000',
    lineHeight: 32,
    fontFamily: Fonts.body,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  formSection: {
    alignSelf: 'stretch',
  },
  bottomSection: {
    gap: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.heading,
    lineHeight: 40,
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderColor: '#fcc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#c33',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Fonts.body,
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 24,
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.body,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: Fonts.body,
  },
  continueButton: {
    height: 56,
    backgroundColor: '#1a5e3d',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: Fonts.heading,
  },
  backButton: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  resendButton: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: Fonts.body,
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.body,
  },
  link: {
    color: '#000000',
    fontSize: 13,
    fontFamily: Fonts.heading,
    textDecorationLine: 'underline',
    lineHeight: 18,
  },
});
