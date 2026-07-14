import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface EventSplashScreenProps {
  event: {
    id: string;
    title: string;
    description: string;
    posterURL?: string;
    logoURL?: string;
  };
  onContinue: () => void;
  onSkip?: () => void;
}

const { width, height } = Dimensions.get('window');

export const EventSplashScreen: React.FC<EventSplashScreenProps> = ({
  event,
  onContinue,
  onSkip,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const titleSlideAnim = useRef(new Animated.Value(30)).current;
  const descriptionSlideAnim = useRef(new Animated.Value(40)).current;
  const buttonSlideAnim = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    // Start the animation sequence
    const startAnimation = () => {
      // Logo appears first with scale animation
      Animated.parallel([
        Animated.timing(logoScaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Title slides in after logo
      setTimeout(() => {
        Animated.timing(titleSlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 400);

      // Description slides in after title
      setTimeout(() => {
        Animated.timing(descriptionSlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 800);

      // Continue button slides in last
      setTimeout(() => {
        Animated.timing(buttonSlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 1200);
    };

    startAnimation();
  }, [fadeAnim, slideUpAnim, logoScaleAnim, titleSlideAnim, descriptionSlideAnim, buttonSlideAnim]);

  return (
    <LinearGradient
      colors={['#0f0c29', '#24243e', '#302b63']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Skip button */}
        {onSkip && (
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        <View style={styles.content}>
        {/* Event Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
        >
          {event.logoURL ? (
            <Image source={{ uri: event.logoURL }} style={styles.logo} />
          ) : event.posterURL ? (
            <Image source={{ uri: event.posterURL }} style={styles.logo} />
          ) : (
            <View style={styles.defaultLogo}>
              <Text style={styles.defaultLogoText}>🎪</Text>
            </View>
          )}
        </Animated.View>

        {/* App Name */}
        <Animated.Text
          style={[
            styles.appName,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          Eventify
        </Animated.Text>

        {/* Event Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: titleSlideAnim }],
            },
          ]}
        >
          <Text style={styles.eventTitle}>{event.title}</Text>
        </Animated.View>

        {/* Event Description */}
        <Animated.View
          style={[
            styles.descriptionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: descriptionSlideAnim }],
            },
          ]}
        >
          <Text style={styles.description}>
            {event.description || 'Join us for an amazing event experience!'}
          </Text>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: buttonSlideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 50,
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 20,
  },
  defaultLogo: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultLogoText: {
    fontSize: 48,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 60,
    textAlign: 'center',
  },
  titleContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 40,
  },
  descriptionContainer: {
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
