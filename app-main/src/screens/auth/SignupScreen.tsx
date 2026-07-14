import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../../services/AuthContext';
import { theme } from '../../utils/theme';
// Removed Firestore imports to prevent internal assertion errors

interface SignupScreenProps {
  navigation: any;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  // Removed validation state and timeout refs to prevent Firestore errors
  
  const { signUp } = useAuth();

  // Effect to validate password match when either password changes
  useEffect(() => {
    if (confirmPassword) {
      validatePasswordMatch();
    }
  }, [password, confirmPassword]);

  // Removed timeout cleanup since we're not using timeouts anymore

  // Validation functions
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('');
      return true;
    }
    
    // Only basic email format validation - no Firestore queries to prevent errors
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    setEmailError('');
    return true; // Always return true, let Firebase Auth handle duplicates
  };

  const validateName = (name: string) => {
    if (!name) {
      setNameError('');
      return true;
    }

    // Only basic validation - no Firestore queries to prevent errors
    if (name.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }

    setNameError('');
    return true; // Always return true, allow duplicates for now
  };

  const validatePasswordMatch = () => {
    if (!confirmPassword) {
      setConfirmPasswordError('');
      return true;
    }
    
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    } else {
      setConfirmPasswordError('');
      return true;
    }
  };

  const validatePasswordStrength = () => {
    if (!password) {
      setPasswordError('');
      return true;
    }
    
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  // Simple handlers without real-time validation to prevent Firestore errors
  const handleEmailChange = (text: string) => {
    setEmail(text);
    // Only do basic format validation, no Firestore queries
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (text && !emailRegex.test(text)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleNameChange = (text: string) => {
    setName(text);
    // Only do basic validation, no Firestore queries
    if (text && text.length < 2) {
      setNameError('Name must be at least 2 characters');
    } else {
      setNameError('');
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    validatePasswordStrength();
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
  };

  const handleSignup = async () => {
    // Check if all fields are filled
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic validation checks (no Firestore queries)
    const isEmailValid = validateEmail(email);
    const isNameValid = validateName(name);
    const isPasswordValid = validatePasswordStrength();
    const isConfirmPasswordValid = validatePasswordMatch();

    // Check if there are any validation errors
    if (!isEmailValid || !isNameValid || !isPasswordValid || !isConfirmPasswordValid) {
      Alert.alert('Validation Error', 'Please fix the errors above before creating your account');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name);
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Title style={styles.title}>Create Account</Title>
          <Paragraph style={styles.subtitle}>
            Join the events community
          </Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={handleNameChange}
              mode="outlined"
              autoCapitalize="words"
              autoComplete="name"
              style={styles.input}
              error={!!nameError}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            <TextInput
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              error={!!emailError}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            <View style={styles.passwordContainer}>
              <TextInput
                label="Password"
                value={password}
                onChangeText={handlePasswordChange}
                mode="outlined"
                secureTextEntry={!showPassword}
                autoComplete="password-new"
                style={[styles.input, styles.passwordInput]}
                error={!!passwordError}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialIcons
                  name={showPassword ? "visibility-off" : "visibility"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <View style={styles.passwordContainer}>
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                autoComplete="password-new"
                style={[styles.input, styles.passwordInput]}
                error={!!confirmPasswordError}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <MaterialIcons
                  name={showConfirmPassword ? "visibility-off" : "visibility"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

            <Button
              mode="contained"
              onPress={handleSignup}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Create Account
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Login')}
              style={styles.button}
            >
              Already have an account? Sign In
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  card: {
    elevation: 4,
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 12,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
});
