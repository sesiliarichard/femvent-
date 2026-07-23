import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  colors: [string, string];
}

const SLIDES: Slide[] = [
  {
    icon: 'calendar',
    title: 'Your Events, All in One Place',
    description: "See every event you've registered for, with agendas, speakers, and updates right at your fingertips.",
    colors: ['#667eea', '#764ba2'],
  },
  {
    icon: 'qr-code',
    title: 'Skip the Line',
    description: 'Your ticket is a QR code. Just show it at the door for instant, fast check-in.',
    colors: ['#43e97b', '#38f9d7'],
  },
  {
    icon: 'people',
    title: 'Connect with Attendees',
    description: 'Network, chat, and engage with speakers and other attendees before and during the event.',
    colors: ['#fa709a', '#fee140'],
  },
  {
    icon: 'notifications',
    title: 'Never Miss a Moment',
    description: 'Get real-time announcements, schedule changes, and reminders so you never miss a session.',
    colors: ['#4facfe', '#00f2fe'],
  },
];

const ONBOARDING_KEY = 'femvents_has_seen_onboarding';

interface OnboardingScreenProps {
  navigation: any;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (error) {
      console.error('Error saving onboarding flag:', error);
    }
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      finishOnboarding();
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const slide = SLIDES[activeIndex];

  return (
    <LinearGradient colors={slide.colors} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <TouchableOpacity style={styles.skipButton} onPress={finishOnboarding}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={72} color="#fff" />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}
        />

        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>
            {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#667eea" />
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

export const hasSeenOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error reading onboarding flag:', error);
    return false;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  skipButton: { alignSelf: 'flex-end', padding: 20 },
  skipText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  slide: { width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  iconCircle: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 40,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 16 },
  description: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 24 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 4,
  },
  dotActive: { backgroundColor: '#fff', width: 24 },
  nextButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, marginHorizontal: 24, marginBottom: 12,
  },
  nextButtonText: { fontSize: 16, fontWeight: '700', color: '#667eea' },
});