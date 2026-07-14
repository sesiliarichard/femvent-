import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  RadioButton,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../services/AuthContext';
import { theme } from '../utils/theme';
import { supabase } from '../services/supabase';

export const HostApplicationScreen: React.FC = () => {
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
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Become a Host</Title>
          <Paragraph style={styles.description}>
            Apply to become a host and start creating your own events. 
            After admin approval and payment processing, you'll get access to host features.
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Application Form</Title>
          
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

          <Button
            mode="contained"
            onPress={handleSubmitApplication}
            disabled={loading}
            style={styles.submitButton}
          >
            {loading ? <ActivityIndicator color="white" /> : 'Submit Application'}
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>What happens next?</Title>
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Admin reviews your application</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Admin contacts you for payment</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>After payment, you become a host</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>4</Text>
              <Text style={styles.stepText}>Start creating and managing events</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 16,
  },
  stepsList: {
    marginTop: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurface,
  },
});
