import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  Surface,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const theme = useTheme();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Login successful - AuthContext will handle navigation
    } catch (error: any) {
      const errorMessage = error.message || 'Invalid email or password. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <Surface style={[styles.header, { backgroundColor: theme.colors.primary }]} elevation={4}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons 
                name="school" 
                size={64} 
                color={theme.colors.onPrimary} 
                style={styles.logo}
              />
              <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.onPrimary }]}>
                Welcome Back!
              </Text>
              <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onPrimary }]}>
                Sign in to access your dashboard
              </Text>
            </View>
          </Surface>

          {/* Login Form */}
          <Card style={[styles.formCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Card.Content style={styles.formContent}>
              {error && (
                <Surface style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]} elevation={1}>
                  <MaterialCommunityIcons 
                    name="alert-circle" 
                    size={20} 
                    color={theme.colors.error} 
                  />
                  <Text variant="bodyMedium" style={[styles.errorText, { color: theme.colors.error }]}>
                    {error}
                  </Text>
                </Surface>
              )}

              <View style={styles.inputContainer}>
                <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurface }]}>
                  Email
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  disabled={isLoading}
                  left={<TextInput.Icon icon="email" />}
                  style={styles.textInput}
                  outlineStyle={styles.inputOutline}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurface }]}>
                  Password
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  disabled={isLoading}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon 
                      icon={showPassword ? "eye-off" : "eye"} 
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  style={styles.textInput}
                  outlineStyle={styles.inputOutline}
                />
              </View>

              <View style={styles.forgotPasswordContainer}>
                <Button
                  mode="text"
                  onPress={() => Alert.alert('Forgot Password', 'This feature will be implemented soon.')}
                  textColor={theme.colors.primary}
                  compact
                >
                  Forgot Password?
                </Button>
              </View>

              <Button
                mode="contained"
                onPress={handleLogin}
                disabled={isLoading}
                loading={isLoading}
                style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.loginButtonContent}
                labelStyle={[styles.loginButtonLabel, { color: theme.colors.onPrimary }]}
              >
                {isLoading ? 'Signing In...' : 'ACCESS DASHBOARD'}
              </Button>

              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
                <Text variant="bodySmall" style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>
                  Demo Credentials
                </Text>
                <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              </View>

              <View style={styles.demoContainer}>
                <Text variant="bodySmall" style={[styles.demoText, { color: theme.colors.onSurfaceVariant }]}>
                  For testing purposes, you can use:
                </Text>
                <Text variant="bodySmall" style={[styles.demoCredential, { color: theme.colors.primary }]}>
                  Email: trainee@example.com
                </Text>
                <Text variant="bodySmall" style={[styles.demoCredential, { color: theme.colors.primary }]}>
                  Password: password123
                </Text>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    margin: 16,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.9,
  },
  formCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
  },
  formContent: {
    padding: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'transparent',
  },
  inputOutline: {
    borderRadius: 12,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  loginButton: {
    borderRadius: 12,
  },
  loginButtonContent: {
    height: 56,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
  },
  demoContainer: {
    alignItems: 'center',
  },
  demoText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  demoCredential: {
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});