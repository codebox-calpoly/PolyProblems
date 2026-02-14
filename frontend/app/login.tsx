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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with actual authentication API call to verify email
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Email verified:', { email });
      setScreen('password');
    } catch (err) {
      setError('Failed to continue. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPassword = async () => {
    setError('');

    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with actual authentication API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Login successful:', { email, password });
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setScreen('email');
    setPassword('');
    setError('');
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
              {screen === 'email' ? 'Enter your email address' : 'Enter your password'}
            </Text>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Form */}
            {screen === 'email' ? (
              <>
                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: textColor }]}>Your email</Text>
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
              </>
            ) : (
              <>
                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: textColor }]}>Password</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: inputBackground,
                        color: textColor,
                        borderColor: borderColor,
                      },
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={isDark ? '#888888' : '#999999'}
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

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

            {/* Continue/Sign In Button */}
            <TouchableOpacity
              style={[styles.continueButton, loading && styles.continueButtonDisabled]}
              onPress={screen === 'email' ? handleContinue : handleSubmitPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.continueButtonText}>
                  {screen === 'email' ? 'Continue' : 'Sign In'}
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
    fontWeight: 'bold',
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
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
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
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
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
  },
  link: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    lineHeight: 18,
  },
});
