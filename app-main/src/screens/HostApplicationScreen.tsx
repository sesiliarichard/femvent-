import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Paragraph,
  TextInput,
  RadioButton,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { supabase } from '../services/supabase';

export const HostApplicationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [applicationData, setApplicationData] = useState({
    motivation: '',
    experience: '',
    eventTypes: '',
    contactMethod: 'email',
    contactEmail: '',
    contactPhone: '',
  });

  const handleSubmitApplication = async () => {
    if (!applicationData.motivation.trim()) {
      Alert.alert('Error', 'Please provide your motivation for becoming a host');
      return;
    }

    // Validate contact details based on selected method
    if (applicationData.contactMethod === 'email') {
      if (!applicationData.contactEmail.trim()) {
        Alert.alert('Error', 'Please provide your email address for contact');
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(applicationData.contactEmail)) {
        Alert.alert('Error', 'Please provide a valid email address');
        return;
      }
    } else if (applicationData.contactMethod === 'phone') {
      if (!applicationData.contactPhone.trim()) {
        Alert.alert('Error', 'Please provide your phone number for contact');
        return;
      }
      // Basic phone validation (at least 10 digits)
      const phoneRegex = /^\d{10,}$/;
      const cleanPhone = applicationData.contactPhone.replace(/\D/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        Alert.alert('Error', 'Please provide a valid phone number (at least 10 digits)');
        return;
      }
    }

    setLoading(true);
    try {
      // Update user record with host application
      const { error } = await supabase
        .from('users')
        .update({
          host_application: {
            status: 'pending',
            appliedAt: new Date().toISOString(),
            motivation: applicationData.motivation,
            experience: applicationData.experience,
            eventTypes: applicationData.eventTypes,
            contactMethod: applicationData.contactMethod,
            contactEmail: applicationData.contactEmail,
            contactPhone: applicationData.contactPhone,
          },
        })
        .eq('id', user!.id);

      if (error) throw error;
      

      Alert.alert(
        'Application Submitted',
        'Your host application has been submitted. Admin will review it and contact you for payment processing.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting application:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#5A4485', '#3d2d5c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Become a Host</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <Card style={styles.card}>
        <Card.Content>
          <Paragraph style={styles.description}>
            Apply to become a host and start creating your own events. 
            After admin approval and payment processing, you'll get access to host features.
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Application Form</Text>
          
          <TextInput
            label="Why do you want to become a host? *"
            value={applicationData.motivation}
            onChangeText={(text) => setApplicationData({ ...applicationData, motivation: text })}
            multiline
            numberOfLines={4}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Previous event hosting experience (optional)"
            value={applicationData.experience}
            onChangeText={(text) => setApplicationData({ ...applicationData, experience: text })}
            multiline
            numberOfLines={3}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="What types of events do you plan to host? (optional)"
            value={applicationData.eventTypes}
            onChangeText={(text) => setApplicationData({ ...applicationData, eventTypes: text })}
            multiline
            numberOfLines={2}
            style={styles.input}
            mode="outlined"
          />

          <View style={styles.radioGroup}>
            <Text style={styles.radioLabel}>Preferred contact method:</Text>
            <RadioButton.Group
              onValueChange={(value) => setApplicationData({ 
                ...applicationData, 
                contactMethod: value,
                // Clear the other contact field when switching
                contactEmail: value === 'email' ? applicationData.contactEmail : '',
                contactPhone: value === 'phone' ? applicationData.contactPhone : ''
              })}
              value={applicationData.contactMethod}
            >
              <View style={styles.radioItem}>
                <RadioButton value="email" />
                <Text>Email</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="phone" />
                <Text>Phone</Text>
              </View>
            </RadioButton.Group>
          </View>

          {/* Contact Email Input */}
          {applicationData.contactMethod === 'email' && (
            <TextInput
              label="Contact Email Address *"
              value={applicationData.contactEmail}
              onChangeText={(text) => setApplicationData({ ...applicationData, contactEmail: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              mode="outlined"
              placeholder="Enter your email address"
            />
          )}

          {/* Contact Phone Input */}
          {applicationData.contactMethod === 'phone' && (
            <TextInput
              label="Contact Phone Number *"
              value={applicationData.contactPhone}
              onChangeText={(text) => setApplicationData({ ...applicationData, contactPhone: text })}
              keyboardType="phone-pad"
              autoComplete="tel"
              style={styles.input}
              mode="outlined"
              placeholder="Enter your phone number"
            />
          )}

<TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmitApplication}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Application</Text>
            )}
          </TouchableOpacity>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>What happens next?</Text>
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={styles.stepIconCircle}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <Text style={styles.stepText}>Admin reviews your application</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepIconCircle}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <Text style={styles.stepText}>Admin contacts you for payment</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepIconCircle}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <Text style={styles.stepText}>After payment, you become a host</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepIconCircle}>
                <Text style={styles.stepNumber}>4</Text>
              </View>
              <Text style={styles.stepText}>Start creating and managing events</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#5A4485',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  stepsList: {
    marginTop: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f1f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5A4485',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
});